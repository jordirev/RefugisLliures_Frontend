import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Location } from '../types';

interface MapViewComponentProps {
  locations: Location[];
  onLocationSelect: (location: Location) => void;
  selectedLocation?: Location;
}

export function MapViewComponent({ locations, onLocationSelect, selectedLocation }: MapViewComponentProps) {
  // Centre dels Pirineus
  const initialRegion = {
    latitude: 42.6,
    longitude: 0.7,
    latitudeDelta: 1.0,
    longitudeDelta: 1.0,
  };

  return (
    <View style={styles.container}>
      {/* Temporary placeholder for map */}
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapPlaceholderText}>🗺️ Mapa dels Refugis</Text>
        <Text style={styles.mapPlaceholderSubtext}>
          {locations.length} refugis disponibles
        </Text>
        {selectedLocation && (
          <Text style={styles.selectedText}>
            Seleccionat: {selectedLocation.name}
          </Text>
        )}
      </View>

      {/* Botons de control */}
      <View style={styles.controls}>
        {/* Brúixola */}
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={() => {/* TODO: Implementar orientació de brúixola */}}
        >
          <Text style={styles.controlIcon}>🧭</Text>
        </TouchableOpacity>

        {/* Centrar ubicació */}
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={() => {/* TODO: Centrar en ubicació actual */}}
        >
          <Text style={styles.controlIcon}>📍</Text>
        </TouchableOpacity>

        {/* Capes */}
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={() => {/* TODO: Canviar capes del mapa */}}
        >
          <Text style={styles.controlIcon}>🗺️</Text>
        </TouchableOpacity>
      </View>
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
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 20,
  },
  mapPlaceholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
  },
  mapPlaceholderSubtext: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 12,
  },
  selectedText: {
    fontSize: 14,
    color: '#ea580c',
    fontWeight: '600',
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
