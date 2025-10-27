import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, StyleSheet, Alert, BackHandler, Platform } from 'react-native';
import { MapViewComponent } from '../components/MapViewComponent';
import { SearchBar } from '../components/SearchBar';
import { FilterPanel } from '../components/FilterPanel';
import { Location, Filters } from '../types';
import { RefugisService } from '../services/RefugisService';
import { useTranslation } from '../utils/useTranslation';

interface MapScreenProps {
  onLocationSelect: (location: Location) => void;
  selectedLocation?: Location;
}

const MAX_ALTITUDE = 3250;
const MAX_PLACES = 30;

export function MapScreen({ 
  onLocationSelect,
  selectedLocation 
}: MapScreenProps) {
  const { t } = useTranslation();
  
  // Estats locals de MapScreen
  const [searchQuery, setSearchQuery] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [allLocations, setAllLocations] = useState<Location[]>([]); // Guardar tots els refugis
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const [filters, setFilters] = useState<Filters>({
    types: [],
    altitude: [0, MAX_ALTITUDE],
    places: [0, MAX_PLACES],
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
        // places
        if (filters.places && (filters.places[0] > 0 || filters.places[1] < MAX_PLACES)) {
          filterParams.places_min = filters.places[0];
          filterParams.places_max = filters.places[1];
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
        Alert.alert(t('common.error'), t('map.errorLoading'));
        //console.error('Invalid refugis response:', data);
        return;
      }
      setAllLocations(data); // Guardar tots els refugis
      setLocations(data); // Mostrar tots inicialment
    } catch (error) {
      Alert.alert(t('common.error'), t('map.errorLoading'));
      //console.error(error);
    }
  };

  const handleOpenFilters = useCallback(() => {
    setIsFilterOpen(true);
  }, []);

  const handleCloseFilters = useCallback(() => {
    setIsFilterOpen(false);
  }, []);

  const handleFiltersChange = useCallback((newFilters: Filters) => {
    setFilters(newFilters);
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Quan l'usuari selecciona un suggeriment
  const handleSuggestionSelect = useCallback((name: string) => {
    setSearchQuery(name);
    // Trobar el refugi seleccionat i obtenir detall (des de la cache si s'hi troba)
    const selectedRefuge = allLocations.find(loc => loc.name === name);
    const fetchAndSelect = async (id: number) => {
      try {
        const detailed = await RefugisService.getRefugiById(id);
        if (detailed) onLocationSelect(detailed);
      } catch (err) {
        // ignore
      }
    };
    if (selectedRefuge && selectedRefuge.id) {
      fetchAndSelect(selectedRefuge.id);
    }
  }, [allLocations, onLocationSelect]);

  // Si l'usuari prem el botó 'back' d'Android mentre hi ha text a la cerca,
  // esborrar la cerca i consumir l'esdeveniment (no fer el back navegacional).
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      if (searchQuery && searchQuery.trim().length > 0) {
        setSearchQuery('');
        return true; // event handled
      }
      return false; // let default behaviour run (navigate back)
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [searchQuery]);

  return (
    <View style={styles.container}>
      <MapViewComponent
        locations={locations}
        onLocationSelect={async (payload: any) => {
          try {
            if (typeof payload === 'number') {
              const detailed = await RefugisService.getRefugiById(payload);
              if (detailed) onLocationSelect(detailed);
            } else if (payload && payload.id) {
              const detailed = await RefugisService.getRefugiById(payload.id);
              if (detailed) onLocationSelect(detailed);
            }
          } catch (err) {
            // ignore
          }
        }}
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

      {/* Panel de filtres */}
      <FilterPanel
        isOpen={isFilterOpen}
        onClose={handleCloseFilters}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        maxAltitude={MAX_ALTITUDE}
        maxPlaces={MAX_PLACES}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
});
