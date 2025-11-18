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

import React from 'react';
import { renderWithProviders, fireEvent, waitFor } from '../setup/testUtils';
import { RefugeBottomSheet } from '../../../components/RefugeBottomSheet';
import { Location } from '../../../models';

// Mock de les icones
jest.mock('../../../assets/icons/altitude.svg', () => 'AltitudeIcon');
jest.mock('../../../assets/icons/user.svg', () => 'CapacityIcon');
jest.mock('../../../assets/icons/region.svg', () => 'RegionIcon');
jest.mock('../../../assets/icons/favourite2.svg', () => 'FavouriteIcon');

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
jest.mock('../../../utils/useTranslation', () => ({
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
  const mockRefuge: Location = {
    id: 1,
    name: 'Refugi de Colomers',
    coord: { lat: 42.6531, long: 0.9858 },
    altitude: 2135,
    places: 16,
    type: 1,
    condition: 'bé',
    region: 'Pallars Sobirà',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
  };

  const mockOnClose = jest.fn();
  const mockOnToggleFavorite = jest.fn();
  const mockOnNavigate = jest.fn();
  const mockOnViewDetails = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderització i visibilitat', () => {
    it('no hauria de renderitzar quan isVisible és false', () => {
      const { queryByText } = renderWithProviders(
        <RefugeBottomSheet
          refuge={mockRefuge}
          isVisible={false}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />,
        { withNavigation: false }
      );

      expect(queryByText('Refugi de Colomers')).toBeNull();
    });

    it('hauria de renderitzar quan isVisible és true', () => {
      const { getByText } = renderWithProviders(
        <RefugeBottomSheet
          refuge={mockRefuge}
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />,
        { withNavigation: false }
      );

      expect(getByText('Refugi de Colomers')).toBeTruthy();
    });

    it('hauria de mostrar la informació bàsica del refugi', () => {
      const { getByText } = renderWithProviders(
        <RefugeBottomSheet
          refuge={mockRefuge}
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />,
        { withNavigation: false }
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
          refuge={mockRefuge}
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />,
        { withNavigation: false }
      );

      expect(getByTestId('badge-type')).toBeTruthy();
    });

    it('hauria de mostrar el badge de condició si existeix', () => {
      const { getByTestId } = renderWithProviders(
        <RefugeBottomSheet
          refuge={mockRefuge}
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />,
        { withNavigation: false }
      );

      expect(getByTestId('badge-condition')).toBeTruthy();
    });

    it('no hauria de mostrar el badge de condició si no existeix', () => {
      const refugeWithoutCondition = { ...mockRefuge, condition: undefined };

      const { queryByTestId } = renderWithProviders(
        <RefugeBottomSheet
          refuge={refugeWithoutCondition}
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />,
        { withNavigation: false }
      );

      expect(queryByTestId('badge-condition')).toBeNull();
    });
  });

  describe('Imatge del refugi', () => {
    it('hauria de mostrar la imatge del refugi', () => {
      const { getByTestId } = renderWithProviders(
        <RefugeBottomSheet
          refuge={mockRefuge}
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />,
        { withNavigation: false }
      );

      const image = getByTestId('refuge-image');
      expect(image).toBeTruthy();
      expect(image.props.source.uri).toBe(mockRefuge.imageUrl);
    });

    it('hauria de mostrar una imatge per defecte si no hi ha imageUrl', () => {
      const refugeWithoutImage = { ...mockRefuge, imageUrl: undefined };

      const { getByTestId } = renderWithProviders(
        <RefugeBottomSheet
          refuge={refugeWithoutImage}
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />,
        { withNavigation: false }
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
          refuge={mockRefuge}
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />,
        { withNavigation: false }
      );

      const backdrop = getByTestId('backdrop');
      fireEvent.press(backdrop);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('hauria de cridar onToggleFavorite quan es fa clic al botó de favorit', () => {
      const { getByTestId } = renderWithProviders(
        <RefugeBottomSheet
          refuge={mockRefuge}
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />,
        { withNavigation: false }
      );

      const favoriteButton = getByTestId('favorite-button');
      fireEvent.press(favoriteButton);

      expect(mockOnToggleFavorite).toHaveBeenCalledWith(mockRefuge.id);
    });

    it('hauria de cridar onViewDetails quan es fa clic al botó de detalls', () => {
      const { getByText } = renderWithProviders(
        <RefugeBottomSheet
          refuge={mockRefuge}
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />,
        { withNavigation: false }
      );

      const detailsButton = getByText('Veure detalls');
      fireEvent.press(detailsButton);

      expect(mockOnViewDetails).toHaveBeenCalledWith(mockRefuge);
    });
  });

  describe('Camps opcionals i casos límit', () => {
    it('hauria de gestionar altitud undefined', () => {
      const refugeWithoutAltitude = { ...mockRefuge, altitude: undefined };

      const { queryByText } = renderWithProviders(
        <RefugeBottomSheet
          refuge={refugeWithoutAltitude}
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />,
        { withNavigation: false }
      );

      // No hauria de mostrar l'altitud
      expect(queryByText(/m$/)).toBeNull();
    });

    it('hauria de mostrar "Unknown" si no hi ha regió', () => {
      const refugeWithoutRegion = { ...mockRefuge, region: undefined };

      const { getByText } = renderWithProviders(
        <RefugeBottomSheet
          refuge={refugeWithoutRegion}
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />,
        { withNavigation: false }
      );

      expect(getByText(/Unknown/)).toBeTruthy();
    });

    it('hauria de gestionar id undefined en toggleFavorite', () => {
      const refugeWithoutId = { ...mockRefuge, id: undefined };

      const { getByTestId } = renderWithProviders(
        <RefugeBottomSheet
          refuge={refugeWithoutId}
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />,
        { withNavigation: false }
      );

      const favoriteButton = getByTestId('favorite-button');
      fireEvent.press(favoriteButton);

      expect(mockOnToggleFavorite).toHaveBeenCalledWith(undefined);
    });

    it('hauria de gestionar places = 0', () => {
      const refugeWithZeroPlaces = { ...mockRefuge, places: 0 };

      const { getByText } = renderWithProviders(
        <RefugeBottomSheet
          refuge={refugeWithZeroPlaces}
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />,
        { withNavigation: false }
      );

      // Hauria de mostrar 0 places
      expect(getByText(/0/)).toBeTruthy();
    });
  });

  describe('Safe Area i layout', () => {
    it('hauria de respectar els insets de safe area', () => {
      const { getByTestId } = renderWithProviders(
        <RefugeBottomSheet
          refuge={mockRefuge}
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />,
        { withNavigation: false }
      );

      const sheet = getByTestId('bottom-sheet');
      // Hauria de tenir padding bottom per als insets
      expect(sheet.props.style).toBeDefined();
    });
  });

  describe('Diferents tipus de refugis', () => {
    it('hauria de mostrar correctament un refugi de tipus 0', () => {
      const refugeType0 = { ...mockRefuge, type: 0 };

      const { getByTestId } = renderWithProviders(
        <RefugeBottomSheet
          refuge={refugeType0}
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />,
        { withNavigation: false }
      );

      expect(getByTestId('badge-type')).toBeTruthy();
    });

    it('hauria de mostrar correctament un refugi sense tipus', () => {
      const refugeWithoutType = { ...mockRefuge, type: undefined };

      const { getByTestId } = renderWithProviders(
        <RefugeBottomSheet
          refuge={refugeWithoutType}
          isVisible={true}
          onClose={mockOnClose}
          onToggleFavorite={mockOnToggleFavorite}
          onNavigate={mockOnNavigate}
          onViewDetails={mockOnViewDetails}
        />,
        { withNavigation: false }
      );

      expect(getByTestId('badge-type')).toBeTruthy();
    });
  });

  describe('Diferents condicions de refugis', () => {
    const conditions: Array<'pobre' | 'normal' | 'bé'> = ['pobre', 'normal', 'bé'];

    conditions.forEach(condition => {
      it(`hauria de mostrar correctament un refugi amb condició ${condition}`, () => {
        const refugeWithCondition = { ...mockRefuge, condition };

        const { getByTestId } = renderWithProviders(
          <RefugeBottomSheet
            refuge={refugeWithCondition}
            isVisible={true}
            onClose={mockOnClose}
            onToggleFavorite={mockOnToggleFavorite}
            onNavigate={mockOnNavigate}
            onViewDetails={mockOnViewDetails}
          />,
          { withNavigation: false }
        );

        expect(getByTestId('badge-condition')).toBeTruthy();
      });
    });
  });
});
