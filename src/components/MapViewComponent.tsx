import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import * as ExpoLocation from 'expo-location';
import { Location } from '../types';
import { LeafletWebMap } from './LeafletWebMap';
import { OfflineMapManager } from './OfflineMapManager';

import LayersIcon from '../assets/icons/layers.svg';
import CompassIcon from '../assets/icons/compass3.png';
import TargetIcon from '../assets/icons/target.png';

interface MapViewComponentProps {
  locations: Location[];
  onLocationSelect: (location: Location) => void;
  selectedLocation?: Location;
}

export function MapViewComponent({ locations, onLocationSelect, selectedLocation }: MapViewComponentProps) {
  const [showOfflineManager, setShowOfflineManager] = useState(false);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);

  // Centre dels Pirineus
  const initialRegion = {
    latitude: 42.6,
    longitude: 0.7,
    latitudeDelta: 1.0,
    longitudeDelta: 1.0,
  };

  return (
    <View style={styles.container}>
      {/* Mapa d'OpenTopoMap amb Leaflet */}
      <LeafletWebMap
        locations={locations}
        onLocationSelect={onLocationSelect}
        selectedLocation={selectedLocation}
        center={[initialRegion.latitude, initialRegion.longitude]}
        zoom={8}
        userLocation={userLocation}
      />

      {/* Botons de control */}
      <View style={styles.controls}>
        {/* Brúixola */}
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={() => {/* TODO: Implementar orientació de brúixola */}}
        >
          <Image source={CompassIcon} style={{ width: 72, height: 72, transform: [{ rotate: '30deg' }] }} />
          {/*<CompassIcon width={24} height={24} color="#4A5565" strokeWidth="3" />*/}
        </TouchableOpacity>

        {/* Centrar ubicació */}
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={async () => {
            // Si ja tenim la ubicació mostrada, la amaguem
            if (userLocation) {
              setUserLocation(null);
              return;
            }

            Alert.alert(
              'Permís de localització',
              'Permetre accedir a la ubicació actual del dispositiu?',
              [
                { text: 'Cancel·la', style: 'cancel' },
                { text: 'Permet', onPress: async () => {
                    try {
                      let { status } = await ExpoLocation.requestForegroundPermissionsAsync();
                      if (status !== 'granted') {
                        Alert.alert('Permís denegat', 'No es pot accedir a la ubicació.');
                        return;
                      }
                      let location = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.High });
                      const latitude = location.coords.latitude;
                      const longitude = location.coords.longitude;

                      // Guardar la ubicació de l'usuari sense seleccionar-la
                      setUserLocation({ latitude, longitude });

                      if (typeof window !== 'undefined' && 'CustomEvent' in window) {
                        const ev = new CustomEvent('centerMapTo', { detail: { lat: latitude, lng: longitude, zoom: 15 } });
                        window.dispatchEvent(ev);
                      }
                    } catch (err) {
                      Alert.alert('Error', 'No s\'ha pogut obtenir la ubicació: ' + (err.message || err));
                    }
                  }
                }
              ]
            );
          }}
        >
          <Image source={TargetIcon} style={{ width: 20, height: 20, tintColor: '#4A5565' }} />
        </TouchableOpacity>

        {/* Capes */}
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={() => setShowOfflineManager(true)}
        >
          <LayersIcon width={16} height={16} color="#4A5565" />
        </TouchableOpacity>
      </View>

      {/* Gestor de mapes offline */}
      <OfflineMapManager
        visible={showOfflineManager}
        onClose={() => setShowOfflineManager(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  marker: {
    width: 32,
    height: 32,
    backgroundColor: '#ea580c',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerSelected: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f97316',
  },
  markerText: {
    fontSize: 18,
  },

  controls: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    gap: 12,
  },
  controlButton: {
    width: 48,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  controlIcon: {
    fontSize: 24,
  },
});
