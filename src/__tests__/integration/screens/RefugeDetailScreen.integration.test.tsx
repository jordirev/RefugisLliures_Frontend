/**
 * Tests d'integració per a RefugeDetailScreen
 * 
 * Cobertura:
 * - Renderització completa del refugi amb totes les dades
 * - Visualització de badges (tipus i condició)
 * - Estadístiques (altitud, places, coordenades)
 * - Descripció amb expand/collapse
 * - Informació opcional (telèfon, web, horari)
 * - Toggle de favorit
 * - Descàrrega de GPX/KML
 * - Navegació (botó back, editar, navegar)
 * - Gestió d'imatges
 * - Casos amb dades mínimes vs completes
 */

import React from 'react';
import { renderWithProviders, fireEvent, waitFor } from '../setup/testUtils';
import { setupMSW } from '../setup/mswServer';
import { RefugeDetailScreen } from '../../../screens/RefugeDetailScreen';
import { Location } from '../../../models';

// Setup MSW
setupMSW();

// Mock de FileSystem i Sharing (Expo)
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file://documents/',
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  EncodingType: {
    UTF8: 'utf8',
  },
}));

// Mock de CustomAlert
const mockShowAlert = jest.fn();
const mockHideAlert = jest.fn();

jest.mock('../../../utils/useCustomAlert', () => ({
  useCustomAlert: () => ({
    alertVisible: false,
    alertConfig: null,
    showAlert: mockShowAlert,
    hideAlert: mockHideAlert,
  }),
}));

// Mock de les icones
jest.mock('../../../assets/icons/arrow-left.svg', () => 'ArrowLeftIcon');
jest.mock('../../../assets/icons/favorite.svg', () => 'FavoriteIcon');
jest.mock('../../../assets/icons/favorite-filled.svg', () => 'FavoriteFilledIcon');
jest.mock('../../../assets/icons/edit.svg', () => 'EditIcon');
jest.mock('../../../assets/icons/location.svg', () => 'LocationIcon');
jest.mock('../../../assets/icons/navigation.svg', () => 'NavigationIcon');

