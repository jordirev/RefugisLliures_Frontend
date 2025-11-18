/**
 * Tests d'integració per a LeafletWebMap
 * 
 * Cobertura:
 * - Renderització del mapa amb WebView
 * - Càrrega de tiles amb OpenTopoMap
 * - Markers de refugis (normal i seleccionat)
 * - Selecció de refugis (onLocationSelect)
 * - Actualització dinàmica de markers
 * - Marker d'ubicació de l'usuari
 * - Centrat del mapa (userLocation, selectedLocation)
 * - Integració amb MapCacheService
 * - Comunicació WebView <-> React Native
 * - HTML generat per Leaflet
 * - Gestió d'esdeveniments del mapa
 */

import React from 'react';
import { renderWithProviders, fireEvent, waitFor } from '../setup/testUtils';
import { setupMSW } from '../setup/mswServer';
import { Location } from '../../../models';

// Setup MSW
setupMSW();

// Mock de MapCacheService abans d'importar el component
jest.mock('../../../services/MapCacheService', () => ({
  MapCacheService: {
    initializeCache: jest.fn(),
    getCacheStatus: jest.fn(),
  },
}));

// Mock expo-file-system
jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///mock/documents/',
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  downloadAsync: jest.fn(),
  readDirectoryAsync: jest.fn(),
  deleteAsync: jest.fn(),
}));

import { LeafletWebMap } from '../../../components/LeafletWebMap';
import { MapCacheService } from '../../../services/MapCacheService';

// Mock de WebView
const mockInjectJavaScript = jest.fn();
const mockWebViewRef = { current: { injectJavaScript: mockInjectJavaScript } };

jest.mock('react-native-webview', () => {
  const { forwardRef, useImperativeHandle } = require('react');
  
  return {
    WebView: forwardRef(({ source, onMessage, ...props }: any, ref: any) => {
      // Simular referència
      useImperativeHandle(ref, () => ({
        injectJavaScript: mockInjectJavaScript,
      }));

      const { View, Text } = require('react-native');
      
      return (
        <View
          testID="webview"
          source={source}
          onMessage={onMessage}
          {...props}
        >
          <Text>WebView Mock</Text>
        </View>
      );
    }),
  };
});

