import React, { useState, useEffect } from 'react';
import { StyleSheet, View, BackHandler, Platform, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapScreen } from '../screens/MapScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { RenovationsScreen } from '../screens/RenovationsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ChangePasswordScreen } from '../screens/ChangePasswordScreen';
import { ChangeEmailScreen } from '../screens/ChangeEmailScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { CreateRenovationScreen } from '../screens/CreateRenovationScreen';
import { RefugeBottomSheet } from './RefugeBottomSheet';
import { RefugeDetailScreen } from '../screens/RefugeDetailScreen';
import { RenovationDetailScreen } from '../screens/RenovationDetailScreen';

import { RefugisService } from '../services/RefugisService';
import { Location } from '../models';
import { useTranslation } from '../hooks/useTranslation';
import { CustomAlert } from './CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';

import MapIcon from '../assets/icons/map2.svg';
import FavIcon from '../assets/icons/fav.svg';
import ReformIcon from '../assets/icons/reform.svg';
import UserIcon from '../assets/icons/user.svg';

const Tab = createBottomTabNavigator();

export function AppNavigator() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { alertVisible, alertConfig, showAlert, hideAlert } = useCustomAlert();
  
  // Només estats globals (compartits entre pantalles)
  const [selectedLocation, setSelectedLocation] = useState<Location | undefined>(undefined);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showDetailScreen, setShowDetailScreen] = useState(false);

  // Handlers globals per al BottomSheet
  const handleToggleFavorite = async (locationId: string | undefined) => {
    if (!locationId) return;
    
    try {
      // El hook useFavourite ja gestiona l'afegir/eliminar favorits
      // Aquest handler només es crida com a callback després de la UI actualització
      // No cal fer res aquí, ja que el hook useFavourite ho gestiona
    } catch (error) {
      showAlert(t('common.error'), t('alerts.favoriteError'));
    }
  };

  const handleNavigate = (location: Location) => {
    showAlert(t('navigation.map'), t('alerts.navigation', { name: location.name }));
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
      return false; // allow default behavior (including navigation back from Settings)
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
          name="Map"
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
          {({ route }: any) => {
            const { selectedRefuge } = route.params || {};
            return (
              <MapScreen
                onLocationSelect={handleShowRefugeBottomSheet}
                selectedLocation={selectedRefuge || selectedLocation}
              />
            );
          }}
        </Tab.Screen>

        <Tab.Screen 
          name="Favorites"
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={[styles.tabIconContainer, focused && styles.tabIconActive]}>
                <FavIcon width={20} height={20} />
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
          name="Renovations"
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
        >
          {() => (
            <RenovationsScreen onViewMap={handleShowRefugeBottomSheet} />
          )}
        </Tab.Screen>

        <Tab.Screen 
          name="Profile"
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
      
        {/* Hidden Settings screen: accessible by navigation.navigate('Settings') but not shown in the tab bar */}
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ 
            tabBarButton: () => null,
            tabBarStyle: { display: 'none' }
          }}
        />
        
        {/* Hidden ChangePassword screen: accessible by navigation.navigate('ChangePassword') but not shown in the tab bar */}
        <Tab.Screen
          name="ChangePassword"
          component={ChangePasswordScreen}
          options={{ 
            tabBarButton: () => null,
            tabBarStyle: { display: 'none' }
          }}
        />
        
        {/* Hidden ChangeEmail screen: accessible by navigation.navigate('ChangeEmail') but not shown in the tab bar */}
        <Tab.Screen
          name="ChangeEmail"
          component={ChangeEmailScreen}
          options={{ 
            tabBarButton: () => null,
            tabBarStyle: { display: 'none' }
          }}
        />
  
      {/* Hidden EditProfile screen: accessible by navigation.navigate('EditProfile') but not shown in the tab bar */}
        <Tab.Screen
          name="EditProfile"
          component={EditProfileScreen}
          options={{ 
            tabBarButton: () => null,
            tabBarStyle: { display: 'none' }
          }}
        />
        
        {/* Hidden CreateRenovation screen: accessible by navigation.navigate('CreateRenovation') but not shown in the tab bar */}
        <Tab.Screen
          name="CreateRenovation"
          component={CreateRenovationScreen}
          options={{ 
            tabBarButton: () => null,
            tabBarStyle: { display: 'none' }
          }}
        />
        
        {/* Hidden RefromDetail screen: accessible by navigation.navigate('RefromDetail') but not shown in the tab bar */}
        <Tab.Screen
          name="RefromDetail"
          component={RenovationDetailScreen}
          options={{ 
            tabBarButton: () => null,
            tabBarStyle: { display: 'none' }
          }}
        />
        
        {/* Hidden RefugeDetail screen: accessible by navigation.navigate('RefugeDetail') but not shown in the tab bar */}
        <Tab.Screen
          name="RefugeDetail"
          options={{ 
            tabBarButton: () => null,
            tabBarStyle: { display: 'none' }
          }}
        >
          {({ route, navigation: nav }: any) => {
            const { refuge } = route.params || {};
            return (
              <RefugeDetailScreen
                refuge={refuge}
                onBack={() => nav.goBack()}
                onToggleFavorite={handleToggleFavorite}
                onNavigate={handleNavigate}
              />
            );
          }}
        </Tab.Screen>
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
