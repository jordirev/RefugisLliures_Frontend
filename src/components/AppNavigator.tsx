import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Alert, BackHandler, Platform, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapScreen } from '../screens/MapScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { ReformsScreen } from '../screens/ReformsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RefugeBottomSheet } from './RefugeBottomSheet';
import { RefugeDetailScreen } from '../screens/RefugeDetailScreen';

import { RefugisService } from '../services/RefugisService';
import { Location } from '../types';
import { useTranslation } from '../utils/useTranslation';

import MapIcon from '../assets/icons/map2.svg';
import FavIcon from '../assets/icons/fav.svg';
import ReformIcon from '../assets/icons/reform.svg';
import UserIcon from '../assets/icons/user.svg';

const Tab = createBottomTabNavigator();

export function AppNavigator() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  
  // Només estats globals (compartits entre pantalles)
  const [selectedLocation, setSelectedLocation] = useState<Location | undefined>(undefined);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showDetailScreen, setShowDetailScreen] = useState(false);

  // Handlers globals per al BottomSheet
  const handleToggleFavorite = async (locationId: number | undefined) => {
    if (!locationId) return;
    
    try {
      // TODO: Implementar toggle favorits quan el backend estigui llest
      await RefugisService.addFavorite(locationId);
      Alert.alert('', t('alerts.favoriteUpdated'));
    } catch (error) {
      Alert.alert(t('common.error'), t('alerts.favoriteError'));
    }
  };

  const handleNavigate = (location: Location) => {
    Alert.alert(t('navigation.map'), t('alerts.navigation', { name: location.name }));
  };


  const handleShowRefugeBottomSheet = (location: Location) => {
    setSelectedLocation(location);
    setShowBottomSheet(true);
  };

  const handleViewDetail = (location: Location) => {
    setSelectedLocation(location);
    setShowBottomSheet(false);
    setShowDetailScreen(true);
  };

  const handleCloseBottomSheet = () => {
    setShowBottomSheet(false);
    setTimeout(() => setSelectedLocation(undefined), 300);
  };

  const handleCloseDetailScreen = () => {
    setShowDetailScreen(false);
    setTimeout(() => setSelectedLocation(undefined), 300);
  };

  // Handle Android hardware back button: if a bottom sheet or detail screen is open,
  // close it and consume the event. Otherwise let the default behaviour run.
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      if (showDetailScreen) {
        handleCloseDetailScreen();
        return true;
      }
      if (showBottomSheet) {
        handleCloseBottomSheet();
        return true;
      }
      return false; // allow default behavior
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [showBottomSheet, showDetailScreen]);

  return (
    <View style={styles.container}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom,
            backgroundColor: '#ffffff',
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
          },
        }}
      >
        <Tab.Screen 
          name={t('navigation.map')}
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={[styles.tabIconContainer, focused && styles.tabIconActive]}>
                <MapIcon width={20} height={20} color="#4A5565" />
                <Text style={styles.tabLabel}>
                  {t('navigation.map')}
                </Text>
              </View>
            ),
          }}
        >
          {() => (
            <MapScreen
              onLocationSelect={handleShowRefugeBottomSheet}
              selectedLocation={selectedLocation}
            />
          )}
        </Tab.Screen>

        <Tab.Screen 
          name={t('navigation.favorites')}
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={[styles.tabIconContainer, focused && styles.tabIconActive]}>
                <FavIcon width={20} height={20} color="#4A5565" />
                <Text style={styles.tabLabel}>
                  {t('navigation.favorites')}
                </Text>
              </View>
            ),
          }}
        >
          {() => (
            <FavoritesScreen
              onViewDetail={handleViewDetail}
              onViewMap={handleShowRefugeBottomSheet}
            />
          )}
        </Tab.Screen>

        <Tab.Screen 
          name={t('navigation.renovations')}
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={[styles.tabIconContainer, focused && styles.tabIconActive]}>
                <ReformIcon width={20} height={20} color="#4A5565" />
                <Text style={styles.tabLabel}>
                  {t('navigation.renovations')}
                </Text>
              </View>
            ),
          }}
          component={ReformsScreen}
        />

        <Tab.Screen 
          name={t('navigation.profile')}
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={[styles.tabIconContainer, focused && styles.tabIconActive]}>
                <UserIcon width={20} height={20} color="#4A5565" />
                <Text style={styles.tabLabel}>
                  {t('navigation.profile')}
                </Text>
              </View>
            ),
          }}
          component={ProfileScreen}
        />
      </Tab.Navigator>

      {/* Bottom Sheet del refugi */}
      {selectedLocation && (
        <RefugeBottomSheet
          refuge={selectedLocation}
          isVisible={showBottomSheet}
          onClose={handleCloseBottomSheet}
          onToggleFavorite={handleToggleFavorite}
          onNavigate={handleNavigate}
          onViewDetails={handleViewDetail}
        />
      )}

      {/* Pantalla de detall del refugi - Per sobre de tot */}
      {selectedLocation && showDetailScreen && (
        <View style={styles.detailScreenOverlay}>
          <RefugeDetailScreen
            refuge={selectedLocation}
            onBack={handleCloseDetailScreen}
            onToggleFavorite={handleToggleFavorite}
            onNavigate={handleNavigate}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabIconContainer: {
    backgroundColor: 'transparent',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconActive: {
    backgroundColor: '#f3f4f6',
  },
  tabLabel: {
    fontSize: 10,
    color: '#4A5565',
    marginTop: 4,
  },
  tabLabelActive: {
    color: '#9CA3AF',
  },
  detailScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    zIndex: 1000,
  },
});
