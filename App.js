import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapScreen } from './src/screens/MapScreen';
import { FavoritesScreen } from './src/screens/FavoritesScreen';
import { ReformsScreen } from './src/screens/ReformsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { RefugeBottomSheet } from './src/components/RefugeBottomSheet';

import { mockLocations } from './src/utils/mockData';
import { Location, Filters } from './src/types';

import MapIcon from './src/assets/icons/map2.svg';
import FavIcon from './src/assets/icons/fav.svg';
import ReformIcon from './src/assets/icons/reform.svg';
import UserIcon from './src/assets/icons/user.svg';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <AppContent />
      </View>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(undefined);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  
  const [filters, setFilters] = useState({
    types: [],
    elevation: [0, 5000],
    difficulty: []
  });

  // Filtrar ubicacions basant-se en cerca i filtres
  const filteredLocations = useMemo(() => {
    return mockLocations.filter(location => {
      const matchesSearch = location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           location.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = filters.types.length === 0 || filters.types.includes(location.type);
      const matchesElevation = location.elevation >= filters.elevation[0] && 
                              location.elevation <= filters.elevation[1];
      const matchesDifficulty = filters.difficulty.length === 0 || 
                               (location.difficulty && filters.difficulty.includes(location.difficulty));
      
      return matchesSearch && matchesType && matchesElevation && matchesDifficulty;
    });
  }, [searchQuery, filters]);

  // Afegir isFavorite a les ubicacions
  const locationsWithFavorites = useMemo(() => {
    return filteredLocations.map(location => ({
      ...location,
      isFavorite: favoriteIds.has(location.id)
    }));
  }, [filteredLocations, favoriteIds]);

  // Obtenir favorits
  const favoriteLocations = useMemo(() => {
    return mockLocations.filter(location => favoriteIds.has(location.id))
                       .map(location => ({ ...location, isFavorite: true }));
  }, [favoriteIds]);

  const handleToggleFavorite = (locationId) => {
    const newFavorites = new Set(favoriteIds);
    if (newFavorites.has(locationId)) {
      newFavorites.delete(locationId);
      Alert.alert('', 'Eliminat dels favorits');
    } else {
      newFavorites.add(locationId);
      Alert.alert('', 'Afegit als favorits');
    }
    setFavoriteIds(newFavorites);
  };

  const handleNavigate = (location) => {
    Alert.alert('Navegació', `Navegant a ${location.name}`);
  };

  const handleShowRefugeBottomSheet = (location) => {
    setSelectedLocation(location);
    setShowBottomSheet(true);
  };

  const handleViewDetail = (location) => {
    setSelectedLocation(location);
    setShowBottomSheet(false);
    Alert.alert(location.name, location.description || 'Sense descripció');
  };

  const handleCloseBottomSheet = () => {
    setShowBottomSheet(false);
    setTimeout(() => setSelectedLocation(undefined), 300);
  };

  return (
    <NavigationContainer>
      <View style={[styles.appContent, {
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
                  <View style={{
                    backgroundColor: focused ? '#f3f4f6' : 'transparent',
                    width: '100%',
                    height: '100%',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <MapIcon 
                      width={20} 
                      height={20} 
                      color="#4A5565" 
                    />
                  </View>
                ),
              }}
            >
              {() => (
                <MapScreen
                  locations={mockLocations}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onOpenFilters={() => Alert.alert('Filtres', 'Funcionalitat de filtres en desenvolupament')}
                  onLocationSelect={handleShowRefugeBottomSheet}
                  selectedLocation={selectedLocation}
                />
              )}
            </Tab.Screen>

            <Tab.Screen 
              name="Favorits"
              options={{
                tabBarIcon: ({ focused }) => (
                  <View style={{
                    backgroundColor: focused ? '#f3f4f6' : 'transparent',
                    width: '100%',
                    height: '100%',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <FavIcon 
                      width={20} 
                      height={20} 
                      color="#4A5565" 
                    />
                  </View>
                ),
              }}
            >
              {() => (
                <FavoritesScreen
                  favorites={favoriteLocations}
                  onViewDetail={handleViewDetail}
                  onViewMap={handleShowRefugeBottomSheet}
                />
              )}
            </Tab.Screen>

            <Tab.Screen 
              name="Reformes"
              options={{
                tabBarIcon: ({ focused }) => (
                  <View style={{
                    backgroundColor: focused ? '#f3f4f6' : 'transparent',
                    width: '100%',
                    height: '100%',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <ReformIcon 
                      width={20} 
                      height={20} 
                      color="#4A5565" 
                    />
                  </View>
                ),
              }}
              component={ReformsScreen}
            />

            <Tab.Screen 
              name="Perfil"
              options={{
                tabBarIcon: ({ focused }) => (
                  <View style={{
                    backgroundColor: focused ? '#f3f4f6' : 'transparent',
                    width: '100%',
                    height: '100%',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <UserIcon 
                      width={20}  
                      height={20} 
                      color="#4A5565" 
                    />
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

          <StatusBar style="auto" />
        </View>
      </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  appContent: {
    flex: 1,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
