import React, { useState } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapScreen } from '../screens/MapScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { ReformsScreen } from '../screens/ReformsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RefugeBottomSheet } from './RefugeBottomSheet';

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
    Alert.alert(location.name, location.description || 'Sense descripció');
  };

  const handleCloseBottomSheet = () => {
    setShowBottomSheet(false);
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
});
