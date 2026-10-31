# Integració — Mapa: Leaflet en WebView, servidors de tiles i cache offline

> **[FET]** comprovat al codi · **[INFERÈNCIA]** deducció · **[NO VERIFICAT]** depèn de config externa.

## Arquitectura
- El mapa **no** usa `react-native-maps` per renderitzar (és dependència, però el component actiu és `LeafletWebMap`) **[FET]**: `src/components/MapViewComponent.tsx:43-52` → `src/components/LeafletWebMap.tsx`.
- `LeafletWebMap` genera un HTML inline (`LeafletWebMap.tsx:155-546`) i el carrega en `react-native-webview`.
- Llibreries **empaquetades dins l'app** (RGPD): Leaflet 1.9.4, leaflet.heat 0.2.0 i leaflet.markercluster 1.5.3 viuen a `src/vendor/leaflet/leafletAssets.ts` i s'injecten inline al HTML; **cap petició a unpkg.com ni a cap CDN** **[FET]**.
- Tiles: `https://a.tile.opentopomap.org/{z}/{x}/{y}.png` (per defecte) o `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` (`LeafletWebMap.tsx:221-228`).

## Comunicació RN ↔ WebView
| Direcció | Mecanisme | On |
|---|---|---|
| RN → WebView | `webViewRef.current.injectJavaScript(...)`: `updateMarkers`, `changeRepresentation`, `changeMapLayer`, `updateSelectedMarker`, ubicació d'usuari | `LeafletWebMap.tsx:53-152` |
| WebView → RN | `window.ReactNativeWebView.postMessage(JSON {type:'locationSelect', id})` → `handleMessage` | `LeafletWebMap.tsx:298-302,394-398,548-566` |

Els objectes `Location` complets es serialitzen a JSON a cada actualització **[FET]** (pot ser pesat **[INFERÈNCIA]**).

## Cache offline (`src/services/MapCacheService.ts`)
- Tiles a `documentDirectory/map_cache/{z}_{x}_{y}.png` (`expo-file-system`, API `File`/`Directory`/`Paths`); metadades a AsyncStorage `map_cache_metadata`; llista de refugis a `map_cache_refuges` (L39-41).
- `downloadTilesForArea` amb lots de 5 i 100 ms d'espera (L167-192); refugis via `fetch` directe a `GET /api/refuges/` (L326-327).
- **Les tiles descarregades no es fan servir**: `getTileUrl`/`hasTile`/`getTileLocalPath` (L212-234) no tenen cap crida **[FET]**.

## Gotchas
- Sense xarxa, la WebView carrega Leaflet (local) però no les tiles → el mapa surt sense fons **[INFERÈNCIA]**. Qualsevol afirmació que el mapa "funciona offline" **no quadra amb el codi** (ús del gestor offline a la UI: [flows/07](../flows/07-map-search-filters.md#passos)).
- Descàrregues massives contra OpenTopoMap/OSM poden violar les seves polítiques d'ús **[INFERÈNCIA]**; no hi ha `User-Agent` propi **[NO VERIFICAT]**.
- El mapa es crea amb `attributionControl: false` (`LeafletWebMap.tsx:214`): no es mostra l'atribució d'OSM/OpenTopoMap, que les seves llicències exigeixen **[FET + INFERÈNCIA legal]**.

## Privacitat (RGPD): proveïdors de tiles — decisió provisional
Els tiles són l'**única comunicació del mapa amb tercers** que queda a l'app (Leaflet ja és local; l'altitud passa pel backend). Es mantenen **provisionalment** fins que el PO decideixi si es manté el proveïdor extern o es contracta un servei propi.

| Proveïdor | Host | Quan | Dades que rep |
|---|---|---|---|
| OpenTopoMap (capa per defecte) | `a.tile.opentopomap.org` | en veure el mapa (`LeafletWebMap`) i en descarregar àrees (`MapCacheService`, `TILE_SERVER`) | IP de l'usuari, `User-Agent`/capçaleres del WebView, coordenades de tile `z/x/y` (revelen la **zona aproximada que mira**) |
| OpenStreetMap (capa alternativa) | `{s}.tile.openstreetmap.org` | només si l'usuari tria la capa OSM | el mateix |

- **No s'hi envia** cap identificador de l'usuari (UID, token, correu) ni cap dada del compte; són peticions anònimes de tiles **[FET]**.
- La IP + la zona consultada es poden considerar dades personals (RGPD); l'app no pot evitar que el proveïdor les vegi mentre carregui els tiles directament **[INFERÈNCIA]**.
- **Garanties**: no hi ha contracte ni encàrrec de tractament (DPA) amb cap dels dos; s'aplica només la política d'ús/privacitat pública de cada servei (OSMF per a OSM; voluntaris per a OpenTopoMap) **[NO VERIFICAT]**: cal revisar les seves polítiques abans de produir i declarar-ho a la política de privacitat de l'app.
- **Alternatives a decidir**: (a) mantenir-los i declarar-ho a la política de privacitat; (b) contractar un servei de tiles amb DPA; (c) servir tiles propis. No es passen pel backend: les polítiques d'ús dels tiles restringeixen el proxy/descàrrega massiva i multiplicaria el consum del servidor.
