/**
 * Tests unitaris per al component BadgeType
 * 
 * Aquest fitxer cobreix:
 * - Renderització amb diferents tipus (strings)
 * - Colors segons el tipus
 * - Mode neutral
 * - Mode muted
 * - Gestió de tipus desconeguts
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { BadgeType } from '../../../components/BadgeType';

// Mock useTranslation hook
jest.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'refuge.type.noGuarded': 'No vigilat',
        'refuge.type.occupiedInSummer': 'Ocupat a l\'estiu',
        'refuge.type.closed': 'Tancat',
        'refuge.type.shelter': 'Abric',
        'refuge.type.emergency': 'Emergència',
      };
      return translations[key] || key;
    },
  }),
}));

describe('BadgeType Component', () => {
  describe('Renderització bàsica', () => {
    it('hauria de renderitzar "No vigilat" quan no es proporciona tipus', () => {
      const { getByText } = render(<BadgeType />);
      
      expect(getByText('No vigilat')).toBeTruthy();
    });

    it('hauria de renderitzar "No vigilat" quan tipus és undefined', () => {
      const { getByText } = render(<BadgeType type={undefined} />);
      
      expect(getByText('No vigilat')).toBeTruthy();
    });

    it('hauria de renderitzar "No vigilat" amb tipus desconegut', () => {
      const { getByText } = render(<BadgeType type="unknown_type" />);
      
      expect(getByText('No vigilat')).toBeTruthy();
    });

    it('hauria de renderitzar "No vigilat" amb tipus "non gardé"', () => {
      const { getByText } = render(<BadgeType type="non gardé" />);
      
      expect(getByText('No vigilat')).toBeTruthy();
    });
  });

  describe('Tipus - noGuarded (per defecte)', () => {
    it('hauria de renderitzar "No vigilat"', () => {
      const { getByText } = render(<BadgeType />);
      
      expect(getByText('No vigilat')).toBeTruthy();
    });

    it('hauria d\'aplicar colors verds pastel', () => {
      const { getByTestId } = render(<BadgeType />);
      
      const badge = getByTestId('badge-container');
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#E6F8EE',
          borderColor: '#7EE0B0',
        })
      );
    });
  });

  describe('Tipus - occupiedInSummer', () => {
    const typeValue = "cabane ouverte mais ocupee par le berger l ete";
    
    it('hauria de renderitzar "Ocupat a l\'estiu"', () => {
      const { getByText } = render(<BadgeType type={typeValue} />);
      
      expect(getByText('Ocupat a l\'estiu')).toBeTruthy();
    });

    it('hauria d\'aplicar colors blaus pastel', () => {
      const { getByTestId } = render(<BadgeType type={typeValue} />);
      
      const badge = getByTestId('badge-container');
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#EAF4FF',
          borderColor: '#A3C4FF',
        })
      );
    });
  });

  describe('Tipus - closed', () => {
    const typeValue = "fermée";
    
    it('hauria de renderitzar "Tancat"', () => {
      const { getByText } = render(<BadgeType type={typeValue} />);
      
      expect(getByText('Tancat')).toBeTruthy();
    });

    it('hauria d\'aplicar colors vermells pastel', () => {
      const { getByTestId } = render(<BadgeType type={typeValue} />);
      
      const badge = getByTestId('badge-container');
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#FDE8E8',
          borderColor: '#F4A6A6',
        })
      );
    });
  });

  describe('Tipus - shelter', () => {
    const typeValue = "orri";
    
    it('hauria de renderitzar "Abric"', () => {
      const { getByText } = render(<BadgeType type={typeValue} />);
      
      expect(getByText('Abric')).toBeTruthy();
    });

    it('hauria d\'aplicar colors grisos', () => {
      const { getByTestId } = render(<BadgeType type={typeValue} />);
      
      const badge = getByTestId('badge-container');
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#F3F4F6',
          borderColor: '#9CA3AF',
        })
      );
    });
  });

  describe('Tipus - emergency', () => {
    const typeValue = "emergence";
    
    it('hauria de renderitzar "Emergència"', () => {
      const { getByText } = render(<BadgeType type={typeValue} />);
      
      expect(getByText('Emergència')).toBeTruthy();
    });

    it('hauria d\'aplicar colors grocs pastel', () => {
      const { getByTestId } = render(<BadgeType type={typeValue} />);
      
      const badge = getByTestId('badge-container');
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#FFF6E0',
          borderColor: '#F7C67A',
        })
      );
    });
  });

  describe('Mode neutral', () => {
    it('hauria d\'aplicar colors neutres quan neutral=true', () => {
      const { getByTestId } = render(<BadgeType neutral={true} />);
      
      const badge = getByTestId('badge-container');
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#F3F4F6',
          borderColor: '#D1D5DB',
        })
      );
    });

    it('hauria de tenir opacity 0.7 en mode neutral', () => {
      const { getByTestId } = render(<BadgeType neutral={true} />);
      
      const badge = getByTestId('badge-container');
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          opacity: 0.7,
        })
      );
    });

    it('hauria d\'ignorar colors de tipus en mode neutral', () => {
      const { getByTestId } = render(<BadgeType type="fermée" neutral={true} />);
      
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
      const { getByText } = render(<BadgeType muted={true} />);
      
      const textElement = getByText('No vigilat');
      expect(textElement.props.style).toContainEqual(
        expect.objectContaining({
          color: '#6B7280',
        })
      );
    });

    it('hauria de mantenir colors de fons originals en mode muted', () => {
      const { getByTestId } = render(<BadgeType muted={true} />);
      
      const badge = getByTestId('badge-container');
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#E6F8EE',
          borderColor: '#7EE0B0',
        })
      );
    });

    it('hauria d\'aplicar muted a tipus "closed"', () => {
      const { getByText, getByTestId } = render(<BadgeType type="fermée" muted={true} />);
      
      const badge = getByTestId('badge-container');
      const textElement = getByText('Tancat');

      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#FDE8E8',
        })
      );
      expect(textElement.props.style).toContainEqual(
        expect.objectContaining({
          color: '#6B7280',
        })
      );
    });
  });

  describe('Combinació de modes', () => {
    it('neutral hauria de tenir prioritat sobre muted', () => {
      const { getByTestId } = render(
        <BadgeType neutral={true} muted={true} />
      );
      
      const badge = getByTestId('badge-container');
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
        <BadgeType style={customStyle} />
      );
      
      const badge = getByTestId('badge-container');
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining(customStyle)
      );
    });

    it('hauria de combinar estils personalitzats amb estils per defecte', () => {
      const customStyle = { padding: 5 };
      const { getByTestId } = render(
        <BadgeType type="fermée" style={customStyle} />
      );
      
      const badge = getByTestId('badge-container');
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#FDE8E8',
        })
      );
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          padding: 5,
        })
      );
    });
  });

  describe('Tots els tipus amb traduccions', () => {
    const testCases = [
      { type: undefined, expectedText: 'No vigilat', expectedBg: '#E6F8EE' },
      { type: 'non gardé', expectedText: 'No vigilat', expectedBg: '#E6F8EE' },
      { type: 'cabane ouverte mais ocupee par le berger l ete', expectedText: 'Ocupat a l\'estiu', expectedBg: '#EAF4FF' },
      { type: 'fermée', expectedText: 'Tancat', expectedBg: '#FDE8E8' },
      { type: 'orri', expectedText: 'Abric', expectedBg: '#F3F4F6' },
      { type: 'emergence', expectedText: 'Emergència', expectedBg: '#FFF6E0' },
    ];

    testCases.forEach(({ type, expectedText, expectedBg }) => {
      it(`hauria de renderitzar correctament el tipus "${type || 'undefined'}"`, () => {
        const { getByText, getByTestId } = render(<BadgeType type={type} />);
        
        expect(getByText(expectedText)).toBeTruthy();
        
        const badge = getByTestId('badge-container');
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
      const { getByText } = render(<BadgeType />);
      
      expect(getByText('No vigilat')).toBeTruthy();
    });
  });

  describe('Snapshot testing', () => {
    it('hauria de coincidir amb el snapshot per defecte', () => {
      const tree = render(<BadgeType />).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('hauria de coincidir amb el snapshot en mode neutral', () => {
      const tree = render(<BadgeType neutral={true} />).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('hauria de coincidir amb el snapshot en mode muted', () => {
      const tree = render(<BadgeType muted={true} />).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('hauria de coincidir amb el snapshot per tipus closed', () => {
      const tree = render(<BadgeType type="fermée" />).toJSON();
      expect(tree).toMatchSnapshot();
    });
  });

  describe('Casos límit', () => {
    it('hauria de gestionar tipus buit com noGuarded', () => {
      const { getByText } = render(<BadgeType type="" />);
      
      expect(getByText('No vigilat')).toBeTruthy();
    });

    it('hauria de gestionar tipus amb espais', () => {
      const { getByText } = render(<BadgeType type="  " />);
      
      expect(getByText('No vigilat')).toBeTruthy();
    });
  });
});
