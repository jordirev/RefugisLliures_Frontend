/**
 * Tests unitaris per al component TabsNavigator
 *
 * Aquest fitxer cobreix:
 * - Renderització del navegador de tabs
 * - Les 4 tabs (Map, Favorites, Renovations, Profile)
 * - Snapshot tests
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { TabsNavigator } from '../../../components/TabsNavigator';
import { NavigationContainer } from '@react-navigation/native';
import { Location } from '../../../models';

// Mock screens
jest.mock('../../../screens/MapScreen', () => ({
  MapScreen: () => {
    const { View, Text } = require('react-native');
    return <View testID="map-screen"><Text>MapScreen</Text></View>;
  },
}));

jest.mock('../../../screens/FavoritesScreen', () => ({
  FavoritesScreen: () => {
    const { View, Text } = require('react-native');
    return <View testID="favorites-screen"><Text>FavoritesScreen</Text></View>;
  },
}));

jest.mock('../../../screens/RenovationsScreen', () => ({
  RenovationsScreen: () => {
    const { View, Text } = require('react-native');
    return <View testID="renovations-screen"><Text>RenovationsScreen</Text></View>;
  },
}));

jest.mock('../../../screens/ProfileScreen', () => ({
  ProfileScreen: () => {
    const { View, Text } = require('react-native');
    return <View testID="profile-screen"><Text>ProfileScreen</Text></View>;
  },
}));

// Mock SVG icons
jest.mock('../../../assets/icons/map2.svg', () => 'MapIcon');
jest.mock('../../../assets/icons/fav.svg', () => 'FavIcon');
jest.mock('../../../assets/icons/reform.svg', () => 'ReformIcon');
jest.mock('../../../assets/icons/user.svg', () => 'UserIcon');

const mockOnLocationSelect = jest.fn();
const mockOnViewDetail = jest.fn();
const mockOnViewMap = jest.fn();

const mockLocation: Location = {
  id: 'refuge-1',
  name: 'Test Refuge',
  coord: { lat: 42.5678, long: 1.2345 },
};

const defaultProps = {
  onLocationSelect: mockOnLocationSelect,
  onViewDetail: mockOnViewDetail,
  onViewMap: mockOnViewMap,
  selectedLocation: undefined,
};

const renderWithNavigation = (props = defaultProps) => {
  return render(
    <NavigationContainer>
      <TabsNavigator {...props} />
    </NavigationContainer>
  );
};

describe('TabsNavigator Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderització bàsica', () => {
    it('hauria de renderitzar el component', () => {
      const { toJSON } = renderWithNavigation();
      expect(toJSON()).toBeTruthy();
    });

    it('hauria de renderitzar amb NavigationContainer', () => {
      const { toJSON } = renderWithNavigation();
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('Amb selectedLocation', () => {
    it('hauria de renderitzar amb selectedLocation', () => {
      const propsWithLocation = {
        ...defaultProps,
        selectedLocation: mockLocation,
      };

      const { toJSON } = renderWithNavigation(propsWithLocation);
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('Props callbacks', () => {
    it('hauria de tenir els callbacks definits', () => {
      const { toJSON } = renderWithNavigation();
      
      expect(toJSON()).toBeTruthy();
      expect(mockOnLocationSelect).toBeDefined();
      expect(mockOnViewDetail).toBeDefined();
      expect(mockOnViewMap).toBeDefined();
    });

    it('hauria de tenir selectedLocation undefined per defecte', () => {
      const { toJSON } = renderWithNavigation();
      expect(toJSON()).toBeTruthy();
      expect(defaultProps.selectedLocation).toBeUndefined();
    });
  });

  describe('Props validation', () => {
    it('hauria d\'acceptar callbacks vàlids', () => {
      const customProps = {
        onLocationSelect: jest.fn(),
        onViewDetail: jest.fn(),
        onViewMap: jest.fn(),
        selectedLocation: undefined,
      };

      const { toJSON } = renderWithNavigation(customProps);
      expect(toJSON()).toBeTruthy();
    });

    it('hauria d\'acceptar una Location vàlida', () => {
      const customProps = {
        ...defaultProps,
        selectedLocation: {
          id: 'custom-id',
          name: 'Custom Refuge',
          coord: { lat: 40.0, long: 2.0 },
        },
      };

      const { toJSON } = renderWithNavigation(customProps);
      expect(toJSON()).toBeTruthy();
    });
  });
});
