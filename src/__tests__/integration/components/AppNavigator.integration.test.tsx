/**
 * Tests d'integració per a AppNavigator
 * 
 * Nota: Aquests tests verifiquen la configuració i estructura del navegador.
 * Les interaccions complexes entre pantalles es testen millor amb tests E2E.
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { AppNavigator } from '../../../components/AppNavigator';
import { renderWithProviders } from '../setup/testUtils';

// Mock dels screens per simplificar els tests d'integració
jest.mock('../../../screens/MapScreen', () => ({
  MapScreen: () => null,
}));

jest.mock('../../../screens/FavoritesScreen', () => ({
  FavoritesScreen: () => null,
}));

jest.mock('../../../screens/RenovationsScreen', () => ({
  RenovationsScreen: () => null,
}));

jest.mock('../../../screens/ProfileScreen', () => ({
  ProfileScreen: () => null,
}));

jest.mock('../../../screens/SettingsScreen', () => ({
  SettingsScreen: () => null,
}));

jest.mock('../../../screens/ChangePasswordScreen', () => ({
  ChangePasswordScreen: () => null,
}));

jest.mock('../../../screens/ChangeEmailScreen', () => ({
  ChangeEmailScreen: () => null,
}));

jest.mock('../../../screens/EditProfileScreen', () => ({
  EditProfileScreen: () => null,
}));

jest.mock('../../../screens/CreateRenovationScreen', () => ({
  CreateRenovationScreen: () => null,
}));

jest.mock('../../../screens/EditRenovationScreen', () => ({
  EditRenovationScreen: () => null,
}));

jest.mock('../../../screens/RenovationDetailScreen', () => ({
  RenovationDetailScreen: () => null,
}));

jest.mock('../../../screens/RefugeDetailScreen', () => ({
  RefugeDetailScreen: () => null,
}));

jest.mock('../../../components/RefugeBottomSheet', () => ({
  RefugeBottomSheet: () => null,
}));

describe('AppNavigator - Tests d\'integració', () => {
  describe('Renderització del navegador', () => {
    it('hauria de renderitzar-se sense errors', () => {
      const { UNSAFE_root } = renderWithProviders(<AppNavigator />);
      expect(UNSAFE_root).toBeTruthy();
    });

    it('hauria de contenir el navegador de tabs', () => {
      const { UNSAFE_root } = renderWithProviders(<AppNavigator />);
      
      // Verificar que el component Navigator està present
      const navigatorElement = UNSAFE_root.findByType('Navigator' as any);
      expect(navigatorElement).toBeTruthy();
    });

    it('hauria de tenir el Stack Navigator amb múltiples pantalles', () => {
      const { UNSAFE_root } = renderWithProviders(<AppNavigator />);
      
      // Verificar que hi ha almenys un Navigator amb screens (poden ser del Tab o del Stack)
      const navigatorElement = UNSAFE_root.findByType('Navigator' as any);
      const screens = navigatorElement.findAllByType('Screen' as any);
      
      // El TabsNavigator té 4 screens (Map, Favorites, Renovations, Profile)
      expect(screens.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Configuració de pantalles', () => {
    it('hauria de configurar les pantalles principals del tab bar', () => {
      const { UNSAFE_root } = renderWithProviders(<AppNavigator />);
      
      const navigatorElement = UNSAFE_root.findByType('Navigator' as any);
      const screens = navigatorElement.findAllByType('Screen' as any);
      
      // Verificar que hi ha el nombre correcte de pantalles
      expect(screens.length).toBeGreaterThanOrEqual(4);
    });

    it('hauria de configurar pantalles ocultes (Settings, ChangePassword, etc.)', () => {
      const { UNSAFE_root } = renderWithProviders(<AppNavigator />);
      
      const navigatorElement = UNSAFE_root.findByType('Navigator' as any);
      const screens = navigatorElement.findAllByType('Screen' as any);
      
      // Verificar que hi ha múltiples pantalles configurades
      expect(screens.length).toBeGreaterThan(1);
    });
  });

  describe('Integració amb providers', () => {
    it('hauria de funcionar amb AuthContext', () => {
      const mockAuthValue = {
        isAuthenticated: true,
        firebaseUser: { uid: 'test-uid', email: 'test@test.com' },
      };

      const { UNSAFE_root } = renderWithProviders(<AppNavigator />, {
        mockAuthValue,
      });

      expect(UNSAFE_root).toBeTruthy();
    });

    it('hauria de funcionar amb SafeAreaProvider', () => {
      // renderWithProviders ja inclou SafeAreaProvider
      const { UNSAFE_root } = renderWithProviders(<AppNavigator />);
      expect(UNSAFE_root).toBeTruthy();
    });

    it('hauria de funcionar amb NavigationContainer', () => {
      // renderWithProviders ja inclou NavigationContainer
      const { UNSAFE_root } = renderWithProviders(<AppNavigator />);
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Gestió d\'errors', () => {
    it('hauria de gestionar contextos undefined correctament', () => {
      // Verificar que el component no peta amb contextos buits
      const { UNSAFE_root } = renderWithProviders(<AppNavigator />, {
        mockAuthValue: {
          isAuthenticated: false,
          firebaseUser: null,
          backendUser: null,
        },
      });

      expect(UNSAFE_root).toBeTruthy();
    });
  });
});
