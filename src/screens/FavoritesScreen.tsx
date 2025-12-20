import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Dimensions } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RefugeCard } from '../components/RefugeCard';
import { Location } from '../models';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import { CustomAlert } from '../components/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { RefugisService } from '../services/RefugisService';

import FavouriteIcon from '../assets/icons/favRed.svg';
import FavouriteFilledIcon from '../assets/icons/favourite2.svg';


interface FavoritesScreenProps {
  onViewDetail: (refuge: Location) => void;
  onViewMap: (refuge: Location) => void;
}

export function FavoritesScreen({ onViewDetail, onViewMap }: FavoritesScreenProps) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { alertVisible, alertConfig, showAlert, hideAlert } = useCustomAlert();
  const flatListRef = useRef<FlatList>(null);
  
  // Get favourite refuges from AuthContext (contains full Location[])
  const { favouriteRefuges } = useAuth();
  const [validFavourites, setValidFavourites] = useState<Location[]>(favouriteRefuges);
  
  // Scroll to top when screen gains focus
  useFocusEffect(
    useCallback(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    }, [])
  );

  const HEADER_HEIGHT = 96;
  // Insets for adaptive safe area padding (bottom on devices with home indicator)
  const insets = useSafeAreaInsets();
  const windowHeight = Dimensions.get('window').height;

  // Els refugis favorits ja vénen validats del context AuthContext
  // No cal fer crides addicionals a l'API per validar-los
  const favoriteLocations = useMemo(() => {
    return favouriteRefuges.map(location => ({ ...location, isFavorite: true }));
  }, [favouriteRefuges]);

  const handleViewMap = (refuge: Location) => {
    // Les dades completes ja estan disponibles des de AuthContext
    onViewMap(refuge);
    (navigation as any).navigate('Map', { selectedRefuge: refuge });
  };

  const handleViewDetail = (refuge: Location) => {
    // Les dades completes ja estan disponibles des de AuthContext
    onViewDetail(refuge);
  };


  return (
    <View style={styles.root}>
      {/* Fixed header */}
      <View style={styles.headerFixed}>
        <SafeAreaView edges={["top"]} style={styles.safeArea}>
          <View style={styles.header}>
            <FavouriteIcon width={20} height={20} />
            <Text style={styles.title}>
              {t('favorites.title')}
              <Text style={styles.count}> {`(${validFavourites.length})`}</Text>
            </Text>
          </View>
        </SafeAreaView>
      </View>

      <FlatList
        ref={flatListRef}
        data={favoriteLocations}
        style={styles.container}
        renderItem={({ item }: { item: Location }) => (
          <RefugeCard
            refuge={item}
            onPress={() => handleViewDetail(item)}
            onViewMap={() => handleViewMap(item)}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: HEADER_HEIGHT, paddingBottom: Math.max(insets.bottom, 16) },
        ]}
        ListEmptyComponent={() => {
          const availableHeight = windowHeight - HEADER_HEIGHT - Math.max(insets.bottom, 16) - 2*insets.top;
            const minHeight = Math.max(availableHeight, 240);
          return (
            <View style={[styles.emptyContainer, { minHeight }]}> 
              <FavouriteFilledIcon width={64} height={64} style={styles.emptyIcon} />
              <Text style={styles.emptyTitle}>{t('favorites.empty.title')}</Text>
              <Text style={styles.emptyText}>{t('favorites.empty.message')}</Text>
            </View>
          );
        }}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item, index) => (item.id ? String(item.id) : String(index))}
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
    backgroundColor: '#F9FAFB',
  },
  root: {
    flex: 1,
  },
  headerFixed: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 6,
    //shadowColor: '#2b2b2bff',
    //shadowOffset: { width: 0, height: 2 },
    //shadowOpacity: 0,
    //shadowRadius: 8,
    //elevation: 2,
  },
  safeArea: {
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,

  },
  title: {
    color: '#101828', 
    fontSize: 16, 
    fontFamily: 'Arimo', 
    fontWeight: '400', 
    lineHeight: 24, 
    flexWrap: 'wrap',
    textAlign: 'center',
    alignItems: 'center',
  },
  count: {
    fontSize: 13,
    fontFamily: 'Arimo',
    color: '#6b7280',
  },
  listContent: {
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: 'transparent',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '400',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});