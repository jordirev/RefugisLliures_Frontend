import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { Location } from '../models';
import { MapCacheService } from '../services/MapCacheService';

interface LeafletWebMapProps {
  locations: Location[];
  onLocationSelect: (location: Location) => void;
  selectedLocation?: Location;
  center?: [number, number];
  zoom?: number;
  userLocation?: {latitude: number, longitude: number} | null;
}

// Memoritzem el component per evitar re-renders innecessaris
export const LeafletWebMap = memo(function LeafletWebMap({ 
  locations, 
  onLocationSelect, 
  selectedLocation,
  center = [42.6, 0.7], // Centre dels Pirineus
  zoom = 8,
  userLocation
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
            updateMarkers(${JSON.stringify(locations)}, ${JSON.stringify(selectedLocation?.id || null)});
          }
        `;
        webViewRef.current.injectJavaScript(js);
        previousLocationsRef.current = locations;
      }
    }
  }, [locations, mapInitialized, selectedLocation]);

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
  }, [selectedLocation?.id, selectedLocation?.coord?.lat, selectedLocation?.coord?.long, mapInitialized]);

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
        /* Popups disabled - removed popup styles to prevent popup rendering */
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

        // Funció per obtenir URL de tile (cache híbrid)
        function getTileUrl(coords) {
          var z = coords.z;
          var x = coords.x;
          var y = coords.y;
          
          // Si tenim cache, intentar usar tiles locals primer
          if (hasCache) {
            // Aquesta és una simulació - en una implementació real, hauríem de comprovar si el tile existeix localment
            // Per ara, utilitzarem online sempre, però amb la infraestructura preparada per cache
            return 'https://a.tile.opentopomap.org/' + z + '/' + x + '/' + y + '.png';
          }
          
          return 'https://a.tile.opentopomap.org/' + z + '/' + x + '/' + y + '.png';
        }

        // Crear una capa personalitzada que pot usar cache
        var CustomTileLayer = L.TileLayer.extend({
          createTile: function(coords, done) {
            var tile = document.createElement('img');
            
            tile.onload = function() {
              done(null, tile);
            };
            
            tile.onerror = function() {
              // Fallback a online si local falla
              tile.src = 'https://a.tile.opentopomap.org/' + coords.z + '/' + coords.x + '/' + coords.y + '.png';
            };
            
            tile.src = getTileUrl(coords);
            return tile;
          }
        });

        // Afegir la capa personalitzada
        var tileLayer = new CustomTileLayer('', {
          maxZoom: 17,
        }).addTo(map);

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

        // Icona blava per la ubicació de l'usuari (escala 2/3)
        // Reduïm el diàmetre i l'ample del border per fer-la aproximadament 2/3 de la mida original
        var userLocationIcon = L.divIcon({
          html: '<div style="width: 16px; height: 16px; background: #2563eb; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.2);"></div>',
          className: 'user-location-marker',
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });

  // Gestió de marcadors - guardem referència global
  var markers = [];
  var userMarker = null;
  // Expose userMarker on window so injected updates can reference/remove it
  window.userMarker = null;

        // Popups removed; no popup content function

        // Funció per afegir marcadors
        function addMarkers(locations, selectedId) {
          // Eliminar marcadors existents
          markers.forEach(function(m) {
            map.removeLayer(m);
          });
          markers = [];

          // Afegir nous marcadors
          locations.forEach(function(location) {
            var isSelected = location.id === selectedId;
            var marker = L.marker([location.coord.lat, location.coord.long], {
              icon: isSelected ? selectedIcon : refugeIcon
            }).addTo(map);

            marker.locationData = location;
            // No popup bound to marker; only notify React Native on click
            marker.on('click', function() {
              window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'locationSelect',
                id: location.id
              }));
            });

            markers.push(marker);
          });
        }

        // Funció per actualitzar markers (crida des de React Native)
        window.updateMarkers = function(newLocations, selectedId) {
          addMarkers(newLocations, selectedId);
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

        // Inicialitzar marcadors
        var initialLocations = ${JSON.stringify(locations)};
        var selectedLocationId = ${JSON.stringify(selectedLocation?.id || null)};
        addMarkers(initialLocations, selectedLocationId);

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