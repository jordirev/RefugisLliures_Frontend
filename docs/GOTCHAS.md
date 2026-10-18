# Gotchas / què NO fer

> **[FET]** comprovat al codi · **[INFERÈNCIA]** deducció · **[NO VERIFICAT]** depèn de config externa.

## Serveis i xarxa
1. **NO retornis `null`/`false` per amagar errors HTTP.** `UsersService` ho fa (`src/services/UsersService.ts:50-61,112-123,209-227,...`) i provoca que les mutacions reportin èxit i no facin rollback **[FET]**. Llança un `Error` amb `status`.
2. **NO facis `fetch` directe** al backend: usa `apiGet/apiPost/...` de `src/services/apiClient.ts` (token + reintent 401). Excepcions actuals: `MapCacheService.ts:326`.
3. **NO fixis `Content-Type` amb `FormData`**: deixa que RN posi el boundary. Per a fotos/vídeos **no** facis multipart: usa `useMediaUpload` (URL PUT prefirmada).
3b. **El PUT a la URL prefirmada de R2 no ha de passar per `apiClient`** ni portar `Authorization`; envia exactament les `headers` de l'intent (el `Content-Type` i la mida estan signats) (`MediaUploadService.putFile`) **[FET]**.
4. L'URL del backend està **hard-coded a 9 serveis**; si la canvies, canvia-la a tots (o centralitza-la). No hi ha manera d'apuntar a un backend local per configuració **[FET]**.
5. `fetchWithLog` substitueix `global.fetch` també en producció i llegeix el cos de totes les respostes (`index.js:4-17`, `src/services/fetchWithLog.ts:33-45`) **[FET]**: no hi posis lògica pesada.
6. Codifica els paràmetres de query (`encodeURIComponent`); `ExperienceService.ts:49` i `DoubtsService.ts:40` no ho fan **[FET]**.

## React Query
7. **NO cridis serveis de mutació directament des de la UI**: passa per un hook amb invalidacions. Fotos/vídeos/avatar: `useMediaUpload`; esborrat: `useDeleteRefugeMedia`; invalidacions comunes a `src/hooks/mediaInvalidation.ts`. Queda pendent l'esborrat d'avatar (`AvatarPopup`) **[FET]**.
8. Crida `mutate()` amb el **tipus exacte** que espera `mutationFn` (bug resolt a `useDeleteRenovation`: ara es passa `{ id, refugeId }`) **[FET]**.
9. Usa el registre `queryKeys` (`src/config/queryClient.ts`); claus divergents dupliquen dades. (`PhotoViewerModal` ja usa `useUser` → `['users','detail',uid]`.)
10. **NO facis `.sort()` in-place** sobre arrays que vénen de la cache o de props (`useUsersQuery.ts:391`, `useRefugesQuery.ts:46`) **[FET]**.
11. En canviar d'usuari, la cache **no es buida** (cap `queryClient.clear()` a `src/`) **[FET]**: si afegeixes dades per usuari, inclou l'`uid` a la clau.
12. Si una mutació canvia comptadors de l'usuari al backend (fotos, experiències, renovations), invalida `['users','detail']`.

## React / hooks
13. **NO cridis hooks condicionalment** (`ProposalsScreen.tsx:66-68`), dins `try/catch` (`EditRefugeScreen.tsx:35-43`) ni dins render-props de `Tab.Screen` (`TabsNavigator.tsx:70-84`) **[FET]**.
14. Usa `setState` funcional quan el nou valor depèn de l'anterior (`useFavourite.ts:40,47` no ho fa) **[FET]**.
15. `CustomAlert` crida `onDismiss` **després** de l'`onPress` del botó (`src/components/CustomAlert.tsx:35-42`): un `showAlert` síncron dins un `onPress` es tanca immediatament **[FET]**.
16. Revisa el nom de ruta exacte: `RefromDetail` (renovation) és el registrat; `EditRefugeScreen.tsx:70` navega a `'RefugeDetails'`, que no existeix **[FET]**.
16b. React Navigation 7: `navigate('X')` cap a una ruta ja existent a la pila **ja no** retrocedeix (v6 sí). Per mantenir-ho, usa `navigation.popTo('Settings')`, `popTo('RefromDetail', params)` o `navigate('MainTabs', { screen }, { pop: true })`. Els `Navigator` necessiten `id={undefined}` pel desajust de tipus `native` 7.5.1 / `core` 7.24 **[FET]**.

