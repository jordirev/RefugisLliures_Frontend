import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { createBottomTabNavigator, BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

import { MapScreen } from '../screens/MapScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { RenovationsScreen } from '../screens/RenovationsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

import { Location } from '../models';
import { useTranslation } from '../hooks/useTranslation';

import MapIcon from '../assets/icons/map2.svg';
import FavIcon from '../assets/icons/fav.svg';
import ReformIcon from '../assets/icons/reform.svg';
import UserIcon from '../assets/icons/user.svg';

type TabParamList = {
  Map: any;
  Favorites: undefined;
  Renovations: undefined;
  Profile: undefined;
};

/** Alçada de la barra (sense l'àrea segura inferior) */
const TAB_BAR_HEIGHT = 58;

/**
 * Botó de la tab bar sense el padding intern per defecte de React Navigation:
 * així el fons (sombrejat) del botó seleccionat omple tot l'ítem, sense vores blanques.
 */
function TabButton({ children, style, onPress, onLongPress, testID, ...rest }: BottomTabBarButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      testID={testID}
      role={rest.role}
      aria-label={rest['aria-label']}
      aria-selected={rest['aria-selected']}
      style={[style, styles.tabButton]}
    >
      {children}
    </Pressable>
  );
}

const Tab = createBottomTabNavigator<TabParamList, undefined>();

interface TabsNavigatorProps {
  onLocationSelect: (location: Location) => void;
  onViewDetail: (location: Location) => void;
  onViewMap: (location: Location) => void;
  selectedLocation: Location | undefined;
}

export function TabsNavigator({ 
  onLocationSelect, 
  onViewDetail, 
  onViewMap,
  selectedLocation 
}: TabsNavigatorProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      id={undefined}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarLabelPosition: 'below-icon',
        tabBarVariant: 'uikit',
        tabBarButton: (props) => <TabButton {...props} />,
        tabBarActiveBackgroundColor: '#f3f4f6',
        // Botons amb la mateixa alçada que la barra: el sombrejat l'omple sencera
        tabBarItemStyle: {
          height: '100%',
          paddingVertical: 0,
          paddingHorizontal: 0,
        },
        tabBarIconStyle: {
          width: '100%',
          height: '100%',
          marginTop: 0,
        },
        tabBarStyle: {
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingTop: 0,
          paddingBottom: 0,
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
            <View style={[styles.tabIconContainer, { paddingBottom: insets.bottom }]}>
              <MapIcon width={20} height={20} color="#4A5565" />
              <Text
                style={styles.tabLabel}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                allowFontScaling={false}
              >
                {t('navigation.map')}
              </Text>
            </View>
          ),
        }}
      >
        {({ route, navigation: mapNavigation }: any) => {
          const { selectedRefuge } = route.params || {};
          
          // Hook per netejar selectedRefuge quan selectedLocation passa a undefined
          useEffect(() => {
            if (selectedLocation === undefined && selectedRefuge !== undefined) {
              // selectedLocation ha passat a undefined però selectedRefuge encara existeix
              // Netejar els paràmetres
              mapNavigation.setParams({ selectedRefuge: undefined });
            }
          }, [selectedLocation, selectedRefuge, mapNavigation]);
          
          // Netejar selectedLocation quan sortim de la tab Map
          useEffect(() => {
            return mapNavigation.addListener('blur', () => {
              // Quan deixem la tab Map, resetar selectedLocation
              onLocationSelect(null as any);
            });
          }, [mapNavigation]);
          
          // Si selectedLocation no és undefined, utilitzar-lo; sinó utilitzar selectedRefuge
          const effectiveLocation = selectedLocation !== undefined ? selectedLocation : selectedRefuge;
          
          return (
            <MapScreen
              onLocationSelect={onLocationSelect}
              selectedLocation={effectiveLocation}
            />
          );
        }}
      </Tab.Screen>

      <Tab.Screen 
        name="Favorites"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconContainer, { paddingBottom: insets.bottom }]}>
              <FavIcon width={20} height={20} />
              <Text
                style={styles.tabLabel}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                allowFontScaling={false}
              >
                {t('navigation.favorites')}
              </Text>
            </View>
          ),
        }}
      >
        {() => (
          <FavoritesScreen
            onViewDetail={onViewDetail}
            onViewMap={onViewMap}
          />
        )}
      </Tab.Screen>

      <Tab.Screen 
        name="Renovations"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconContainer, { paddingBottom: insets.bottom }]}>
              <ReformIcon width={20} height={20} color="#4A5565" />
              <Text
                style={styles.tabLabel}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                allowFontScaling={false}
              >
                {t('navigation.renovations')}
              </Text>
            </View>
          ),
        }}
      >
        {() => (
          <RenovationsScreen onViewMap={onViewMap} />
        )}
      </Tab.Screen>

      <Tab.Screen 
        name="Profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconContainer, { paddingBottom: insets.bottom }]}>
              <UserIcon width={20} height={20} color="#4A5565" />
              <Text
                style={styles.tabLabel}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                allowFontScaling={false}
              >
                {t('navigation.profile')}
              </Text>
            </View>
          ),
        }}
      >
        {() => (
          <ProfileScreen onViewDetail={onViewDetail} onViewMap={onViewMap} />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    padding: 0,
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconContainer: {
    backgroundColor: 'transparent',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 10,
    color: '#4A5565',
    marginTop: 4,
    width: '100%',
    paddingHorizontal: 2,
    textAlign: 'center',
  },
});
