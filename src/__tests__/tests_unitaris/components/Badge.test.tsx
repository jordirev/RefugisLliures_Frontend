/**
 * Tests unitaris per al component Badge
 * 
 * Aquest fitxer cobreix:
 * - Renderització bàsica del component
 * - Props (text, background, color, borderColor)
 * - Estils personalitzats (containerStyle, textStyle)
 * - textColor override
 * - Gestió de text invalid (null, undefined)
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Badge } from '../../../components/Badge';

describe('Badge Component', () => {
  describe('Renderització bàsica', () => {
    it('hauria de renderitzar amb text', () => {
      const { getByText } = render(<Badge text="Test Badge" />);
      
      expect(getByText('Test Badge')).toBeTruthy();
    });

    it('hauria de renderitzar amb els colors per defecte', () => {
      const { getByText } = render(<Badge text="Test" />);
      
      const badge = getByText('Test').parent;
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#A2FFC8',
          borderColor: '#30D270',
        })
      );
    });

    it('hauria de aplicar el color de text per defecte', () => {
      const { getByText } = render(<Badge text="Test" />);
      
      const textElement = getByText('Test');
      expect(textElement.props.style).toContainEqual(
        expect.objectContaining({
          color: '#007931',
        })
      );
    });
  });

  describe('Props de colors personalitzats', () => {
    it('hauria d\'aplicar background personalitzat', () => {
      const { getByText } = render(
        <Badge text="Test" background="#FF0000" />
      );
      
      const badge = getByText('Test').parent;
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#FF0000',
        })
      );
    });

    it('hauria d\'aplicar color de text personalitzat', () => {
      const { getByText } = render(
        <Badge text="Test" color="#FFFFFF" />
      );
      
      const textElement = getByText('Test');
      expect(textElement.props.style).toContainEqual(
        expect.objectContaining({
          color: '#FFFFFF',
        })
      );
    });

    it('hauria d\'aplicar borderColor personalitzat', () => {
      const { getByText } = render(
        <Badge text="Test" borderColor="#0000FF" />
      );
      
      const badge = getByText('Test').parent;
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          borderColor: '#0000FF',
        })
      );
    });

    it('hauria d\'aplicar múltiples colors personalitzats alhora', () => {
      const { getByText } = render(
        <Badge 
          text="Test" 
          background="#123456"
          color="#ABCDEF"
          borderColor="#FEDCBA"
        />
      );
      
      const badge = getByText('Test').parent;
      const textElement = getByText('Test');

      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#123456',
          borderColor: '#FEDCBA',
        })
      );
      expect(textElement.props.style).toContainEqual(
        expect.objectContaining({
          color: '#ABCDEF',
        })
      );
    });
  });

  describe('textColor override', () => {
    it('hauria d\'usar textColor quan es proporciona', () => {
      const { getByText } = render(
        <Badge 
          text="Test" 
          color="#FF0000"
          textColor="#00FF00"
        />
      );
      
      const textElement = getByText('Test');
      expect(textElement.props.style).toContainEqual(
        expect.objectContaining({
          color: '#00FF00', // textColor té prioritat
        })
      );
    });

    it('hauria d\'usar color quan textColor és undefined', () => {
      const { getByText } = render(
        <Badge 
          text="Test" 
          color="#FF0000"
          textColor={undefined}
        />
      );
      
      const textElement = getByText('Test');
      expect(textElement.props.style).toContainEqual(
        expect.objectContaining({
          color: '#FF0000',
        })
      );
    });
  });

  describe('Estils personalitzats', () => {
    it('hauria d\'aplicar containerStyle personalitzat', () => {
      const customStyle = { marginTop: 10, marginBottom: 20 };
      const { getByText } = render(
        <Badge text="Test" containerStyle={customStyle} />
      );
      
      const badge = getByText('Test').parent;
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining(customStyle)
      );
    });

    it('hauria d\'aplicar textStyle personalitzat', () => {
      const customStyle = { fontSize: 16, fontWeight: '700' };
      const { getByText } = render(
        <Badge text="Test" textStyle={customStyle} />
      );
      
      const textElement = getByText('Test');
      expect(textElement.props.style).toContainEqual(
        expect.objectContaining(customStyle)
      );
    });

    it('hauria de combinar containerStyle amb estils per defecte', () => {
      const customStyle = { opacity: 0.8 };
      const { getByText } = render(
        <Badge text="Test" containerStyle={customStyle} />
      );
      
      const badge = getByText('Test').parent;
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#A2FFC8', // estil per defecte
          opacity: 0.8, // estil personalitzat
        })
      );
    });
  });

  describe('Gestió de text invalid', () => {
    it('hauria de renderitzar string buit quan text és null', () => {
      const { getByText } = render(<Badge text={null as any} />);
      
      expect(getByText('null')).toBeTruthy();
    });

    it('hauria de renderitzar string buit quan text és undefined', () => {
      const { getByText } = render(<Badge text={undefined as any} />);
      
      expect(getByText('undefined')).toBeTruthy();
    });

    it('hauria de convertir números a string', () => {
      const { getByText } = render(<Badge text={123 as any} />);
      
      expect(getByText('123')).toBeTruthy();
    });

    it('hauria de convertir booleans a string', () => {
      const { getByText: getByTextTrue } = render(<Badge text={true as any} />);
      expect(getByTextTrue('true')).toBeTruthy();

      const { getByText: getByTextFalse } = render(<Badge text={false as any} />);
      expect(getByTextFalse('false')).toBeTruthy();
    });

    it('hauria de gestionar string buit', () => {
      const { getByText } = render(<Badge text="" />);
      
      expect(getByText('')).toBeTruthy();
    });
  });

  describe('Casos límit', () => {
    it('hauria de renderitzar text molt llarg', () => {
      const longText = 'A'.repeat(1000);
      const { getByText } = render(<Badge text={longText} />);
      
      expect(getByText(longText)).toBeTruthy();
    });

    it('hauria de gestionar text amb caràcters especials', () => {
      const specialText = '<>&"\'àèìòù ñ ç';
      const { getByText } = render(<Badge text={specialText} />);
      
      expect(getByText(specialText)).toBeTruthy();
    });

    it('hauria de gestionar text amb emojis', () => {
      const emojiText = '🏔️ Refugi ✅';
      const { getByText } = render(<Badge text={emojiText} />);
      
      expect(getByText(emojiText)).toBeTruthy();
    });

    it('hauria de gestionar text amb salts de línia', () => {
      const multilineText = 'Línia 1\nLínia 2\nLínia 3';
      const { getByText } = render(<Badge text={multilineText} />);
      
      expect(getByText(multilineText)).toBeTruthy();
    });

    it('hauria de gestionar text amb espais', () => {
      const spacedText = '   Text amb espais   ';
      const { getByText } = render(<Badge text={spacedText} />);
      
      expect(getByText(spacedText)).toBeTruthy();
    });
  });

  describe('Propietats de borderWidth', () => {
    it('hauria de tenir borderWidth de 1.25', () => {
      const { getByText } = render(<Badge text="Test" />);
      
      const badge = getByText('Test').parent;
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          borderWidth: 1.25,
        })
      );
    });
  });

  describe('Colors en diferents formats', () => {
    it('hauria d\'acceptar colors en format hex', () => {
      const { getByText } = render(
        <Badge text="Test" background="#FF5733" color="#C70039" />
      );
      
      const badge = getByText('Test').parent;
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#FF5733',
        })
      );
    });

    it('hauria d\'acceptar colors en format rgb', () => {
      const { getByText } = render(
        <Badge 
          text="Test" 
          background="rgb(255, 87, 51)" 
          color="rgb(199, 0, 57)"
        />
      );
      
      const badge = getByText('Test').parent;
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: 'rgb(255, 87, 51)',
        })
      );
    });

    it('hauria d\'acceptar colors en format rgba', () => {
      const { getByText } = render(
        <Badge 
          text="Test" 
          background="rgba(255, 87, 51, 0.5)" 
          color="rgba(199, 0, 57, 1)"
        />
      );
      
      const badge = getByText('Test').parent;
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: 'rgba(255, 87, 51, 0.5)',
        })
      );
    });

    it('hauria d\'acceptar colors amb noms', () => {
      const { getByText } = render(
        <Badge text="Test" background="red" color="white" borderColor="blue" />
      );
      
      const badge = getByText('Test').parent;
      const textElement = getByText('Test');

      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: 'red',
          borderColor: 'blue',
        })
      );
      expect(textElement.props.style).toContainEqual(
        expect.objectContaining({
          color: 'white',
        })
      );
    });
  });

  describe('Snapshot testing', () => {
    it('hauria de coincidir amb el snapshot amb props per defecte', () => {
      const tree = render(<Badge text="Snapshot Test" />).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('hauria de coincidir amb el snapshot amb props personalitzades', () => {
      const tree = render(
        <Badge 
          text="Custom Badge"
          background="#123456"
          color="#FFFFFF"
          borderColor="#ABCDEF"
          containerStyle={{ margin: 10 }}
          textStyle={{ fontSize: 14 }}
        />
      ).toJSON();
      expect(tree).toMatchSnapshot();
    });
  });
});
