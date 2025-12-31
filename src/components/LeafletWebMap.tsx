import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { Location } from '../models';
import { MapCacheService } from '../services/MapCacheService';

export type RepresentationType = 'markers' | 'heatmap' | 'cluster';
export type MapLayerType = 'opentopomap' | 'openstreetmap';

interface LeafletWebMapProps {
  locations: Location[];
  onLocationSelect: (location: Location) => void;
  selectedLocation?: Location;
  center?: [number, number];
  zoom?: number;
  userLocation?: {latitude: number, longitude: number} | null;
  representation?: RepresentationType;
  mapLayer?: MapLayerType;
}

// Memoritzem el component per evitar re-renders innecessaris
export const LeafletWebMap = memo(function LeafletWebMap({ 
  locations, 
  onLocationSelect, 
  selectedLocation,
  center = [42.6, 0.7], // Centre dels Pirineus
  zoom = 8,
  userLocation,
  representation = 'markers',
  mapLayer = 'opentopomap'
}: LeafletWebMapProps) {
  const [cacheStatus, setCacheStatus] = useState<any>(null);
  const webViewRef = useRef<any>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const previousLocationsRef = useRef<Location[]>([]);

  useEffect(() => {
    // Inicialitzar cache i obtenir estat
    const initCache = async () => {
      try {
        await MapCacheService.initializeCache();
        const status = await MapCacheService.getCacheStatus();
        setCacheStatus(status);
      } catch (error) {
        console.error('Error initializing cache:', error);
        // Continue with default cache status (null)
      }
    };
    initCache();
  }, []);

  // Actualitzar markers dinàmicament quan locations canvia (després de la inicialització)
  useEffect(() => {
    if (mapInitialized && webViewRef.current && locations.length > 0) {
      // Només actualitzar si les locations han canviat realment
      const locationsChanged = JSON.stringify(previousLocationsRef.current) !== JSON.stringify(locations);
      if (locationsChanged) {
        const js = `
          if (typeof updateMarkers === 'function') {
            updateMarkers(${JSON.stringify(locations)}, ${JSON.stringify(selectedLocation?.id || null)}, '${representation}');
          }
        `;
        webViewRef.current.injectJavaScript(js);
        previousLocationsRef.current = locations;
      }
    }
  }, [locations, mapInitialized, selectedLocation, representation]);

  // Actualitzar representació quan canvia
  useEffect(() => {
    if (mapInitialized && webViewRef.current) {
      const js = `
        if (typeof changeRepresentation === 'function') {
          changeRepresentation('${representation}', ${JSON.stringify(locations)}, ${JSON.stringify(selectedLocation?.id || null)});
        }
      `;
      webViewRef.current.injectJavaScript(js);
    }
  }, [representation, mapInitialized]);

  // Actualitzar capa del mapa quan canvia
  useEffect(() => {
    if (mapInitialized && webViewRef.current) {
      const js = `
        if (typeof changeMapLayer === 'function') {
          changeMapLayer('${mapLayer}');
        }
      `;
      webViewRef.current.injectJavaScript(js);
    }
  }, [mapLayer, mapInitialized]);

  // Actualitzar el marker seleccionat
  useEffect(() => {
    if (mapInitialized && webViewRef.current) {
      const lat = selectedLocation?.coord?.lat;
      const lng = selectedLocation?.coord?.long;
      const id = selectedLocation?.id;

      const js = `
        (function() {
          try {
            if (typeof updateSelectedMarker === 'function') {
              updateSelectedMarker(
                ${JSON.stringify(id || null)}, 
                ${JSON.stringify(lat || null)}, 
                ${JSON.stringify(lng || null)}
              );
            }
          } catch(e) {
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'debug',
              message: 'Error in updateSelectedMarker: ' + e.message
            }));
          }
        })();
        true;
      `;
      webViewRef.current.injectJavaScript(js);
    }
  }, [selectedLocation, mapInitialized]);

  // Centrar el mapa quan userLocation canvia
  useEffect(() => {
    // Only attempt to modify the WebView map after it has initialized
    if (mapInitialized && webViewRef.current) {
      const js = `
        (function() {
          try {
            // Remove previous user marker if present
            if (window.userMarker) {
              try { map.removeLayer(window.userMarker); } catch(e) {}
              window.userMarker = null;
            }

            var ul = ${JSON.stringify(userLocation)};
            if (ul && ul.latitude && ul.longitude) {
              // Add a round blue marker with white border and shadow
              window.userMarker = L.marker([ul.latitude, ul.longitude], { icon: userLocationIcon }).addTo(map);
              // Center map to the user location
              map.setView([ul.latitude, ul.longitude], 8);
            }
          } catch(err) {
            // swallow errors coming from injected code
            console && console.error && console.error('inject userLocation error', err);
          }
        })();
        true;
      `;
      webViewRef.current.injectJavaScript(js);
    }
  }, [userLocation, mapInitialized]);

  // Generar HTML amb Leaflet - Memoritzar per evitar regeneració
  const mapHTML = useMemo(() => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Mapa de Refugis</title>
      
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossorigin=""/>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
        crossorigin=""></script>
      
      <!-- Leaflet.heat for heatmap -->
      <script src="https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js"></script>
      
      <!-- Leaflet.markercluster for clustering -->
      <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
      <script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
      
      <style>
        body { 
          margin: 0; 
          padding: 0; 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        #map { 
          height: 100vh; 
          width: 100vw; 
        }
        /* Custom cluster styles */
        .marker-cluster-small {
          background-color: rgba(255, 105, 0, 0.6);
        }
        .marker-cluster-small div {
          background-color: rgba(255, 105, 0, 0.8);
        }
        .marker-cluster-medium {
          background-color: rgba(255, 105, 0, 0.6);
        }
        .marker-cluster-medium div {
          background-color: rgba(255, 105, 0, 0.8);
        }
        .marker-cluster-large {
          background-color: rgba(255, 105, 0, 0.6);
        }
        .marker-cluster-large div {
          background-color: rgba(255, 105, 0, 0.9);
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      
      <script>
        // Inicialitzar el mapa centrat als Pirineus
        var map = L.map('map', { attributionControl: false }).setView([${center[0]}, ${center[1]}], ${zoom});

        // Cache status information
        var cacheInfo = ${JSON.stringify(cacheStatus)};
        var hasCache = cacheInfo && cacheInfo.metadata && cacheInfo.metadata.isComplete;

        // Definir les capes de mapa
        var tileLayers = {
          opentopomap: L.tileLayer('https://a.tile.opentopomap.org/{z}/{x}/{y}.png', {
            maxZoom: 17,
          }),
          openstreetmap: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
          })
        };

        // Capa actual
        var currentLayer = '${mapLayer}';
        var tileLayer = tileLayers[currentLayer].addTo(map);

        // Icona personalitzada per als refugis
        var refugeIcon = L.divIcon({
          html: '<div style="width: 28px; height: 28px; padding-right: 0.02px; background: #FF6900; box-shadow: 0px 4px 6px -4px rgba(0, 0, 0, 0.10); border-radius: 50%; justify-content: center; align-items: center; display: flex;"><div style="width: 16px; height: 16px; position: relative; overflow: hidden;"><svg width="16" height="16" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.9585 14.4595V9.12744C10.9585 8.95067 10.8883 8.78115 10.7633 8.65615C10.6383 8.53116 10.4688 8.46094 10.292 8.46094H7.62598C7.44921 8.46094 7.27968 8.53116 7.15469 8.65615C7.02969 8.78115 6.95947 8.95067 6.95947 9.12744V14.4595" stroke="white" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/><path d="M2.96045 7.12793C2.9604 6.93402 3.00266 6.74244 3.08428 6.56654C3.16589 6.39065 3.2849 6.23468 3.433 6.10951L8.09853 2.11049C8.33913 1.90714 8.64397 1.79558 8.95898 1.79558C9.274 1.79558 9.57884 1.90714 9.81944 2.11049L14.485 6.10951C14.6331 6.23468 14.7521 6.39065 14.8337 6.56654C14.9153 6.74244 14.9576 6.93402 14.9575 7.12793V13.1265C14.9575 13.48 14.8171 13.8191 14.5671 14.069C14.3171 14.319 13.978 14.4595 13.6245 14.4595H4.29346C3.93992 14.4595 3.60087 14.319 3.35088 14.069C3.10089 13.8191 2.96045 13.48 2.96045 13.1265V7.12793Z" stroke="white" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/></svg></div></div>',
          className: 'custom-marker',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        var selectedIcon = L.divIcon({
          html: '<div style="width: 32px; height: 32px; padding-right: 0.02px; background: #FF6900; box-shadow: 0px 4px 6px -4px rgba(0, 0, 0, 0.10), 0px 0px 0px 3px rgba(255, 255, 255, 0.8); border-radius: 50%; justify-content: center; align-items: center; display: flex;"><div style="width: 18px; height: 18px; position: relative; overflow: hidden;"><svg width="18" height="18" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.9585 14.4595V9.12744C10.9585 8.95067 10.8883 8.78115 10.7633 8.65615C10.6383 8.53116 10.4688 8.46094 10.292 8.46094H7.62598C7.44921 8.46094 7.27968 8.53116 7.15469 8.65615C7.02969 8.78115 6.95947 8.95067 6.95947 9.12744V14.4595" stroke="white" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/><path d="M2.96045 7.12793C2.9604 6.93402 3.00266 6.74244 3.08428 6.56654C3.16589 6.39065 3.2849 6.23468 3.433 6.10951L8.09853 2.11049C8.33913 1.90714 8.64397 1.79558 8.95898 1.79558C9.274 1.79558 9.57884 1.90714 9.81944 2.11049L14.485 6.10951C14.6331 6.23468 14.7521 6.39065 14.8337 6.56654C14.9153 6.74244 14.9576 6.93402 14.9575 7.12793V13.1265C14.9575 13.48 14.8171 13.8191 14.5671 14.069C14.3171 14.319 13.978 14.4595 13.6245 14.4595H4.29346C3.93992 14.4595 3.60087 14.319 3.35088 14.069C3.10089 13.8191 2.96045 13.48 2.96045 13.1265V7.12793Z" stroke="white" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/></svg></div></div>',
          className: 'custom-marker-selected',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        // Icona blava per la ubicació de l'usuari
        var userLocationIcon = L.divIcon({
          html: '<div style="width: 16px; height: 16px; background: #2563eb; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.2);"></div>',
          className: 'user-location-marker',
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });

        // Variables globals per gestionar les diferents representacions
        var markers = [];
        var markerClusterGroup = null;
        var heatmapLayer = null;
        var userMarker = null;
        var currentRepresentation = '${representation}';
        
        window.userMarker = null;

        // Funció per netejar totes les capes de representació
        function clearRepresentations() {
          // Netejar markers individuals
          markers.forEach(function(m) {
            map.removeLayer(m);
          });
          markers = [];
          
          // Netejar cluster
          if (markerClusterGroup) {
            map.removeLayer(markerClusterGroup);
            markerClusterGroup = null;
          }
          
          // Netejar heatmap
          if (heatmapLayer) {
            map.removeLayer(heatmapLayer);
            heatmapLayer = null;
          }
        }

        // Funció per afegir marcadors normals
        function addMarkers(locations, selectedId) {
          clearRepresentations();

          locations.forEach(function(location) {
            var isSelected = location.id === selectedId;
            var marker = L.marker([location.coord.lat, location.coord.long], {
              icon: isSelected ? selectedIcon : refugeIcon
            }).addTo(map);

            marker.locationData = location;
            marker.on('click', function() {
              window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'locationSelect',
                id: location.id
              }));
            });

            markers.push(marker);
          });
        }

        // Funció per afegir heatmap
        function addHeatmap(locations, selectedId) {
          clearRepresentations();
          
          var currentZoom = map.getZoom();
          var TRANSITION_ZOOM = 12; // Zoom a partir del qual mostrem markers
          
          if (currentZoom >= TRANSITION_ZOOM) {
            // Mostrar markers individuals
            addMarkers(locations, selectedId);
          } else {
            // Mostrar heatmap
            var heatData = locations.map(function(loc) {
              return [loc.coord.lat, loc.coord.long, 1.5]; // [lat, lng, intensity] - augmentat per més visibilitat
            });
            
            heatmapLayer = L.heatLayer(heatData, {
              radius: 30,
              blur: 20,
              max: 1.0,
              maxZoom: TRANSITION_ZOOM,
              gradient: {
                0.0: '#FED7AA',
                0.3: '#FDBA74',
                0.5: '#FB923C',
                0.7: '#F97316',
                0.9: '#FF6900',
                1.0: '#EA580C'
              }
            }).addTo(map);
          }
          
          // Event listener per canviar a markers quan fem zoom
          map.off('zoomend', handleHeatmapZoom);
          map.on('zoomend', handleHeatmapZoom);
          
          function handleHeatmapZoom() {
            var zoom = map.getZoom();
            if (currentRepresentation === 'heatmap') {
              if (zoom >= TRANSITION_ZOOM && heatmapLayer) {
                clearRepresentations();
                addMarkers(locations, selectedId);
              } else if (zoom < TRANSITION_ZOOM && markers.length > 0) {
                clearRepresentations();
                addHeatmap(locations, selectedId);
              }
            }
          }
        }

        // Funció per afegir clusters
        function addCluster(locations, selectedId) {
          clearRepresentations();
          
          var currentZoom = map.getZoom();
          var TRANSITION_ZOOM = 12; // Zoom a partir del qual desactivem clustering
          
          markerClusterGroup = L.markerClusterGroup({
            maxClusterRadius: currentZoom >= TRANSITION_ZOOM ? 0 : 80,
            disableClusteringAtZoom: TRANSITION_ZOOM,
            spiderfyOnMaxZoom: false,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            iconCreateFunction: function(cluster) {
              var count = cluster.getChildCount();
              var size = 'small';
              if (count >= 10) size = 'medium';
              if (count >= 20) size = 'large';
              
              return L.divIcon({
                html: '<div><span>' + count + '</span></div>',
                className: 'marker-cluster marker-cluster-' + size,
                iconSize: L.point(40, 40)
              });
            }
          });
          
          locations.forEach(function(location) {
            var isSelected = location.id === selectedId;
            var marker = L.marker([location.coord.lat, location.coord.long], {
              icon: isSelected ? selectedIcon : refugeIcon
            });
            
            marker.locationData = location;
            marker.on('click', function() {
              window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'locationSelect',
                id: location.id
              }));
            });
            
            markerClusterGroup.addLayer(marker);
            markers.push(marker);
          });
          
          map.addLayer(markerClusterGroup);
        }

        // Funció per canviar el tipus de representació
        window.changeRepresentation = function(newRepresentation, locations, selectedId) {
          currentRepresentation = newRepresentation;
          
          if (newRepresentation === 'markers') {
            addMarkers(locations, selectedId);
          } else if (newRepresentation === 'heatmap') {
            addHeatmap(locations, selectedId);
          } else if (newRepresentation === 'cluster') {
            addCluster(locations, selectedId);
          }
        };

        // Funció per canviar la capa del mapa
        window.changeMapLayer = function(newLayer) {
          if (currentLayer !== newLayer && tileLayers[newLayer]) {
            map.removeLayer(tileLayer);
            tileLayer = tileLayers[newLayer].addTo(map);
            currentLayer = newLayer;
          }
        };

        // Funció per actualitzar markers (crida des de React Native)
        window.updateMarkers = function(newLocations, selectedId, representation) {
          representation = representation || currentRepresentation;
          
          if (representation === 'markers') {
            addMarkers(newLocations, selectedId);
          } else if (representation === 'heatmap') {
            addHeatmap(newLocations, selectedId);
          } else if (representation === 'cluster') {
            addCluster(newLocations, selectedId);
          }
        };

        // Funció per actualitzar només el marker seleccionat (més eficient)
        window.updateSelectedMarker = function(selectedId, lat, lng) {
          try {
            // Actualitzar icones de tots els marcadors
            markers.forEach(function(marker) {
              var isSelected = marker.locationData && marker.locationData.id === selectedId;
              marker.setIcon(isSelected ? selectedIcon : refugeIcon);
            });
            
            // Centrar mapa al refugi seleccionat
            if (selectedId) {
              var targetLat = lat;
              var targetLng = lng;
              
              // Si no tenim coordenades passades, buscar-les al marcador
              if (targetLat === null || targetLat === undefined || targetLng === null || targetLng === undefined) {
                var selectedMarker = markers.find(function(m) { 
                  return m.locationData && m.locationData.id === selectedId; 
                });
                
                if (selectedMarker && selectedMarker.locationData && selectedMarker.locationData.coord) {
                  targetLat = selectedMarker.locationData.coord.lat;
                  targetLng = selectedMarker.locationData.coord.long;
                }
              }
              
              // Fer zoom si tenim coordenades
              if (targetLat !== null && targetLat !== undefined && targetLng !== null && targetLng !== undefined) {
                map.setView([targetLat, targetLng], 14, {
                  animate: true,
                  duration: 0.5
                });
              }
            }
          } catch(e) {
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'debug',
              message: 'Error in updateSelectedMarker: ' + e.message
            }));
          }
        };

        // Inicialitzar amb la representació adequada
        var initialLocations = ${JSON.stringify(locations)};
        var selectedLocationId = ${JSON.stringify(selectedLocation?.id || null)};
        var initialRepresentation = '${representation}';
        
        if (initialRepresentation === 'markers') {
          addMarkers(initialLocations, selectedLocationId);
        } else if (initialRepresentation === 'heatmap') {
          addHeatmap(initialLocations, selectedLocationId);
        } else if (initialRepresentation === 'cluster') {
          addCluster(initialLocations, selectedLocationId);
        }

        // Dibuixa la bola blava si tenim userLocation (assignada a window.userMarker per evitar duplicats)
        var userLocation = ${JSON.stringify(userLocation)};
        if (userLocation && userLocation.latitude && userLocation.longitude) {
          try {
            if (window.userMarker) {
              try { map.removeLayer(window.userMarker); } catch(e) {}
              window.userMarker = null;
            }
          } catch(e) {}

          window.userMarker = L.marker([userLocation.latitude, userLocation.longitude], {
            icon: userLocationIcon
          }).addTo(map);
        }

        // Event listener per centrar el mapa en la ubicació de l'usuari
        window.addEventListener('centerMapTo', function(event) {
          var detail = event.detail;
          if (detail && detail.lat && detail.lng) {
            map.setView([detail.lat, detail.lng], detail.zoom || 15);
          }
        });

        // Si vols centrar el mapa a una ubicació seleccionada, fes-ho només si NO hi ha userLocation actiu
        // Així evitem sobreescriure el centrat de la ubicació de l'usuari
        if (selectedLocationId && !(userLocation && userLocation.latitude && userLocation.longitude)) {
          var selectedMarker = markers.find(function(m) { 
            return m.locationData && m.locationData.id === selectedLocationId; 
          });
          if (selectedMarker && selectedMarker.locationData && selectedMarker.locationData.coord) {
            var lat = selectedMarker.locationData.coord.lat;
            var lng = selectedMarker.locationData.coord.long;
            if (lat !== undefined && lng !== undefined) {
              map.setView([lat, lng], 14);
            }
          }
        }

        // Desactivar els controls de zoom per defecte (podem afegir els nostres propis botons)
        map.zoomControl.remove();

        // Notificar que el mapa està inicialitzat
        window.ReactNativeWebView?.postMessage(JSON.stringify({
          type: 'mapInitialized'
        }));
      </script>
    </body>
    </html>
  `, [cacheStatus]); // Només regenerar HTML si canvia el cache

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'locationSelect') {
        // payload can be { id } coming from the webview
        if (data.id !== undefined) {
          onLocationSelect(data.id);
        } else if (data.location) {
          onLocationSelect(data.location);
        }
      } else if (data.type === 'mapInitialized') {
        setMapInitialized(true);
      } else if (data.type === 'debug') {
        console.log('[WebView]', data.message);
      }
    } catch (error) {
      console.error('Error parsing message from WebView:', error);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: mapHTML }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        scrollEnabled={false}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        testID="webview"
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});