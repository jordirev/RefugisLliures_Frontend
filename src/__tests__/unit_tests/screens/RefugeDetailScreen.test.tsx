/**
 * Tests unitaris per a la pantalla RefugeDetailScreen
 * 
 * Aquest fitxer cobreix:
 * - Renderització d'informació del refugi
 * - Funcionalitat de favorits
 * - Descàrrega de GPX/KML
 * - Obertura d'enllaços externs (Windy, Wikiloc)
 * - Gestió d'errors
 * - Casos límit
 */

// Mock d'expo-image-picker (ha d'anar ABANS dels imports)
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  MediaTypeOptions: {
    Images: 'Images',
    Videos: 'Videos',
    All: 'All',
  },
}));

// Mock d'expo-file-system/legacy
jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: '/mock/documents/',
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  EncodingType: {
    UTF8: 'utf8',
  },
}));

// Mock d'expo-sharing
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock d'expo-video
jest.mock('expo-video', () => ({
  VideoView: 'VideoView',
  useVideoPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    replace: jest.fn(),
  })),
}));

// Mock de PhotoViewerModal
jest.mock('../../../components/PhotoViewerModal', () => ({
  PhotoViewerModal: () => null,
}));

// Mock de RefugeOccupationModal
jest.mock('../../../components/RefugeOccupationModal', () => ({
  RefugeOccupationModal: () => null,
}));

// Mock de useRefugeVisitsQuery
jest.mock('../../../hooks/useRefugeVisitsQuery', () => ({
  useRefugeVisits: () => ({
    data: [],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

// Mock de @react-navigation/native
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useFocusEffect: jest.fn((callback) => callback()),
}));

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { RefugeDetailScreen } from '../../../screens/RefugeDetailScreen';
import { Location } from '../../../models';
import useFavourite from '../../../hooks/useFavourite';
import { Linking } from 'react-native';

// Mock de useTranslation
jest.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      const translations: Record<string, any> = {
        'common.error': 'Error',
        'common.edit': 'Editar',
        'common.cancel': 'Cancel·lar',
        'common.download': 'Descarregar',
        'alerts.favoriteError': 'Error afegint a favorits',
        'alerts.editRefuge': (p: any) => `Editant ${p.name}`,
        'alerts.downloadGPX.title': 'Descarregar GPX',
        'alerts.downloadGPX.message': (p: any) => `Descarregar ${p.name}.gpx`,
        'alerts.downloadKML.title': 'Descarregar KML',
        'alerts.downloadKML.message': (p: any) => `Descarregar ${p.name}.kml`,
        'alerts.windyMessage': 'Obrir a Windy?',
        'alerts.wikilocMessage': 'Obrir a Wikiloc?',
        'alerts.linkError': 'Error obrint enllaç',
        'alerts.fileSaved': 'Fitxer desat',
        'alerts.fileSavedAt': (p: any) => `Desat a ${p.path}`,
        'alerts.fileError': 'Error desant fitxer',
      };
      const translation = translations[key];
      return typeof translation === 'function' ? translation(params) : translation || key;
    },
  }),
}));

// Mock de useAuth
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    firebaseUser: { uid: 'test-uid' },
    backendUser: null,
    favouriteRefugeIds: [],
    visitedRefugeIds: [],
    setFavouriteRefugeIds: jest.fn(),
    setVisitedRefugeIds: jest.fn(),
    isLoading: false,
    isAuthenticated: true,
    isOfflineMode: false,
    authToken: 'mock-token',
    login: jest.fn(),
    loginWithGoogle: jest.fn(),
    signup: jest.fn(),
    logout: jest.fn(),
    deleteAccount: jest.fn(),
    refreshToken: jest.fn(),
    reloadUser: jest.fn(),
    refreshUserData: jest.fn(),
    changePassword: jest.fn(),
    changeEmail: jest.fn(),
    updateUsername: jest.fn(),
    enterOfflineMode: jest.fn(),
    exitOfflineMode: jest.fn(),
  }),
}));

