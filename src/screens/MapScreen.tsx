import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  const [allLocations, setAllLocations] = useState<Location[]>([]); // Guardar tots els refugis
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const [filters, setFilters] = useState<Filters>({
    types: [],
    altitude: [0, MAX_ALTITUDE],
    capacity: [0, MAX_CAPACITY],
    condition: []
  });

  // Filtrar refugis localment basant-se en searchQuery
  const filteredLocations = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) {
      return allLocations;
    }
    const lower = searchQuery.toLowerCase();
    return allLocations.filter(loc => 
      loc.name && loc.name.toLowerCase().includes(lower)
    );
  }, [searchQuery, allLocations]);

  // Suggestions d'autocomplete local (només noms únics dels refugis filtrats)
  const suggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    return Array.from(new Set(
      filteredLocations.map(loc => loc.name).filter(Boolean)
    ));
  }, [searchQuery, filteredLocations]);

  // Actualitzar locations mostrats al mapa
  useEffect(() => {
    setLocations(filteredLocations);
  }, [filteredLocations]);

  // Carregar refugis del backend només quan canvien els filtres (no searchQuery!)
  useEffect(() => {
    loadRefugis();
  }, [filters]);

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
      // NO enviem searchQuery a l'API - filtrem localment!
      
      // Si no hi ha cap filtre, crida sense paràmetres
      if (Object.keys(filterParams).length === 0) {
        data = await RefugisService.getRefugis();
      } else {
        data = await RefugisService.getRefugis(filterParams);
      }
      // Validació de la resposta
      if (!Array.isArray(data)) {
        Alert.alert('Error', "No s'han pogut carregar bé els refugis");
        console.error('Invalid refugis response:', data);
        return;
      }
      setAllLocations(data); // Guardar tots els refugis
      setLocations(data); // Mostrar tots inicialment
    } catch (error) {
      Alert.alert('Error', 'No s\'han pogut carregar els refugis');
      console.error(error);
    }
  };

  const handleOpenFilters = useCallback(() => {
    Alert.alert('Filtres', 'Funcionalitat de filtres en desenvolupament');
    // TODO: Implementar pantalla de filtres que actualitzi l'estat 'filters'
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Quan l'usuari selecciona un suggeriment
  const handleSuggestionSelect = useCallback((name: string) => {
    setSearchQuery(name);
    // Trobar el refugi seleccionat i centrar el mapa
    const selectedRefuge = allLocations.find(loc => loc.name === name);
    if (selectedRefuge) {
      onLocationSelect(selectedRefuge);
    }
  }, [allLocations, onLocationSelect]);

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
            suggestions={suggestions}
            onSuggestionSelect={handleSuggestionSelect}
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
