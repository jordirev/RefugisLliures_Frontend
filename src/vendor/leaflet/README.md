# Leaflet empaquetat

`leafletAssets.ts` conté, com a cadenes, els fitxers de `leaflet@1.9.4`, `leaflet.heat@0.2.0` i `leaflet.markercluster@1.5.3`
(idèntics als de npm; el SHA-256 de `leaflet.js` i `leaflet.css` coincideix amb els SRI que l'app ja usava).
`LeafletWebMap` els injecta inline al HTML del WebView, així que **no hi ha cap petició a unpkg.com** (RGPD: no s'exposa la IP).

Per actualitzar: `npm pack leaflet@X leaflet.heat@Y leaflet.markercluster@Z`, descomprimir i regenerar el fitxer amb la
mateixa estructura d'exportacions (`LEAFLET_JS`, `LEAFLET_CSS`, `LEAFLET_HEAT_JS`, `MARKERCLUSTER_JS`,
`MARKERCLUSTER_CSS`, `MARKERCLUSTER_DEFAULT_CSS`).
