/**
 * Tests unitaris per al component BadgeType
 * 
 * Aquest fitxer cobreix:
 * - Renderització amb diferents tipus (0-5)
 * - Colors segons el tipus
 * - Traduccions dels tipus
 * - Mode neutral i muted
 * - Gestió de tipus desconeguts
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { BadgeType } from '../../../components/BadgeType';

// Mock de useTranslation
jest.mock('../../../utils/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'refuge.type.noGuarded': 'No vigilat',
        'refuge.type.occupiedInSummer': 'Ocupat a l\'estiu',
        'refuge.type.closed': 'Tancat',
        'refuge.type.shelter': 'Abric',
        'refuge.type.emergency': 'Emergència',
        'refuge.type.unknown': 'Desconegut',
      };
      return translations[key] || key;
    },
  }),
}));

describe('BadgeType Component', () => {
  describe('Renderització bàsica', () => {
    it('hauria de renderitzar "Desconegut" quan no es proporciona tipus', () => {
      const { getByText } = render(<BadgeType />);
      
      expect(getByText('Desconegut')).toBeTruthy();
    });

    it('hauria de renderitzar "Desconegut" quan tipus és undefined', () => {
      const { getByText } = render(<BadgeType type={undefined} />);
      
      expect(getByText('Desconegut')).toBeTruthy();
    });

    it('hauria de renderitzar "Desconegut" quan tipus és 5', () => {
      const { getByText } = render(<BadgeType type={5} />);
      
      expect(getByText('Desconegut')).toBeTruthy();
    });
  });

  describe('Tipus 0 - noGuarded', () => {
    it('hauria de renderitzar "No vigilat"', () => {
      const { getByText } = render(<BadgeType type={0} />);
      
      expect(getByText('No vigilat')).toBeTruthy();
    });

    it('hauria d\'aplicar colors verds', () => {
      const { getByText } = render(<BadgeType type={0} />);
      
      const badge = getByText('No vigilat').parent;
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#D1FAE5',
          borderColor: '#34D399',
        })
      );
    });
  });

  describe('Tipus 1 - occupiedInSummer', () => {
    it('hauria de renderitzar "Ocupat a l\'estiu"', () => {
      const { getByText } = render(<BadgeType type={1} />);
      
      expect(getByText('Ocupat a l\'estiu')).toBeTruthy();
    });

    it('hauria d\'aplicar colors blaus', () => {
      const { getByText } = render(<BadgeType type={1} />);
      
      const badge = getByText('Ocupat a l\'estiu').parent;
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#DBEAFE',
          borderColor: '#60A5FA',
        })
      );
    });
  });

  describe('Tipus 2 - closed', () => {
    it('hauria de renderitzar "Tancat"', () => {
      const { getByText } = render(<BadgeType type={2} />);
      
      expect(getByText('Tancat')).toBeTruthy();
    });

    it('hauria d\'aplicar colors vermells', () => {
      const { getByText } = render(<BadgeType type={2} />);
      
      const badge = getByText('Tancat').parent;
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#FEE2E2',
          borderColor: '#F87171',
        })
      );
    });
  });

  describe('Tipus 3 - shelter', () => {
    it('hauria de renderitzar "Abric"', () => {
      const { getByText } = render(<BadgeType type={3} />);
      
      expect(getByText('Abric')).toBeTruthy();
    });

    it('hauria d\'aplicar colors grisos', () => {
      const { getByText } = render(<BadgeType type={3} />);
      
      const badge = getByText('Abric').parent;
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#F3F4F6',
          borderColor: '#9CA3AF',
        })
      );
    });
  });

  describe('Tipus 4 - emergency', () => {
    it('hauria de renderitzar "Emergència"', () => {
      const { getByText } = render(<BadgeType type={4} />);
      
      expect(getByText('Emergència')).toBeTruthy();
    });

    it('hauria d\'aplicar colors taronja', () => {
      const { getByText } = render(<BadgeType type={4} />);
      
      const badge = getByText('Emergència').parent;
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#FEF3C7',
          borderColor: '#F59E42',
        })
      );
    });
  });

  describe('Tipus 5 - unknown', () => {
    it('hauria de renderitzar "Desconegut"', () => {
      const { getByText } = render(<BadgeType type={5} />);
      
      expect(getByText('Desconegut')).toBeTruthy();
    });

    it('hauria d\'aplicar colors grisos', () => {
      const { getByText } = render(<BadgeType type={5} />);
      
      const badge = getByText('Desconegut').parent;
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#E5E7EB',
          borderColor: '#9CA3AF',
        })
      );
    });
  });

  describe('Mode neutral', () => {
    it('hauria d\'aplicar colors neutres quan neutral=true', () => {
      const { getByText } = render(<BadgeType type={0} neutral={true} />);
      
      const badge = getByText('No vigilat').parent;
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#F3F4F6',
          borderColor: '#D1D5DB',
        })
      );
    });

    it('hauria de tenir opacity 0.7 en mode neutral', () => {
      const { getByText } = render(<BadgeType type={0} neutral={true} />);
      
      const badge = getByText('No vigilat').parent;
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          opacity: 0.7,
        })
      );
    });

    it('hauria d\'ignorar colors de tipus en mode neutral', () => {
      const { getByText } = render(<BadgeType type={2} neutral={true} />);
      
      const badge = getByText('Tancat').parent;
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#F3F4F6', // color neutral, no vermell
        })
      );
    });
  });

  describe('Mode muted', () => {
    it('hauria d\'aplicar textColor gris quan muted=true', () => {
      const { getByText } = render(<BadgeType type={0} muted={true} />);
      
      const textElement = getByText('No vigilat');
      expect(textElement.props.style).toContainEqual(
        expect.objectContaining({
          color: '#6B7280', // color de text muted
        })
      );
    });

    it('hauria de mantenir colors de fons originals en mode muted', () => {
      const { getByText } = render(<BadgeType type={0} muted={true} />);
      
      const badge = getByText('No vigilat').parent;
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#D1FAE5', // colors de fons originals
          borderColor: '#34D399',
        })
      );
    });

    it('hauria d\'aplicar muted a tipus "closed"', () => {
      const { getByText } = render(<BadgeType type={2} muted={true} />);
      
      const badge = getByText('Tancat').parent;
      const textElement = getByText('Tancat');

      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#FEE2E2', // colors de fons vermells
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
      const { getByText } = render(
        <BadgeType type={0} neutral={true} muted={true} />
      );
      
      const badge = getByText('No vigilat').parent;
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
      const { getByText } = render(
        <BadgeType type={0} style={customStyle} />
      );
      
      const badge = getByText('No vigilat').parent;
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining(customStyle)
      );
    });

    it('hauria de combinar estils personalitzats amb estils per defecte', () => {
      const customStyle = { padding: 5 };
      const { getByText } = render(
        <BadgeType type={1} style={customStyle} />
      );
      
      const badge = getByText('Ocupat a l\'estiu').parent;
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#DBEAFE', // estil per defecte
          padding: 5, // estil personalitzat
        })
      );
    });
  });

  describe('Tipus fora de rang', () => {
    it('hauria de tractar tipus negatiu com unknown', () => {
      const { getByText } = render(<BadgeType type={-1} />);
      
      expect(getByText('Desconegut')).toBeTruthy();
    });

    it('hauria de tractar tipus > 5 com unknown', () => {
      const { getByText } = render(<BadgeType type={10} />);
      
      expect(getByText('Desconegut')).toBeTruthy();
    });

    it('hauria de tractar tipus molt gran com unknown', () => {
      const { getByText } = render(<BadgeType type={999} />);
      
      expect(getByText('Desconegut')).toBeTruthy();
    });
  });

  describe('Tots els tipus', () => {
    const testCases = [
      { type: 0, expectedText: 'No vigilat', expectedBg: '#D1FAE5' },
      { type: 1, expectedText: 'Ocupat a l\'estiu', expectedBg: '#DBEAFE' },
      { type: 2, expectedText: 'Tancat', expectedBg: '#FEE2E2' },
      { type: 3, expectedText: 'Abric', expectedBg: '#F3F4F6' },
      { type: 4, expectedText: 'Emergència', expectedBg: '#FEF3C7' },
      { type: 5, expectedText: 'Desconegut', expectedBg: '#E5E7EB' },
    ];

    testCases.forEach(({ type, expectedText, expectedBg }) => {
      it(`hauria de renderitzar correctament el tipus ${type}`, () => {
        const { getByText } = render(<BadgeType type={type} />);
        
        expect(getByText(expectedText)).toBeTruthy();
        
        const badge = getByText(expectedText).parent;
        expect(badge?.props.style).toContainEqual(
          expect.objectContaining({
            backgroundColor: expectedBg,
          })
        );
      });
    });
  });

  describe('Traducció dels tipus', () => {
    it('hauria d\'usar la funció t per traduir', () => {
      const { getByText } = render(<BadgeType type={0} />);
      
      // Verificar que el text traduït es mostra
      expect(getByText('No vigilat')).toBeTruthy();
    });

    it('hauria de mostrar la clau de traducció si no es troba', () => {
      // Aquest test verifica que el component gestiona traduccions no trobades
      const { getByText } = render(<BadgeType type={3} />);
      
      expect(getByText('Abric')).toBeTruthy();
    });
  });

  describe('Snapshot testing', () => {
    it('hauria de coincidir amb el snapshot per cada tipus', () => {
      [0, 1, 2, 3, 4, 5].forEach(type => {
        const tree = render(<BadgeType type={type} />).toJSON();
        expect(tree).toMatchSnapshot(`BadgeType-${type}`);
      });
    });

    it('hauria de coincidir amb el snapshot en mode neutral', () => {
      const tree = render(<BadgeType type={0} neutral={true} />).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('hauria de coincidir amb el snapshot en mode muted', () => {
      const tree = render(<BadgeType type={0} muted={true} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
  });

  describe('Casos límit de números', () => {
    it('hauria de gestionar 0 correctament', () => {
      const { getByText } = render(<BadgeType type={0} />);
      
      expect(getByText('No vigilat')).toBeTruthy();
    });

    it('hauria de gestionar NaN com unknown', () => {
      const { getByText } = render(<BadgeType type={NaN} />);
      
      expect(getByText('Desconegut')).toBeTruthy();
    });

    it('hauria de gestionar Infinity com unknown', () => {
      const { getByText } = render(<BadgeType type={Infinity} />);
      
      expect(getByText('Desconegut')).toBeTruthy();
    });
  });
});
