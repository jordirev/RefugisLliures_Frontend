import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MapViewComponent } from '../components/MapViewComponent';
import { SearchBar } from '../components/SearchBar';
import { Location } from '../types';

interface MapScreenProps {
  locations: Location[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenFilters: () => void;
  onLocationSelect: (location: Location) => void;
  selectedLocation?: Location;
}

export function MapScreen({ 
  locations, 
  searchQuery, 
  onSearchChange, 
  onOpenFilters,
  onLocationSelect,
  selectedLocation 
}: MapScreenProps) {
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
          onSearchChange={onSearchChange}
          onOpenFilters={onOpenFilters}
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
