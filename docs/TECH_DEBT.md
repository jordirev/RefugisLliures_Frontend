# Deute tècnic detectat

> **[FET]** comprovat al codi · **[INFERÈNCIA]** deducció · **[NO VERIFICAT]** depèn de config externa.
> Inventari; res no s'ha corregit al codi. B14 (docs antigues de `README/` que descrivien comportament inexistent) està **resolt**: la carpeta s'ha eliminat i el contingut vàlid s'ha migrat a `docs/` (octubre 2026).

## Alt (funcionalitat trencada o dades incorrectes)
| # | Problema | Evidència | Tipus |
|---|---|---|---|
| A1 | Eliminar una renovation des del detall envia `DELETE /api/renovations/undefined/` | `src/screens/RenovationDetailScreen.tsx:199` vs `src/hooks/useRenovationsQuery.ts:108` | FET |
| A2 | Errors de serveis d'usuari reportats com a èxit (preferits, visitats, perfil, idioma): retornen `null`/`false`, sense rollback | `src/services/UsersService.ts:50-61,112-123,209-227,245-255,309-327,345-355`; `src/hooks/useFavourite.ts:40,47`; `src/hooks/useVisited.ts:40,47`; `src/components/LanguageSelector.tsx:37-49` | FET |
| A3 | Esborrar compte: backend primer, sense reautenticació → compte de Firebase orfe si `requires-recent-login` | `src/services/AuthService.ts:328-335` | FET (ordre) + INFERÈNCIA (efecte) |
| A4 | Errors de proposta amb "coord" al missatge es mostren com a **èxit**; errors d'eliminació silenciats | `src/components/RefugeForm.tsx:515-541`, `src/components/AppNavigator.tsx:98-108` | FET |
| A5 | `condition = 0` substituïda per heurística (`||` en lloc de `??`) | `src/services/mappers/RefugiMapper.ts:111` | FET |
| A6 | Mapes offline no funcionals: tiles descarregades no usades, Leaflet via CDN | `src/services/MapCacheService.ts:212-234`, `src/components/LeafletWebMap.tsx:163-176,221-228` | FET |
| A7 | Cache de React Query no es buida al logout → dades per usuari (p. ex. `is_visitor`) visibles al següent usuari | cap `clear/removeQueries` a `src/`; `src/hooks/useRefugeVisitsQuery.ts:20` | FET + INFERÈNCIA |
| A8 | Sessió no persistent (Firebase sense persistència RN) | `src/services/firebase.ts:60-61` | FET + INFERÈNCIA |

## Mitjà
| # | Problema | Evidència | Tipus |
|---|---|---|---|
| M1 | Marcadors antics quan un filtre retorna 0 resultats | `src/components/LeafletWebMap.tsx:54` | FET |
| M2 | Ruta inexistent `'RefugeDetails'` | `src/screens/EditRefugeScreen.tsx:70` | FET |
| M3 | Errata de ruta `RefromDetail`, tipada com `'RenovationDetail'` | `src/components/AppNavigator.tsx:211`, `src/screens/RenovationDetailScreen.tsx:40` | FET |
| M4 | Pujada/esborrat de fotos sense hook → no invalida usuari ni llistes; codi duplicat | `RefugeDetailScreen.tsx:542-599`, `QuickActionsMenu.tsx:165-225`, `PhotoViewerModal.tsx:156-164`; hooks sense ús a `src/hooks/useRefugeMediaQuery.ts` | FET |
| M5 | URL incorrecta `/refugis/{id}/media/` (codi mort) | `src/services/RefugeMediaService.ts:59` | FET |
| M6 | Refresc de propostes d'admin escriu a una clau diferent de la viva | `src/hooks/useProposalsQuery.ts:51-59` vs `14-19` | INFERÈNCIA |
| M7 | Hook condicional | `src/screens/ProposalsScreen.tsx:66-68` | FET |
| M8 | EditRenovation 409 obre la renovation equivocada | `src/screens/EditRenovationScreen.tsx:112-117` | FET |
| M9 | `materials_needed` no es pot buidar; >500 caràcters bloqueja sense missatge | `src/components/RenovationForm.tsx:232-234,277-278` | FET |
| M10 | Usuari Google creat amb idioma fix `ca`; fallada de creació al backend només loggejada | `src/services/AuthService.ts:180,185-189` | FET |
| M11 | Idioma en majúscules/minúscules inconsistent; idioma del wizard de registre no persistit | `LanguageSelector.tsx:35`, `AuthService.ts:82`, `SignUpScreen.tsx:73` | FET |
| M12 | Canvi d'email no sincronitzat al backend; canvi d'email/contrasenya oferts a usuaris Google | `AuthService.ts:392-463`, `SettingsScreen.tsx:103-115` | FET |
| M13 | Carrera entre listener d'auth (3×1 s) i creació d'usuari al backend | `src/contexts/AuthContext.tsx:53-110` | INFERÈNCIA |
| M14 | Closure obsoleta en ids de preferits/visitats | `useFavourite.ts:29,40,47`, `useVisited.ts:29,40,47` | FET |
| M15 | `.sort()` in-place sobre arrays de cache | `useUsersQuery.ts:391`, `useRefugesQuery.ts:46` | FET |
| M16 | `getRefugiById` / `getRenovationById` converteixen errors en `null` (sense retry ni missatge útil) | `src/services/RefugisService.ts:18-29`, `src/services/RenovationService.ts:82-85` | FET |
| M17 | CI actualitza snapshots (`-u`) | `.github/workflows/main.yml:33` | FET |
| M18 | Atribució de tiles desactivada | `src/components/LeafletWebMap.tsx:214` | FET |
| M19 | `CustomAlert` es tanca després de l'`onPress` (alertes encadenades perdudes); alertes amagades amb la galeria oberta | `src/components/CustomAlert.tsx:35-42`, `RefugeDetailScreen.tsx:704-1195` | FET |