describe('LeafletWebMap - Tests d\'integració', () => {
  const mockLocations: Location[] = [
    {
      id: 1,
      name: 'Refugi de Colomèrs',
      coord: { lat: 42.6581, long: 0.9503 },
      type: 1,
      condition: 'bé',
      altitude: 2135,
      places: 16,
    },
    {
      id: 2,
      name: 'Refugi de Restanca',
      coord: { lat: 42.6432, long: 0.9245 },
      type: 0,
      condition: 'normal',
      altitude: 2010,
      places: 8,
    },
  ];

  const mockOnLocationSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (MapCacheService.initializeCache as jest.Mock).mockResolvedValue(undefined);
    (MapCacheService.getCacheStatus as jest.Mock).mockResolvedValue({
      metadata: { isComplete: false },
    });
  });

  describe('Renderització inicial', () => {
    it('hauria de renderitzar el component WebView', () => {
      const { getByTestId } = renderWithProviders(
        <LeafletWebMap
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />,
        { withNavigation: false }
      );

      expect(getByTestId('webview')).toBeTruthy();
    });

    it('hauria de generar HTML amb Leaflet', () => {
      const { getByTestId } = renderWithProviders(
        <LeafletWebMap
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />,
        { withNavigation: false }
      );

      const webview = getByTestId('webview');
      const html = webview.props.source.html;

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('leaflet');
      expect(html).toContain('opentopomap');
    });

    it('hauria d\'inicialitzar MapCacheService', async () => {
      renderWithProviders(
        <LeafletWebMap
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />,
        { withNavigation: false }
      );

      await waitFor(() => {
        expect(MapCacheService.initializeCache).toHaveBeenCalled();
        expect(MapCacheService.getCacheStatus).toHaveBeenCalled();
      });
    });

    it('hauria de centrar el mapa als Pirineus per defecte', () => {
      const { getByTestId } = renderWithProviders(
        <LeafletWebMap
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />,
        { withNavigation: false }
      );

      const webview = getByTestId('webview');
      const html = webview.props.source.html;

      expect(html).toContain('setView([42.6, 0.7], 8)');
    });

    it('hauria de permetre especificar centre i zoom personalitzats', () => {
      const { getByTestId } = renderWithProviders(
        <LeafletWebMap
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
          center={[42.5, 1.0]}
          zoom={10}
        />,
        { withNavigation: false }
      );

      const webview = getByTestId('webview');
      const html = webview.props.source.html;

      expect(html).toContain('setView([42.5, 1], 10)');
    });
  });

  describe('Markers de refugis', () => {
    it('hauria de generar markers per a tots els refugis', () => {
      const { getByTestId } = renderWithProviders(
        <LeafletWebMap
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />,
        { withNavigation: false }
      );

      const webview = getByTestId('webview');
      const html = webview.props.source.html;

      expect(html).toContain('Refugi de Colomèrs');
      expect(html).toContain('Refugi de Restanca');
      expect(html).toContain('42.6581');
      expect(html).toContain('0.9503');
    });

    it('hauria de crear icones personalitzades per als markers', () => {
      const { getByTestId } = renderWithProviders(
        <LeafletWebMap
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />,
        { withNavigation: false }
      );

      const webview = getByTestId('webview');
      const html = webview.props.source.html;

      expect(html).toContain('refugeIcon');
      expect(html).toContain('selectedIcon');
      expect(html).toContain('#FF6900'); // Color taronja dels markers
    });

    it('hauria de diferenciar el marker seleccionat', () => {
      const { getByTestId } = renderWithProviders(
        <LeafletWebMap
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
          selectedLocation={mockLocations[0]}
        />,
        { withNavigation: false }
      );

      const webview = getByTestId('webview');
      const html = webview.props.source.html;

      expect(html).toContain('selectedLocationId = 1');
    });

    it('hauria de gestionar array de refugis buit', () => {
      const { getByTestId } = renderWithProviders(
        <LeafletWebMap
          locations={[]}
          onLocationSelect={mockOnLocationSelect}
        />,
        { withNavigation: false }
      );

      const webview = getByTestId('webview');
      expect(webview).toBeTruthy();
    });
  });

  describe('Selecció de refugis', () => {
    it('hauria de cridar onLocationSelect quan es fa clic en un marker', async () => {
      const { getByTestId } = renderWithProviders(
        <LeafletWebMap
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />,
        { withNavigation: false }
      );

      // Simulate the WebView sending a message about location selection
      const webview = getByTestId('webview');
      
      if (webview.props.onMessage) {
        webview.props.onMessage({
          nativeEvent: {
            data: JSON.stringify({ type: 'locationSelect', id: 1 })
          }
        });
      }

      await waitFor(() => {
        expect(mockOnLocationSelect).toHaveBeenCalledWith(1);
      });
    });

    it('hauria de gestionar missatges amb objecte location', async () => {
      const mockOnMessage = jest.fn();

      const { getByTestId } = renderWithProviders(
        <LeafletWebMap
          locations={mockLocations}
          onLocationSelect={mockOnMessage}
        />,
        { withNavigation: false }
      );

      const webview = getByTestId('webview');

      // Simular missatge amb objecte location
      webview.props.onMessage({
        nativeEvent: {
          data: JSON.stringify({
            type: 'locationSelect',
            location: mockLocations[0],
          }),
        },
      });

      await waitFor(() => {
        expect(mockOnMessage).toHaveBeenCalledWith(mockLocations[0]);
      });
    });

    it('hauria de gestionar errors en parsejar missatges', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      const { getByTestId } = renderWithProviders(
        <LeafletWebMap
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />,
        { withNavigation: false }
      );

      const webview = getByTestId('webview');

      // Enviar dades invàlides
      webview.props.onMessage({
        nativeEvent: {
          data: 'invalid json',
        },
      });

      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });

  describe('Actualització dinàmica de markers', () => {
    it('hauria d\'actualitzar markers quan canvien les locations', async () => {
      const { getByTestId, rerender } = renderWithProviders(
        <LeafletWebMap
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />,
        { withNavigation: false }
      );

      // Simular inicialització del mapa
      const webview = getByTestId('webview');

      webview.props.onMessage({
        nativeEvent: {
          data: JSON.stringify({ type: 'mapInitialized' }),
        },
      });

      await waitFor(() => {
        // Mapa inicialitzat
      });

      // Canviar locations
      const newLocations = [mockLocations[0]];

      rerender(
        <LeafletWebMap
          locations={newLocations}
          onLocationSelect={mockOnLocationSelect}
        />
      );

      await waitFor(() => {
        expect(mockInjectJavaScript).toHaveBeenCalled();
      });
    });

    it('hauria d\'actualitzar el marker seleccionat', async () => {
      const { getByTestId, rerender } = renderWithProviders(
        <LeafletWebMap
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />,
        { withNavigation: false }
      );

      // Inicialitzar mapa
      const webview = getByTestId('webview');

      webview.props.onMessage({
        nativeEvent: {
          data: JSON.stringify({ type: 'mapInitialized' }),
        },
      });

      // Canviar selecció
      rerender(
        <LeafletWebMap
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
          selectedLocation={mockLocations[1]}
        />
      );

      await waitFor(() => {
        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining('updateSelectedMarker')
        );
      });
    });

    it('no hauria d\'actualitzar si locations no han canviat', async () => {
      const { getByTestId, rerender } = renderWithProviders(
        <LeafletWebMap
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />,
        { withNavigation: false }
      );

      const webview = getByTestId('webview');

      webview.props.onMessage({
        nativeEvent: {
          data: JSON.stringify({ type: 'mapInitialized' }),
        },
      });

      // Wait for initial updateMarkers call after initialization
      await waitFor(() => {
        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining('updateMarkers')
        );
      });

      const callCountBefore = mockInjectJavaScript.mock.calls.filter(
        (call) => call[0].includes('updateMarkers')
      ).length;

      // Re-render amb les mateixes locations
      rerender(
        <LeafletWebMap
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />
      );

      // Wait a bit to ensure no new calls
      await new Promise(resolve => setTimeout(resolve, 100));

      const callCountAfter = mockInjectJavaScript.mock.calls.filter(
        (call) => call[0].includes('updateMarkers')
      ).length;

      // Should not have made any additional updateMarkers calls
      expect(callCountAfter).toBe(callCountBefore);
    });
  });

  describe('Ubicació de l\'usuari', () => {
    it('hauria de mostrar marker de l\'usuari', () => {
      const { getByTestId } = renderWithProviders(
        <LeafletWebMap
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
          userLocation={{ latitude: 42.5, longitude: 1.0 }}
        />,
        { withNavigation: false }
      );

      const webview = getByTestId('webview');
      const html = webview.props.source.html;

      expect(html).toContain('userLocationIcon');
      expect(html).toContain('42.5');
      expect(html).toContain('1.0');
    });

    it('hauria de centrar el mapa a l\'ubicaci\u00f3 de l\'usuari', async () => {
      const { getByTestId } = renderWithProviders(
        <LeafletWebMap
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
          userLocation={{ latitude: 42.5, longitude: 1.0 }}
        />,
        { withNavigation: false }
      );

      const webview = getByTestId('webview');

      // Trigger map initialization
      webview.props.onMessage({
        nativeEvent: {
          data: JSON.stringify({ type: 'mapInitialized' }),
        },
      });

      // Check that injectJavaScript was called with user location centering code
      await waitFor(() => {
        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining('map.setView([ul.latitude, ul.longitude], 15)')
        );
      });
    });

    it('hauria d\'actualitzar el marker quan canvia userLocation', async () => {
      const { getByTestId, rerender } = renderWithProviders(
        <LeafletWebMap
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />,
        { withNavigation: false }
      );

      // Inicialitzar
      const webview = getByTestId('webview');

      webview.props.onMessage({
        nativeEvent: {
          data: JSON.stringify({ type: 'mapInitialized' }),
        },
      });

      // Afegir userLocation
      rerender(
        <LeafletWebMap
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
          userLocation={{ latitude: 42.5, longitude: 1.0 }}
        />
      );

      await waitFor(() => {
        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining('userMarker')
        );
      });
    });

    it('hauria d\'eliminar el marker anterior quan canvia userLocation', async () => {
      const { getByTestId, rerender } = renderWithProviders(
        <LeafletWebMap
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
          userLocation={{ latitude: 42.5, longitude: 1.0 }}
        />,
        { withNavigation: false }
      );

      const webview = getByTestId('webview');

      webview.props.onMessage({
        nativeEvent: {
          data: JSON.stringify({ type: 'mapInitialized' }),
        },
      });

      // Canviar userLocation
      rerender(
        <LeafletWebMap
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
          userLocation={{ latitude: 42.6, longitude: 1.1 }}
        />
      );

      await waitFor(() => {
        expect(mockInjectJavaScript).toHaveBeenCalledWith(
          expect.stringContaining('removeLayer')
        );
      });
    });

    it('no hauria de mostrar marker sense userLocation', () => {
      const { getByTestId } = renderWithProviders(
        <LeafletWebMap
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />,
        { withNavigation: false }
      );

      const webview = getByTestId('webview');
      const html = webview.props.source.html;

      // userLocation should be undefined, so the marker won't be added to the map
      expect(html).toContain('var userLocation = undefined');
      // The icon is defined but not used since userLocation is undefined
      expect(html).toContain('if (userLocation && userLocation.latitude && userLocation.longitude)');
    });
  });

  describe('Integració amb MapCacheService', () => {
    it('hauria d\'usar cache quan està disponible', async () => {
      (MapCacheService.getCacheStatus as jest.Mock).mockResolvedValue({
        metadata: { isComplete: true },
      });

      const { getByTestId } = renderWithProviders(
        <LeafletWebMap
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />,
        { withNavigation: false }
      );

      // Wait for cache status to load and HTML to update
      await waitFor(() => {
        const webview = getByTestId('webview');
        const html = webview.props.source?.html;
        
        expect(html).toBeDefined();
        // Check that cacheInfo has isComplete: true
        expect(html).toContain('"isComplete":true');
      }, { timeout: 2000 });
    });

    it('hauria d\'usar tiles online sense cache', async () => {
      const { getByTestId } = renderWithProviders(
        <LeafletWebMap
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />,
        { withNavigation: false }
      );

      // Wait for HTML to be available
      await waitFor(() => {
        const webview = getByTestId('webview');
        const html = webview.props.source?.html;

        expect(html).toBeDefined();
        // Check that cacheInfo has isComplete: false
        expect(html).toContain('"isComplete":false');
        expect(html).toContain('opentopomap.org');
      }, { timeout: 2000 });
    });
  });

  describe('Configuració del mapa', () => {
    it('hauria de deshabilitar els controls de zoom', () => {
      const { getByTestId } = renderWithProviders(
        <LeafletWebMap
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />,
        { withNavigation: false }
      );

      const webview = getByTestId('webview');
      const html = webview.props.source.html;

      expect(html).toContain('zoomControl.remove()');
    });

    it('hauria de configurar maxZoom a 17', () => {
      const { getByTestId } = renderWithProviders(
        <LeafletWebMap
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />,
        { withNavigation: false }
      );

      const webview = getByTestId('webview');
      const html = webview.props.source.html;

      expect(html).toContain('maxZoom: 17');
    });

    it('no hauria de mostrar marker sense userLocation', () => {
      const { getByTestId } = renderWithProviders(
        <LeafletWebMap
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />,
        { withNavigation: false }
      );

      const webview = getByTestId('webview');
      const html = webview.props.source?.html;

      // userLocation should be undefined in the JavaScript
      expect(html).toContain('var userLocation = undefined');
    });

    it('hauria de deshabilitar popups', () => {
      const { getByTestId } = renderWithProviders(
        <LeafletWebMap
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />,
        { withNavigation: false }
      );

      const webview = getByTestId('webview');
      const html = webview.props.source.html;

      // Popups disabled - només notificar React Native
      expect(html).toContain('ReactNativeWebView');
    });
  });

  describe('Propietats del WebView', () => {
    it('hauria d\'habilitar JavaScript', () => {
      const { getByTestId } = renderWithProviders(
        <LeafletWebMap
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />,
        { withNavigation: false }
      );

      const webview = getByTestId('webview');
      expect(webview.props.javaScriptEnabled).toBe(true);
    });

    it('hauria d\'habilitar domStorage', () => {
      const { getByTestId } = renderWithProviders(
        <LeafletWebMap
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />,
        { withNavigation: false }
      );

      const webview = getByTestId('webview');
      expect(webview.props.domStorageEnabled).toBe(true);
    });

    it('hauria de deshabilitar scroll', () => {
      const { getByTestId } = renderWithProviders(
        <LeafletWebMap
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />,
        { withNavigation: false }
      );

      const webview = getByTestId('webview');
      expect(webview.props.scrollEnabled).toBe(false);
    });

    it('hauria de mostrar estat de càrrega', () => {
      const { getByTestId } = renderWithProviders(
        <LeafletWebMap
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />,
        { withNavigation: false }
      );

      const webview = getByTestId('webview');
      expect(webview.props.startInLoadingState).toBe(true);
    });
  });

  describe('Memorització del component', () => {
    it('no hauria de re-renderitzar amb les mateixes props', () => {
      const { rerender } = renderWithProviders(
        <LeafletWebMap
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />,
        { withNavigation: false }
      );

      const renderCount = mockInjectJavaScript.mock.calls.length;

      // Re-render amb les mateixes props
      rerender(
        <LeafletWebMap
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />
      );

      // El nombre de crides no hauria d'augmentar
      expect(mockInjectJavaScript.mock.calls.length).toBe(renderCount);
    });
  });

  describe('Casos límit', () => {
    it('hauria de gestionar coordenades extremes', () => {
      const extremeLocations: Location[] = [
        {
          id: 1,
          name: 'Nord',
          coord: { lat: 89.9, long: 179.9 },
          type: 1,
          condition: 'bé',
          altitude: 3500,
          places: 0,
        },
      ];

      const { getByTestId } = renderWithProviders(
        <LeafletWebMap
          locations={extremeLocations}
          onLocationSelect={mockOnLocationSelect}
        />,
        { withNavigation: false }
      );

      const webview = getByTestId('webview');
      expect(webview).toBeTruthy();
    });

    it('hauria de gestionar molts refugis', () => {
      const manyLocations = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `Refugi ${i}`,
        coord: { lat: 42.5 + i * 0.01, long: 1.0 + i * 0.01 },
        type: 1,
        condition: 'bé' as const,
        altitude: 2000,
        places: 10,
      }));

      const { getByTestId } = renderWithProviders(
        <LeafletWebMap
          locations={manyLocations}
          onLocationSelect={mockOnLocationSelect}
        />,
        { withNavigation: false }
      );

      const webview = getByTestId('webview');
      expect(webview).toBeTruthy();
    });

    it('hauria de gestionar errors en initializeCache', async () => {
      (MapCacheService.initializeCache as jest.Mock).mockRejectedValue(
        new Error('Cache error')
      );

      const { getByTestId } = renderWithProviders(
        <LeafletWebMap
          locations={mockLocations}
          onLocationSelect={mockOnLocationSelect}
        />,
        { withNavigation: false }
      );

      // Hauria de renderitzar igualment
      await waitFor(() => {
        expect(getByTestId('webview')).toBeTruthy();
      });
    });
  });
});
