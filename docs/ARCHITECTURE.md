# Arquitectura del frontend

> Llegenda: **[FET]** comprovat al codi · **[INFERÈNCIA]** deducció · **[NO VERIFICAT]** depèn de config externa. Vegeu [README](README.md).

## 1. Stack
| Peça | Detall | Font |
|---|---|---|
| Framework | Expo SDK ~54, React Native 0.81.5, React 19.1, New Architecture | `package.json`, `app.config.js:36` |
| Llenguatge | TypeScript a `src/` (`App.js`, `index.js` en JS) | — |
| Navegació | React Navigation 6 (native-stack + bottom-tabs) | `src/components/AppNavigator.tsx`, `src/components/TabsNavigator.tsx` |
| Estat del servidor | TanStack React Query 5 | `src/config/queryClient.ts` |
| Estat de sessió | React Context (`AuthContext`) | `src/contexts/AuthContext.tsx` |
| Auth | Firebase JS SDK 12 + Google Sign-In natiu | `src/services/firebase.ts`, `src/services/AuthService.ts` |
| Backend | REST a Render (URL fixa) | [integrations/backend-api.md](integrations/backend-api.md) |
| Mapa | Leaflet dins `react-native-webview` | [integrations/maps-leaflet-tiles.md](integrations/maps-leaflet-tiles.md) |
| i18n | i18next + react-i18next, ca/es/en/fr, fallback `ca` | `src/i18n/index.ts`, [architecture/i18n.md](architecture/i18n.md) |
| Tests | Jest (preset react-native), Testing Library, MSW, emulador Firebase Auth | `jest.config.js`, `jest.config.e2e.js` |
| Build | EAS (Android), GitHub Actions, SonarCloud, Codecov | [integrations/eas-ci-tooling.md](integrations/eas-ci-tooling.md) |

## 2. Estructura
```
index.js                substitueix global.fetch per fetchWithLog i registra App
App.js                  providers + tria Login/SignUp vs AppNavigator
app.config.js           config Expo + injecció de Firebase (extra) i google-services.json
src/
  screens/              pantalles (23)
  components/           components i navegadors (AppNavigator, TabsNavigator, LeafletWebMap, formularis, modals)
  hooks/                use*Query.ts (React Query) + useFavourite, useVisited, useCustomAlert, useTranslation
  services/             *Service.ts (classes estàtiques), apiClient, fetchWithLog, firebase
    dto/                forma JSON del backend
    mappers/            DTO → model
  models/index.ts       interfícies de domini (Location = refugi, User, Renovation, ...)
  contexts/AuthContext.tsx
  config/queryClient.ts defaults + registre queryKeys
  i18n/                 index.ts + locales/{ca,es,en,fr}.json
  utils/                authUtils (isUserAdmin), mockData (sense ús)
  __tests__/            unit_tests/, integration/ (MSW), E2E/, i duplicats a services/, hooks/
docs/                   aquesta documentació (índex a docs/README.md)
```

## 3. Capes (patró de referència: renovations)
```
Screen/Component → hook use*Query (useQuery/useMutation) → *Service (static) → apiClient → fetchWithLog → Backend
                 ↑ mapper DTO→Model dins el queryFn/mutationFn            ↑ Bearer de Firebase + reintent en 401
```
| Capa | Contracte | Exemple |
|---|---|---|
| Pantalla | Consumeix hooks i `useAuth()`; alertes amb `useCustomAlert`; textos `t()` | `src/screens/RenovationsScreen.tsx` |
| Hook | `queryKey` + `queryFn` que crida el servei i mapeja; mutacions invaliden claus a `onSuccess` | `src/hooks/useRenovationsQuery.ts:14-171` |
| Servei | `static async`, construeix URL amb `API_BASE_URL`, retorna DTO (refugis, usuaris, propostes i visites ja retornen model); errors: **llança** o **retorna null** segons el servei | `src/services/RenovationService.ts:41-154` |
| Mapper | Funció pura DTO→model | `src/services/mappers/RenovationMapper.ts:11-22` |
| Model | Interfície TS | `src/models/index.ts:93` |

Patrons aplicats (capes, Repository, DTO, Mapper, Facade, Decorator, Optimistic update…) amb diagrames: [architecture/design-patterns.md](architecture/design-patterns.md).

## 4. Navegació
- **Pre-login** (sense navigator): `App.js` alterna `LoginScreen`/`SignUpScreen` per estat; entra a `AppNavigator` si `isAuthenticated` (Firebase user + `emailVerified`) o `isOfflineMode` (`App.js:59-72`, `AuthContext.tsx:245`).
- **AppNavigator** (native-stack, `src/components/AppNavigator.tsx:181-260`): `MainTabs`, `Settings`, `ChangePassword`, `ChangeEmail`, `EditProfile`, `HelpSupport`, `AboutTheApp`, `CreateRenovation`, `CreateRefuge`, `EditRefuge`, `EditRenovation`, `Proposals`, `ProposalDetail`, `DoubtsScreen`, `ExperiencesScreen`, `RefromDetail` (detall de renovation, amb errata), `RefugeDetail`.
- **Overlays per estat** a `AppNavigator` (L44-55, 262-348): bottom sheet, detall de refugi, edició, dubtes, experiències, popup d'eliminació. Diverses pantalles existeixen **alhora** com a overlay i com a ruta.
- **Tabs** (`src/components/TabsNavigator.tsx`): Map, Favorites, Renovations, Profile.
- Sense `ParamList` tipada: navegació amb `any` **[FET]**.

