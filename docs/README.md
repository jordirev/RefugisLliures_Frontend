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

### Guies (passos per executar o configurar)
- [guides/getting-started.md](guides/getting-started.md) — instal·lar, executar (dev client / Expo Go), scripts i solució de problemes
- [guides/firebase-setup.md](guides/firebase-setup.md) — projecte Firebase, `.env`, fitxers natius, verificació manual de l'auth, errors comuns
- [guides/google-signin-setup.md](guides/google-signin-setup.md) — Web Client ID, SHA-1, build nativa, errors de Google Sign-In

### Arquitectura en detall
- [architecture/design-patterns.md](architecture/design-patterns.md) — patrons arquitectònics i de disseny amb diagrames (fill d'ARCHITECTURE §3)
- [architecture/i18n.md](architecture/i18n.md) — selecció i canvi d'idioma, ús de `t()`, claus, afegir idiomes

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

### Referència detallada per domini
- [reference/experience-service.md](reference/experience-service.md) — endpoints, respostes, errors i hooks d'experiències (fill de flows/11)

## Origen: antiga carpeta `README/`
La carpeta `README/` (20 fitxers de 2025) s'ha eliminat a l'octubre de 2026. El contingut vigent s'ha migrat i contrastat amb el codi; el desactualitzat (pantalles mock, `app.json`, `expo-auth-session`, mapes offline "funcionals", refresc de token "complet", `src/examples/`) s'ha descartat.

| Antic | Destí |
|---|---|
| `README.md`, `START_HERE.md`, `README_NATIVE.md` | [guides/getting-started.md](guides/getting-started.md) |
| `SETUP_CHECKLIST.md`, `FIREBASE_SETUP_FIX.md`, `AUTH_QUICK_START.md`, `AUTHENTICATION_README.md` | [guides/firebase-setup.md](guides/firebase-setup.md), [integrations/firebase-auth-google.md](integrations/firebase-auth-google.md) (API de `useAuth`/`AuthService`) |
| `GOOGLE_LOGIN_SETUP.md`, `GOOGLE_LOGIN_GUIA_RAPIDA.md`, `GOOGLE_LOGIN_RESUM.md` | [guides/google-signin-setup.md](guides/google-signin-setup.md) |
| `AUTHENTICATION_FLOWS.md`, `IMPLEMENTATION_SUMMARY.md`, `LOGIN_README.md`, `SIGNUP_README.md` | [flows/01](flows/01-signup.md), [flows/02](flows/02-login-logout-session.md), [integrations/firebase-auth-google.md](integrations/firebase-auth-google.md) |
| `TOKEN_REFRESH.md` | [integrations/firebase-auth-google.md §Tokens](integrations/firebase-auth-google.md#tokens) |
| `PATRONS_ARQUITECTONICS_I_DISSENY.md` | [architecture/design-patterns.md](architecture/design-patterns.md) (corregit) |
| `I18N_IMPLEMENTATION.md` | [architecture/i18n.md](architecture/i18n.md) |
| `EXPERIENCE_SERVICE.md` | [reference/experience-service.md](reference/experience-service.md) |
| `PHOTO_GALLERY_IMPLEMENTATION.md` | [flows/09 §UI](flows/09-refuge-photos-gallery.md#ui) |
| `OFFLINE_MAPS.md` | [flows/07](flows/07-map-search-filters.md), [integrations/maps-leaflet-tiles.md](integrations/maps-leaflet-tiles.md) |

## Fora d'abast
Backend (té els seus docs a `Backend/RefugisLliures_Backend/docs/`) i integració frontend↔backend (es documentarà a `TFG/`). No s'ha documentat la carpeta `TFG/INFO`. Mai es documenten valors de secrets.
