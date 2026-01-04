/**
 * Tests d'integració per al component RefugeBottomSheet
 * 
 * Cobertura:
 * - Renderització del bottom sheet amb informació del refugi
 * - Visualització de badges (tipus i condició)
 * - Botó de favorit
 * - Botó de veure detalls
 * - Gestió de visibilitat (isVisible)
 * - Tancament del bottom sheet
 * - Casos límit i camps opcionals
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

// Mock de useRefuge hook
const mockRefugeData = {
  id: '1',
  name: 'Refugi de Colomers',
  coord: { lat: 42.6531, long: 0.9858 },
  altitude: 2135,
  places: 16,
  type: 1,
  condition: 2,
  region: 'Pallars Sobirà',
  images_metadata: [{ url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800' }],
};

let mockUseRefugeReturn = {
  data: mockRefugeData,
  isLoading: false,
};

jest.mock('../../../hooks/useRefugesQuery', () => ({
  useRefuge: jest.fn(() => mockUseRefugeReturn),
}));

// Mock de useFavourite hook
const mockToggleFavourite = jest.fn();
let mockUseFavouriteReturn = {
  isFavourite: false,
  toggleFavourite: mockToggleFavourite,
  isProcessing: false,
};

jest.mock('../../../hooks/useFavourite', () => ({
  __esModule: true,
  default: jest.fn(() => mockUseFavouriteReturn),
}));

import React from 'react';
import { renderWithProviders, fireEvent, waitFor } from '../setup/testUtils';
import { RefugeBottomSheet } from '../../../components/RefugeBottomSheet';
import { Location } from '../../../models';

// Mock de les icones
jest.mock('../../../assets/icons/altitude.svg', () => 'AltitudeIcon');
jest.mock('../../../assets/icons/user.svg', () => 'CapacityIcon');
jest.mock('../../../assets/icons/region.svg', () => 'RegionIcon');
jest.mock('../../../assets/icons/favourite2.svg', () => 'FavouriteIcon');
jest.mock('../../../assets/icons/favRed.svg', () => 'FavouriteRedIcon');

// Mock dels components Badge
jest.mock('../../../components/BadgeType', () => ({
  BadgeType: ({ type }: any) => {
    const React = require('react');
    const { Text } = require('react-native');
    return <Text testID="badge-type">Type: {type}</Text>;
  },
}));

jest.mock('../../../components/BadgeCondition', () => ({
  BadgeCondition: ({ condition }: any) => {
    const React = require('react');
    const { Text } = require('react-native');
    return <Text testID="badge-condition">Condition: {condition}</Text>;
  },
}));

// Mock de useTranslation
jest.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'refuge.actions.viewDetails': 'Veure detalls',
        'refuge.actions.navigate': 'Com arribar',
      };
      return translations[key] || key;
    },
  }),
}));

describe('RefugeBottomSheet - Tests d\'integració', () => {
  const mockOnClose = jest.fn();
  const mockOnToggleFavorite = jest.fn();
  const mockOnNavigate = jest.fn();
  const mockOnViewDetails = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mocks to default values
    mockUseRefugeReturn = {
      data: mockRefugeData,
      isLoading: false,
    };
    mockUseFavouriteReturn = {
      isFavourite: false,
      toggleFavourite: mockToggleFavourite,
      isProcessing: false,
    };
  });

  describe('Renderització i visibilitat', () => {
    it('no hauria de renderitzar quan isVisible és false', () => {
      const { queryByText } = renderWithProviders(
        <RefugeBottomSheet
          refugeId="1"
          isVisible={false}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />,
        { withNavigation: false, mockAuthValue: { isAuthenticated: true } }
      );

      expect(queryByText('Refugi de Colomers')).toBeNull();
    });

    it('hauria de renderitzar quan isVisible és true', () => {
      const { getByText } = renderWithProviders(
        <RefugeBottomSheet
          refugeId="1"
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />,
        { withNavigation: false, mockAuthValue: { isAuthenticated: true } }
      );

      expect(getByText('Refugi de Colomers')).toBeTruthy();
    });

    it('hauria de mostrar la informació bàsica del refugi', () => {
      const { getByText } = renderWithProviders(
        <RefugeBottomSheet
          refugeId="1"
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />,
        { withNavigation: false, mockAuthValue: { isAuthenticated: true } }
      );

      expect(getByText('Refugi de Colomers')).toBeTruthy();
      expect(getByText(/2135 m/)).toBeTruthy();
      expect(getByText(/16/)).toBeTruthy();
      expect(getByText(/Pallars Sobirà/)).toBeTruthy();
    });
  });

  describe('Badges i tipus', () => {
    it('hauria de mostrar el badge de tipus', () => {
      const { getByTestId } = renderWithProviders(
        <RefugeBottomSheet
          refugeId="1"
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />,
        { withNavigation: false, mockAuthValue: { isAuthenticated: true } }
      );

      expect(getByTestId('badge-type')).toBeTruthy();
    });

    it('hauria de mostrar el badge de condició si existeix', () => {
      const { getByTestId } = renderWithProviders(
        <RefugeBottomSheet
          refugeId="1"
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />,
        { withNavigation: false, mockAuthValue: { isAuthenticated: true } }
      );

      expect(getByTestId('badge-condition')).toBeTruthy();
    });

    it('no hauria de mostrar el badge de condició si no existeix', () => {
      mockUseRefugeReturn = {
        data: { ...mockRefugeData, condition: undefined },
        isLoading: false,
      };

      const { queryByTestId } = renderWithProviders(
        <RefugeBottomSheet
          refugeId="1"
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />,
        { withNavigation: false, mockAuthValue: { isAuthenticated: true } }
      );

      expect(queryByTestId('badge-condition')).toBeNull();
    });
  });

  describe('Imatge del refugi', () => {
    it('hauria de mostrar la imatge del refugi', () => {
      const { getByTestId } = renderWithProviders(
        <RefugeBottomSheet
          refugeId="1"
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />,
        { withNavigation: false, mockAuthValue: { isAuthenticated: true } }
      );

      const image = getByTestId('refuge-image');
      expect(image).toBeTruthy();
      expect(image.props.source.uri).toBe(mockRefugeData.images_metadata[0].url);
    });

    it('hauria de mostrar una imatge per defecte si no hi ha images_metadata', () => {
      mockUseRefugeReturn = {
        data: { ...mockRefugeData, images_metadata: [] },
        isLoading: false,
      };

      const { getByTestId } = renderWithProviders(
        <RefugeBottomSheet
          refugeId="1"
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />,
        { withNavigation: false, mockAuthValue: { isAuthenticated: true } }
      );

      const image = getByTestId('refuge-image');
      expect(image).toBeTruthy();
      // Hauria de tenir una URL per defecte
      expect(image.props.source.uri).toContain('unsplash.com');
    });
  });

  describe('Interaccions', () => {
    it('hauria de cridar onClose quan es fa clic al backdrop', () => {
      const { getByTestId } = renderWithProviders(
        <RefugeBottomSheet
          refugeId="1"
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />,
        { withNavigation: false, mockAuthValue: { isAuthenticated: true } }
      );

      const backdrop = getByTestId('backdrop');
      fireEvent.press(backdrop);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('hauria de permetre pressionar el botó de favorit', async () => {
      const { getByTestId } = renderWithProviders(
        <RefugeBottomSheet
          refugeId="1"
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />,
        { withNavigation: false, mockAuthValue: { isAuthenticated: true } }
      );

      const favoriteButton = getByTestId('favorite-button');
      
      // Verificar que el botó existeix i es pot pressionar
      expect(favoriteButton).toBeTruthy();
      fireEvent.press(favoriteButton);
      
      await waitFor(() => {
        expect(mockToggleFavourite).toHaveBeenCalled();
      });
    });

    it('hauria de cridar onViewDetails quan es fa clic al botó de detalls', () => {
      const { getByText } = renderWithProviders(
        <RefugeBottomSheet
          refugeId="1"
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />,
        { withNavigation: false, mockAuthValue: { isAuthenticated: true } }
      );

      const detailsButton = getByText('Veure detalls');
      fireEvent.press(detailsButton);

      expect(mockOnViewDetails).toHaveBeenCalled();
    });
  });

  describe('Camps opcionals i casos límit', () => {
    it('hauria de gestionar altitud undefined', () => {
      mockUseRefugeReturn = {
        data: { ...mockRefugeData, altitude: undefined },
        isLoading: false,
      };

      const { queryByText } = renderWithProviders(
        <RefugeBottomSheet
          refugeId="1"
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />,
        { withNavigation: false, mockAuthValue: { isAuthenticated: true } }
      );

      // No hauria de mostrar l'altitud
      expect(queryByText(/2135 m/)).toBeNull();
    });

    it('hauria de mostrar "Unknown" si no hi ha regió', () => {
      mockUseRefugeReturn = {
        data: { ...mockRefugeData, region: undefined },
        isLoading: false,
      };

      const { getByText } = renderWithProviders(
        <RefugeBottomSheet
          refugeId="1"
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />,
        { withNavigation: false, mockAuthValue: { isAuthenticated: true } }
      );

      expect(getByText(/Unknown/)).toBeTruthy();
    });

    it('hauria de gestionar refugeId buit sense errors', () => {
      mockUseRefugeReturn = {
        data: null,
        isLoading: false,
      };

      const { queryByTestId } = renderWithProviders(
        <RefugeBottomSheet
          refugeId=""
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />,
        { withNavigation: false, mockAuthValue: { isAuthenticated: true } }
      );

      // No hauria de renderitzar res si no hi ha dades
      expect(queryByTestId('bottom-sheet')).toBeNull();
    });

    it('hauria de gestionar places = 0', () => {
      mockUseRefugeReturn = {
        data: { ...mockRefugeData, places: 0 },
        isLoading: false,
      };

      const { getByText } = renderWithProviders(
        <RefugeBottomSheet
          refugeId="1"
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />,
        { withNavigation: false, mockAuthValue: { isAuthenticated: true } }
      );

      // Hauria de mostrar 0 places
      expect(getByText(/0/)).toBeTruthy();
    });
  });

  describe('Safe Area i layout', () => {
    it('hauria de respectar els insets de safe area', () => {
      const { getByTestId } = renderWithProviders(
        <RefugeBottomSheet
          refugeId="1"
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />,
        { withNavigation: false, mockAuthValue: { isAuthenticated: true } }
      );

      const sheet = getByTestId('bottom-sheet');
      // Hauria de tenir padding bottom per als insets
      expect(sheet.props.style).toBeDefined();
    });
  });

  describe('Diferents tipus de refugis', () => {
    it('hauria de mostrar correctament un refugi de tipus 0', () => {
      mockUseRefugeReturn = {
        data: { ...mockRefugeData, type: 0 },
        isLoading: false,
      };

      const { getByTestId } = renderWithProviders(
        <RefugeBottomSheet
          refugeId="1"
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />,
        { withNavigation: false, mockAuthValue: { isAuthenticated: true } }
      );

      expect(getByTestId('badge-type')).toBeTruthy();
    });

    it('hauria de mostrar correctament un refugi sense tipus', () => {
      mockUseRefugeReturn = {
        data: { ...mockRefugeData, type: undefined },
        isLoading: false,
      };

      const { getByTestId } = renderWithProviders(
        <RefugeBottomSheet
          refugeId="1"
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />,
        { withNavigation: false, mockAuthValue: { isAuthenticated: true } }
      );

      expect(getByTestId('badge-type')).toBeTruthy();
    });
  });

  describe('Diferents condicions de refugis', () => {
    const conditions = [1, 2, 3];

    conditions.forEach(condition => {
      it(`hauria de mostrar correctament un refugi amb condició ${condition}`, () => {
        mockUseRefugeReturn = {
          data: { ...mockRefugeData, condition },
          isLoading: false,
        };

        const { getByTestId } = renderWithProviders(
          <RefugeBottomSheet
            refugeId="1"
            isVisible={true}
            onClose={mockOnClose}
            onToggleFavorite={mockOnToggleFavorite}
            onNavigate={mockOnNavigate}
            onViewDetails={mockOnViewDetails}
          />,
          { withNavigation: false, mockAuthValue: { isAuthenticated: true } }
        );

        expect(getByTestId('badge-condition')).toBeTruthy();
      });
    });
  });

  describe('Estat de carrega', () => {
    it('no hauria de renderitzar mentre carrega', () => {
      mockUseRefugeReturn = {
        data: null,
        isLoading: true,
      };

      const { queryByTestId } = renderWithProviders(
        <RefugeBottomSheet
          refugeId="1"
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />,
        { withNavigation: false, mockAuthValue: { isAuthenticated: true } }
      );

      expect(queryByTestId('bottom-sheet')).toBeNull();
    });
  });
});

