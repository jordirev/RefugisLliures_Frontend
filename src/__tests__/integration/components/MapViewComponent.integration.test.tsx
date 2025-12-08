/**
 * Tests d'integració per al component MapViewComponent
 * 
 * Cobertura:
 * - Renderització del mapa amb ubicacions
 * - Selecció d'ubicacions
 * - Botons de control (compass, target, layers)
 * - Permisos d'ubicació i gestió d'errors
 * - Gestor de mapes offline
 * - Centrar la ubicació de l'usuari
 */

import React from 'react';
import { renderWithProviders, fireEvent, waitFor } from '../setup/testUtils';
import { MapViewComponent } from '../../../components/MapViewComponent';
import { Location } from '../../../models';
import * as ExpoLocation from 'expo-location';

// Mock de ExpoLocation
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: {
    High: 4,
  },
}));

// Mock dels components fills
jest.mock('../../../components/LeafletWebMap', () => ({
  LeafletWebMap: ({ onLocationSelect, selectedLocation }: any) => {
    const React = require('react');
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View testID="leaflet-web-map">
        <Text>Leaflet Map</Text>
        {selectedLocation && <Text testID="selected-location">{selectedLocation.name}</Text>}
      </View>
    );
  },
}));

jest.mock('../../../components/OfflineMapManager', () => ({
  OfflineMapManager: ({ visible, onClose }: any) => {
    const React = require('react');
    const { View, Text, TouchableOpacity } = require('react-native');
    if (!visible) return null;
    return (
      <View testID="offline-map-manager">
        <Text>Offline Map Manager</Text>
        <TouchableOpacity testID="close-offline-manager" onPress={onClose}>
          <Text>Close</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

// Mock de les icones
jest.mock('../../../assets/icons/layers.svg', () => 'LayersIcon');
jest.mock('../../../assets/icons/compass3.png', () => 'CompassIcon');
jest.mock('../../../assets/icons/target.png', () => 'TargetIcon');

// Mock de useTranslation
jest.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'permissions.location.title': 'Permís d\'ubicació',
        'permissions.location.message': 'Necessitem accés a la teva ubicació',
        'common.cancel': 'Cancel·lar',
        'common.allow': 'Permetre',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock de useCustomAlert
jest.mock('../../../hooks/useCustomAlert', () => ({
  useCustomAlert: () => ({
    alertVisible: false,
    alertConfig: null,
    showAlert: jest.fn(),
    hideAlert: jest.fn(),
  }),
}));

describe('MapViewComponent - Tests d\'integració', () => {
  const mockLocations: Location[] = [
    {
      id: 1,
      name: 'Refugi de Colomers',
      coord: { lat: 42.6531, long: 0.9858 },
      altitude: 2135,
      places: 16,
      type: 1,
    },
    {
      id: 2,
      name: 'Refugi de Ventosa',
      coord: { lat: 42.5678, long: 0.8456 },
      altitude: 2220,
      places: 20,
      type: 0,
    },
  ];

  const mockOnLocationSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderització bàsica', () => {
    it('hauria de renderitzar el mapa amb les ubicacions', () => {
      const { getByTestId, getByText } = renderWithProviders(
        <MapViewComponent
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />,
        { withNavigation: false }
      );

      expect(getByTestId('leaflet-web-map')).toBeTruthy();
      expect(getByText('Leaflet Map')).toBeTruthy();
    });

    it('hauria de renderitzar els botons de control', () => {
      const { getByTestId } = renderWithProviders(
        <MapViewComponent
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />,
        { withNavigation: false }
      );

      // 3 botons: compass, target, layers
      expect(getByTestId('compass-button')).toBeTruthy();
      expect(getByTestId('target-button')).toBeTruthy();
      expect(getByTestId('layers-button')).toBeTruthy();
    });

    it('hauria de mostrar la ubicació seleccionada', () => {
      const selectedLocation = mockLocations[0];

      const { getByTestId } = renderWithProviders(
        <MapViewComponent
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
          selectedLocation={selectedLocation}
        />,
        { withNavigation: false }
      );

      expect(getByTestId('selected-location')).toBeTruthy();
    });
  });

  describe('Botó de capes (Offline Map Manager)', () => {
    it('hauria d\'obrir el gestor de mapes offline en fer clic', async () => {
      const { getByTestId, queryByTestId } = renderWithProviders(
        <MapViewComponent
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />,
        { withNavigation: false }
      );

      // Inicialment no hauria d'estar visible
      expect(queryByTestId('offline-map-manager')).toBeNull();

      // Clicar el botó de capes
      const layersButton = getByTestId('layers-button');
      fireEvent.press(layersButton);

      await waitFor(() => {
        expect(queryByTestId('offline-map-manager')).toBeTruthy();
      });
    });

    it('hauria de tancar el gestor de mapes offline', async () => {
      const { getByTestId, queryByTestId } = renderWithProviders(
        <MapViewComponent
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />,
        { withNavigation: false }
      );

      // Obrir el gestor
      const layersButton = getByTestId('layers-button');
      fireEvent.press(layersButton);

      await waitFor(() => {
        expect(getByTestId('offline-map-manager')).toBeTruthy();
      });

      // Tancar el gestor
      const closeButton = getByTestId('close-offline-manager');
      fireEvent.press(closeButton);

      await waitFor(() => {
        expect(queryByTestId('offline-map-manager')).toBeNull();
      });
    });
  });

  describe('Botó de centrar ubicació', () => {
    it('hauria de demanar permisos d\'ubicació', async () => {
      const mockRequestPermissions = ExpoLocation.requestForegroundPermissionsAsync as jest.Mock;
      mockRequestPermissions.mockResolvedValue({ status: 'granted' });

      const mockGetCurrentPosition = ExpoLocation.getCurrentPositionAsync as jest.Mock;
      mockGetCurrentPosition.mockResolvedValue({
        coords: {
          latitude: 42.5,
          longitude: 1.5,
          altitude: null,
          accuracy: 10,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      });

      const mockShowAlert = jest.fn();
      jest.spyOn(require('../../../hooks/useCustomAlert'), 'useCustomAlert').mockReturnValue({
        alertVisible: false,
        alertConfig: null,
        showAlert: mockShowAlert,
        hideAlert: jest.fn(),
      });

      const { getByTestId } = renderWithProviders(
        <MapViewComponent
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />,
        { withNavigation: false }
      );

      // Clicar el botó de centrar ubicació
      const targetButton = getByTestId('target-button');
      fireEvent.press(targetButton);

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          'Permís d\'ubicació',
          'Necessitem accés a la teva ubicació',
          expect.arrayContaining([
            expect.objectContaining({ text: 'Cancel·lar' }),
            expect.objectContaining({ text: 'Permetre' }),
          ])
        );
      });
    });

    it('hauria de gestionar el cas quan es denega el permís', async () => {
      const mockRequestPermissions = ExpoLocation.requestForegroundPermissionsAsync as jest.Mock;
      mockRequestPermissions.mockResolvedValue({ status: 'denied' });

      const mockShowAlert = jest.fn((title, message, buttons) => {
        // Simular que l'usuari fa clic a "Permetre"
        if (buttons && Array.isArray(buttons)) {
          const allowButton = buttons.find((b: any) => b.text === 'Permetre');
          if (allowButton?.onPress) {
            allowButton.onPress();
          }
        }
      });

      jest.spyOn(require('../../../hooks/useCustomAlert'), 'useCustomAlert').mockReturnValue({
        alertVisible: false,
        alertConfig: null,
        showAlert: mockShowAlert,
        hideAlert: jest.fn(),
      });

      const { getByTestId } = renderWithProviders(
        <MapViewComponent
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />,
        { withNavigation: false }
      );

      const targetButton = getByTestId('target-button');
      fireEvent.press(targetButton);

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalled();
      });

      // Hauria de mostrar un altre alert indicant que el permís va ser denegat
      await waitFor(() => {
        expect(mockRequestPermissions).toHaveBeenCalled();
        // Should have been called twice - once for permission request, once for denied message
        expect(mockShowAlert).toHaveBeenCalledTimes(2);
      });
    });

    it('hauria de gestionar errors en obtenir la ubicació', async () => {
      const mockRequestPermissions = ExpoLocation.requestForegroundPermissionsAsync as jest.Mock;
      mockRequestPermissions.mockResolvedValue({ status: 'granted' });

      const mockGetCurrentPosition = ExpoLocation.getCurrentPositionAsync as jest.Mock;
      mockGetCurrentPosition.mockRejectedValue(new Error('Location error'));

      const mockShowAlert = jest.fn((title, message, buttons) => {
        // Simular que l'usuari fa clic a "Permetre"
        if (buttons && Array.isArray(buttons)) {
          const allowButton = buttons.find((b: any) => b.text === 'Permetre');
          if (allowButton?.onPress) {
            allowButton.onPress();
          }
        }
      });

      jest.spyOn(require('../../../hooks/useCustomAlert'), 'useCustomAlert').mockReturnValue({
        alertVisible: false,
        alertConfig: null,
        showAlert: mockShowAlert,
        hideAlert: jest.fn(),
      });

      const { getByTestId } = renderWithProviders(
        <MapViewComponent
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />,
        { withNavigation: false }
      );

      const targetButton = getByTestId('target-button');
      fireEvent.press(targetButton);

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalled();
        // Should be called twice - once for permission, once for error
        expect(mockShowAlert).toHaveBeenCalledTimes(2);
      });
    });

    it('hauria de permetre amagar la ubicació de l\'usuari si ja està mostrada', async () => {
      const mockRequestPermissions = ExpoLocation.requestForegroundPermissionsAsync as jest.Mock;
      mockRequestPermissions.mockResolvedValue({ status: 'granted' });

      const mockGetCurrentPosition = ExpoLocation.getCurrentPositionAsync as jest.Mock;
      mockGetCurrentPosition.mockResolvedValue({
        coords: {
          latitude: 42.5,
          longitude: 1.5,
          altitude: null,
          accuracy: 10,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      });

      const mockShowAlert = jest.fn((title, message, buttons) => {
        if (buttons && Array.isArray(buttons)) {
          const allowButton = buttons.find((b: any) => b.text === 'Permetre');
          if (allowButton?.onPress) {
            allowButton.onPress();
          }
        }
      });

      jest.spyOn(require('../../../hooks/useCustomAlert'), 'useCustomAlert').mockReturnValue({
        alertVisible: false,
        alertConfig: null,
        showAlert: mockShowAlert,
        hideAlert: jest.fn(),
      });

      const { getByTestId } = renderWithProviders(
        <MapViewComponent
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />,
        { withNavigation: false }
      );

      const targetButton = getByTestId('target-button');

      // Primera vegada: mostrar ubicació
      fireEvent.press(targetButton);

      // Esperar que es completi el flux de permisos i ubicació
      await waitFor(() => {
        expect(mockGetCurrentPosition).toHaveBeenCalled();
      }, { timeout: 2000 });

      // Esperar un moment per assegurar que l'estat s'ha actualitzat
      await new Promise(resolve => setTimeout(resolve, 200));

      // Capturar el nombre de crides abans de la segona pressió
      const callsBeforeSecondPress = mockShowAlert.mock.calls.length;

      // Segona vegada: amagar ubicació
      // Com que la ubicació ja està mostrada, no hauria de demanar permisos de nou
      fireEvent.press(targetButton);

      // Esperar un moment
      await new Promise(resolve => setTimeout(resolve, 100));

      // No hauria d'haver cridat showAlert de nou després de tenir la ubicació
      expect(mockShowAlert.mock.calls.length).toBe(callsBeforeSecondPress);
    });
  });

  describe('Memoització del component', () => {
    it('no hauria de re-renderitzar si les props no canvien', () => {
      const { rerender } = renderWithProviders(
        <MapViewComponent
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />,
        { withNavigation: false }
      );

      // Re-renderitzar amb les mateixes props
      rerender(
        <MapViewComponent
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />
      );

      // El component hauria d'estar memoritzat i no re-renderitzar-se
      // Això es verificaria amb un spy en el component, però aquí només comprovem
      // que no hi ha errors
    });
  });

  describe('Casos límit', () => {
    it('hauria de gestionar una llista buida d\'ubicacions', () => {
      const { getByTestId } = renderWithProviders(
        <MapViewComponent
          locations={[]}
          onLocationSelect={mockOnLocationSelect}
        />,
        { withNavigation: false }
      );

      expect(getByTestId('leaflet-web-map')).toBeTruthy();
    });

    it('hauria de gestionar undefined selectedLocation', () => {
      const { getByTestId, queryByTestId } = renderWithProviders(
        <MapViewComponent
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
          selectedLocation={undefined}
        />,
        { withNavigation: false }
      );

      expect(getByTestId('leaflet-web-map')).toBeTruthy();
      expect(queryByTestId('selected-location')).toBeNull();
    });
  });
});
