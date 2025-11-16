/**
 * Tests unitaris per al component BadgeCondition
 * 
 * Aquest fitxer cobreix:
 * - Renderització amb diferents condicions
 * - Colors segons la condició
 * - Mode neutral
 * - Mode muted
 * - Gestió de condicions desconegudes
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { BadgeCondition } from '../../../components/BadgeCondition';

describe('BadgeCondition Component', () => {
  describe('Renderització bàsica', () => {
    it('hauria de renderitzar amb condició "bé"', () => {
      const { getByText, getByTestId } = render(<BadgeCondition condition="bé" />);
      
      expect(getByText('bé')).toBeTruthy();
    });

    it('hauria de renderitzar "Desconegut" quan no es proporciona condició', () => {
      const { getByText, getByTestId } = render(<BadgeCondition />);
      
      expect(getByText('Desconegut')).toBeTruthy();
    });

    it('hauria de renderitzar amb condició undefined', () => {
      const { getByText, getByTestId } = render(<BadgeCondition condition={undefined} />);
      
      expect(getByText('Desconegut')).toBeTruthy();
    });

    it('hauria de renderitzar amb condició buida', () => {
      const { getByText, getByTestId } = render(<BadgeCondition condition="" />);
      
      expect(getByText('')).toBeTruthy();
    });
  });

  describe('Colors segons condició "bé"', () => {
    it('hauria d\'aplicar colors verds per condició "bé"', () => {
      const { getByText, getByTestId } = render(<BadgeCondition condition="bé" />);
      
      const badge = getByTestId('badge-container');
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#A2FFC8',
          borderColor: '#30D270',
        })
      );
    });

    it('hauria d\'aplicar colors verds per condició "bo"', () => {
      const { getByText, getByTestId } = render(<BadgeCondition condition="bo" />);
      
      const badge = getByTestId('badge-container');
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#A2FFC8',
        })
      );
    });

    it('hauria d\'aplicar colors verds per condició "good"', () => {
      const { getByText, getByTestId } = render(<BadgeCondition condition="good" />);
      
      const badge = getByTestId('badge-container');
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#A2FFC8',
        })
      );
    });

    it('hauria d\'aplicar colors verds per condició "ok"', () => {
      const { getByText, getByTestId } = render(<BadgeCondition condition="ok" />);
      
      const badge = getByTestId('badge-container');
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#A2FFC8',
        })
      );
    });
  });

  describe('Colors segons condició "excel·lent"', () => {
    it('hauria d\'aplicar colors verds per condició "excel·lent"', () => {
      const { getByText, getByTestId } = render(<BadgeCondition condition="excel·lent" />);
      
      const badge = getByTestId('badge-container');
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#A2FFC8',
          borderColor: '#30D270',
        })
      );
    });
  });

  describe('Colors segons condició "normal"', () => {
    it('hauria d\'aplicar colors blaus per condició "normal"', () => {
      const { getByText, getByTestId } = render(<BadgeCondition condition="normal" />);
      
      const badge = getByTestId('badge-container');
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#e0ebffff',
          borderColor: '#2d70ecff',
        })
      );
    });

    it('hauria d\'aplicar colors blaus per condició "regular"', () => {
      const { getByText, getByTestId } = render(<BadgeCondition condition="regular" />);
      
      const badge = getByTestId('badge-container');
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#e0ebffff',
        })
      );
    });
  });

  describe('Colors segons condició "pobre"', () => {
    it('hauria d\'aplicar colors vermells per condició "pobre"', () => {
      const { getByText, getByTestId } = render(<BadgeCondition condition="pobre" />);
      
      const badge = getByTestId('badge-container');
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#FEE2E2',
          borderColor: '#F87171',
        })
      );
    });
  });

  describe('Colors per condició desconeguda', () => {
    it('hauria d\'aplicar colors grisos per condició desconeguda', () => {
      const { getByText, getByTestId } = render(<BadgeCondition condition="desconegut" />);
      
      const badge = getByTestId('badge-container');
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#E5E7EB',
          borderColor: '#9CA3AF',
        })
      );
    });

    it('hauria d\'aplicar colors grisos per condició no reconeguda', () => {
      const { getByText, getByTestId } = render(<BadgeCondition condition="altra condició" />);
      
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
      const { getByText, getByTestId } = render(<BadgeCondition condition="bé" neutral={true} />);
      
      const badge = getByTestId('badge-container');
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#F3F4F6',
          borderColor: '#D1D5DB',
        })
      );
    });

    it('hauria de tenir opacity 0.7 en mode neutral', () => {
      const { getByText, getByTestId } = render(<BadgeCondition condition="bé" neutral={true} />);
      
      const badge = getByTestId('badge-container');
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          opacity: 0.7,
        })
      );
    });

    it('hauria d\'ignorar colors de condició en mode neutral', () => {
      const { getByText, getByTestId } = render(<BadgeCondition condition="pobre" neutral={true} />);
      
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
      const { getByText, getByTestId } = render(<BadgeCondition condition="bé" muted={true} />);
      
      const textElement = getByText('bé');
      expect(textElement.props.style).toContainEqual(
        expect.objectContaining({
          color: '#6B7280', // color de text muted
        })
      );
    });

    it('hauria de mantenir colors de fons originals en mode muted', () => {
      const { getByText, getByTestId } = render(<BadgeCondition condition="bé" muted={true} />);
      
      const badge = getByTestId('badge-container');
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#A2FFC8', // colors de fons originals
          borderColor: '#30D270',
        })
      );
    });

    it('hauria d\'aplicar muted a condició "pobre"', () => {
      const { getByText, getByTestId } = render(<BadgeCondition condition="pobre" muted={true} />);
      
      const badge = getByTestId('badge-container');
      const textElement = getByText('pobre');

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
      const { getByText, getByTestId } = render(
        <BadgeCondition condition="bé" neutral={true} muted={true} />
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
      const { getByText, getByTestId } = render(
        <BadgeCondition condition="bé" style={customStyle} />
      );
      
      const badge = getByTestId('badge-container');
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining(customStyle)
      );
    });

    it('hauria de combinar estils personalitzats amb estils per defecte', () => {
      const customStyle = { padding: 5 };
      const { getByText, getByTestId } = render(
        <BadgeCondition condition="normal" style={customStyle} />
      );
      
      const badge = getByTestId('badge-container');
      // React Native combines styles as an array, check for both properties separately
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#e0ebffff', // estil per defecte
        })
      );
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          padding: 5, // estil personalitzat
        })
      );
    });
  });

  describe('Case insensitivity', () => {
    it('hauria de reconèixer condicions en majúscules', () => {
      const { getByText, getByTestId } = render(<BadgeCondition condition="BÉ" />);
      
      const badge = getByTestId('badge-container');
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#A2FFC8',
        })
      );
    });

    it('hauria de reconèixer condicions en minúscules', () => {
      const { getByText, getByTestId } = render(<BadgeCondition condition="pobre" />);
      
      const badge = getByTestId('badge-container');
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#FEE2E2',
        })
      );
    });

    it('hauria de reconèixer condicions amb barreja de majúscules i minúscules', () => {
      const { getByText, getByTestId } = render(<BadgeCondition condition="ExCeL·LeNt" />);
      
      const badge = getByTestId('badge-container');
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#A2FFC8',
        })
      );
    });
  });

  describe('Casos límit', () => {
    it('hauria de gestionar condicions amb espais', () => {
      const { getByText, getByTestId } = render(<BadgeCondition condition="  bé  " />);
      
      expect(getByText('  bé  ')).toBeTruthy();
    });

    it('hauria de gestionar condicions amb caràcters especials', () => {
      const { getByText, getByTestId } = render(<BadgeCondition condition="bé-ok" />);
      
      expect(getByText('bé-ok')).toBeTruthy();
    });

    it('hauria de gestionar múltiples condicions en una string', () => {
      const { getByText, getByTestId } = render(<BadgeCondition condition="normal i bé" />);
      
      // Hauria de reconèixer la primera paraula clau que trobi (bé es comprova primer)
      const badge = getByTestId('badge-container');
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#A2FFC8', // colors de "bé" (es comprova primer)
        })
      );
    });
  });

  describe('Totes les condicions', () => {
    const testCases = [
      { condition: 'bé', expectedBg: '#A2FFC8' },
      { condition: 'bo', expectedBg: '#A2FFC8' },
      { condition: 'good', expectedBg: '#A2FFC8' },
      { condition: 'ok', expectedBg: '#A2FFC8' },
      { condition: 'excel·lent', expectedBg: '#A2FFC8' },
      { condition: 'normal', expectedBg: '#e0ebffff' },
      { condition: 'regular', expectedBg: '#e0ebffff' },
      { condition: 'pobre', expectedBg: '#FEE2E2' },
    ];

    testCases.forEach(({ condition, expectedBg }) => {
      it(`hauria d'aplicar el color correcte per "${condition}"`, () => {
        const { getByText, getByTestId } = render(<BadgeCondition condition={condition} />);
        
        const badge = getByTestId('badge-container');
        expect(badge?.props.style).toContainEqual(
          expect.objectContaining({
            backgroundColor: expectedBg,
          })
        );
      });
    });
  });

  describe('Snapshot testing', () => {
    it('hauria de coincidir amb el snapshot amb condició "bé"', () => {
      const tree = render(<BadgeCondition condition="bé" />).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('hauria de coincidir amb el snapshot en mode neutral', () => {
      const tree = render(<BadgeCondition condition="bé" neutral={true} />).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('hauria de coincidir amb el snapshot en mode muted', () => {
      const tree = render(<BadgeCondition condition="bé" muted={true} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
  });
});