describe('RefugeDetailScreen - Tests d\'integració', () => {
  const mockOnBack = jest.fn();
  const mockOnToggleFavorite = jest.fn();
  const mockOnNavigate = jest.fn();
  const mockOnEdit = jest.fn();

  const mockRefuge: Location = {
    id: 1,
    name: 'Refugi de Colomèrs',
    type: 'guardat',
    condition: 'bo',
    altitude: 2135,
    places: 16,
    latitude: 42.6581,
    longitude: 0.9503,
    region: 'Aran',
    comarca: 'Val d\'Aran',
    description: 'Refugi guardat situat al Parc Nacional d\'Aigüestortes i Estany de Sant Maurici. Ubicat al cor dels Pirineus, ofereix vistes espectaculars als estanys de Colomèrs. El refugi disposa de servei de restauració i està obert tot l\'any.',
    phone: '+34 973 253 005',
    web: 'https://refugicolomes.com',
    schedule: 'Obert tot l\'any. Horari: 8:00 - 22:00',
    image: 'https://example.com/refuge.jpg',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderització inicial', () => {
    it('hauria de renderitzar el nom del refugi', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <RefugeDetailScreen
          refuge={mockRefuge}
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false }
      );

      expect(getByText('Refugi de Colomèrs')).toBeTruthy();
    });

    it('hauria de renderitzar els badges de tipus i condició', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <RefugeDetailScreen
          refuge={mockRefuge}
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false }
      );

      expect(getByText('Guardat')).toBeTruthy();
      expect(getByText('Bon estat')).toBeTruthy();
    });

    it('hauria de mostrar l\'altitud', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <RefugeDetailScreen
          refuge={mockRefuge}
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false }
      );

      expect(getByText('2135 m')).toBeTruthy();
    });

    it('hauria de mostrar les places disponibles', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <RefugeDetailScreen
          refuge={mockRefuge}
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false }
      );

      expect(getByText('16 places')).toBeTruthy();
    });

    it('hauria de mostrar les coordenades', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <RefugeDetailScreen
          refuge={mockRefuge}
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false }
      );

      // Coordenades formatades: lat 4 decimals, long 5 decimals
      expect(getByText(/42\.6581/)).toBeTruthy();
      expect(getByText(/0\.95030/)).toBeTruthy();
    });

    it('hauria de mostrar la descripció', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <RefugeDetailScreen
          refuge={mockRefuge}
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false }
      );

      expect(getByText(/Refugi guardat situat al Parc Nacional/)).toBeTruthy();
    });

    it('hauria de mostrar la regió i comarca', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <RefugeDetailScreen
          refuge={mockRefuge}
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false }
      );

      expect(getByText(/Aran.*Val d'Aran/)).toBeTruthy();
    });

    it('hauria de mostrar la imatge del refugi', () => {
      const { getByRole, getByTestId } = renderWithProviders(
        <RefugeDetailScreen
          refuge={mockRefuge}
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false }
      );

      const images = getByRole('image');
      expect(images).toBeTruthy();
    });
  });

  describe('Informació opcional', () => {
    it('hauria de mostrar el telèfon si està disponible', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <RefugeDetailScreen
          refuge={mockRefuge}
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false }
      );

      expect(getByText('+34 973 253 005')).toBeTruthy();
    });

    it('hauria de mostrar la web si està disponible', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <RefugeDetailScreen
          refuge={mockRefuge}
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false }
      );

      expect(getByText('https://refugicolomes.com')).toBeTruthy();
    });

    it('hauria de mostrar l\'horari si està disponible', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <RefugeDetailScreen
          refuge={mockRefuge}
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false }
      );

      expect(getByText(/Obert tot l'any/)).toBeTruthy();
    });

    it('no hauria de mostrar seccions per camps opcionals buits', () => {
      const minimalRefuge: Location = {
        id: 2,
        name: 'Refugi Simple',
        type: 'lliure',
        condition: 'ruïna',
        altitude: 1500,
        places: 0,
        latitude: 42.5,
        longitude: 1.0,
      };

      const { queryByText } = renderWithProviders(
        <RefugeDetailScreen
          refuge={minimalRefuge}
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false }
      );

      // No hauria de mostrar aquests camps si no estan disponibles
      expect(queryByText('Telèfon')).toBeNull();
      expect(queryByText('Web')).toBeNull();
      expect(queryByText('Horari')).toBeNull();
    });
  });

  describe('Descripció expandible', () => {
    it('hauria de mostrar el botó "Llegir més" per descripcions llargues', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <RefugeDetailScreen
          refuge={mockRefuge}
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false }
      );

      expect(getByText('Llegir més')).toBeTruthy();
    });

    it('hauria d\'expandir la descripció quan es fa clic a "Llegir més"', async () => {
      const { getByText, getByTestId } = renderWithProviders(
        <RefugeDetailScreen
          refuge={mockRefuge}
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false }
      );

      const readMoreButton = getByText('Llegir més');
      fireEvent.press(readMoreButton);

      await waitFor(() => {
        expect(getByText('Llegir menys')).toBeTruthy();
      });
    });

    it('hauria de col·lapsar la descripció quan es fa clic a "Llegir menys"', async () => {
      const { getByText, getByTestId } = renderWithProviders(
        <RefugeDetailScreen
          refuge={mockRefuge}
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false }
      );

      // Expandir
      fireEvent.press(getByText('Llegir més'));

      await waitFor(() => {
        expect(getByText('Llegir menys')).toBeTruthy();
      });

      // Col·lapsar
      fireEvent.press(getByText('Llegir menys'));

      await waitFor(() => {
        expect(getByText('Llegir més')).toBeTruthy();
      });
    });
  });

  describe('Accions del refugi', () => {
    it('hauria de cridar onBack quan es fa clic al botó back', () => {
      const { getByTestId } = renderWithProviders(
        <RefugeDetailScreen
          refuge={mockRefuge}
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false }
      );

      const backButton = getByTestId('back-button');
      fireEvent.press(backButton);

      expect(mockOnBack).toHaveBeenCalled();
    });

    it('hauria de cridar onToggleFavorite quan es fa clic al botó de favorit', () => {
      const { getByTestId } = renderWithProviders(
        <RefugeDetailScreen
          refuge={mockRefuge}
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false }
      );

      const favoriteButton = getByTestId('favorite-button');
      fireEvent.press(favoriteButton);

      expect(mockOnToggleFavorite).toHaveBeenCalledWith(1);
    });

    it('hauria de cridar onNavigate quan es fa clic al botó de navegació', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <RefugeDetailScreen
          refuge={mockRefuge}
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false }
      );

      const navigateButton = getByText('Com arribar');
      fireEvent.press(navigateButton);

      expect(mockOnNavigate).toHaveBeenCalledWith(mockRefuge);
    });

    it('hauria de cridar onEdit quan es fa clic al botó d\'editar', () => {
      const { getByTestId } = renderWithProviders(
        <RefugeDetailScreen
          refuge={mockRefuge}
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onEdit={mockOnEdit}
        />,
        { withNavigation: false }
      );

      const editButton = getByTestId('edit-button');
      fireEvent.press(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith(mockRefuge);
    });

    it('no hauria de mostrar el botó d\'editar si no es proporciona onEdit', () => {
      const { queryByTestId } = renderWithProviders(
        <RefugeDetailScreen
          refuge={mockRefuge}
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false }
      );

      const editButton = queryByTestId('edit-button');
      expect(editButton).toBeNull();
    });
  });

  describe('Descàrrega de fitxers', () => {
    it('hauria de mostrar el botó de descàrrega GPX', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <RefugeDetailScreen
          refuge={mockRefuge}
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false }
      );

      expect(getByText('GPX')).toBeTruthy();
    });

    it('hauria de mostrar el botó de descàrrega KML', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <RefugeDetailScreen
          refuge={mockRefuge}
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false }
      );

      expect(getByText('KML')).toBeTruthy();
    });

    it('hauria de descarregar fitxer GPX quan es fa clic', async () => {
      const { getByText, getByTestId } = renderWithProviders(
        <RefugeDetailScreen
          refuge={mockRefuge}
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false }
      );

      const gpxButton = getByText('GPX');
      fireEvent.press(gpxButton);

      await waitFor(() => {
        // Hauria de cridar writeAsStringAsync de FileSystem
        const FileSystem = require('expo-file-system');
        expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
      });
    });

    it('hauria de descarregar fitxer KML quan es fa clic', async () => {
      const { getByText, getByTestId } = renderWithProviders(
        <RefugeDetailScreen
          refuge={mockRefuge}
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false }
      );

      const kmlButton = getByText('KML');
      fireEvent.press(kmlButton);

      await waitFor(() => {
        const FileSystem = require('expo-file-system');
        expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
      });
    });
  });

  describe('Diferents tipus de refugis', () => {
    it('hauria de renderitzar correctament un refugi guardat', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <RefugeDetailScreen
          refuge={{ ...mockRefuge, type: 'guardat' }}
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false }
      );

      expect(getByText('Guardat')).toBeTruthy();
    });

    it('hauria de renderitzar correctament un refugi lliure', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <RefugeDetailScreen
          refuge={{ ...mockRefuge, type: 'lliure' }}
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false }
      );

      expect(getByText('Lliure')).toBeTruthy();
    });

    it('hauria de renderitzar correctament una cabana', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <RefugeDetailScreen
          refuge={{ ...mockRefuge, type: 'cabana' }}
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false }
      );

      expect(getByText('Cabana')).toBeTruthy();
    });

    it('hauria de renderitzar correctament una borda', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <RefugeDetailScreen
          refuge={{ ...mockRefuge, type: 'borda' }}
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false }
      );

      expect(getByText('Borda')).toBeTruthy();
    });
  });

  describe('Diferents condicions de refugis', () => {
    it('hauria de renderitzar correctament un refugi en bon estat', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <RefugeDetailScreen
          refuge={{ ...mockRefuge, condition: 'bo' }}
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false }
      );

      expect(getByText('Bon estat')).toBeTruthy();
    });

    it('hauria de renderitzar correctament un refugi en estat regular', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <RefugeDetailScreen
          refuge={{ ...mockRefuge, condition: 'regular' }}
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false }
      );

      expect(getByText('Estat regular')).toBeTruthy();
    });

    it('hauria de renderitzar correctament un refugi en ruïna', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <RefugeDetailScreen
          refuge={{ ...mockRefuge, condition: 'ruïna' }}
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false }
      );

      expect(getByText('Ruïna')).toBeTruthy();
    });
  });

  describe('Casos límit', () => {
    it('hauria de gestionar refugi sense places', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <RefugeDetailScreen
          refuge={{ ...mockRefuge, places: 0 }}
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false }
      );

      expect(getByText('0 places')).toBeTruthy();
    });

    it('hauria de gestionar refugi sense descripció', () => {
      const { queryByText } = renderWithProviders(
        <RefugeDetailScreen
          refuge={{ ...mockRefuge, description: undefined }}
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false }
      );

      expect(queryByText('Descripció')).toBeNull();
    });

    it('hauria de gestionar refugi sense imatge', () => {
      const { queryByRole } = renderWithProviders(
        <RefugeDetailScreen
          refuge={{ ...mockRefuge, image: undefined }}
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false }
      );

      // Hauria de mostrar una imatge per defecte o placeholder
      const images = queryByRole('image');
      expect(images).toBeTruthy();
    });

    it('hauria de gestionar altituds extremes', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <RefugeDetailScreen
          refuge={{ ...mockRefuge, altitude: 3500 }}
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false }
      );

      expect(getByText('3500 m')).toBeTruthy();
    });

    it('hauria de gestionar moltes places', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <RefugeDetailScreen
          refuge={{ ...mockRefuge, places: 100 }}
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false }
      );

      expect(getByText('100 places')).toBeTruthy();
    });
  });

  describe('Coordenades i localització', () => {
    it('hauria de formatear les coordenades correctament', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <RefugeDetailScreen
          refuge={mockRefuge}
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false }
      );

      // Latitud amb 4 decimals, longitud amb 5 decimals
      expect(getByText(/42\.6581.*0\.95030/)).toBeTruthy();
    });

    it('hauria de permetre copiar les coordenades', async () => {
      const Clipboard = require('@react-native-clipboard/clipboard');

      const { getByTestId } = renderWithProviders(
        <RefugeDetailScreen
          refuge={mockRefuge}
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false }
      );

      const coordsButton = getByTestId('copy-coordinates');
      fireEvent.press(coordsButton);

      await waitFor(() => {
        expect(Clipboard.setString).toHaveBeenCalledWith('42.6581, 0.95030');
      });
    });
  });

  describe('Scrolling i layout', () => {
    it('hauria de permetre fer scroll pel contingut', () => {
      const { getByTestId } = renderWithProviders(
        <RefugeDetailScreen
          refuge={mockRefuge}
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false }
      );

      const scrollView = getByTestId('detail-scroll-view');
      expect(scrollView).toBeTruthy();
    });
  });
});