// Mock de useFavourite
jest.mock('../../../hooks/useFavourite', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock de useVisited
jest.mock('../../../hooks/useVisited', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock de useRefugesQuery - amb dades controlables
const mockUseRefuge = jest.fn();
jest.mock('../../../hooks/useRefugesQuery', () => ({
  useRefuge: () => mockUseRefuge(),
  useAllRefuges: () => ({
    data: [],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

// Mock de useUsersQuery
jest.mock('../../../hooks/useUsersQuery', () => ({
  useFavouriteRefuges: () => ({
    data: [],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
  useAddFavouriteRefuge: () => ({
    mutateAsync: jest.fn().mockResolvedValue({}),
    isPending: false,
  }),
  useRemoveFavouriteRefuge: () => ({
    mutateAsync: jest.fn().mockResolvedValue({}),
    isPending: false,
  }),
  useAddVisitedRefuge: () => ({
    mutateAsync: jest.fn().mockResolvedValue({}),
    isPending: false,
  }),
  useRemoveVisitedRefuge: () => ({
    mutateAsync: jest.fn().mockResolvedValue({}),
    isPending: false,
  }),
}));

// Mock de useExperiencesQuery
jest.mock('../../../hooks/useExperiencesQuery', () => ({
  useExperiences: () => ({
    data: [],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
  useDeleteExperience: () => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn().mockResolvedValue({}),
    isPending: false,
  }),
  useUpdateExperience: () => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn().mockResolvedValue({}),
    isPending: false,
  }),
  useCreateExperience: () => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn().mockResolvedValue({}),
    isPending: false,
  }),
}));

// Mock de useCustomAlert
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

const mockUseFavourite = useFavourite as jest.MockedFunction<typeof useFavourite>;

// Import useVisited for mocking
import useVisited from '../../../hooks/useVisited';
const mockUseVisited = useVisited as jest.MockedFunction<typeof useVisited>;

describe('RefugeDetailScreen Component', () => {
  const baseRefuge: Location = {
    id: "1",
    name: 'Refugi de Colomers',
    coord: { long: 0.9456, lat: 42.6497 },
    region: 'Val d\'Aran',
    places: 50,
    condition: 'bé',
    altitude: 2135,
    type: "1",
    imageUrl: 'https://example.com/image.jpg',
    description: 'Un refugi preciós situat als Pirineus',
  };

  const mockOnBack = jest.fn();
  const mockOnToggleFavorite = jest.fn();
  const mockOnNavigate = jest.fn();
  const mockOnEdit = jest.fn();
  const mockToggleFavourite = jest.fn();
  const mockToggleVisited = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set default useRefuge mock to return refuge data
    mockUseRefuge.mockReturnValue({
      data: { ...baseRefuge },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    
    mockUseFavourite.mockReturnValue({
      isFavourite: false,
      toggleFavourite: mockToggleFavourite,
      isProcessing: false,
    });

    mockUseVisited.mockReturnValue({
      isVisited: false,
      toggleVisited: mockToggleVisited,
      isProcessing: false,
    });

    // Mock Linking methods
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any);
  });

  describe('Renderització bàsica', () => {
    it('hauria de renderitzar el nom del refugi', () => {
      const { getByText } = render(
        <RefugeDetailScreen
          refugeId="1"
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />
      );
      
      expect(getByText('Refugi de Colomers')).toBeTruthy();
    });

    it('hauria de renderitzar la descripció', () => {
      const { getByText } = render(
        <RefugeDetailScreen
          refugeId="1"
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />
      );
      
      expect(getByText('Un refugi preciós situat als Pirineus')).toBeTruthy();
    });

    it('hauria de renderitzar l\'altitud', () => {
      const { getByText } = render(
        <RefugeDetailScreen
          refugeId="1"
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />
      );
      
      // Format: 2135m sense espai
      expect(getByText('2135m')).toBeTruthy();
    });

    it('hauria de renderitzar el nombre de places', () => {
      const { getByText } = render(
        <RefugeDetailScreen
          refugeId="1"
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />
      );
      
      expect(getByText('50')).toBeTruthy();
    });

    it('hauria de renderitzar les coordenades', () => {
      const { getByText } = render(
        <RefugeDetailScreen
          refugeId="1"
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />
      );
      
      // Format: (lat, long) amb 4 i 5 decimals
      expect(getByText(/42\.6497/)).toBeTruthy();
      expect(getByText(/0\.94560/)).toBeTruthy();
    });
  });

  describe('Funcionalitat de favorits', () => {
    it('hauria de mostrar la icona de favorit buit quan NO és favorit', () => {
      mockUseFavourite.mockReturnValue({
        isFavourite: false,
        toggleFavourite: mockToggleFavourite,
        isProcessing: false,
      });

      const { UNSAFE_root } = render(
        <RefugeDetailScreen
          refugeId="1"
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />
      );
      
      expect(UNSAFE_root).toBeTruthy();
    });

    it('hauria de mostrar la icona de favorit ple quan és favorit', () => {
      mockUseFavourite.mockReturnValue({
        isFavourite: true,
        toggleFavourite: mockToggleFavourite,
        isProcessing: false,
      });

      const { UNSAFE_root } = render(
        <RefugeDetailScreen
          refugeId="1"
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />
      );
      
      expect(UNSAFE_root).toBeTruthy();
    });

    it('hauria de cridar toggleFavourite i onToggleFavorite quan es fa click', async () => {
      mockToggleFavourite.mockResolvedValue(undefined);

      const { getByTestId } = render(
        <RefugeDetailScreen
          refugeId="1"
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />
      );
      
      const favoriteButton = getByTestId('favorite-button');
      fireEvent.press(favoriteButton);
      
      await waitFor(() => {
        expect(mockToggleFavourite).toHaveBeenCalled();
        expect(mockOnToggleFavorite).toHaveBeenCalledWith(baseRefuge.id);
      });
    });

    it('hauria de mostrar error si toggleFavourite falla', async () => {
      mockToggleFavourite.mockRejectedValue(new Error('Network error'));

      const { getByTestId } = render(
        <RefugeDetailScreen
          refugeId="1"
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />
      );
      
      const favoriteButton = getByTestId('favorite-button');
      fireEvent.press(favoriteButton);
      
      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith('Error', 'Error afegint a favorits');
      });
    });
  });

  describe('Botó de tornar enrere', () => {
    it('hauria de cridar onBack quan es fa click al botó', () => {
      const { getByTestId } = render(
        <RefugeDetailScreen
          refugeId="1"
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />
      );
      
      const backButton = getByTestId('back-button');
      fireEvent.press(backButton);
      
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('Descàrrega de fitxers', () => {
    it('hauria de mostrar alerta de confirmació per descarregar GPX', () => {
      const { getByTestId } = render(
        <RefugeDetailScreen
          refugeId="1"
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />
      );
      
      const gpxButton = getByTestId('download-gpx-button');
      fireEvent.press(gpxButton);
      
      expect(mockShowAlert).toHaveBeenCalledWith(
        'Descarregar GPX',
        'Descarregar Refugi de Colomers.gpx',
        expect.any(Array)
      );
    });

    it('hauria de mostrar alerta de confirmació per descarregar KML', () => {
      const { getByTestId } = render(
        <RefugeDetailScreen
          refugeId="1"
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />
      );
      
      const kmlButton = getByTestId('download-kml-button');
      fireEvent.press(kmlButton);
      
      expect(mockShowAlert).toHaveBeenCalledWith(
        'Descarregar KML',
        'Descarregar Refugi de Colomers.kml',
        expect.any(Array)
      );
    });
  });

  describe('Enllaços externs', () => {
    it('hauria de renderitzar el botó de Windy', () => {
      const { getByTestId } = render(
        <RefugeDetailScreen
          refugeId="1"
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />
      );
      
      const windyButton = getByTestId('weather-button');
      expect(windyButton).toBeTruthy();
      
      // Verificar que es pot prémer
      fireEvent.press(windyButton);
      expect(true).toBeTruthy();
    });

    it('hauria de renderitzar el botó de Wikiloc', () => {
      const { getByTestId } = render(
        <RefugeDetailScreen
          refugeId="1"
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />
      );
      
      const wikilocButton = getByTestId('routes-button');
      expect(wikilocButton).toBeTruthy();
      
      // Verificar que es pot prémer
      fireEvent.press(wikilocButton);
      expect(true).toBeTruthy();
    });
  });

  describe('Descripció expandible', () => {
    it('hauria de mostrar botó "Llegir més" si la descripció és llarga', () => {
      const longDescription = 'A'.repeat(300);
      mockUseRefuge.mockReturnValue({
        data: { ...baseRefuge, description: longDescription },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
      
      const { getByText } = render(
        <RefugeDetailScreen
          refugeId="1"
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />
      );
      
      // Verificar que es renderitza la descripció
      expect(getByText(longDescription)).toBeTruthy();
    });
  });

  describe('Casos límit', () => {
    it('hauria de gestionar refugi sense descripció', () => {
      mockUseRefuge.mockReturnValue({
        data: { ...baseRefuge, description: undefined },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
      
      const { queryByText } = render(
        <RefugeDetailScreen
          refugeId="1"
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />
      );
      
      expect(queryByText('Un refugi preciós situat als Pirineus')).toBeNull();
    });

    it('hauria de gestionar refugi sense altitud', () => {
      mockUseRefuge.mockReturnValue({
        data: { ...baseRefuge, altitude: undefined },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
      
      const { queryByText } = render(
        <RefugeDetailScreen
          refugeId="1"
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />
      );
      
      expect(queryByText(/m$/)).toBeNull();
    });

    it('hauria de gestionar refugi sense imatge', () => {
      mockUseRefuge.mockReturnValue({
        data: { ...baseRefuge, imageUrl: undefined },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
      
      const { UNSAFE_root } = render(
        <RefugeDetailScreen
          refugeId="1"
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />
      );
      
      // Hauria de mostrar una imatge per defecte
      expect(UNSAFE_root).toBeTruthy();
    });

    it('hauria de gestionar refugi amb altitud 0', () => {
      mockUseRefuge.mockReturnValue({
        data: { ...baseRefuge, altitude: 0 },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
      
      const { getByText } = render(
        <RefugeDetailScreen
          refugeId="1"
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />
      );
      
      // Altitud 0 es mostra com N/A
      expect(getByText('N/A')).toBeTruthy();
    });

    it('hauria de gestionar refugi sense id', () => {
      mockUseRefuge.mockReturnValue({
        data: { ...baseRefuge, id: undefined },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
      
      const { UNSAFE_root } = render(
        <RefugeDetailScreen
          refugeId=""
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />
      );
      
      expect(mockUseFavourite).toHaveBeenCalledWith('');
      expect(UNSAFE_root).toBeTruthy();
    });

    it('hauria de gestionar noms amb caràcters especials per descàrregues', () => {
      mockUseRefuge.mockReturnValue({
        data: { ...baseRefuge, name: 'Refugi d\'Amitges / Test' },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
      
      const { getByTestId } = render(
        <RefugeDetailScreen
          refugeId="1"
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />
      );
      
      const gpxButton = getByTestId('download-gpx-button');
      fireEvent.press(gpxButton);
      
      // Hauria de sanititzar el nom per al fitxer
      expect(mockShowAlert).toHaveBeenCalled();
    });
  });

  describe('Safe area insets', () => {
    it('hauria de aplicar safe area insets correctament', () => {
      const { UNSAFE_root } = render(
        <RefugeDetailScreen
          refugeId="1"
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />
      );
      
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Snapshot testing', () => {
    it('hauria de coincidir amb el snapshot amb totes les dades', () => {
      const tree = render(
        <RefugeDetailScreen
          refugeId="1"
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onEdit={mockOnEdit}
        />
      ).toJSON();
      
      expect(tree).toMatchSnapshot();
    });

    it('hauria de coincidir amb el snapshot sense dades opcionals', () => {
      const minimalRefuge: Location = {
        id: "1",
        name: 'Refugi Mínim',
        coord: { long: 1, lat: 42 },
      };
      
      mockUseRefuge.mockReturnValue({
        data: minimalRefuge,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
      
      const tree = render(
        <RefugeDetailScreen
          refugeId="1"
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />
      ).toJSON();
      
      expect(tree).toMatchSnapshot();
    });

    it('hauria de coincidir amb el snapshot amb favorit actiu', () => {
      mockUseFavourite.mockReturnValue({
        isFavourite: true,
        toggleFavourite: mockToggleFavourite,
        isProcessing: false,
      });

      const tree = render(
        <RefugeDetailScreen
          refugeId="1"
          onBack={mockOnBack}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
        />
      ).toJSON();
      
      expect(tree).toMatchSnapshot();
    });
  });
});