## 5. Estat
| Tipus | On | Notes |
|---|---|---|
| Sessió (Firebase user, backendUser, ids preferits/visitats, mode offline) | `AuthContext` | Listener `onAuthStateChanged` amb 3 reintents de `GET /users/{uid}/` (L53-110) |
| Dades del servidor | React Query | `staleTime` 9 min, `gcTime` 15 min, `retry` 2, mutacions `retry` 0 (`queryClient.ts:20-33`) |
| Preferències | AsyncStorage | idioma `@refugis_app_language`, cache de mapes |
| UI | estat local de components | |

Claus de query: registre `queryKeys` (`src/config/queryClient.ts:39-67`) per a refuges, users, renovations, proposals; la resta (experiences, doubts, refugeVisits, refugeMedia) i molts hooks usen arrays literals **[FET]**.

## 6. Autenticació i autorització (resum)
- Token: `AuthService.getAuthToken()` = `auth.currentUser.getIdToken()`; `apiClient` l'afegeix i reintenta un cop en 401 (`src/services/apiClient.ts:36-79`).
- Admin a la UI: `isUserAdmin()` (`src/utils/authUtils.ts`) només a `SettingsScreen` per mostrar l'opció de gestió de propostes; la resta de pantalles confien en el param `mode`. **L'autorització real és al backend.**
- Propietat (editar/eliminar experiències, dubtes, fotos, renovations) només es comprova **visualment** comparant `uid`s.
- Detall: [flows/02](flows/02-login-logout-session.md), [integrations/firebase-auth-google.md](integrations/firebase-auth-google.md).

## 7. Convencions
- **Idioma**: comentaris, JSDoc i missatges d'error dels serveis en **català**; identificadors en anglès; UI via i18n (amb excepcions hard-coded, vegeu [TECH_DEBT](TECH_DEBT.md); detall a [architecture/i18n.md](architecture/i18n.md)).
- **Noms**: pantalles `XScreen.tsx` amb export amb nom; serveis `XService` classe estàtica; hooks `useX` / `useXQuery.ts`; DTO `XDTO`; mapper `mapXFromDTO`.
- **Models** mantenen snake_case del backend (`creator_uid`, `ini_date`); el refugi és `Location`.
- **Alertes**: `useCustomAlert` + `<CustomAlert/>` (no `Alert.alert`, amb excepcions).
- **Logs**: `console.log/error` abundants; `fetchWithLog` registra totes les peticions.
- **Colors**: taronja `#f97316` / `#FF6900` hard-coded als estils; degradat `#FF8904 → #F54900` a capçaleres i botons de Login/SignUp.

## 8. Excepcions al patró [FET]
| Excepció | On |
|---|---|
| Servei cridat directament des de UI sense hook (sense invalidacions) | pujada/esborrat de fotos (`RefugeDetailScreen.tsx:587`, `QuickActionsMenu.tsx:210`, `PhotoViewerModal.tsx:156-164`), avatar (`AvatarPopup.tsx`), autocompletar refugi (`RenovationForm.tsx:115-135`) |
| `fetch` directe | `MapCacheService.ts:326-327`, `RefugeForm.tsx:152` (Open-Elevation), `AvatarPopup.tsx:100` (blob local) |
| Serveis que retornen `null`/`false` en lloc de llançar | `UsersService.ts` (gairebé tot), `RefugisService.getRefugiById`, `RenovationService.getRenovationById` |
| Hooks que sempre llancen (deprecats) | `useCreateRefuge/useUpdateRefuge/useDeleteRefuge` (`useRefugesQuery.ts:76-130`) |
| Hook condicional | `ProposalsScreen.tsx:66-68` |
| Hooks dins render-props / try-catch | `TabsNavigator.tsx:70-84`, `EditRefugeScreen.tsx:35-43`, `ExperiencesScreen.tsx:72-77`, `DoubtsScreen.tsx:105-110` |
| Claus de cache divergents | `PhotoViewerModal.tsx:109` (`['user', uid]`) |

## 9. Tests
- Unitaris: `src/__tests__/unit_tests/{components,screens,hooks,services,mappers,i18n,utils,endpoints}` (molts amb snapshots a `__snapshots__/`).
- Integració: `src/__tests__/integration/{components,screens}` amb MSW (`setup/mswServer.ts`, `mswHandlers.ts`) i mocks de Firebase (`setup/firebaseMocks.ts`).
- E2E: `src/__tests__/E2E/auth.e2e.test.ts` contra l'emulador d'Auth (`firebase.json`).
- Duplicats: `src/__tests__/services`, `src/__tests__/hooks`, `src/__tests__/services/mappers` repeteixen tests de `unit_tests/` **[FET]**.
- Comandes: `npm test`, `npm run test:unit`, `npm run test:integration`, `npm run test:coverage`, `npm run test:e2e`.
- CI executa `npm run test:coverage -- -u` → **actualitza snapshots** i no detecta regressions visuals **[FET]**.

## 10. Gotchas / què NO fer
Llista completa: [GOTCHAS.md](GOTCHAS.md). Top 5:
1. No retornis `null` en errors dels serveis: llança, o les mutacions no faran rollback.
2. No cridis serveis de mutació des de la UI sense hook: perdràs les invalidacions.
3. Buida la cache de React Query en canviar d'usuari (avui no es fa).
4. No confiïs en comprovacions de propietat/admin de la UI: el backend és qui autoritza (i té forats, vegeu docs del backend).
5. Afegeix cada text a les quatre locales.

## 11. Deute tècnic
Llista completa per severitat: [TECH_DEBT.md](TECH_DEBT.md).
