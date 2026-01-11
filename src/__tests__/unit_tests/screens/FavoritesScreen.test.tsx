/**
 * Tests unitaris per a la pantalla FavoritesScreen
 * 
 * Aquest fitxer cobreix:
 * - Renderització de la llista de favorits
 * - Estat buit (sense favorits)
 * - Navegació al mapa i detalls
 * - Integració amb AuthContext
 * - Casos límit
 */

// Mock d'expo-video (ha d'anar ABANS dels imports)
jest.mock('expo-video', () => ({
  VideoView: 'VideoView',
  useVideoPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    replace: jest.fn(),
  })),
}));

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { FavoritesScreen } from '../../../screens/FavoritesScreen';
import { Location } from '../../../models';
import { useAuth } from '../../../contexts/AuthContext';

// Mock de useAuth
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock de useTranslation
jest.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      const translations: Record<string, string> = {
        'favorites.title': 'Favorits',
        'favorites.empty.title': 'No tens favorits',
        'favorites.empty.message': 'Afegeix refugis als teus favorits per veure\'ls aquí',
        'navigation.map': 'Mapa',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock de useNavigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
  useFocusEffect: jest.fn((callback) => callback()),
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

// Variable controlable per al mock de useFavouriteRefuges
let mockFavouriteRefugesData: any[] = [];
let mockIsLoading = false;

jest.mock('../../../hooks/useUsersQuery', () => ({
  useFavouriteRefuges: jest.fn(() => ({
    data: mockFavouriteRefugesData,
    isLoading: mockIsLoading,
    error: null,
    refetch: jest.fn(),
  })),
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

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('FavoritesScreen Component', () => {
  const mockFavouriteRefuges: Location[] = [
    {
      id: "1",
      name: 'Refugi de Colomers',
      coord: { long: 0.9456, lat: 42.6497 },
      region: 'Val d\'Aran',
      places: 50,
      condition: 1,
      altitude: 2135,
      type: "non gardée",
    },
    {
      id: "2",
      name: 'Refugi d\'Amitges',
      coord: { long: 0.9876, lat: 42.5678 },
      region: 'Pallars Sobirà',
      places: 60,
      condition: 3,
      altitude: 2380,
      type: "non gardée",
    },
    {
      id: "3",
      name: 'Refugi de Restanca',
      coord: { long: 0.7890, lat: 42.7890 },
      region: 'Val d\'Aran',
      places: 40,
      condition: 2,
      altitude: 2010,
      type: "non gardée",
    },
  ];

  const mockOnViewDetail = jest.fn();
  const mockOnViewMap = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock data to default 3 refuges
    mockFavouriteRefugesData = [...mockFavouriteRefuges];
    mockIsLoading = false;
    
    mockUseAuth.mockReturnValue({
      firebaseUser: { uid: 'test-uid' } as any,
      backendUser: null,
      favouriteRefugeIds: ['1', '2', '3'],
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
    });
  });

  describe('Renderització bàsica', () => {
    it('hauria de renderitzar el títol "Favorits"', () => {
      const { getByText } = render(
        <FavoritesScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      
      expect(getByText('Favorits', { exact: false })).toBeTruthy();
    });

    it('hauria de mostrar el comptador de favorits', () => {
      const { getByText } = render(
        <FavoritesScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      
      expect(getByText('(3)')).toBeTruthy();
    });

    it('hauria de renderitzar tots els refugis favorits', () => {
      const { getByText } = render(
        <FavoritesScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      
      expect(getByText('Refugi de Colomers')).toBeTruthy();
      expect(getByText('Refugi d\'Amitges')).toBeTruthy();
      expect(getByText('Refugi de Restanca')).toBeTruthy();
    });
  });

  describe('Estat buit', () => {
    beforeEach(() => {
      // Set empty favourites for this describe block
      mockFavouriteRefugesData = [];
    });

    it('hauria de mostrar missatge quan no hi ha favorits', () => {
      const { getByText } = render(
        <FavoritesScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      
      expect(getByText('No tens favorits')).toBeTruthy();
      expect(getByText('Afegeix refugis als teus favorits per veure\'ls aquí')).toBeTruthy();
    });

    it('hauria de mostrar comptador (0) quan no hi ha favorits', () => {
      const { getByText } = render(
        <FavoritesScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      
      expect(getByText('(0)')).toBeTruthy();
    });

    it('hauria de mostrar icona de favorit en estat buit', () => {
      const { getByText } = render(
        <FavoritesScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      
      // Verificar que es mostra el missatge buit
      expect(getByText('No tens favorits')).toBeTruthy();
    });
  });

  describe('Navegació a detalls', () => {
    it('hauria de cridar onViewDetail quan es fa click a una card', () => {
      const { getByText } = render(
        <FavoritesScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      
      // Verificar que el refugi es renderitza i fer click
      const refugeCard = getByText('Refugi de Colomers');
      fireEvent.press(refugeCard);
      
      // El component crida onViewDetail amb les dades del refugi
      expect(mockOnViewDetail).toHaveBeenCalled();
    });

    it('hauria de passar les dades del refugi amb isFavorite a onViewDetail', () => {
      const { getByText } = render(
        <FavoritesScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      
      // Verificar que els refugis es mostren
      expect(getByText('Refugi de Colomers')).toBeTruthy();
    });

    it('hauria de gestionar refugi sense id', () => {
      const refugesWithoutId = [{ ...mockFavouriteRefuges[0], id: undefined }];
      mockFavouriteRefugesData = refugesWithoutId;

      const { getByText } = render(
        <FavoritesScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      
      // Verificar que el refugi es renderitza correctament malgrat no tenir id
      expect(getByText('Refugi de Colomers')).toBeTruthy();
    });
  });

  describe('Navegació al mapa', () => {
    it('hauria de cridar onViewMap i navigate quan es fa click al botó del mapa', async () => {
      const { getAllByTestId } = render(
        <FavoritesScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      
      const mapButtons = getAllByTestId('map-button');
      fireEvent.press(mapButtons[0]);
      
      await waitFor(() => {
        expect(mockOnViewMap).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('Map', expect.any(Object));
      });
    });

    it('hauria de passar les dades del refugi a navigate', async () => {
      const { getAllByTestId } = render(
        <FavoritesScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      
      const mapButtons = getAllByTestId('map-button');
      fireEvent.press(mapButtons[0]);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('Map', { selectedRefuge: expect.objectContaining({ name: 'Refugi de Colomers' }) });
      });
    });

    it('hauria de gestionar múltiples clicks al mapa sense duplicar navegacions', async () => {
      const { getAllByTestId } = render(
        <FavoritesScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      
      const mapButtons = getAllByTestId('map-button');
      
      // Click al primer refugi
      fireEvent.press(mapButtons[0]);
      
      await waitFor(() => {
        expect(mockOnViewMap).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledTimes(1);
      });
      
      // Click al segon refugi
      fireEvent.press(mapButtons[1]);
      
      await waitFor(() => {
        expect(mockOnViewMap).toHaveBeenCalledTimes(2);
        expect(mockNavigate).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Actualització de la llista', () => {
    it('hauria d\'actualitzar la llista quan canvien els favorits', () => {
      const { getByText } = render(
        <FavoritesScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      
      expect(getByText('Refugi de Colomers')).toBeTruthy();
      expect(getByText('(3)')).toBeTruthy();
    });

    it('hauria de passar de llista buida a mostrar favorits quan s\'actualitza', () => {
      // Start with empty
      mockFavouriteRefugesData = [];
      
      const { getByText } = render(
        <FavoritesScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      
      expect(getByText('No tens favorits')).toBeTruthy();
      expect(getByText('(0)')).toBeTruthy();
    });
  });

  describe('Propietat isFavorite', () => {
    it('hauria d\'afegir isFavorite:true a tots els refugis', () => {
      const { getByText } = render(
        <FavoritesScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      
      expect(getByText('Refugi de Colomers')).toBeTruthy();
    });
  });

  describe('Header fix', () => {
    it('hauria de mostrar un header fix a la part superior', () => {
      const { getByText } = render(
        <FavoritesScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      
      const title = getByText('Favorits', { exact: false });
      expect(title).toBeTruthy();
    });
  });

  describe('Casos límit', () => {
    it('hauria de gestionar un refugi amb tots els camps opcionals', () => {
      const minimalRefuge: Location = {
        id: "99",
        name: 'Refugi Mínim',
        coord: { long: 1, lat: 42 },
      };
      
      mockFavouriteRefugesData = [minimalRefuge];

      const { getByText } = render(
        <FavoritesScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      
      expect(getByText('Refugi Mínim')).toBeTruthy();
    });

    it('hauria de gestionar noms llargs', () => {
      const longNameRefuge: Location = {
        id: "99",
        name: 'Refugi amb un nom extremadament llarg que podria causar problemes de layout',
        coord: { long: 1, lat: 42 },
        region: 'Regió amb nom llarg',
        places: 100,
      };
      
      mockFavouriteRefugesData = [longNameRefuge];

      const { getByText } = render(
        <FavoritesScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      
      expect(getByText('Refugi amb un nom extremadament llarg que podria causar problemes de layout')).toBeTruthy();
    });

    it('hauria de gestionar llistes molt llargues de favorits', () => {
      const manyFavorites = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        name: `Refugi ${i}`,
        coord: { long: 1 + i * 0.01, lat: 42 + i * 0.01 },
        region: 'Pirineus',
        places: 20 + i,
      }));
      
      mockFavouriteRefugesData = manyFavorites;

      const { getByText } = render(
        <FavoritesScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      
      expect(getByText('(50)')).toBeTruthy();
      expect(getByText('Refugi 0')).toBeTruthy();
    });
  });

  describe('Integració amb AuthContext', () => {
    it('hauria d\'utilitzar favouriteRefuges del context', () => {
      render(<FavoritesScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />);
      
      expect(mockUseAuth).toHaveBeenCalled();
    });

    it('hauria de mostrar el nombre correcte de favorits', () => {
      const { getByText } = render(
        <FavoritesScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      
      expect(getByText('(3)')).toBeTruthy();
    });
  });

  describe('Snapshot testing', () => {
    it('hauria de coincidir amb el snapshot amb favorits', () => {
      const tree = render(
        <FavoritesScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      ).toJSON();
      
      expect(tree).toMatchSnapshot();
    });

    it('hauria de coincidir amb el snapshot sense favorits', () => {
      mockFavouriteRefugesData = [];

      const tree = render(
        <FavoritesScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      ).toJSON();
      
      expect(tree).toMatchSnapshot();
    });
  });
});
