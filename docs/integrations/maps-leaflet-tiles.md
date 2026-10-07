# Integració — Mapa: Leaflet en WebView, servidors de tiles i cache offline

> **[FET]** comprovat al codi · **[INFERÈNCIA]** deducció · **[NO VERIFICAT]** depèn de config externa.

## Arquitectura
- El mapa **no** usa `react-native-maps` per renderitzar (és dependència, però el component actiu és `LeafletWebMap`) **[FET]**: `src/components/MapViewComponent.tsx:43-52` → `src/components/LeafletWebMap.tsx`.
- `LeafletWebMap` genera un HTML inline (`LeafletWebMap.tsx:155-546`) i el carrega en `react-native-webview`.
- Llibreries carregades **des de CDN unpkg**: Leaflet 1.9.4, leaflet.heat 0.2.0, leaflet.markercluster 1.5.3 (`LeafletWebMap.tsx:163-176`).
- Tiles: `https://a.tile.opentopomap.org/{z}/{x}/{y}.png` (per defecte) o `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` (`LeafletWebMap.tsx:221-228`).

## Comunicació RN ↔ WebView
| Direcció | Mecanisme | On |
|---|---|---|
| RN → WebView | `webViewRef.current.injectJavaScript(...)`: `updateMarkers`, `changeRepresentation`, `changeMapLayer`, `updateSelectedMarker`, ubicació d'usuari | `LeafletWebMap.tsx:53-152` |
| WebView → RN | `window.ReactNativeWebView.postMessage(JSON {type:'locationSelect', id})` → `handleMessage` | `LeafletWebMap.tsx:298-302,394-398,548-566` |

Els objectes `Location` complets es serialitzen a JSON a cada actualització **[FET]** (pot ser pesat **[INFERÈNCIA]**).

## Cache offline (`src/services/MapCacheService.ts`)
- Tiles a `documentDirectory/map_cache/{z}_{x}_{y}.png` (expo-file-system/legacy); metadades a AsyncStorage `map_cache_metadata`; llista de refugis a `map_cache_refuges` (L39-41).
- `downloadTilesForArea` amb lots de 5 i 100 ms d'espera (L167-192); refugis via `fetch` directe a `GET /api/refuges/` (L326-327).
- **Les tiles descarregades no es fan servir**: `getTileUrl`/`hasTile`/`getTileLocalPath` (L212-234) no tenen cap crida **[FET]**.

## Gotchas
- Sense xarxa, la WebView no pot carregar ni Leaflet (CDN) ni tiles → el mapa no es pinta **[INFERÈNCIA]**. Qualsevol afirmació que el mapa "funciona offline" **no quadra amb el codi** (ús del gestor offline a la UI: [flows/07](../flows/07-map-search-filters.md#passos)).
- Descàrregues massives contra OpenTopoMap/OSM poden violar les seves polítiques d'ús **[INFERÈNCIA]**; no hi ha `User-Agent` propi **[NO VERIFICAT]**.
- El mapa es crea amb `attributionControl: false` (`LeafletWebMap.tsx:214`): no es mostra l'atribució d'OSM/OpenTopoMap, que les seves llicències exigeixen **[FET + INFERÈNCIA legal]**.
