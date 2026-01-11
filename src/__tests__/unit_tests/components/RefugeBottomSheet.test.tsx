/**
 * Tests unitaris per al component RefugeBottomSheet
 * 
 * Aquest fitxer cobreix:
 * - Renderització bàsica i visibilitat
 * - Informació del refugi mostrada
 * - Funcionalitat de favorits
 * - Gestió de clicks (tanca, navegació, detalls)
 * - Casos límit
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { RefugeBottomSheet } from '../../../components/RefugeBottomSheet';
import useFavourite from '../../../hooks/useFavourite';

// Mock de expo-video
jest.mock('expo-video', () => ({
  VideoView: 'VideoView',
  useVideoPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
  })),
}));

// Base mock refuge data
const mockRefugeData = {
  id: '1',
  name: 'Refugi Test',
  coord: { long: 1.5, lat: 42.5 },
  region: 'Pirineus',
  places: 20,
  condition: 2,
  altitude: 2500,
  type: 'non gardé',
  images_metadata: [{ url: 'https://example.com/image.jpg' }],
};

// Mock de useRefugesQuery (useRefuge)
const mockUseRefuge = jest.fn();
jest.mock('../../../hooks/useRefugesQuery', () => ({
  useRefuge: (id: string) => mockUseRefuge(id),
}));

// Mock de useTranslation
jest.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'refuge.actions.viewDetails': 'Veure detalls',
        'refuge.actions.navigate': 'Navegar',
        'refuge.type.noGuarded': 'No vigilat',
        'refuge.condition.good': 'Bé',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock de useFavourite hook
jest.mock('../../../hooks/useFavourite', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockUseFavourite = useFavourite as jest.MockedFunction<typeof useFavourite>;

describe('RefugeBottomSheet Component', () => {
  const mockOnClose = jest.fn();
  const mockOnToggleFavorite = jest.fn();
  const mockOnNavigate = jest.fn();
  const mockOnViewDetails = jest.fn();
  const mockToggleFavourite = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default successful data load
    mockUseRefuge.mockReturnValue({
      data: mockRefugeData,
      isLoading: false,
      error: null,
    });
    
    mockUseFavourite.mockReturnValue({
      isFavourite: false,
      toggleFavourite: mockToggleFavourite,
      isProcessing: false,
    });
  });

  describe('Visibilitat', () => {
    it('NO hauria de renderitzar-se quan isVisible és false', () => {
      const { queryByTestId } = render(
        <RefugeBottomSheet
          refugeId="1"
          isVisible={false}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />
      );
      
      expect(queryByTestId('bottom-sheet')).toBeNull();
    });

    it('hauria de renderitzar-se quan isVisible és true', () => {
      const { getByTestId } = render(
        <RefugeBottomSheet
          refugeId="1"
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />
      );
      
      expect(getByTestId('bottom-sheet')).toBeTruthy();
    });

    it('NO hauria de renderitzar-se quan isLoading és true', () => {
      mockUseRefuge.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      const { queryByTestId } = render(
        <RefugeBottomSheet
          refugeId="1"
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />
      );
      
      expect(queryByTestId('bottom-sheet')).toBeNull();
    });

    it('NO hauria de renderitzar-se quan no hi ha dades del refugi', () => {
      mockUseRefuge.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      const { queryByTestId } = render(
        <RefugeBottomSheet
          refugeId="1"
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />
      );
      
      expect(queryByTestId('bottom-sheet')).toBeNull();
    });
  });

  describe('Renderització d\'informació', () => {
    it('hauria de mostrar el nom del refugi', () => {
      const { getByText } = render(
        <RefugeBottomSheet
          refugeId="1"
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />
      );
      
      expect(getByText('Refugi Test')).toBeTruthy();
    });

    it('hauria de mostrar la regió', () => {
      const { getByText } = render(
        <RefugeBottomSheet
          refugeId="1"
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />
      );
      
      expect(getByText('Pirineus')).toBeTruthy();
    });

    it('hauria de mostrar l\'altitud', () => {
      const { getByText } = render(
        <RefugeBottomSheet
          refugeId="1"
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />
      );
      
      expect(getByText('2500 m')).toBeTruthy();
    });

    it('hauria de mostrar el nombre de places', () => {
      const { getByText } = render(
        <RefugeBottomSheet
          refugeId="1"
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />
      );
      
      expect(getByText('20')).toBeTruthy();
    });

    it('hauria de mostrar la imatge del refugi', () => {
      const { getByTestId } = render(
        <RefugeBottomSheet
          refugeId="1"
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />
      );
      
      expect(getByTestId('refuge-image')).toBeTruthy();
    });
  });

  describe('Gestió de clicks', () => {
    it('hauria de cridar onClose quan es fa click al backdrop', () => {
      const { getByTestId } = render(
        <RefugeBottomSheet
          refugeId="1"
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />
      );
      
      fireEvent.press(getByTestId('backdrop'));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('hauria de cridar onViewDetails quan es fa click al botó de detalls', () => {
      const { getByText } = render(
        <RefugeBottomSheet
          refugeId="1"
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />
      );
      
      fireEvent.press(getByText('Veure detalls'));
      expect(mockOnViewDetails).toHaveBeenCalledWith(mockRefugeData);
    });
  });

  describe('Funcionalitat de favorits', () => {
    it('hauria de cridar toggleFavourite quan es fa click al botó de favorit', async () => {
      const { getByTestId } = render(
        <RefugeBottomSheet
          refugeId="1"
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />
      );
      
      fireEvent.press(getByTestId('favorite-button'));
      
      await waitFor(() => {
        expect(mockToggleFavourite).toHaveBeenCalled();
      });
    });

    it('hauria de cridar onToggleFavorite després de toggleFavourite', async () => {
      mockToggleFavourite.mockResolvedValue(undefined);
      
      const { getByTestId } = render(
        <RefugeBottomSheet
          refugeId="1"
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />
      );
      
      fireEvent.press(getByTestId('favorite-button'));
      
      await waitFor(() => {
        expect(mockOnToggleFavorite).toHaveBeenCalledWith('1');
      });
    });

    it('hauria de tenir accessibilityState.selected=true quan és favorit', () => {
      mockUseFavourite.mockReturnValue({
        isFavourite: true,
        toggleFavourite: mockToggleFavourite,
        isProcessing: false,
      });

      const { getByTestId } = render(
        <RefugeBottomSheet
          refugeId="1"
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />
      );
      
      const favoriteButton = getByTestId('favorite-button');
      expect(favoriteButton.props.accessibilityState.selected).toBe(true);
    });

    it('hauria de cridar useFavourite amb el refugeId correcte', () => {
      render(
        <RefugeBottomSheet
          refugeId="123"
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />
      );
      
      expect(mockUseFavourite).toHaveBeenCalledWith('123');
    });
  });

  describe('Casos límit', () => {
    it('hauria de gestionar refugi sense imatges', () => {
      mockUseRefuge.mockReturnValue({
        data: { ...mockRefugeData, images_metadata: [] },
        isLoading: false,
        error: null,
      });

      const { getByTestId } = render(
        <RefugeBottomSheet
          refugeId="1"
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />
      );
      
      // Should render with default image
      expect(getByTestId('refuge-image')).toBeTruthy();
    });

    it('hauria de gestionar noms llargs correctament', () => {
      mockUseRefuge.mockReturnValue({
        data: { ...mockRefugeData, name: 'Refugi amb un nom molt molt molt llarg per provar' },
        isLoading: false,
        error: null,
      });

      const { getByText } = render(
        <RefugeBottomSheet
          refugeId="1"
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />
      );
      
      expect(getByText('Refugi amb un nom molt molt molt llarg per provar')).toBeTruthy();
    });

    it('hauria de gestionar altituds de 0 metres', () => {
      mockUseRefuge.mockReturnValue({
        data: { ...mockRefugeData, altitude: 0 },
        isLoading: false,
        error: null,
      });

      const { getByText } = render(
        <RefugeBottomSheet
          refugeId="1"
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />
      );
      
      expect(getByText('0 m')).toBeTruthy();
    });
  });

  describe('Snapshot testing', () => {
    it('hauria de coincidir amb el snapshot quan isVisible és false', () => {
      const tree = render(
        <RefugeBottomSheet
          refugeId="1"
          isVisible={false}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />
      ).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('hauria de coincidir amb el snapshot quan isVisible és true', () => {
      const tree = render(
        <RefugeBottomSheet
          refugeId="1"
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
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
        <RefugeBottomSheet
          refugeId="1"
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />
      ).toJSON();
      expect(tree).toMatchSnapshot();
    });
  });
});
