import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { MapViewComponent } from '../components/MapViewComponent';
import { SearchBar } from '../components/SearchBar';
import { Location, Filters } from '../types';
import { RefugisService } from '../services/RefugisService';

interface MapScreenProps {
  onLocationSelect: (location: Location) => void;
  selectedLocation?: Location;
}

const MAX_ALTITUDE = 3250;
const MAX_CAPACITY = 30;

export function MapScreen({ 
  onLocationSelect,
  selectedLocation 
}: MapScreenProps) {
  // Estats locals de MapScreen
  const [searchQuery, setSearchQuery] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  
  const [filters, setFilters] = useState<Filters>({
    types: [],
    altitude: [0, MAX_ALTITUDE],
    capacity: [0, MAX_CAPACITY],
    condition: []
  });

  // Carregar refugis del backend
  useEffect(() => {
    loadRefugis();
  }, [filters, searchQuery]);

  const loadRefugis = async () => {
    try {
      let data;
      // Construir objecte de filtres només si cal
      const filterParams: any = {};
      if (filters) {
        // Altitude
        if (filters.altitude && (filters.altitude[0] > 0 || filters.altitude[1] < MAX_ALTITUDE)) {
          filterParams.altitude_min = filters.altitude[0];
          filterParams.altitude_max = filters.altitude[1];
        }
        // Capacity
        if (filters.capacity && (filters.capacity[0] > 0 || filters.capacity[1] < MAX_CAPACITY)) {
          filterParams.places_min = filters.capacity[0];
          filterParams.places_max = filters.capacity[1];
        }
        // Types
        if (filters.types && filters.types.length > 0) {
          filterParams.type = filters.types.join(',');
        }
        // Condition
        if (filters.condition && filters.condition.length > 0) {
          filterParams.condition = filters.condition.join(',');
        }
      }
      // Cerca per nom
      if (searchQuery && searchQuery.trim() !== "") {
        filterParams.search = searchQuery.trim();
      }
      // Si no hi ha cap filtre ni cerca, crida sense paràmetres
      if (Object.keys(filterParams).length === 0) {
        data = await RefugisService.getRefugis();
      } else {
        data = await RefugisService.getRefugis(filterParams);
      }
      setLocations(data);
    } catch (error) {
      Alert.alert('Error', 'No s\'han pogut carregar els refugis');
      console.error(error);
    }
  };

  const handleOpenFilters = () => {
    Alert.alert('Filtres', 'Funcionalitat de filtres en desenvolupament');
    // TODO: Implementar pantalla de filtres que actualitzi l'estat 'filters'
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <View style={styles.container}>
      <MapViewComponent
        locations={locations}
        onLocationSelect={onLocationSelect}
        selectedLocation={selectedLocation}
      />
      <View
        style={{
          position: 'absolute',
          left: 4,
          right: 4,
          top: '0%',
          zIndex: 10,
          elevation: 10,
        }}
      >
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onOpenFilters={handleOpenFilters}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
});
