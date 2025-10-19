import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Importar les icones SVG
import SearchIcon from '../assets/icons/search.svg';
import FilterIcon from '../assets/icons/filters.svg';
import PlusIcon from '../assets/icons/plus.svg';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenFilters: () => void;
}

export function SearchBar({ searchQuery, onSearchChange, onOpenFilters }: SearchBarProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Container de cerca */}
        <View style={styles.searchContainer}>
          <View style={styles.inputWrapper}>
            <SearchIcon 
              width={20} 
              height={20} 
              color="#6B7280" 
            />
            <TextInput
              style={styles.input}
              placeholder="Cercar refugis..."
              value={searchQuery}
              onChangeText={onSearchChange}
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={onOpenFilters}
          >
            <FilterIcon width={18} height={18} color="#6B7280" />
          </TouchableOpacity>
        </View>
        {/* Botó afegeix */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {/* TODO: Implementar afegir nova ubicació */}}
        >
          <View style={styles.addIconContainer}>
            <Text style={styles.plusText}>+</Text>
          </View>
          <Text style={styles.addText}>Afegeix</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: 'transparent',
  },
  container: {
    padding: 16,
    backgroundColor: 'transparent',
  },
  addButton: {
    height: 32,
    backgroundColor: 'white',
    shadowColor: 'rgba(0, 0, 0, 0.10)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
    borderRadius: 14,
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  addIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#99A1AF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginLeft: -4,
  },
  plusText: {
    minWidth: 16,
    color: '#99A1AF',
    fontSize: 12,
    fontFamily: 'Arimo',
    fontWeight: '400',
    lineHeight: 12,
    textAlign: 'center',
    position: 'absolute',
  },
  addText: {
    color: '#99A1AF',
    fontSize: 14,
    fontFamily: 'Arimo',
    fontWeight: '400',
    lineHeight: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputWrapper: {
    flex: 1,
    height: 44,
    backgroundColor: 'white',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginRight: 8,
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#374151',
    marginLeft: 8,
  },
  filterButton: {
    width: 44,
    height: 44,
    backgroundColor: 'white',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
});