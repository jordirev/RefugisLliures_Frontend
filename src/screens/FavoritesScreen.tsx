import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, Alert } from 'react-native';
import { RefugeCard } from '../components/RefugeCard';
import { Location } from '../types';
import { RefugisService } from '../services/RefugisService';
import { useTranslation } from '../utils/useTranslation';

interface FavoritesScreenProps {
  onViewDetail: (refuge: Location) => void;
  onViewMap: (refuge: Location) => void;
}

export function FavoritesScreen({ onViewDetail, onViewMap }: FavoritesScreenProps) {
  const { t } = useTranslation();
  
  // Estats locals de FavoritesScreen
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar favorits al muntar el component
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      // TODO: Quan el backend tingui l'endpoint de favorits, usar-lo
      const favorites = await RefugisService.getFavorites();
      
      // Mentre tant, podem carregar tots els refugis i filtrar els favorits localment
      const allLocations = await RefugisService.getRefugis();
      setLocations(allLocations);
      
      // Extreure IDs de favorits (això vindria del backend)
      const ids = new Set(favorites.map(f => f.id).filter((id): id is number => id !== undefined));
      setFavoriteIds(ids);
    } catch (error) {
      Alert.alert(t('common.error'), t('favorites.error'));
    } finally {
      setLoading(false);
    }
  };

  // Obtenir favorits amb la propietat isFavorite
  const favoriteLocations = useMemo(() => {
    return locations
      .filter(location => location.id && favoriteIds.has(location.id))
      .map(location => ({ ...location, isFavorite: true }));
  }, [locations, favoriteIds]);

  if (favoriteLocations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>❤️</Text>
        <Text style={styles.emptyTitle}>{t('favorites.empty.title')}</Text>
        <Text style={styles.emptyText}>
          {t('favorites.empty.message')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('favorites.title')}</Text>
        <Text style={styles.count}>
          {favoriteLocations.length} {t('favorites.count', { count: favoriteLocations.length })}
        </Text>
      </View>
      
      <FlatList
        data={favoriteLocations}
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
