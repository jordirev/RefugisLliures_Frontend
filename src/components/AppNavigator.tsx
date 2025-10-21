import React, { useState } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
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

import MapIcon from '../assets/icons/map2.svg';
import FavIcon from '../assets/icons/fav.svg';
import ReformIcon from '../assets/icons/reform.svg';
import UserIcon from '../assets/icons/user.svg';

const Tab = createBottomTabNavigator();

export function AppNavigator() {
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
      Alert.alert('', 'Favorit actualitzat');
    } catch (error) {
      Alert.alert('Error', 'No s\'ha pogut actualitzar els favorits');
    }
  };

  const handleNavigate = (location: Location) => {
    Alert.alert('Navegació', `Navegant a ${location.name}`);
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

  return (
    <View style={[styles.container, {
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
    }]}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: '#4A5565',
          tabBarInactiveTintColor: '#4A5565',
          tabBarStyle: {
            height: 60,
            paddingBottom: 0,
          },
        }}
      >
        <Tab.Screen 
          name="Mapa" 
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={[styles.tabIconContainer, focused && styles.tabIconActive]}>
                <MapIcon width={20} height={20} color="#4A5565" />
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
          name="Favorits"
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={[styles.tabIconContainer, focused && styles.tabIconActive]}>
                <FavIcon width={20} height={20} color="#4A5565" />
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
          name="Reformes"
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={[styles.tabIconContainer, focused && styles.tabIconActive]}>
                <ReformIcon width={20} height={20} color="#4A5565" />
              </View>
            ),
          }}
          component={ReformsScreen}
        />

        <Tab.Screen 
          name="Perfil"
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={[styles.tabIconContainer, focused && styles.tabIconActive]}>
                <UserIcon width={20} height={20} color="#4A5565" />
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
