/**
 * Tests unitaris per al component BadgeCondition
 * 
 * Aquest fitxer cobreix:
 * - Renderització amb diferents condicions (numèriques)
 * - Colors segons la condició
 * - Mode neutral
 * - Mode muted
 * - Gestió de condicions desconegudes
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { BadgeCondition } from '../../../components/BadgeCondition';

// Mock useTranslation hook
jest.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'refuge.condition.poor': 'Pobre',
        'refuge.condition.fair': 'Correcte',
        'refuge.condition.good': 'Bé',
        'refuge.condition.excellent': 'Excel·lent',
        'refuge.condition.unknown': 'Desconegut',
      };
      return translations[key] || key;
    },
  }),
}));

describe('BadgeCondition Component', () => {
  describe('Renderització bàsica', () => {
    it('hauria de renderitzar amb condició 2 (bé)', () => {
      const { getByText } = render(<BadgeCondition condition={2} />);
      
      expect(getByText('Bé')).toBeTruthy();
    });

    it('hauria de renderitzar "Desconegut" quan no es proporciona condició', () => {
      const { getByText } = render(<BadgeCondition />);
      
      expect(getByText('Desconegut')).toBeTruthy();
    });

    it('hauria de renderitzar amb condició undefined', () => {
      const { getByText } = render(<BadgeCondition condition={undefined} />);
      
      expect(getByText('Desconegut')).toBeTruthy();
    });

    it('hauria de renderitzar "Desconegut" amb condició invàlida', () => {
      const { getByText } = render(<BadgeCondition condition={99} />);
      
      expect(getByText('Desconegut')).toBeTruthy();
    });
  });

  describe('Colors segons condició 2 (bé)', () => {
    it('hauria d\'aplicar colors verds pastel per condició 2', () => {
      const { getByTestId } = render(<BadgeCondition condition={2} />);
      
      const badge = getByTestId('badge-container');
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#E6F8EE',
          borderColor: '#7EE0B0',
        })
      );
    });
  });

  describe('Colors segons condició 3 (excel·lent)', () => {
    it('hauria d\'aplicar colors grocs pastel per condició 3', () => {
      const { getByTestId } = render(<BadgeCondition condition={3} />);
      
      const badge = getByTestId('badge-container');
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#FFF6E0',
          borderColor: '#F7C67A',
        })
      );
    });
  });

  describe('Colors segons condició 1 (correcte)', () => {
    it('hauria d\'aplicar colors blaus pastel per condició 1', () => {
      const { getByTestId } = render(<BadgeCondition condition={1} />);
      
      const badge = getByTestId('badge-container');
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#EAF4FF',
          borderColor: '#A3C4FF',
        })
      );
    });
  });

  describe('Colors segons condició 0 (pobre)', () => {
    it('hauria d\'aplicar colors vermells pastel per condició 0', () => {
      const { getByTestId } = render(<BadgeCondition condition={0} />);
      
      const badge = getByTestId('badge-container');
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#FDE8E8',
          borderColor: '#F4A6A6',
        })
      );
    });
  });

  describe('Colors per condició desconeguda', () => {
    it('hauria d\'aplicar colors grisos per condició desconeguda', () => {
      const { getByTestId } = render(<BadgeCondition condition={99} />);
      
      const badge = getByTestId('badge-container');
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#E5E7EB',
          borderColor: '#9CA3AF',
        })
      );
    });

    it('hauria d\'aplicar colors grisos per condició undefined', () => {
      const { getByTestId } = render(<BadgeCondition />);
      
      const badge = getByTestId('badge-container');
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#E5E7EB',
        })
      );
    });

    it('hauria d\'aplicar colors grisos per condició negativa', () => {
      const { getByTestId } = render(<BadgeCondition condition={-1} />);
      
      const badge = getByTestId('badge-container');
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#E5E7EB',
        })
      );
    });
  });

  describe('Mode neutral', () => {
    it('hauria d\'aplicar colors neutres quan neutral=true', () => {
      const { getByTestId } = render(<BadgeCondition condition={2} neutral={true} />);
      
      const badge = getByTestId('badge-container');
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#F3F4F6',
          borderColor: '#D1D5DB',
        })
      );
    });

    it('hauria de tenir opacity 0.7 en mode neutral', () => {
      const { getByTestId } = render(<BadgeCondition condition={2} neutral={true} />);
      
      const badge = getByTestId('badge-container');
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          opacity: 0.7,
        })
      );
    });

    it('hauria d\'ignorar colors de condició en mode neutral', () => {
      const { getByTestId } = render(<BadgeCondition condition={0} neutral={true} />);
      
      const badge = getByTestId('badge-container');
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#F3F4F6', // color neutral, no vermell
        })
      );
    });
  });

  describe('Mode muted', () => {
    it('hauria d\'aplicar textColor gris quan muted=true', () => {
      const { getByText } = render(<BadgeCondition condition={2} muted={true} />);
      
      const textElement = getByText('Bé');
      expect(textElement.props.style).toContainEqual(
        expect.objectContaining({
          color: '#6B7280', // color de text muted
        })
      );
    });

    it('hauria de mantenir colors de fons originals en mode muted', () => {
      const { getByTestId } = render(<BadgeCondition condition={2} muted={true} />);
      
      const badge = getByTestId('badge-container');
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#E6F8EE', // colors de fons originals
          borderColor: '#7EE0B0',
        })
      );
    });

    it('hauria d\'aplicar muted a condició 0 (pobre)', () => {
      const { getByText, getByTestId } = render(<BadgeCondition condition={0} muted={true} />);
      
      const badge = getByTestId('badge-container');
      const textElement = getByText('Pobre');

      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#FDE8E8', // colors de fons vermells pastel
        })
      );
      expect(textElement.props.style).toContainEqual(
        expect.objectContaining({
          color: '#6B7280', // text gris
        })
      );
    });
  });

  describe('Combinació de modes', () => {
    it('neutral hauria de tenir prioritat sobre muted', () => {
      const { getByTestId } = render(
        <BadgeCondition condition={2} neutral={true} muted={true} />
      );
      
      const badge = getByTestId('badge-container');
      // En mode neutral, s'apliquen colors neutres (no muted)
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#F3F4F6',
          borderColor: '#D1D5DB',
        })
      );
    });
  });

  describe('Estils personalitzats', () => {
    it('hauria d\'aplicar estils personalitzats amb la prop style', () => {
      const customStyle = { marginTop: 10 };
      const { getByTestId } = render(
        <BadgeCondition condition={2} style={customStyle} />
      );
      
      const badge = getByTestId('badge-container');
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining(customStyle)
      );
    });

    it('hauria de combinar estils personalitzats amb estils per defecte', () => {
      const customStyle = { padding: 5 };
      const { getByTestId } = render(
        <BadgeCondition condition={1} style={customStyle} />
      );
      
      const badge = getByTestId('badge-container');
      // React Native combines styles as an array, check for both properties separately
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#EAF4FF', // estil per defecte
        })
      );
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          padding: 5, // estil personalitzat
        })
      );
    });
  });

  describe('Totes les condicions', () => {
    const testCases = [
      { condition: 0, expectedBg: '#FDE8E8', name: 'pobre' },
      { condition: 1, expectedBg: '#EAF4FF', name: 'correcte' },
      { condition: 2, expectedBg: '#E6F8EE', name: 'bé' },
      { condition: 3, expectedBg: '#FFF6E0', name: 'excel·lent' },
    ];

    testCases.forEach(({ condition, expectedBg, name }) => {
      it(`hauria d'aplicar el color correcte per condició ${condition} (${name})`, () => {
        const { getByTestId } = render(<BadgeCondition condition={condition} />);
        
        const badge = getByTestId('badge-container');
        expect(badge?.props.style).toContainEqual(
          expect.objectContaining({
            backgroundColor: expectedBg,
          })
        );
      });
    });
  });

  describe('Textos traduïts', () => {
    it('hauria de mostrar "Pobre" per condició 0', () => {
      const { getByText } = render(<BadgeCondition condition={0} />);
      expect(getByText('Pobre')).toBeTruthy();
    });

    it('hauria de mostrar "Correcte" per condició 1', () => {
      const { getByText } = render(<BadgeCondition condition={1} />);
      expect(getByText('Correcte')).toBeTruthy();
    });

    it('hauria de mostrar "Bé" per condició 2', () => {
      const { getByText } = render(<BadgeCondition condition={2} />);
      expect(getByText('Bé')).toBeTruthy();
    });

    it('hauria de mostrar "Excel·lent" per condició 3', () => {
      const { getByText } = render(<BadgeCondition condition={3} />);
      expect(getByText('Excel·lent')).toBeTruthy();
    });
  });

  describe('Snapshot testing', () => {
    it('hauria de coincidir amb el snapshot amb condició 2', () => {
      const tree = render(<BadgeCondition condition={2} />).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('hauria de coincidir amb el snapshot en mode neutral', () => {
      const tree = render(<BadgeCondition condition={2} neutral={true} />).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('hauria de coincidir amb el snapshot en mode muted', () => {
      const tree = render(<BadgeCondition condition={2} muted={true} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
  });
});