## Baix
| # | Problema | Evidència |
|---|---|---|
| B1 | URL del backend duplicada a 9 serveis, sense config | `src/services/*Service.ts` (vegeu `docs/integrations/backend-api.md`) |
| B2 | `fetchWithLog` actiu en producció i llegeix tots els cossos | `index.js:4-17`, `src/services/fetchWithLog.ts:33-45` |
| B3 | `queryKeys` no usat de manera consistent; clau `['user', uid]` duplicada | `src/hooks/useRenovationsQuery.ts`, `useRefugeVisitsQuery.ts`, `PhotoViewerModal.tsx:109` |
| B4 | Bloc d'actualització de llistes de propostes copiat 5 vegades | `src/hooks/useProposalsQuery.ts` |
| B5 | Helpers duplicats (detecció de vídeo, icones de serveis) | `RefugeDetailScreen.tsx:70,250-263`, `GalleryScreen.tsx:35`, `PhotoViewerModal.tsx:44`, `RefugeBottomSheet.tsx:13`, `UserExperience.tsx:39`, `RefugeForm.tsx:550-563` |
| B6 | Strings hard-coded (català/anglès) fora d'i18n | `LoginScreen.tsx:95-105,169-179,236`, `OfflineMapManager.tsx`, `RefugeOccupationModal.tsx:186`, serveis |
| B7 | Claus i18n inexistents | `signup.errors.usernameTooShort`, `proposals.errorLoading`, `refuge.gallery.permissionDenied`, `profile.avatar.expoGo*`, `createRefuge.pressToEdit` (en) |
| B8 | `?id=` redundant | `src/services/RenovationService.ts:168,209` |
| B9 | `POST /users/` envia `email` que el backend no espera | `src/services/UsersService.ts:11-16` |
| B10 | Termes i condicions no acceptats ni registrats | `src/components/TermsAndConditionsModal.tsx:187-200` |
| B11 | `Linking.openURL` sense `catch` | `RenovationDetailScreen.tsx:112`, `RenovationCard.tsx:46` |
| B12 | Opcions de picker incoherents (MIME forçat, `MediaTypeOptions.All` obsolet, `aspect` sense `allowsEditing`) | `ExperiencesScreen.tsx:148,157`, `UserExperience.tsx:154`, `RefugeDetailScreen.tsx:559` |
| B13 | Tests duplicats en dues carpetes | `src/__tests__/services` vs `src/__tests__/unit_tests/services` (també `hooks`, `mappers`) |

## Codi mort / sense ús
`src/utils/mockData.ts` (no importat; no encaixa amb `Location`) · `useCreateRefuge/useUpdateRefuge/useDeleteRefuge` (`useRefugesQuery.ts:76-130`) · `useRefugeMedia`, `useUploadRefugeMedia`, `useDeleteRefugeMedia` (`useRefugeMediaQuery.ts`) · `useUserVisits` (`useRefugeVisitsQuery.ts:32`) · `MapCacheService.getTileUrl/hasTile/getTileLocalPath` · `AppNavigator.handleToggleFavorite` (no-op) · prop `onNavigate` · `Share` a `QuickActionsMenu.tsx:11` · `deleteMediaMutation` (`ExperiencesScreen.tsx:106`) · imports `@env` a `src/services/firebase.ts:26-34` · paràmetres `authToken?` de `UsersService` i estat `authToken` del context · `const stack` a `App.js:36` · dependències `expo-auth-session`, `expo-image-manipulator` · `export *` de mòduls amb `default` a `src/hooks/index.ts:7-8`.
