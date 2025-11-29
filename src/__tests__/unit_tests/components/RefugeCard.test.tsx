/**
 * Tests unitaris per al component RefugeCard
 * 
 * Aquest fitxer cobreix:
 * - Renderització bàsica
 * - Mostrar informació del refugi
 * - Badge de condició
 * - Gestió de clicks (onPress, onViewMap)
 * - Camps opcionals
 * - Casos límit
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { TouchableOpacity, View } from 'react-native';
import { RefugeCard } from '../../../components/RefugeCard';
import { Location } from '../../../models';
import useFavourite from '../../../hooks/useFavourite';

const mockUseFavourite = useFavourite as jest.MockedFunction<typeof useFavourite>;

// Mock de useTranslation
jest.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'refuge.actions.viewOnMap': 'Veure al mapa',
        'refuge.title': 'Refugi',
        'common.pyrenees': 'Pirineus',
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

describe('RefugeCard Component', () => {
  const baseRefuge: Location = {
    id: "1",
    name: 'Refugi Test',
    coord: { long: 1.5, lat: 42.5 },
    region: 'Pirineus',
    places: 20,
    condition: 'bé',
  };

  const mockToggleFavourite = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation
    mockUseFavourite.mockReturnValue({
      isFavourite: false,
      toggleFavourite: mockToggleFavourite,
      isProcessing: false,
    });
  });

  describe('Renderització bàsica', () => {
    it('hauria de renderitzar el nom del refugi', () => {
      const { getByText } = render(<RefugeCard refuge={baseRefuge} />);
      
      expect(getByText('Refugi Test')).toBeTruthy();
    });

    it('hauria de renderitzar la regió', () => {
      const { getByText } = render(<RefugeCard refuge={baseRefuge} />);
      
      expect(getByText('Pirineus')).toBeTruthy();
    });

    it('hauria de renderitzar el nombre de places', () => {
      const { getByText } = render(<RefugeCard refuge={baseRefuge} />);
      
      // Buscar només el número, ja que la icona és un component separat
      expect(getByText(/20/)).toBeTruthy();
    });

    it('hauria de renderitzar el botó del mapa', () => {
      const { getByTestId } = render(<RefugeCard refuge={baseRefuge} />);
      
      expect(getByTestId('map-button')).toBeTruthy();
    });
  });

  describe('Badge de condició', () => {
    it('NO hauria de mostrar badge de condició (funcionalitat eliminada)', () => {
      const { queryByText } = render(<RefugeCard refuge={baseRefuge} />);
      
      // El nou disseny no mostra badge de condició a la card
      expect(queryByText('bé')).toBeNull();
    });

    it('NO hauria de mostrar badge quan condition és undefined', () => {
      const refugeWithoutCondition: Location = {
        ...baseRefuge,
        condition: undefined,
      };
      const { queryByText } = render(<RefugeCard refuge={refugeWithoutCondition} />);
      
      // El nou disseny no mostra badge de condició
      expect(queryByText('pobre')).toBeNull();
      expect(queryByText('normal')).toBeNull();
    });

    it('NO hauria de mostrar badge per diferents condicions', () => {
      const conditions: Array<'pobre' | 'normal' | 'bé' | 'excel·lent'> = [
        'pobre', 'normal', 'bé', 'excel·lent'
      ];

      conditions.forEach(condition => {
        const refuge: Location = { ...baseRefuge, condition };
        const { queryByText } = render(<RefugeCard refuge={refuge} />);
        // El nou disseny no mostra badges de condició
        expect(queryByText(condition)).toBeNull();
      });
    });
  });

  describe('Gestió de clicks', () => {
    it('hauria de cridar onPress quan es fa click a la card', () => {
      const onPress = jest.fn();
      const { getByText } = render(<RefugeCard refuge={baseRefuge} onPress={onPress} />);
      
      const card = getByText('Refugi Test').parent?.parent?.parent;
      
      if (card) {
        fireEvent.press(card);
      }
      
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('NO hauria de cridar onPress si no es proporciona', () => {
      const { getByText } = render(<RefugeCard refuge={baseRefuge} />);
      
      const card = getByText('Refugi Test').parent?.parent?.parent;
      
      // No hauria de llançar error
      if (card) {
        expect(() => fireEvent.press(card)).not.toThrow();
      }
    });

    it('hauria de cridar onViewMap quan es fa click al botó del mapa', () => {
      const onViewMap = jest.fn();
      const { getByTestId } = render(<RefugeCard refuge={baseRefuge} onViewMap={onViewMap} />);
      
      const mapButton = getByTestId('map-button');
      fireEvent.press(mapButton);
      
      expect(onViewMap).toHaveBeenCalledTimes(1);
    });

    it('NO hauria de cridar onViewMap si no es proporciona', () => {
      const { getByTestId } = render(<RefugeCard refuge={baseRefuge} />);
      
      const mapButton = getByTestId('map-button');
      
      // No hauria de llançar error
      expect(() => fireEvent.press(mapButton)).not.toThrow();
    });
  });

  describe('Funcionalitat de favorits', () => {
    it('hauria de mostrar la icona de favorit buit quan NO és favorit', () => {
      mockUseFavourite.mockReturnValue({
        isFavourite: false,
        toggleFavourite: mockToggleFavourite,
        isProcessing: false,
      });

      const { getByTestId } = render(<RefugeCard refuge={baseRefuge} />);
      
      const favoriteButton = getByTestId('favorite-button');
      expect(favoriteButton).toBeTruthy();
    });

    it('hauria de mostrar la icona de favorit ple quan és favorit', () => {
      mockUseFavourite.mockReturnValue({
        isFavourite: true,
        toggleFavourite: mockToggleFavourite,
        isProcessing: false,
      });

      const { getByTestId } = render(<RefugeCard refuge={baseRefuge} />);
      
      const favoriteButton = getByTestId('favorite-button');
      expect(favoriteButton).toBeTruthy();
    });

    it('hauria de cridar toggleFavourite quan es fa click al botó de favorit', async () => {
      mockToggleFavourite.mockResolvedValue(undefined);

      const { getByTestId } = render(<RefugeCard refuge={baseRefuge} />);
      
      const favoriteButton = getByTestId('favorite-button');
      fireEvent.press(favoriteButton);
      
      await waitFor(() => {
        expect(mockToggleFavourite).toHaveBeenCalledTimes(1);
      });
    });

    it('hauria de cridar onToggleFavorite després de toggleFavourite', async () => {
      mockToggleFavourite.mockResolvedValue(undefined);
      const onToggleFavorite = jest.fn();

      const { getByTestId } = render(
        <RefugeCard refuge={baseRefuge} onToggleFavorite={onToggleFavorite} />
      );
      
      const favoriteButton = getByTestId('favorite-button');
      fireEvent.press(favoriteButton);
      
      await waitFor(() => {
        expect(mockToggleFavourite).toHaveBeenCalled();
        expect(onToggleFavorite).toHaveBeenCalledWith(baseRefuge.id);
      });
    });

    it('hauria de gestionar errors al fer toggle de favorit', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockToggleFavourite.mockRejectedValue(new Error('Network error'));

      const { getByTestId } = render(<RefugeCard refuge={baseRefuge} />);
      
      const favoriteButton = getByTestId('favorite-button');
      fireEvent.press(favoriteButton);
      
      await waitFor(() => {
        expect(mockToggleFavourite).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });

    it('NO hauria de gestionar estat disabled (funcionalitat no implementada)', () => {
      mockUseFavourite.mockReturnValue({
        isFavourite: false,
        toggleFavourite: mockToggleFavourite,
        isProcessing: true,
      });

      const { getByTestId } = render(<RefugeCard refuge={baseRefuge} />);
      
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

      const { getByTestId } = render(<RefugeCard refuge={baseRefuge} />);
      
      const favoriteButton = getByTestId('favorite-button');
      expect(favoriteButton.props.accessibilityState.selected).toBe(true);
    });

    it('NO hauria de cridar onToggleFavorite si no es proporciona', async () => {
      mockToggleFavourite.mockResolvedValue(undefined);

      const { getByTestId } = render(<RefugeCard refuge={baseRefuge} />);
      
      const favoriteButton = getByTestId('favorite-button');
      
      // No hauria de llançar error
      await expect(async () => {
        fireEvent.press(favoriteButton);
        await waitFor(() => expect(mockToggleFavourite).toHaveBeenCalled());
      }).resolves.not.toThrow();
    });

    it('hauria de cridar useFavourite amb el refugeId correcte', () => {
      render(<RefugeCard refuge={baseRefuge} />);
      
      expect(mockUseFavourite).toHaveBeenCalledWith(baseRefuge.id);
    });

    it('hauria de gestionar refugi sense id', () => {
      const refugeWithoutId: Location = {
        ...baseRefuge,
        id: undefined,
      };

      render(<RefugeCard refuge={refugeWithoutId} />);
      
      expect(mockUseFavourite).toHaveBeenCalledWith(undefined);
    });
  });

  describe('Camps opcionals', () => {
    it('hauria de mostrar "Pirineus" per defecte si region és undefined', () => {
      const refugeWithoutRegion: Location = {
        ...baseRefuge,
        region: undefined,
      };
      const { getByText } = render(<RefugeCard refuge={refugeWithoutRegion} />);
      
      expect(getByText('Pirineus')).toBeTruthy();
    });

    it('hauria de mostrar "Pirineus" per defecte si region és null', () => {
      const refugeWithoutRegion: Location = {
        ...baseRefuge,
        region: null,
      };
      const { getByText } = render(<RefugeCard refuge={refugeWithoutRegion} />);
      
      expect(getByText('Pirineus')).toBeTruthy();
    });

    it('hauria de mostrar "?" si places és undefined', () => {
      const refugeWithoutPlaces: Location = {
        ...baseRefuge,
        places: undefined,
      };
      const { getByText } = render(<RefugeCard refuge={refugeWithoutPlaces} />);
      
      expect(getByText(/\?/)).toBeTruthy();
    });

    it('hauria de mostrar "?" si places és null', () => {
      const refugeWithoutPlaces: Location = {
        ...baseRefuge,
        places: null,
      };
      const { getByText } = render(<RefugeCard refuge={refugeWithoutPlaces} />);
      
      expect(getByText(/\?/)).toBeTruthy();
    });

    it('hauria de mostrar "?" si places=0', () => {
      const refugeZeroPlaces: Location = {
        ...baseRefuge,
        places: 0,
      };
      const { getByText } = render(<RefugeCard refuge={refugeZeroPlaces} />);
      
      expect(getByText(/\?/)).toBeTruthy();
    });
  });

  describe('Diferents regions', () => {
    it('hauria de mostrar regions personalitzades', () => {
      const regions = ['Pallars Sobirà', 'Alta Ribagorça', 'Val d\'Aran'];

      regions.forEach(region => {
        const refuge: Location = { ...baseRefuge, region };
        const { getByText } = render(<RefugeCard refuge={refuge} />);
        expect(getByText(region)).toBeTruthy();
      });
    });
  });

  describe('Diferents capacitats', () => {
    it('hauria de mostrar capacitats petites', () => {
      const refuge: Location = { ...baseRefuge, places: 5 };
      const { getByText } = render(<RefugeCard refuge={refuge} />);
      
      expect(getByText(/5/)).toBeTruthy();
    });

    it('hauria de mostrar capacitats grans', () => {
      const refuge: Location = { ...baseRefuge, places: 100 };
      const { getByText } = render(<RefugeCard refuge={refuge} />);
      
      expect(getByText(/100/)).toBeTruthy();
    });

    it('hauria de mostrar capacitats molt grans', () => {
      const refuge: Location = { ...baseRefuge, places: 500 };
      const { getByText } = render(<RefugeCard refuge={refuge} />);
      
      expect(getByText(/500/)).toBeTruthy();
    });
  });

  describe('Noms de refugis', () => {
    it('hauria de mostrar noms curts', () => {
      const refuge: Location = { ...baseRefuge, name: 'ABC' };
      const { getByText } = render(<RefugeCard refuge={refuge} />);
      
      expect(getByText('ABC')).toBeTruthy();
    });

    it('hauria de mostrar noms llargs', () => {
      const longName = 'Refugi de Muntanya amb un Nom Molt Llarg per Testejar';
      const refuge: Location = { ...baseRefuge, name: longName };
      const { getByText } = render(<RefugeCard refuge={refuge} />);
      
      expect(getByText(longName)).toBeTruthy();
    });

    it('hauria de mostrar noms amb caràcters especials', () => {
      const refuge: Location = { ...baseRefuge, name: 'Refugi d\'Amitges' };
      const { getByText } = render(<RefugeCard refuge={refuge} />);
      
      expect(getByText('Refugi d\'Amitges')).toBeTruthy();
    });

    it('hauria de mostrar noms amb accents', () => {
      const refuge: Location = { ...baseRefuge, name: 'Estació d\'Espot' };
      const { getByText } = render(<RefugeCard refuge={refuge} />);
      
      expect(getByText('Estació d\'Espot')).toBeTruthy();
    });
  });

  describe('Propietats del TouchableOpacity', () => {
    it('hauria de tenir activeOpacity 0.7', () => {
      const { UNSAFE_getAllByType } = render(<RefugeCard refuge={baseRefuge} />);
      
      const touchables = UNSAFE_getAllByType(TouchableOpacity);
      // El primer touchable és la card principal
      const mainCard = touchables[0];
      
      expect(mainCard.props.activeOpacity).toBe(0.7);
    });
  });

  describe('Estructura del component', () => {
    it('hauria de tenir una View per la imatge', () => {
      const { UNSAFE_getAllByType } = render(<RefugeCard refuge={baseRefuge} />);
      
      const views = UNSAFE_getAllByType(View);
      // Verificar que hi ha múltiples Views (imageContainer, infoContainer, etc.)
      expect(views.length).toBeGreaterThan(3);
    });

    it('hauria de tenir el botó de favorit posicionat a la cantonada superior dreta', () => {
      const { getByTestId } = render(<RefugeCard refuge={baseRefuge} />);
      
      const favoriteButton = getByTestId('favorite-button');
      expect(favoriteButton.props.style).toMatchObject({
        position: 'absolute',
        top: 8,
        right: 8,
      });
    });

    it('hauria de mostrar el separador "•" entre regió i places', () => {
      const { getByText } = render(<RefugeCard refuge={baseRefuge} />);
      
      expect(getByText('•')).toBeTruthy();
    });
  });

  describe('Casos límit', () => {
    it('hauria de gestionar refugi amb tots els camps opcionals undefined', () => {
      const minimalRefuge: Location = {
        name: 'Refugi Mínim',
        coord: { long: 1, lat: 42 },
        region: undefined,
        places: undefined,
        condition: undefined,
      };
      const { getByText } = render(<RefugeCard refuge={minimalRefuge} />);
      
      expect(getByText('Refugi Mínim')).toBeTruthy();
      expect(getByText('Pirineus')).toBeTruthy(); // valor per defecte
      expect(getByText(/\?/)).toBeTruthy(); // mostra ? quan places és undefined
    });

    it('hauria de gestionar refugi amb tots els camps opcionals null', () => {
      const minimalRefuge: Location = {
        name: 'Refugi Mínim',
        coord: { long: 1, lat: 42 },
        region: null,
        places: null,
        condition: undefined,
      };
      const { getByText } = render(<RefugeCard refuge={minimalRefuge} />);
      
      expect(getByText('Refugi Mínim')).toBeTruthy();
      expect(getByText('Pirineus')).toBeTruthy();
      expect(getByText(/\?/)).toBeTruthy();
    });

    it('hauria de gestionar nom buit', () => {
      const refuge: Location = { ...baseRefuge, name: '' };
      const { UNSAFE_root } = render(<RefugeCard refuge={refuge} />);
      
      // Simplement verificar que es renderitza sense errors
      expect(UNSAFE_root).toBeTruthy();
    });

    it('hauria de gestionar regió buida mostrant valor per defecte', () => {
      const refuge: Location = { ...baseRefuge, region: '' };
      const { getByText } = render(<RefugeCard refuge={refuge} />);
      
      // Regió buida hauria de mostrar el valor per defecte
      expect(getByText('Pirineus')).toBeTruthy();
    });
  });

  describe('Interacció amb múltiples cards', () => {
    it('hauria de gestionar múltiples cards independents', () => {
      const refuge1: Location = { ...baseRefuge, id: "1", name: 'Refugi 1' };
      const refuge2: Location = { ...baseRefuge, id: "2", name: 'Refugi 2' };

      const onPress1 = jest.fn();
      const onPress2 = jest.fn();

      const { getByText } = render(
        <>
          <RefugeCard refuge={refuge1} onPress={onPress1} />
          <RefugeCard refuge={refuge2} onPress={onPress2} />
        </>
      );

      const card1 = getByText('Refugi 1').parent?.parent?.parent;
      const card2 = getByText('Refugi 2').parent?.parent?.parent;

      if (card1) fireEvent.press(card1);
      if (card2) fireEvent.press(card2);

      expect(onPress1).toHaveBeenCalledTimes(1);
      expect(onPress2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Snapshot testing', () => {
    it('hauria de coincidir amb el snapshot amb props bàsiques', () => {
      const tree = render(<RefugeCard refuge={baseRefuge} />).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('hauria de coincidir amb el snapshot amb tots els camps', () => {
      const fullRefuge: Location = {
        id: "1",
        name: 'Refugi Complet',
        coord: { long: 1.5, lat: 42.5 },
        region: 'Pallars Sobirà',
        places: 30,
        condition: 'excel·lent',
        altitude: 2500,
        description: 'Un refugi excel·lent',
      };
      const tree = render(
        <RefugeCard refuge={fullRefuge} onPress={jest.fn()} onViewMap={jest.fn()} />
      ).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('hauria de coincidir amb el snapshot sense condició', () => {
      const refugeNoCondition: Location = {
        ...baseRefuge,
        condition: undefined,
      };
      const tree = render(<RefugeCard refuge={refugeNoCondition} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
  });
});
