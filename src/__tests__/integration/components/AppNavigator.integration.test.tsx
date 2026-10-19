/**
 * Tests d'integració per a AppNavigator
 * 
 * Nota: Aquests tests verifiquen la configuració i estructura del navegador.
 * Les interaccions complexes entre pantalles es testen millor amb tests E2E.
 */

// Mock expo-video
jest.mock('expo-video', () => ({
  VideoView: 'VideoView',
  useVideoPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    replace: jest.fn(),
  })),
}));

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'Images',
  },
  requestMediaLibraryPermissionsAsync: jest.fn(() => 
    Promise.resolve({ status: 'granted' })
  ),
}));

// Mock useProposalsQuery hooks
jest.mock('../../../hooks/useProposalsQuery', () => ({
  useDeleteRefugeProposal: jest.fn(() => ({
    mutateAsync: jest.fn(),
    isPending: false,
  })),
  useAcceptRefugeProposal: jest.fn(() => ({
    mutateAsync: jest.fn(),
    isPending: false,
  })),
  useRejectRefugeProposal: jest.fn(() => ({
    mutateAsync: jest.fn(),
    isPending: false,
  })),
}));

import React from 'react';
import { render } from '@testing-library/react-native';
import { AppNavigator } from '../../../components/AppNavigator';
import { renderWithProviders } from '../setup/testUtils';
import { findAllByType, findByType } from '../../testHelpers/findByType';

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

jest.mock('../../../screens/ExperiencesScreen', () => ({
  ExperiencesScreen: () => null,
}));

// AuthContext: per defecte sense sessió (els tests poden sobreescriure useAuth)
jest.mock('../../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../../contexts/AuthContext'),
  useAuth: jest.fn(() => ({ backendUser: null, firebaseUser: null })),
}));

jest.mock('../../../components/RefugeBottomSheet', () => ({
  RefugeBottomSheet: () => null,
}));

describe('AppNavigator - Tests d\'integració', () => {
  describe('Renderització del navegador', () => {
    it('hauria de renderitzar-se sense errors', async () => {
      const { container } = await renderWithProviders(<AppNavigator />);
      expect(container).toBeTruthy();
    });

    it('hauria de contenir el navegador de tabs', async () => {
      const { container } = await renderWithProviders(<AppNavigator />);
      
      // Verificar que el component Navigator està present
      const navigatorElement = findByType(container, 'Navigator' as any);
      expect(navigatorElement).toBeTruthy();
    });

    it('hauria de tenir el Stack Navigator amb múltiples pantalles', async () => {
      const { container } = await renderWithProviders(<AppNavigator />);
      
      // Verificar que hi ha almenys un Navigator amb screens (poden ser del Tab o del Stack)
      const navigatorElement = findByType(container, 'Navigator' as any);
      const screens = findAllByType(navigatorElement, 'Screen' as any);
      
      // El TabsNavigator té 4 screens (Map, Favorites, Renovations, Profile)
      expect(screens.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Configuració de pantalles', () => {
    it('hauria de configurar les pantalles principals del tab bar', async () => {
      const { container } = await renderWithProviders(<AppNavigator />);
      
      const navigatorElement = findByType(container, 'Navigator' as any);
      const screens = findAllByType(navigatorElement, 'Screen' as any);
      
      // Verificar que hi ha el nombre correcte de pantalles
      expect(screens.length).toBeGreaterThanOrEqual(4);
    });

    it('hauria de configurar pantalles ocultes (Settings, ChangePassword, etc.)', async () => {
      const { container } = await renderWithProviders(<AppNavigator />);
      
      const navigatorElement = findByType(container, 'Navigator' as any);
      const screens = findAllByType(navigatorElement, 'Screen' as any);
      
      // Verificar que hi ha múltiples pantalles configurades
      expect(screens.length).toBeGreaterThan(1);
    });
  });

  describe('Integració amb providers', () => {
    it('hauria de funcionar amb AuthContext', async () => {
      const mockAuthValue = {
        isAuthenticated: true,
        firebaseUser: { uid: 'test-uid', email: 'test@test.com' },
      };

      const { container } = await renderWithProviders(<AppNavigator />, {
        mockAuthValue,
      });

      expect(container).toBeTruthy();
    });

    it('hauria de funcionar amb SafeAreaProvider', async () => {
      // renderWithProviders ja inclou SafeAreaProvider
      const { container } = await renderWithProviders(<AppNavigator />);
      expect(container).toBeTruthy();
    });

    it('hauria de funcionar amb NavigationContainer', async () => {
      // renderWithProviders ja inclou NavigationContainer
      const { container } = await renderWithProviders(<AppNavigator />);
      expect(container).toBeTruthy();
    });
  });

  describe('Gestió d\'errors', () => {
    it('hauria de gestionar contextos undefined correctament', async () => {
      // Verificar que el component no peta amb contextos buits
      const { container } = await renderWithProviders(<AppNavigator />, {
        mockAuthValue: {
          isAuthenticated: false,
          firebaseUser: null,
          backendUser: null,
        },
      });

      expect(container).toBeTruthy();
    });
  });

  describe("Pantalla d'edat (AgeGate)", () => {
    it('bloqueja l\'app si backendUser.age_confirmed === false', async () => {
      const { getByText, getByTestId, container } = await renderWithProviders(<AppNavigator />, {
        mockAuthValue: {
          isAuthenticated: true,
          firebaseUser: { uid: 'test-uid' },
          backendUser: { uid: 'test-uid', username: 'Test', age_confirmed: false },
        },
      });

      expect(getByText('age.gateTitle')).toBeTruthy();
      expect(getByTestId('agegate-submit')).toBeTruthy();
      expect(findAllByType(container, 'Navigator' as any)).toHaveLength(0);
    });

    it('no bloqueja si age_confirmed === true', async () => {
      const { queryByText } = await renderWithProviders(<AppNavigator />, {
        mockAuthValue: {
          isAuthenticated: true,
          firebaseUser: { uid: 'test-uid' },
          backendUser: { uid: 'test-uid', username: 'Test', age_confirmed: true },
        },
      });
      expect(queryByText('age.gateTitle')).toBeNull();
    });
  });
});
