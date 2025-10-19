import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { RefugeCard } from '../components/RefugeCard';
import { Location } from '../types';

interface FavoritesScreenProps {
  favorites: Location[];
  onViewDetail: (refuge: Location) => void;
  onViewMap: (refuge: Location) => void;
}

export function FavoritesScreen({ favorites, onViewDetail, onViewMap }: FavoritesScreenProps) {
  if (favorites.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>❤️</Text>
        <Text style={styles.emptyTitle}>Encara no tens favorits</Text>
        <Text style={styles.emptyText}>
          Afegeix refugis als teus favorits per veure'ls aquí
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Els meus favorits</Text>
        <Text style={styles.count}>{favorites.length} refugi{favorites.length !== 1 ? 's' : ''}</Text>
      </View>
      
      <FlatList
        data={favorites}
        renderItem={({ item }: { item: Location }) => (
          <RefugeCard
            refuge={item}
            onPress={() => onViewDetail(item)}
            onViewMap={() => onViewMap(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  count: {
    fontSize: 14,
    color: '#6b7280',
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f9fafb',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});
