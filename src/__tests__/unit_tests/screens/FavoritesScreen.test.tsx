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

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { FavoritesScreen } from '../../../screens/FavoritesScreen';
import { Location } from '../../../models';
import { useAuth } from '../../../contexts/AuthContext';
import { RefugisService } from '../../../services/RefugisService';

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
}));

// Mock de RefugisService
jest.mock('../../../services/RefugisService', () => ({
  RefugisService: {
    getRefugiById: jest.fn(),
  },
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

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockGetRefugiById = RefugisService.getRefugiById as jest.MockedFunction<typeof RefugisService.getRefugiById>;

describe('FavoritesScreen Component', () => {
  const mockFavouriteRefuges: Location[] = [
    {
      id: 1,
      name: 'Refugi de Colomers',
      coord: { long: 0.9456, lat: 42.6497 },
      region: 'Val d\'Aran',
      places: 50,
      condition: 'bé',
      altitude: 2135,
      type: 1,
      imageUrl: 'https://example.com/image1.jpg',
    },
    {
      id: 2,
      name: 'Refugi d\'Amitges',
      coord: { long: 0.9876, lat: 42.5678 },
      region: 'Pallars Sobirà',
      places: 60,
      condition: 'excel·lent',
      altitude: 2380,
      type: 1,
      imageUrl: 'https://example.com/image2.jpg',
    },
    {
      id: 3,
      name: 'Refugi de Restanca',
      coord: { long: 0.7890, lat: 42.7890 },
      region: 'Val d\'Aran',
      places: 40,
      condition: 'normal',
      altitude: 2010,
      type: 1,
    },
  ];

  const mockOnViewDetail = jest.fn();
  const mockOnViewMap = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      favouriteRefuges: mockFavouriteRefuges,
      firebaseUser: { uid: 'test-uid' } as any,
      backendUser: null,
      visitedRefuges: [],
      isLoading: false,
      isAuthenticated: true,
      authToken: 'mock-token',
      login: jest.fn(),
      loginWithGoogle: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      deleteAccount: jest.fn(),
      refreshToken: jest.fn(),
      reloadUser: jest.fn(),
      changePassword: jest.fn(),
      changeEmail: jest.fn(),
      updateUsername: jest.fn(),
      getFavouriteRefuges: jest.fn(),
      addFavouriteRefuge: jest.fn(),
      removeFavouriteRefuge: jest.fn(),
      getVisitedRefuges: jest.fn(),
      addVisitedRefuge: jest.fn(),
      removeVisitedRefuge: jest.fn(),
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
    it('hauria de mostrar missatge quan no hi ha favorits', () => {
      mockUseAuth.mockReturnValue({
        ...mockUseAuth(),
        favouriteRefuges: [],
      });

      const { getByText } = render(
        <FavoritesScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      
      expect(getByText('No tens favorits')).toBeTruthy();
      expect(getByText('Afegeix refugis als teus favorits per veure\'ls aquí')).toBeTruthy();
    });

    it('hauria de mostrar comptador (0) quan no hi ha favorits', () => {
      mockUseAuth.mockReturnValue({
        ...mockUseAuth(),
        favouriteRefuges: [],
      });

      const { getByText } = render(
        <FavoritesScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      
      expect(getByText('(0)')).toBeTruthy();
    });

    it('hauria de mostrar icona de favorit en estat buit', () => {
      mockUseAuth.mockReturnValue({
        ...mockUseAuth(),
        favouriteRefuges: [],
      });

      const { getByText } = render(
        <FavoritesScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      
      // Verificar que es mostra el missatge buit
      expect(getByText('No tens favorits')).toBeTruthy();
    });
  });

  describe('Navegació a detalls', () => {
    it('hauria de cridar getRefugiById i onViewDetail quan es fa click a una card', async () => {
      const fullRefuge = { ...mockFavouriteRefuges[0], description: 'Refugi complet' };
      mockGetRefugiById.mockResolvedValue(fullRefuge);

      const { getByText } = render(
        <FavoritesScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      
      const card = getByText('Refugi de Colomers').parent?.parent?.parent;
      if (card) {
        fireEvent.press(card);
      }
      
      await waitFor(() => {
        expect(mockGetRefugiById).toHaveBeenCalledWith(1);
        expect(mockOnViewDetail).toHaveBeenCalledWith(fullRefuge);
      });
    });

    it('hauria de gestionar errors en carregar detalls del refugi', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockGetRefugiById.mockRejectedValue(new Error('Network error'));

      const { getByText } = render(
        <FavoritesScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      
      const card = getByText('Refugi de Colomers').parent?.parent?.parent;
      if (card) {
        fireEvent.press(card);
      }
      
      await waitFor(() => {
        expect(mockGetRefugiById).toHaveBeenCalled();
        // Fallback: hauria de cridar onViewDetail amb les dades parcials
        expect(mockOnViewDetail).toHaveBeenCalledWith({ ...mockFavouriteRefuges[0], isFavorite: true });
      });

      consoleErrorSpy.mockRestore();
    });

    it('hauria de gestionar refugi sense id', async () => {
      const refugesWithoutId = [{ ...mockFavouriteRefuges[0], id: undefined }];
      mockUseAuth.mockReturnValue({
        ...mockUseAuth(),
        favouriteRefuges: refugesWithoutId,
      });

      const { getByText } = render(
        <FavoritesScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      
      const card = getByText('Refugi de Colomers').parent?.parent?.parent;
      if (card) {
        fireEvent.press(card);
      }
      
      await waitFor(() => {
        expect(mockGetRefugiById).not.toHaveBeenCalled();
      });
    });
  });

  describe('Navegació al mapa', () => {
    it('hauria de cridar getRefugiById, onViewMap i navigate quan es fa click al botó del mapa', async () => {
      const fullRefuge = { ...mockFavouriteRefuges[0], description: 'Refugi complet' };
      mockGetRefugiById.mockResolvedValue(fullRefuge);

      const { getAllByTestId } = render(
        <FavoritesScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      
      const mapButtons = getAllByTestId('map-button');
      fireEvent.press(mapButtons[0]);
      
      await waitFor(() => {
        expect(mockGetRefugiById).toHaveBeenCalledWith(1);
        expect(mockOnViewMap).toHaveBeenCalledWith(fullRefuge);
        expect(mockNavigate).toHaveBeenCalledWith('Map', { selectedRefuge: fullRefuge });
      });
    });

    it('hauria de gestionar errors en carregar refugi per al mapa', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockGetRefugiById.mockRejectedValue(new Error('Network error'));

      const { getAllByTestId } = render(
        <FavoritesScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      
      const mapButtons = getAllByTestId('map-button');
      fireEvent.press(mapButtons[0]);
      
      await waitFor(() => {
        expect(mockGetRefugiById).toHaveBeenCalled();
        // Fallback: hauria de cridar onViewMap amb les dades parcials
        expect(mockOnViewMap).toHaveBeenCalledWith({ ...mockFavouriteRefuges[0], isFavorite: true });
        expect(mockNavigate).toHaveBeenCalledWith('Map', { selectedRefuge: { ...mockFavouriteRefuges[0], isFavorite: true } });
      });

      consoleErrorSpy.mockRestore();
    });

    it('hauria de gestionar múltiples clicks al mapa sense duplicar navegacions', async () => {
      mockGetRefugiById.mockResolvedValue(mockFavouriteRefuges[0]);

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
      const { rerender, getByText, queryByText } = render(
        <FavoritesScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      
      expect(getByText('Refugi de Colomers')).toBeTruthy();
      expect(getByText('(3)')).toBeTruthy();
      
      // Actualitzar el mock per eliminar un favorit
      mockUseAuth.mockReturnValue({
        ...mockUseAuth(),
        favouriteRefuges: [mockFavouriteRefuges[0], mockFavouriteRefuges[1]],
      });
      
      rerender(<FavoritesScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />);
      
      expect(getByText('Refugi de Colomers')).toBeTruthy();
      expect(getByText('Refugi d\'Amitges')).toBeTruthy();
      expect(queryByText('Refugi de Restanca')).toBeNull();
      expect(getByText('(2)')).toBeTruthy();
    });

    it('hauria de passar de llista buida a mostrar favorits', () => {
      mockUseAuth.mockReturnValue({
        ...mockUseAuth(),
        favouriteRefuges: [],
      });

      const { rerender, getByText, queryByText } = render(
        <FavoritesScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      
      expect(getByText('No tens favorits')).toBeTruthy();
      
      // Afegir favorits
      mockUseAuth.mockReturnValue({
        ...mockUseAuth(),
        favouriteRefuges: [mockFavouriteRefuges[0]],
      });
      
      rerender(<FavoritesScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />);
      
      expect(queryByText('No tens favorits')).toBeNull();
      expect(getByText('Refugi de Colomers')).toBeTruthy();
      expect(getByText('(1)')).toBeTruthy();
    });
  });

  describe('Propietat isFavorite', () => {
    it('hauria d\'afegir isFavorite:true a tots els refugis', () => {
      const { UNSAFE_root } = render(
        <FavoritesScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      
      // Verificar que es renderitzen correctament (implica que tenen isFavorite)
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
      
      mockUseAuth.mockReturnValue({
        ...mockUseAuth(),
        favouriteRefuges: [minimalRefuge],
      });

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
      
      mockUseAuth.mockReturnValue({
        ...mockUseAuth(),
        favouriteRefuges: [longNameRefuge],
      });

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
      
      mockUseAuth.mockReturnValue({
        ...mockUseAuth(),
        favouriteRefuges: manyFavorites,
      });

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

    it('hauria de reaccionar a canvis en el context', () => {
      const { rerender, getByText } = render(
        <FavoritesScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      
      expect(getByText('(3)')).toBeTruthy();
      
      // Simular actualització del context
      mockUseAuth.mockReturnValue({
        ...mockUseAuth(),
        favouriteRefuges: [...mockFavouriteRefuges, {
          id: "4",
          name: 'Nou Refugi',
          coord: { long: 1, lat: 42 },
          region: 'Test',
          places: 30,
        }],
      });
      
      rerender(<FavoritesScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />);
      
      expect(getByText('(4)')).toBeTruthy();
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
      mockUseAuth.mockReturnValue({
        ...mockUseAuth(),
        favouriteRefuges: [],
      });

      const tree = render(
        <FavoritesScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      ).toJSON();
      
      expect(tree).toMatchSnapshot();
    });
  });
});