## Auth i seguretat
17. La UI **no és una barrera de seguretat**: botons d'eliminar/editar i el mode admin depenen de comparacions locals de `uid` i de paràmetres de ruta. El backend és qui autoritza **[FET]**.
18. Sense persistència de sessió (`src/services/firebase.ts:60-61`): no assumeixis que l'usuari continua loguejat després de reiniciar **[INFERÈNCIA]**.
19. `isUserAdmin()` no força refresc del token: un rol nou no es veu immediatament **[FET]**.
20. **NO llegeixis ni imprimeixis** `.env`, `google-services.json` ni `GoogleService-Info.plist`. Només s'esmenten noms de variables (`.env.example`).
21. Abans d'operacions sensibles de Firebase (`user.delete()`, `updatePassword`), cal **reautenticar**; `deleteAccount` no ho fa i esborra primer el backend (`AuthService.ts:328-335`) **[FET]**.

## i18n i textos
22. Afegeix cada clau a **les quatre** locales (`src/i18n/locales/{ca,es,en,fr}.json`). Hi ha claus que falten i es mostren crues (`proposals.errorLoading`) **[FET]**.
23. **NO posis textos d'usuari als serveis** (avui molts llancen missatges en català que la UI mostra directament) **[FET]**.
24. Canvia l'idioma amb el helper `changeLanguage` de `src/i18n/index.ts` (desa a AsyncStorage), no amb `i18n.changeLanguage` directe (`SignUpScreen.tsx:73`) **[FET]**.
25. L'idioma al backend s'envia en minúscules (`'ca'`) al registre però en majúscules des de Settings (`LanguageSelector.tsx:35`) **[FET]**: tria'n un.

## Errors mostrats com a èxit
26. **NO filtris errors per text** per decidir si és èxit: `RefugeForm.tsx:515-541` mostra èxit si el missatge conté "coord" **[FET]**.

## Mapa
27. Les tiles offline es descarreguen però **no s'usen**; Leaflet ve de CDN. No prometis funcionalitat offline del mapa **[FET]**.
28. L'efecte que injecta marcadors ignora llistes buides (`LeafletWebMap.tsx:54`) **[FET]**.

## Mitjans (feature `images`)
32. **Valida abans d'enviar**: només fotos i vídeos de la llista blanca (MIME **i** extensió, `MediaUploadService.validateAsset`); obre el picker amb `mediaTypes: ['images','videos']` (avatar `['images']`). Mai forcis el MIME **[FET]**.
33. Mostra `<RightsDeclarationModal {...rightsModalProps} />` a qualsevol pantalla que usi `useMediaUpload`; si no, la promesa de `pickMedia` queda penjada esperant la declaració **[FET]**.
34. Un `<Modal>` sempre queda per sobre de la pila: **tanca'l abans de `navigate`** (p. ex. visor → `ReportMedia`). Les rutes que han de tapar els overlays d'`AppNavigator` s'han d'afegir a `ROUTES_ABOVE_OVERLAYS` **[FET]**.
35. Renderitza mitjans amb `MediaImage`/`MediaThumbnail` (expo-image, `cacheKey` = clau R2, `blurhash`): una `Image` amb la URL prefirmada no aprofita mai la cache perquè la URL canvia **[FET]**.
36. `react-native-compressor` és un mòdul natiu: requereix build EAS/dev client; el codi el carrega amb `require` i, si falla, puja el vídeo original **[FET]**. Als tests està mockejat a `jest.setup.js` (també `expo-image`, `expo-image-manipulator`, `expo-image-picker`).
37. Els codis d'error (`age_not_confirmed`, `user_blocked`, `not_owner`, `underage`) es llegeixen de l'`ApiError.code`, mai del text **[FET]**.

## Tests i CI
29. CI fa `npm run test:coverage -- -u`: **els snapshots s'actualitzen sols** i mai fallen a CI (`.github/workflows/main.yml:33`) **[FET]**. Revisa snapshots en local.
30. Hi ha tests duplicats a `src/__tests__/services` i `src/__tests__/unit_tests/services` (i `hooks`, `mappers`): actualitza tots dos o elimina'n un **[FET]**.
31. `@env` es mapeja a `__mocks__/env.js` als tests: afegeix-hi qualsevol variable nova.
32. `react-test-renderer` ha d'estar fixat a 19.2.0, exactament la versió de React (RNTL 13); `babel-preset-expo` és devDependency perquè jest el necessita hoisted **[FET]**.
