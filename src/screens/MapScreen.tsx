import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, StyleSheet, BackHandler, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MapViewComponent } from '../components/MapViewComponent';
import { SearchBar } from '../components/SearchBar';
import { FilterPanel } from '../components/FilterPanel';
import { Location, Filters } from '../models';
import { useTranslation } from '../hooks/useTranslation';
import { CustomAlert } from '../components/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { useRefuges } from '../hooks/useRefugesQuery';

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
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { alertVisible, alertConfig, showAlert, hideAlert } = useCustomAlert();
  
  // Estats locals de MapScreen
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const [filters, setFilters] = useState<Filters>({
    types: [],
    altitude: [0, MAX_ALTITUDE],
    places: [0, MAX_PLACES],
    condition: []
  });

  // Construir objecte de filtres per React Query
  const filterParams = useMemo(() => {
    const params: any = {};
    
    // Altitude
    if (filters.altitude && (filters.altitude[0] > 0 || filters.altitude[1] < MAX_ALTITUDE)) {
      params.altitude_min = filters.altitude[0];
      params.altitude_max = filters.altitude[1];
    }
    
    // Places
    if (filters.places && (filters.places[0] > 0 || filters.places[1] < MAX_PLACES)) {
      params.places_min = filters.places[0];
      params.places_max = filters.places[1];
    }
    
    // Types
    if (filters.types && filters.types.length > 0) {
      params.type = filters.types.join(',');
    }
    
    // Condition
    if (filters.condition && filters.condition.length > 0) {
      params.condition = filters.condition.join(',');
    }
    
    return Object.keys(params).length > 0 ? params : undefined;
  }, [filters]);

  // Utilitzar React Query per carregar refugis
  const { data: allLocations = [], isLoading, isError } = useRefuges(filterParams);

  // Mostrar alertes quan hi ha errors o no resultats
  useEffect(() => {
    if (isError) {
      showAlert(t('common.error'), t('map.errorLoading'));
    } else if (!isLoading && filterParams && allLocations.length === 0) {
      showAlert(
        t('map.noResults.title'),
        t('map.noResults.message'),
        [{ text: t('common.ok'), onPress: hideAlert }]
      );
    }
  }, [isError, isLoading, filterParams, allLocations.length]);

  // Filtrar refugis localment pel seu nom basant-se en searchQuery 
  // (utilitzat per a llista de suggeriments a la searchbar i mapa)
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
    // Trobar el refugi seleccionat - les dades ja estan disponibles a allLocations
    const selectedRefuge = allLocations.find(loc => loc.name === name);
    if (selectedRefuge) {
      onLocationSelect(selectedRefuge);
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

  const handleAddPress = () => {
    navigation.navigate('CreateRefuge');
  };

  return (
    <View style={styles.container}>
      <MapViewComponent
        locations={filteredLocations}
        onLocationSelect={(payload: any) => {
          // Simplement passar l'objecte sencer que ja està a filteredLocations
          // No cal fer crides addicionals a l'API ja que tenim totes les dades
          if (typeof payload === 'string') {
            const location = filteredLocations.find(loc => loc.id === payload);
            if (location) onLocationSelect(location);
          } else if (payload && payload.id) {
            onLocationSelect(payload);
          }
        }}
        selectedLocation={selectedLocation}
      />
      <View
        style={{
          position: 'absolute',
          left: 4,
          right: 4,
          top: 0,
          zIndex: 10,
          elevation: 10,
        }}
      >
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onOpenFilters={handleOpenFilters}
          onAddPress={handleAddPress}
          suggestions={suggestions}
          onSuggestionSelect={handleSuggestionSelect}
          topInset={insets.top}
        />
      </View>

      {/* Dim the safe area (status bar) when filters are open — same tone as FilterPanel/RefugeBottomSheet */}
      {isFilterOpen && (
        <View
          pointerEvents="none"
          style={[
            styles.safeAreaOverlay,
            { height: insets.top, backgroundColor: 'rgba(0,0,0,0.5)' },
          ]}
        />
      )}

      {/* Panel de filtres */}
      <FilterPanel
        isOpen={isFilterOpen}
        onClose={handleCloseFilters}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        maxAltitude={MAX_ALTITUDE}
        maxPlaces={MAX_PLACES}
      />
      
      {/* CustomAlert */}
      {alertConfig && (
        <CustomAlert
          visible={alertVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onDismiss={hideAlert}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  safeAreaOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 1000,
    elevation: 1000,
  },
});
