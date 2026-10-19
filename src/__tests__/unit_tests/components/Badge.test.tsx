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
    it('hauria de renderitzar amb text', async () => {
      const { getByText } = await render(<Badge text="Test Badge" />);
      
      expect(getByText('Test Badge')).toBeTruthy();
    });

    it('hauria de renderitzar amb els colors per defecte', async () => {
      const { getByText, getByTestId } = await render(<Badge text="Test" testID="badge-container" />);
      
      const badge = getByTestId("badge-container");
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#A2FFC8',
          borderColor: '#30D270',
        })
      );
    });

    it('hauria de aplicar el color de text per defecte', async () => {
      const { getByText } = await render(<Badge text="Test" testID="badge-container" />);
      
      const textElement = getByText('Test');
      expect(textElement.props.style).toContainEqual(
        expect.objectContaining({
          color: '#007931',
        })
      );
    });
  });

  describe('Props de colors personalitzats', () => {
    it('hauria d\'aplicar background personalitzat', async () => {
      const { getByText, getByTestId } = await render(
        <Badge text="Test" testID="badge-container" background="#FF0000" />
      );
      
      const badge = getByTestId("badge-container");
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#FF0000',
        })
      );
    });

    it('hauria d\'aplicar color de text personalitzat', async () => {
      const { getByText } = await render(
        <Badge text="Test" color="#FFFFFF" />
      );
      
      const textElement = getByText('Test');
      expect(textElement.props.style).toContainEqual(
        expect.objectContaining({
          color: '#FFFFFF',
        })
      );
    });

    it('hauria d\'aplicar borderColor personalitzat', async () => {
      const { getByText, getByTestId } = await render(
        <Badge text="Test" testID="badge-container" borderColor="#0000FF" />
      );
      
      const badge = getByTestId("badge-container");
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          borderColor: '#0000FF',
        })
      );
    });

    it('hauria d\'aplicar múltiples colors personalitzats alhora', async () => {
      const { getByText, getByTestId } = await render(
        <Badge 
          text="Test" 
          testID="badge-container"
          background="#123456"
          color="#ABCDEF"
          borderColor="#FEDCBA"
        />
      );
      
      const badge = getByTestId("badge-container");
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
    it('hauria d\'usar textColor quan es proporciona', async () => {
      const { getByText } = await render(
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

    it('hauria d\'usar color quan textColor és undefined', async () => {
      const { getByText } = await render(
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
    it('hauria d\'aplicar containerStyle personalitzat', async () => {
      const customStyle = { marginTop: 10, marginBottom: 20 };
      const { getByText, getByTestId } = await render(
        <Badge text="Test" testID="badge-container" containerStyle={customStyle} />
      );
      
      const badge = getByTestId("badge-container");
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining(customStyle)
      );
    });

    it('hauria d\'aplicar textStyle personalitzat', async () => {
      const customStyle = { fontSize: 16, fontWeight: '700' as const };
      const { getByText } = await render(
        <Badge text="Test" textStyle={customStyle} />
      );
      
      const textElement = getByText('Test');
      expect(textElement.props.style).toContainEqual(
        expect.objectContaining(customStyle)
      );
    });

    it('hauria de combinar containerStyle amb estils per defecte', async () => {
      const customStyle = { opacity: 0.8 };
      const { getByText, getByTestId } = await render(
        <Badge text="Test" testID="badge-container" containerStyle={customStyle} />
      );
      
      const badge = getByTestId("badge-container");
      // Check that both backgroundColor and opacity exist in the style array
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#A2FFC8', // estil per defecte
        })
      );
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          opacity: 0.8, // estil personalitzat
        })
      );
    });
  });

  describe('Gestió de text invalid', () => {
    it('hauria de renderitzar string buit quan text és null', async () => {
      const { getByText } = await render(<Badge text={null as any} />);
      
      expect(getByText('')).toBeTruthy();
    });

    it('hauria de renderitzar string buit quan text és undefined', async () => {
      const { getByText } = await render(<Badge text={undefined as any} />);
      
      expect(getByText('')).toBeTruthy();
    });

    it('hauria de convertir números a string', async () => {
      const { getByText } = await render(<Badge text={123 as any} />);
      
      expect(getByText('123')).toBeTruthy();
    });

    it('hauria de convertir booleans a string', async () => {
      const { getByText: getByTextTrue } = await render(<Badge text={true as any} />);
      expect(getByTextTrue('true')).toBeTruthy();

      const { getByText: getByTextFalse } = await render(<Badge text={false as any} />);
      expect(getByTextFalse('false')).toBeTruthy();
    });

    it('hauria de gestionar string buit', async () => {
      const { getByText } = await render(<Badge text="" />);
      
      expect(getByText('')).toBeTruthy();
    });
  });

  describe('Casos límit', () => {
    it('hauria de renderitzar text molt llarg', async () => {
      const longText = 'A'.repeat(1000);
      const { getByText } = await render(<Badge text={longText} />);
      
      expect(getByText(longText)).toBeTruthy();
    });

    it('hauria de gestionar text amb caràcters especials', async () => {
      const specialText = '<>&"\'àèìòù ñ ç';
      const { getByText } = await render(<Badge text={specialText} />);
      
      expect(getByText(specialText)).toBeTruthy();
    });

    it('hauria de gestionar text amb emojis', async () => {
      const emojiText = '🏔️ Refugi ✅';
      const { getByText } = await render(<Badge text={emojiText} />);
      
      expect(getByText(emojiText)).toBeTruthy();
    });

    it('hauria de gestionar text amb salts de línia', async () => {
      const multilineText = 'Línia 1\nLínia 2\nLínia 3';
      const { getByText } = await render(<Badge text={multilineText} />);
      
      expect(getByText(multilineText)).toBeTruthy();
    });

    it('hauria de gestionar text amb espais', async () => {
      const spacedText = '   Text amb espais   ';
      const { getByText } = await render(<Badge text={spacedText} />);
      
      expect(getByText(spacedText)).toBeTruthy();
    });
  });

  describe('Propietats de borderWidth', () => {
    it('hauria de tenir borderWidth de 1.25', async () => {
      const { getByText, getByTestId } = await render(<Badge text="Test" testID="badge-container" />);
      
      const badge = getByTestId("badge-container");
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          borderWidth: 1.25,
        })
      );
    });
  });

  describe('Colors en diferents formats', () => {
    it('hauria d\'acceptar colors en format hex', async () => {
      const { getByText, getByTestId } = await render(
        <Badge text="Test" testID="badge-container" background="#FF5733" color="#C70039" />
      );
      
      const badge = getByTestId("badge-container");
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#FF5733',
        })
      );
    });

    it('hauria d\'acceptar colors en format rgb', async () => {
      const { getByText, getByTestId } = await render(
        <Badge 
          text="Test" 
          testID="badge-container"
          background="rgb(255, 87, 51)" 
          color="rgb(199, 0, 57)"
        />
      );
      
      const badge = getByTestId("badge-container");
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: 'rgb(255, 87, 51)',
        })
      );
    });

    it('hauria d\'acceptar colors en format rgba', async () => {
      const { getByText, getByTestId } = await render(
        <Badge 
          text="Test" 
          testID="badge-container"
          background="rgba(255, 87, 51, 0.5)" 
          color="rgba(199, 0, 57, 1)"
        />
      );
      
      const badge = getByTestId("badge-container");
      expect(badge?.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: 'rgba(255, 87, 51, 0.5)',
        })
      );
    });

    it('hauria d\'acceptar colors amb noms', async () => {
      const { getByText, getByTestId } = await render(
        <Badge text="Test" testID="badge-container" background="red" color="white" borderColor="blue" />
      );
      
      const badge = getByTestId("badge-container");
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
    it('hauria de coincidir amb el snapshot amb props per defecte', async () => {
      const tree = (await render(<Badge text="Snapshot Test" />)).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('hauria de coincidir amb el snapshot amb props personalitzades', async () => {
      const tree = (await render(
        <Badge 
          text="Custom Badge"
          background="#123456"
          color="#FFFFFF"
          borderColor="#ABCDEF"
          containerStyle={{ margin: 10 }}
          textStyle={{ fontSize: 14 }}
        />
      )).toJSON();
      expect(tree).toMatchSnapshot();
    });
  });
});


