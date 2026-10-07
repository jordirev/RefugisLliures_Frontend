# Documentació tècnica del frontend — RefugisLliures

App mòbil Expo / React Native (TypeScript). Documentació generada a partir del **codi actual** (branca `feature/crear-editar-refugis`, octubre 2026). Les rutes són relatives a l'arrel del repo (`RefugisLliures_Frontend/`) i es citen com `ruta:línia`.

## Llegenda
| Marca | Significat |
|---|---|
| **[FET]** | Comprovat llegint el codi citat. |
| **[INFERÈNCIA]** | Deducció raonada (comportament de llibreries, conseqüències), no executada. |
| **[NO VERIFICAT]** | No confirmable des del repo (EAS, Firebase console, servidors externs). |

## Índex
- [ARCHITECTURE.md](ARCHITECTURE.md) — stack, estructura, capes, navegació, estat, convencions, excepcions, tests.
- [GOTCHAS.md](GOTCHAS.md) — què NO fer.
- [TECH_DEBT.md](TECH_DEBT.md) — bugs i deute per severitat.

### Fluxos d'usuari (amb diagrama Mermaid)
| # | Flux | Fitxer |
|---|---|---|
| 1 | Registre | [flows/01-signup.md](flows/01-signup.md) |
| 2 | Login (email/Google), sessió, token, logout | [flows/02-login-logout-session.md](flows/02-login-logout-session.md) |
| 3 | Perfil, avatar, configuració, idioma, esborrar compte | [flows/03-profile-settings-account.md](flows/03-profile-settings-account.md) |
| 4 | Preferits i visitats | [flows/04-favourite-visited.md](flows/04-favourite-visited.md) |
| 5 | Ocupació / visites planificades | [flows/05-refuge-visits-occupation.md](flows/05-refuge-visits-occupation.md) |
| 6 | Renovations | [flows/06-renovations.md](flows/06-renovations.md) |
| 7 | Mapa, cerca, filtres, mapes offline | [flows/07-map-search-filters.md](flows/07-map-search-filters.md) |
| 8 | Detall de refugi | [flows/08-refuge-detail.md](flows/08-refuge-detail.md) |
| 9 | Pujar fotos, galeria, esborrar foto | [flows/09-refuge-photos-gallery.md](flows/09-refuge-photos-gallery.md) |
| 10 | Crear/editar/eliminar refugi via propostes i revisió admin | [flows/10-refuge-proposals.md](flows/10-refuge-proposals.md) |
| 11 | Experiències | [flows/11-experiences.md](flows/11-experiences.md) |
| 12 | Dubtes i respostes | [flows/12-doubts.md](flows/12-doubts.md) |

### Integracions externes
- [integrations/backend-api.md](integrations/backend-api.md) — API REST del backend (costat client)
- [integrations/firebase-auth-google.md](integrations/firebase-auth-google.md) — Firebase Auth i Google Sign-In
- [integrations/maps-leaflet-tiles.md](integrations/maps-leaflet-tiles.md) — Leaflet/WebView, OpenTopoMap/OSM, cache offline
- [integrations/external-apis-device.md](integrations/external-apis-device.md) — Open-Elevation, Windy, Wikiloc, capacitats natives
- [integrations/eas-ci-tooling.md](integrations/eas-ci-tooling.md) — Expo/EAS, GitHub Actions, Sonar, Codecov, Jest

### Receptes
- [recipes/add-endpoint-call.md](recipes/add-endpoint-call.md) — consumir un endpoint (servei + DTO + mapper + hook)
- [recipes/add-service.md](recipes/add-service.md)
- [recipes/add-model.md](recipes/add-model.md)
- [recipes/add-screen.md](recipes/add-screen.md)

## Relació amb `README/` (documentació antiga)
La carpeta `README/` (20 fitxers, ~4.000 línies) es manté sense canvis. Contradiccions detectades:

| Fitxer antic | Afirmació | Realitat |
|---|---|---|
| `README/TOKEN_REFRESH.md` | Refresc "implementat i funcional", amb logs concrets | Només hi ha un reintent en 401; els logs citats no existeixen (`src/services/apiClient.ts`) **[FET]** |
| `README/OFFLINE_MAPS.md` | El mapa funciona offline amb la cache | Les tiles no es llegeixen mai (`src/services/MapCacheService.ts:212-234`) **[FET]** |
| `README/GOOGLE_LOGIN_SETUP.md` | Usa `expo-auth-session` / `expo-crypto` | Usa `@react-native-google-signin/google-signin` (`src/services/AuthService.ts:25-31`) **[FET]** |

La resta no s'ha contrastat línia a línia → **[NO VERIFICAT]**.

## Fora d'abast
Backend (té els seus docs a `Backend/RefugisLliures_Backend/docs/`) i integració frontend↔backend (es documentarà a `TFG/`). No s'ha documentat la carpeta `TFG/INFO`. Mai es documenten valors de secrets.
