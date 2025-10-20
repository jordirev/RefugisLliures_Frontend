import React, { memo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

// Importar les icones SVG
import SearchIcon from '../assets/icons/search.svg';
import FilterIcon from '../assets/icons/filters.svg';
import PlusIcon from '../assets/icons/plus.svg';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenFilters: () => void;
  suggestions?: string[];
  onSuggestionSelect?: (name: string) => void;
}

// Memoritzem el component per evitar re-renders innecessaris
export const SearchBar = memo(function SearchBar({ searchQuery, onSearchChange, onOpenFilters, suggestions = [], onSuggestionSelect }: SearchBarProps) {
  return (
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
            placeholderTextColor="#6B7280"
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={onOpenFilters}
        >
          <FilterIcon width={18} height={18} color="#6B7280" />
        </TouchableOpacity>
      </View>
      {/* Llista de suggeriments d'autocomplete */}
      {suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {suggestions.slice(0, 6).map((name) => (
            <TouchableOpacity
              key={name}
              style={styles.suggestionItem}
              onPress={() => onSuggestionSelect && onSuggestionSelect(name)}
            >
              <Text style={styles.suggestionText}>{name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
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
  );
});

const styles = StyleSheet.create({
  container: {
    padding: 8,
    backgroundColor: 'transparent',
    marginTop: 16,
  },
  addButton: {
    height: 32,
    backgroundColor: 'white',
    shadowColor: 'rgba(0, 0, 0, 0.10)',
    shadowOffset: { width: 4, height: 4 },
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
    marginTop: -8,
    marginLeft: 10,
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
    borderRadius: 18,
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
    fontFamily: 'Arimo',
    color: '#616774ff',
    marginLeft: 8,
  },
  filterButton: {
    width: 44,
    height: 44,
    backgroundColor: 'white',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 5,
    shadowRadius: 4,
    elevation: 2,
  },
    suggestionsContainer: {
      backgroundColor: 'white',
      borderRadius: 12,
      marginTop: -8,
      marginBottom: 8,
      shadowColor: 'rgba(0,0,0,0.08)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 4,
      elevation: 2,
      paddingVertical: 4,
    },
    suggestionItem: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#F0F0F0',
    },
    suggestionText: {
      fontSize: 15,
      color: '#616774',
    },
});