import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { Location } from '../types';
import { MapCacheService } from '../services/MapCacheService';

interface LeafletWebMapProps {
  locations: Location[];
  onLocationSelect: (location: Location) => void;
  selectedLocation?: Location;
  center?: [number, number];
  zoom?: number;
}

export function LeafletWebMap({ 
  locations, 
  onLocationSelect, 
  selectedLocation,
  center = [42.6, 0.7], // Centre dels Pirineus
  zoom = 8 
}: LeafletWebMapProps) {
  
  const [cacheStatus, setCacheStatus] = useState<any>(null);

  useEffect(() => {
    // Inicialitzar cache i obtenir estat
    const initCache = async () => {
      await MapCacheService.initializeCache();
      const status = await MapCacheService.getCacheStatus();
      setCacheStatus(status);
    };
    
    initCache();
  }, []);
  
  // Generar HTML amb Leaflet
  const mapHTML = `
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
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .leaflet-popup-content {
          margin: 12px;
          line-height: 1.4;
        }
        .popup-title {
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 8px;
        }
        .popup-description {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 8px;
        }
        .popup-details {
          font-size: 12px;
          color: #9ca3af;
        }
        .popup-detail {
          margin-bottom: 4px;
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
          html: '<div style="background: #ea580c; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"><span style="color: white; font-size: 12px;">🏠</span></div>',
          className: 'custom-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        var selectedIcon = L.divIcon({
          html: '<div style="background: #f97316; width: 28px; height: 28px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.4);"><span style="color: white; font-size: 14px;">🏠</span></div>',
          className: 'custom-marker-selected',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        // Afegir marcadors per cada refugi
        var locations = ${JSON.stringify(locations)};
        var selectedLocationId = ${selectedLocation?.id || null};
        
        locations.forEach(function(location) {
          var isSelected = location.id === selectedLocationId;
          var marker = L.marker([location.coord.lat, location.coord.long], {
            icon: isSelected ? selectedIcon : refugeIcon
          }).addTo(map);

          var popupContent = '<div>' +
            '<div class="popup-title">' + location.name + '</div>';
          
          if (location.description) {
            var shortDescription = location.description.length > 150 
              ? location.description.substring(0, 150) + '...' 
              : location.description;
            popupContent += '<div class="popup-description">' + shortDescription.replace(/\\[b\\]/g, '').replace(/\\[\\/b\\]/g, '') + '</div>';
          }
          
          popupContent += '<div class="popup-details">' +
            '<div class="popup-detail">📍 ' + location.coord.lat.toFixed(4) + ', ' + location.coord.long.toFixed(4) + '</div>';
          
          if (location.altitude) {
            popupContent += '<div class="popup-detail">⛰️ ' + location.altitude + 'm</div>';
          }
          
          if (location.condition) {
            popupContent += '<div class="popup-detail">🏔️ Estat: ' + location.condition + '</div>';
          }
          
          if (location.places !== undefined) {
            popupContent += '<div class="popup-detail">🛏️ Places: ' + location.places + '</div>';
          }
          
          popupContent += '</div></div>';
          
          marker.bindPopup(popupContent);
          
          marker.on('click', function() {
            // Enviar missatge a React Native quan es fa clic en un marcador
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'locationSelect',
              location: location
            }));
          });
        });

        // Si hi ha una ubicació seleccionada, centrar-la
        if (selectedLocationId) {
          var selectedLocation = locations.find(function(loc) { return loc.id === selectedLocationId; });
          if (selectedLocation) {
            map.setView([selectedLocation.coord.lat, selectedLocation.coord.long], 14);
          }
        }

        // Desactivar els controls de zoom per defecte (podem afegir els nostres propis botons)
        map.zoomControl.remove();
      </script>
    </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'locationSelect' && data.location) {
        onLocationSelect(data.location);
      }
    } catch (error) {
      console.error('Error parsing message from WebView:', error);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});