# CLAUDE.md — RefugisLliures Frontend

App mòbil Expo / React Native (TypeScript) per consultar refugis lliures: mapa, detall, fotos, experiències, dubtes, ocupació, reformes ("renovations") i propostes de canvi revisades per admins.
Documentació detallada a [`docs/`](docs/README.md). Llegenda: **[FET]** / **[INFERÈNCIA]** / **[NO VERIFICAT]**.

## Stack
- Expo SDK ~54, React Native 0.81.5, React 19.1 (New Architecture). Android via EAS; no hi ha `ios/`.
- React Navigation 6 (native-stack + bottom-tabs); TanStack React Query 5; Context per a la sessió.
- Firebase Auth (JS SDK) + Google Sign-In natiu; backend REST a Render (URL fixa a cada servei).
- Mapa: Leaflet dins `react-native-webview` (tiles OpenTopoMap/OSM, Leaflet via CDN unpkg).
- i18n: i18next, idiomes `ca` (fallback), `es`, `en`, `fr`.

## Comandes
```bash
npm install
npm start                 # expo start (Google Sign-In i crop-picker requereixen build nativa / dev client)
npm run android           # expo run:android
npm run test:unit         # jest unit_tests
npm run test:integration  # jest + MSW
npm run test:coverage     # unit + integració amb coverage
npm run test:e2e          # emulador Firebase Auth (firebase-tools)
```
Config local: `.env` amb els noms de `.env.example` (no llegir ni imprimir valors).

## Capes (patró de referència: renovations)
```
Screen → hook use*Query (React Query) → *Service (static, retorna DTO) → apiClient (Bearer + reintent 401) → fetchWithLog → Backend
                     └ mapper DTO→Model (src/services/mappers) dins queryFn/mutationFn
```
- `src/screens/` pantalles · `src/components/` (incl. `AppNavigator`, `TabsNavigator`, `LeafletWebMap`) · `src/hooks/` · `src/services/{dto,mappers}` · `src/models/index.ts` · `src/contexts/AuthContext.tsx` · `src/config/queryClient.ts` · `src/i18n/`.
- Pre-login sense navigator: `App.js` alterna Login/SignUp; entra a `AppNavigator` si Firebase user amb email verificat o mode offline.
- Rutes de pila a `src/components/AppNavigator.tsx` (ull: errata `RefromDetail` = detall de renovation); tabs Map, Favorites, Renovations, Profile.

## Convencions
- Català a comentaris, JSDoc i missatges d'error de serveis; identificadors en anglès; textos d'UI amb `t()` i clau a **les 4 locales**.
- Serveis: `export class XService { static async ... }`; DTO `XDTO`; mapper `mapXFromDTO`; models amb camps snake_case del backend (el refugi és `Location`).
- Alertes: `useCustomAlert` + `<CustomAlert/>`.
- Claus de query: registre `queryKeys` a `src/config/queryClient.ts` (no sempre respectat).
- Defaults React Query: staleTime 9 min, gcTime 15 min, retry 2 (queries), 0 (mutacions).

## Top gotchas (llista completa: docs/GOTCHAS.md)
1. Els serveis han de **llançar** en error; `UsersService` retorna `null` i les mutacions creuen que han anat bé.
2. Mutacions sempre via hook amb invalidacions; la pujada/esborrat de fotos i l'avatar avui salten els hooks.
3. `mutate()` amb el tipus exacte de `mutationFn` (eliminar renovation està trencat per això).
4. La cache de React Query **no es buida** al logout; la sessió Firebase **no persisteix** entre arrencades.
5. La UI no és seguretat: comprovacions d'autor/admin són visuals; autoritza el backend.
6. Cap hook condicional, dins `try/catch` o dins render-props de `Tab.Screen`.
7. No decideixis èxit/error pel text del missatge (`RefugeForm` mostra èxit si l'error conté "coord").
8. `CustomAlert` es tanca després d'`onPress`: no encadenis `showAlert` síncrons.
9. Els mapes offline no funcionen (tiles mai llegides, Leaflet via CDN).
10. CI fa `test:coverage -- -u`: els snapshots no fallen mai a CI.

## Seguretat
- **No llegeixis ni imprimeixis** `.env`, `google-services.json`, `GoogleService-Info.plist` ni secrets d'EAS; només noms de variables.
- L'URL de producció del backend està hard-coded a `src/services/*Service.ts`; no hi ha config per entorn.

## Índex de docs
- `docs/ARCHITECTURE.md` — stack, estructura, capes, navegació, estat, convencions, excepcions, tests.
- `docs/GOTCHAS.md` — què NO fer · `docs/TECH_DEBT.md` — bugs i deute per severitat.
- `docs/flows/` — 01 registre · 02 login/sessió · 03 perfil/compte · 04 preferits/visitats · 05 ocupació · 06 renovations · 07 mapa · 08 detall refugi · 09 fotos · 10 propostes · 11 experiències · 12 dubtes.
- `docs/integrations/` — backend-api · firebase-auth-google · maps-leaflet-tiles · external-apis-device · eas-ci-tooling.
- `docs/recipes/` — add-endpoint-call · add-service · add-model · add-screen.
- `README/` — docs antigues; algunes obsoletes (vegeu `docs/README.md`).

## En canviar codi
- Endpoint nou → `docs/recipes/add-endpoint-call.md`; pantalla nova → `docs/recipes/add-screen.md`.
- Corregeixes un bug de `docs/TECH_DEBT.md` → treu-lo o marca'l com a resolt.
