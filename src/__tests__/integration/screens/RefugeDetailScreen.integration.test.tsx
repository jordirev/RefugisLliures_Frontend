/**
 * Tests d'integració per a RefugeDetailScreen
 * 
 * NOTA: Aquest test ha estat simplificat perquè el component RefugeDetailScreen
 * ara utilitza refugeId + hooks (useRefuge) en lloc de rebre l'objecte refuge com a prop.
 */

// Mock expo-video ABANS de les importacions
jest.mock('expo-video', () => ({
  VideoView: 'VideoView',
  useVideoPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn(),
  })),
}));

// Mock expo-image-picker ABANS de les importacions
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  MediaTypeOptions: { Images: 'Images' },
}));

import React from 'react';
import { renderWithProviders, fireEvent } from '../setup/testUtils';
import { RefugeDetailScreen } from '../../../screens/RefugeDetailScreen';

// Mock de Linking
jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn(() => Promise.resolve()),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
}));

// Mock de expo-file-system
jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///mock/documents/',
  cacheDirectory: 'file:///mock/cache/',
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: false })),
  deleteAsync: jest.fn(() => Promise.resolve()),
  getContentUriAsync: jest.fn((uri: string) => Promise.resolve(uri)),
  EncodingType: { UTF8: 'utf8' },
  StorageAccessFramework: {
    requestDirectoryPermissionsAsync: jest.fn(() => Promise.resolve({ granted: false })),
    createFileAsync: jest.fn(() => Promise.resolve('file:///mock/newfile.gpx')),
    writeAsStringAsync: jest.fn(() => Promise.resolve()),
  },
}));

// Mock de expo-sharing
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}));

// Mock data for useRefuge
const mockRefugeData = {
  id: 1,
  name: 'Refugi de Colomèrs',
  type: 1,
  condition: 'bé',
  altitude: 2135,
  places: 16,
  coord: { lat: 42.6581, long: 0.9503 },
  region: 'Aran',
  description: 'Refugi guardat situat al Parc Nacional.',
  imageUrl: 'https://example.com/refuge.jpg',
};

// Mock de useRefuge hook
jest.mock('../../../hooks/useRefugesQuery', () => ({
  useRefuge: jest.fn(() => ({
    data: mockRefugeData,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })),
  useRefuges: jest.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
}));

// Mock de useFavourite hook
jest.mock('../../../hooks/useFavourite', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    isFavourite: false,
    toggleFavourite: jest.fn(),
    isProcessing: false,
  })),
}));

// Mock de useVisited hook
jest.mock('../../../hooks/useVisited', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    isVisited: false,
    toggleVisited: jest.fn(),
    isProcessing: false,
  })),
}));

// Mock de useExperiencesQuery hooks
jest.mock('../../../hooks/useExperiencesQuery', () => ({
  useExperiences: jest.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
  useDeleteExperience: jest.fn(() => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn(),
    isLoading: false,
  })),
  useUpdateExperience: jest.fn(() => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn(),
    isLoading: false,
  })),
}));

// Mock de CustomAlert
const mockShowAlert = jest.fn();
const mockHideAlert = jest.fn();
jest.mock('../../../hooks/useCustomAlert', () => ({
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderització inicial', () => {
    it('hauria de renderitzar el nom del refugi', () => {
      const { getByText } = renderWithProviders(
        <RefugeDetailScreen
          refugeId="1"
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false, mockAuthValue: { isAuthenticated: true } }
      );

      expect(getByText('Refugi de Colomèrs')).toBeTruthy();
    });

    it('hauria de mostrar l\'altitud', () => {
      const { getByText } = renderWithProviders(
        <RefugeDetailScreen
          refugeId="1"
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false, mockAuthValue: { isAuthenticated: true } }
      );

      expect(getByText('2135m')).toBeTruthy();
    });

    it('hauria de mostrar el nombre de places', () => {
      const { getByText } = renderWithProviders(
        <RefugeDetailScreen
          refugeId="1"
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false, mockAuthValue: { isAuthenticated: true } }
      );

      expect(getByText('16')).toBeTruthy();
    });

    it('hauria de mostrar la descripció', () => {
      const { getByText } = renderWithProviders(
        <RefugeDetailScreen
          refugeId="1"
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false, mockAuthValue: { isAuthenticated: true } }
      );

      expect(getByText(/Refugi guardat/)).toBeTruthy();
    });
  });

  describe('Interaccions', () => {
    it('hauria de cridar onBack quan es fa clic al botó de tornar', () => {
      const { getByTestId } = renderWithProviders(
        <RefugeDetailScreen
          refugeId="1"
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false, mockAuthValue: { isAuthenticated: true } }
      );

      const backButton = getByTestId('back-button');
      fireEvent.press(backButton);

      expect(mockOnBack).toHaveBeenCalled();
    });

    it('hauria de mostrar el botó de favorit', () => {
      const { getByTestId } = renderWithProviders(
        <RefugeDetailScreen
          refugeId="1"
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false, mockAuthValue: { isAuthenticated: true } }
      );

      expect(getByTestId('favorite-button')).toBeTruthy();
    });

    it('hauria de mostrar el botó de navegació', () => {
      const { getByTestId } = renderWithProviders(
        <RefugeDetailScreen
          refugeId="1"
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false, mockAuthValue: { isAuthenticated: true } }
      );

      expect(getByTestId('menu-button')).toBeTruthy();
    });
  });

  describe('Botons de descàrrega', () => {
    it('hauria de mostrar el botó de descàrrega GPX', () => {
      const { getByTestId } = renderWithProviders(
        <RefugeDetailScreen
          refugeId="1"
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false, mockAuthValue: { isAuthenticated: true } }
      );

      expect(getByTestId('download-gpx-button')).toBeTruthy();
    });

    it('hauria de mostrar el botó de descàrrega KML', () => {
      const { getByTestId } = renderWithProviders(
        <RefugeDetailScreen
          refugeId="1"
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false, mockAuthValue: { isAuthenticated: true } }
      );

      expect(getByTestId('download-kml-button')).toBeTruthy();
    });
  });

  describe('Botons d\'enllaços externs', () => {
    it('hauria de mostrar el botó de rutes (Wikiloc)', () => {
      const { getByTestId } = renderWithProviders(
        <RefugeDetailScreen
          refugeId="1"
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false, mockAuthValue: { isAuthenticated: true } }
      );

      expect(getByTestId('routes-button')).toBeTruthy();
    });

    it('hauria de mostrar el botó de temps (Windy)', () => {
      const { getByTestId } = renderWithProviders(
        <RefugeDetailScreen
          refugeId="1"
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />,
        { withNavigation: false, mockAuthValue: { isAuthenticated: true } }
      );

      expect(getByTestId('weather-button')).toBeTruthy();
    });
  });
});



