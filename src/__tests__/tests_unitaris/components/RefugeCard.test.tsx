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
import { render, fireEvent } from '@testing-library/react-native';
import { TouchableOpacity, View } from 'react-native';
import { RefugeCard } from '../../../components/RefugeCard';
import { Location } from '../../../models';

// Mock de useTranslation
jest.mock('../../../utils/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'refuge.actions.viewOnMap': 'Veure al mapa',
      };
      return translations[key] || key;
    },
  }),
}));

describe('RefugeCard Component', () => {
  const baseRefuge: Location = {
    id: 1,
    name: 'Refugi Test',
    coord: { long: 1.5, lat: 42.5 },
    region: 'Pirineus',
    places: 20,
    condition: 'bé',
  };

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
      
      expect(getByText('👤 20')).toBeTruthy();
    });

    it('hauria de renderitzar el botó "Veure al mapa"', () => {
      const { getByText } = render(<RefugeCard refuge={baseRefuge} />);
      
      expect(getByText(/Veure al mapa/)).toBeTruthy();
    });
  });

  describe('Badge de condició', () => {
    it('hauria de mostrar el badge amb la condició del refugi', () => {
      const { getByText } = render(<RefugeCard refuge={baseRefuge} />);
      
      expect(getByText('bé')).toBeTruthy();
    });

    it('NO hauria de mostrar badge quan condition és undefined', () => {
      const refugeWithoutCondition: Location = {
        ...baseRefuge,
        condition: undefined,
      };
      const { queryByText } = render(<RefugeCard refuge={refugeWithoutCondition} />);
      
      // El component comprova refuge.condition abans de renderitzar el badge
      expect(queryByText('bé')).toBeNull();
    });

    it('hauria de mostrar badge per diferents condicions', () => {
      const conditions: Array<'pobre' | 'normal' | 'bé' | 'excel·lent'> = [
        'pobre', 'normal', 'bé', 'excel·lent'
      ];

      conditions.forEach(condition => {
        const refuge: Location = { ...baseRefuge, condition };
        const { getByText } = render(<RefugeCard refuge={refuge} />);
        expect(getByText(condition)).toBeTruthy();
      });
    });
  });

  describe('Gestió de clicks', () => {
    it('hauria de cridar onPress quan es fa click a la card', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <RefugeCard refuge={baseRefuge} onPress={onPress} />
      );
      
      const card = getByText('Refugi Test').parent?.parent?.parent;
      if (card) {
        fireEvent.press(card);
      }
      
      expect(onPress).toHaveBeenCalled();
    });

    it('hauria de cridar onViewMap quan es prem el botó del mapa', () => {
      const onViewMap = jest.fn();
      const { getByText } = render(
        <RefugeCard refuge={baseRefuge} onViewMap={onViewMap} />
      );
      
      const mapButton = getByText('🗺️ Veure al mapa').parent;
      if (mapButton) {
        fireEvent.press(mapButton);
      }
      
      expect(onViewMap).toHaveBeenCalled();
    });

    it('NO hauria de cridar onPress si no està definit', () => {
      const { getByText } = render(<RefugeCard refuge={baseRefuge} />);
      
      const card = getByText('Refugi Test').parent?.parent?.parent;
      
      // No hauria de llançar error
      expect(() => {
        if (card) fireEvent.press(card);
      }).not.toThrow();
    });

    it('NO hauria de cridar onViewMap si no està definit', () => {
      const { getByText } = render(<RefugeCard refuge={baseRefuge} />);
      
      const mapButton = getByText('🗺️ Veure al mapa').parent;
      
      // No hauria de llançar error
      expect(() => {
        if (mapButton) fireEvent.press(mapButton);
      }).not.toThrow();
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

    it('hauria de mostrar 60 per defecte si places és undefined', () => {
      const refugeWithoutPlaces: Location = {
        ...baseRefuge,
        places: undefined,
      };
      const { getByText } = render(<RefugeCard refuge={refugeWithoutPlaces} />);
      
      expect(getByText('👤 60')).toBeTruthy();
    });

    it('hauria de mostrar 60 per defecte si places és null', () => {
      const refugeWithoutPlaces: Location = {
        ...baseRefuge,
        places: null,
      };
      const { getByText } = render(<RefugeCard refuge={refugeWithoutPlaces} />);
      
      expect(getByText('👤 60')).toBeTruthy();
    });

    it('hauria de mostrar places=0 si està definit', () => {
      const refugeZeroPlaces: Location = {
        ...baseRefuge,
        places: 0,
      };
      const { getByText } = render(<RefugeCard refuge={refugeZeroPlaces} />);
      
      expect(getByText('👤 0')).toBeTruthy();
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
      
      expect(getByText('👤 5')).toBeTruthy();
    });

    it('hauria de mostrar capacitats grans', () => {
      const refuge: Location = { ...baseRefuge, places: 100 };
      const { getByText } = render(<RefugeCard refuge={refuge} />);
      
      expect(getByText('👤 100')).toBeTruthy();
    });

    it('hauria de mostrar capacitats molt grans', () => {
      const refuge: Location = { ...baseRefuge, places: 500 };
      const { getByText } = render(<RefugeCard refuge={refuge} />);
      
      expect(getByText('👤 500')).toBeTruthy();
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

    it('hauria de tenir el badge posicionat a la cantonada superior dreta', () => {
      const { getByText } = render(<RefugeCard refuge={baseRefuge} />);
      
      const badgeText = getByText('bé');
      const badge = badgeText.parent?.parent; // View container with position styles
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          position: 'absolute',
          top: 8,
          right: 8,
        })
      );
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
      expect(getByText('👤 60')).toBeTruthy(); // valor per defecte
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
      expect(getByText('👤 60')).toBeTruthy();
    });

    it('hauria de gestionar nom buit', () => {
      const refuge: Location = { ...baseRefuge, name: '' };
      const { getByText } = render(<RefugeCard refuge={refuge} />);
      
      expect(getByText('refuge.title')).toBeTruthy();
    });

    it('hauria de gestionar regió buida', () => {
      const refuge: Location = { ...baseRefuge, region: '' };
      const { getByText } = render(<RefugeCard refuge={refuge} />);
      
      expect(getByText('')).toBeTruthy();
    });
  });

  describe('Interacció amb múltiples cards', () => {
    it('hauria de gestionar múltiples cards independents', () => {
      const refuge1: Location = { ...baseRefuge, id: 1, name: 'Refugi 1' };
      const refuge2: Location = { ...baseRefuge, id: 2, name: 'Refugi 2' };

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
        id: 1,
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
