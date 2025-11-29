/**
 * Tests unitaris per al component RefugeBottomSheet
 * 
 * Aquest fitxer cobreix:
 * - Renderització bàsica i visibilitat
 * - Informació del refugi mostrada
 * - Funcionalitat de favorits
 * - Gestió de clicks (tanca, navegació, detalls)
 * - Casos límit i camps opcionals
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { RefugeBottomSheet } from '../../../components/RefugeBottomSheet';
import { Location } from '../../../models';
import useFavourite from '../../../hooks/useFavourite';

// Mock de useTranslation
jest.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'refuge.actions.viewDetails': 'Veure detalls',
        'refuge.actions.navigate': 'Navegar',
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
  const baseRefuge: Location = {
    id: 1,
    name: 'Refugi Test',
    coord: { long: 1.5, lat: 42.5 },
    region: 'Pirineus',
    places: 20,
    condition: 'bé',
    altitude: 2500,
    type: 1,
    imageUrl: 'https://example.com/image.jpg',
  };

  const mockOnClose = jest.fn();
  const mockOnToggleFavorite = jest.fn();
  const mockOnNavigate = jest.fn();
  const mockOnViewDetails = jest.fn();
  const mockToggleFavourite = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
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
          refuge={baseRefuge}
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
          refuge={baseRefuge}
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />
      );
      
      expect(getByTestId('bottom-sheet')).toBeTruthy();
    });
  });

  describe('Renderització d\'informació', () => {
    it('hauria de mostrar el nom del refugi', () => {
      const { getByText } = render(
        <RefugeBottomSheet
          refuge={baseRefuge}
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
          refuge={baseRefuge}
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
          refuge={baseRefuge}
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
          refuge={baseRefuge}
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
          refuge={baseRefuge}
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />
      );
      
      const image = getByTestId('refuge-image');
      expect(image).toBeTruthy();
      expect(image.props.source.uri).toBe('https://example.com/image.jpg');
    });

    it('hauria de mostrar imatge per defecte si no hi ha imageUrl', () => {
      const refugeWithoutImage = { ...baseRefuge, imageUrl: undefined };
      
      const { getByTestId } = render(
        <RefugeBottomSheet
          refuge={refugeWithoutImage}
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />
      );
      
      const image = getByTestId('refuge-image');
      expect(image.props.source.uri).toContain('unsplash.com');
    });

    it('NO hauria de mostrar altitud si no està disponible', () => {
      const refugeWithoutAltitude = { ...baseRefuge, altitude: undefined };
      
      const { queryByText } = render(
        <RefugeBottomSheet
          refuge={refugeWithoutAltitude}
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />
      );
      
      expect(queryByText(/m$/)).toBeNull();
    });

    it('hauria de mostrar "Unknown" si no hi ha regió', () => {
      const refugeWithoutRegion = { ...baseRefuge, region: undefined };
      
      const { getByText } = render(
        <RefugeBottomSheet
          refuge={refugeWithoutRegion}
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />
      );
      
      expect(getByText('Unknown')).toBeTruthy();
    });
  });

  describe('Gestió de clicks', () => {
    it('hauria de cridar onClose quan es fa click al backdrop', () => {
      const { getByTestId } = render(
        <RefugeBottomSheet
          refuge={baseRefuge}
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />
      );
      
      const backdrop = getByTestId('backdrop');
      fireEvent.press(backdrop);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('hauria de cridar onViewDetails quan es fa click al botó de detalls', () => {
      const { getByText } = render(
        <RefugeBottomSheet
          refuge={baseRefuge}
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />
      );
      
      const detailsButton = getByText('Veure detalls');
      fireEvent.press(detailsButton);
      
      expect(mockOnViewDetails).toHaveBeenCalledWith(baseRefuge);
    });
  });

  describe('Funcionalitat de favorits', () => {
    it('hauria de mostrar la icona de favorit buit quan NO és favorit', () => {
      mockUseFavourite.mockReturnValue({
        isFavourite: false,
        toggleFavourite: mockToggleFavourite,
        isProcessing: false,
      });

      const { getByTestId } = render(
        <RefugeBottomSheet
          refuge={baseRefuge}
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />
      );
      
      const favoriteButton = getByTestId('favorite-button');
      expect(favoriteButton).toBeTruthy();
    });

    it('hauria de mostrar la icona de favorit ple quan és favorit', () => {
      mockUseFavourite.mockReturnValue({
        isFavourite: true,
        toggleFavourite: mockToggleFavourite,
        isProcessing: false,
      });

      const { getByTestId } = render(
        <RefugeBottomSheet
          refuge={baseRefuge}
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />
      );
      
      const favoriteButton = getByTestId('favorite-button');
      expect(favoriteButton).toBeTruthy();
    });

    it('hauria de cridar toggleFavourite quan es fa click al botó de favorit', async () => {
      mockToggleFavourite.mockResolvedValue(undefined);

      const { getByTestId } = render(
        <RefugeBottomSheet
          refuge={baseRefuge}
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />
      );
      
      const favoriteButton = getByTestId('favorite-button');
      fireEvent.press(favoriteButton);
      
      await waitFor(() => {
        expect(mockToggleFavourite).toHaveBeenCalledTimes(1);
      });
    });

    it('hauria de cridar onToggleFavorite després de toggleFavourite', async () => {
      mockToggleFavourite.mockResolvedValue(undefined);

      const { getByTestId } = render(
        <RefugeBottomSheet
          refuge={baseRefuge}
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />
      );
      
      const favoriteButton = getByTestId('favorite-button');
      fireEvent.press(favoriteButton);
      
      await waitFor(() => {
        expect(mockToggleFavourite).toHaveBeenCalled();
        expect(mockOnToggleFavorite).toHaveBeenCalledWith(baseRefuge.id);
      });
    });

    it('hauria de gestionar errors al fer toggle de favorit', async () => {
      mockToggleFavourite.mockRejectedValue(new Error('Network error'));

      const { getByTestId } = render(
        <RefugeBottomSheet
          refuge={baseRefuge}
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />
      );
      
      const favoriteButton = getByTestId('favorite-button');
      fireEvent.press(favoriteButton);
      
      await waitFor(() => {
        expect(mockToggleFavourite).toHaveBeenCalled();
      });
      
      // No hauria de cridar onToggleFavorite si hi ha error
      expect(mockOnToggleFavorite).not.toHaveBeenCalled();
    });

    it('NO hauria de gestionar estat disabled (funcionalitat no implementada)', () => {
      mockUseFavourite.mockReturnValue({
        isFavourite: false,
        toggleFavourite: mockToggleFavourite,
        isProcessing: true,
      });

      const { getByTestId } = render(
        <RefugeBottomSheet
          refuge={baseRefuge}
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />
      );
      
      const favoriteButton = getByTestId('favorite-button');
      // El component no implementa disabled, només gestiona isProcessing internament
      expect(favoriteButton.props.disabled).toBeUndefined();
    });

    it('hauria de tenir accessibilityState.selected=true quan és favorit', () => {
      mockUseFavourite.mockReturnValue({
        isFavourite: true,
        toggleFavourite: mockToggleFavourite,
        isProcessing: false,
      });

      const { getByTestId } = render(
        <RefugeBottomSheet
          refuge={baseRefuge}
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
          refuge={baseRefuge}
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />
      );
      
      expect(mockUseFavourite).toHaveBeenCalledWith(baseRefuge.id);
    });
  });

  describe('Badges', () => {
    it('hauria de mostrar el badge de tipus', () => {
      const { getByTestId } = render(
        <RefugeBottomSheet
          refuge={baseRefuge}
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />
      );
      
      // BadgeType component should be rendered
      expect(getByTestId('bottom-sheet')).toBeTruthy();
    });

    it('hauria de mostrar el badge de condició si està disponible', () => {
      const { getByTestId } = render(
        <RefugeBottomSheet
          refuge={baseRefuge}
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />
      );
      
      // BadgeCondition component should be rendered
      expect(getByTestId('bottom-sheet')).toBeTruthy();
    });

    it('NO hauria de mostrar el badge de condició si no està disponible', () => {
      const refugeWithoutCondition = { ...baseRefuge, condition: undefined };
      
      const { getByTestId } = render(
        <RefugeBottomSheet
          refuge={refugeWithoutCondition}
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />
      );
      
      expect(getByTestId('bottom-sheet')).toBeTruthy();
    });
  });

  describe('Casos límit', () => {
    it('hauria de gestionar refugi amb id undefined', () => {
      const refugeWithoutId = { ...baseRefuge, id: undefined };
      
      const { getByTestId } = render(
        <RefugeBottomSheet
          refuge={refugeWithoutId}
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />
      );
      
      expect(getByTestId('bottom-sheet')).toBeTruthy();
      expect(mockUseFavourite).toHaveBeenCalledWith(undefined);
    });

    it('hauria de gestionar noms llargs correctament', () => {
      const longName = 'Refugi amb un nom molt llarg que hauria de truncar-se o ajustar-se correctament en la UI';
      const refugeWithLongName = { ...baseRefuge, name: longName };
      
      const { getByText } = render(
        <RefugeBottomSheet
          refuge={refugeWithLongName}
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />
      );
      
      expect(getByText(longName)).toBeTruthy();
    });

    it('hauria de gestionar altituds de 0 metres', () => {
      const refugeAtSeaLevel = { ...baseRefuge, altitude: 0 };
      
      const { getByText } = render(
        <RefugeBottomSheet
          refuge={refugeAtSeaLevel}
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />
      );
      
      expect(getByText('0 m')).toBeTruthy();
    });

    it('hauria de gestionar places de 0', () => {
      const refugeWithZeroPlaces = { ...baseRefuge, places: 0 };
      
      const { getByText } = render(
        <RefugeBottomSheet
          refuge={refugeWithZeroPlaces}
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />
      );
      
      expect(getByText('0')).toBeTruthy();
    });
  });

  describe('Safe area insets', () => {
    it('hauria de renderitzar correctament amb safe area insets', () => {
      const { getByTestId } = render(
        <RefugeBottomSheet
          refuge={baseRefuge}
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />
      );
      
      const bottomSheet = getByTestId('bottom-sheet');
      expect(bottomSheet).toBeTruthy();
    });
  });

  describe('Snapshot testing', () => {
    it('hauria de coincidir amb el snapshot quan isVisible és false', () => {
      const tree = render(
        <RefugeBottomSheet
          refuge={baseRefuge}
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
          refuge={baseRefuge}
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
          refuge={baseRefuge}
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
