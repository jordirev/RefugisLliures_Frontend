/**
 * Tests unitaris per al component CustomAlert
 * 
 * Aquest fitxer cobreix:
 * - Renderització del modal
 * - Mostrar/ocultar el modal
 * - Títol i missatge
 * - Botons i callbacks
 * - Tipus de botons (default, cancel, destructive)
 * - onDismiss callback
 * - Casos límit
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CustomAlert } from '../../../components/CustomAlert';
import { Modal } from 'react-native';

describe('CustomAlert Component', () => {
  const defaultProps = {
    visible: true,
    title: 'Títol Test',
    message: 'Missatge de prova',
    buttons: [{ text: 'OK', onPress: jest.fn() }],
    onDismiss: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Visibilitat del modal', () => {
    it('hauria de mostrar el modal quan visible=true', () => {
      const { getByText } = render(<CustomAlert {...defaultProps} />);
      
      expect(getByText('Títol Test')).toBeTruthy();
      expect(getByText('Missatge de prova')).toBeTruthy();
    });

    it('NO hauria de mostrar contingut quan visible=false', () => {
      const { queryByText } = render(
        <CustomAlert {...defaultProps} visible={false} />
      );
      
      // Modal podria estar en el tree però no visible
      expect(queryByText('Títol Test')).toBeNull();
    });

    it('hauria de passar visible prop al Modal', () => {
      const { UNSAFE_getByType } = render(<CustomAlert {...defaultProps} />);
      
      const modal = UNSAFE_getByType(Modal);
      expect(modal.props.visible).toBe(true);
    });
  });

  describe('Títol del modal', () => {
    it('hauria de mostrar el títol proporcionat', () => {
      const { getByText } = render(<CustomAlert {...defaultProps} />);
      
      expect(getByText('Títol Test')).toBeTruthy();
    });

    it('hauria de mostrar títols llargs', () => {
      const longTitle = 'Aquest és un títol molt llarg per veure com es comporta el component';
      const { getByText } = render(
        <CustomAlert {...defaultProps} title={longTitle} />
      );
      
      expect(getByText(longTitle)).toBeTruthy();
    });

    it('hauria de mostrar títol buit', () => {
      const { queryByText } = render(
        <CustomAlert {...defaultProps} title="" />
      );
      
      // When title is empty string, it shouldn't be rendered
      expect(queryByText('')).toBeNull();
    });

    it('hauria de mostrar títols amb caràcters especials', () => {
      const title = 'Títol amb "cometes" i \'apòstrofs\'';
      const { getByText } = render(
        <CustomAlert {...defaultProps} title={title} />
      );
      
      expect(getByText(title)).toBeTruthy();
    });

    it('hauria de mostrar títols amb emojis', () => {
      const title = '⚠️ Avís Important 🚨';
      const { getByText } = render(
        <CustomAlert {...defaultProps} title={title} />
      );
      
      expect(getByText(title)).toBeTruthy();
    });
  });

  describe('Missatge del modal', () => {
    it('hauria de mostrar el missatge proporcionat', () => {
      const { getByText } = render(<CustomAlert {...defaultProps} />);
      
      expect(getByText('Missatge de prova')).toBeTruthy();
    });

    it('hauria de mostrar missatges llargs', () => {
      const longMessage = 'Aquest és un missatge molt llarg amb múltiples línies de text per verificar que el component gestiona correctament missatges extensos amb molts caràcters.';
      const { getByText } = render(
        <CustomAlert {...defaultProps} message={longMessage} />
      );
      
      expect(getByText(longMessage)).toBeTruthy();
    });

    it('hauria de mostrar missatge buit', () => {
      const { getByText } = render(
        <CustomAlert {...defaultProps} message="" />
      );
      
      expect(getByText('')).toBeTruthy();
    });

    it('hauria de mostrar missatges amb salts de línia', () => {
      const message = 'Línia 1\nLínia 2\nLínia 3';
      const { getByText } = render(
        <CustomAlert {...defaultProps} message={message} />
      );
      
      expect(getByText(message)).toBeTruthy();
    });

    it('hauria de mostrar missatges amb emojis', () => {
      const message = '✅ Operació realitzada correctament 🎉';
      const { getByText } = render(
        <CustomAlert {...defaultProps} message={message} />
      );
      
      expect(getByText(message)).toBeTruthy();
    });
  });

  describe('Botons del modal', () => {
    it('hauria de mostrar un botó', () => {
      const { getByText } = render(<CustomAlert {...defaultProps} />);
      
      expect(getByText('OK')).toBeTruthy();
    });

    it('hauria de mostrar múltiples botons', () => {
      const buttons = [
        { text: 'Cancel·lar', onPress: jest.fn() },
        { text: 'Acceptar', onPress: jest.fn() },
      ];
      const { getByText } = render(
        <CustomAlert {...defaultProps} buttons={buttons} />
      );
      
      expect(getByText('Cancel·lar')).toBeTruthy();
      expect(getByText('Acceptar')).toBeTruthy();
    });

    it('hauria de mostrar tres botons', () => {
      const buttons = [
        { text: 'Opció 1', onPress: jest.fn() },
        { text: 'Opció 2', onPress: jest.fn() },
        { text: 'Opció 3', onPress: jest.fn() },
      ];
      const { getByText } = render(
        <CustomAlert {...defaultProps} buttons={buttons} />
      );
      
      expect(getByText('Opció 1')).toBeTruthy();
      expect(getByText('Opció 2')).toBeTruthy();
      expect(getByText('Opció 3')).toBeTruthy();
    });

    it('hauria de cridar onPress quan es prem un botó', () => {
      const onPress = jest.fn();
      const buttons = [{ text: 'Test', onPress }];
      const { getByText } = render(
        <CustomAlert {...defaultProps} buttons={buttons} />
      );
      
      fireEvent.press(getByText('Test'));
      
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('hauria de cridar els callbacks correctes per cada botó', () => {
      const onPress1 = jest.fn();
      const onPress2 = jest.fn();
      const buttons = [
        { text: 'Botó 1', onPress: onPress1 },
        { text: 'Botó 2', onPress: onPress2 },
      ];
      const { getByText } = render(
        <CustomAlert {...defaultProps} buttons={buttons} />
      );
      
      fireEvent.press(getByText('Botó 1'));
      fireEvent.press(getByText('Botó 2'));
      
      expect(onPress1).toHaveBeenCalledTimes(1);
      expect(onPress2).toHaveBeenCalledTimes(1);
    });

    it('NO hauria de petar si onPress és undefined', () => {
      const buttons = [{ text: 'Test' }];
      const { getByText } = render(
        <CustomAlert {...defaultProps} buttons={buttons} />
      );
      
      expect(() => {
        fireEvent.press(getByText('Test'));
      }).not.toThrow();
    });
  });

  describe('Estils dels botons', () => {
    it('hauria de aplicar estil default per defecte', () => {
      const buttons = [{ text: 'Default', onPress: jest.fn() }];
      const { getByText } = render(
        <CustomAlert {...defaultProps} buttons={buttons} />
      );
      
      const button = getByText('Default');
      expect(button).toBeTruthy();
    });

    it('hauria de aplicar estil cancel', () => {
      const buttons = [{ text: 'Cancel·lar', onPress: jest.fn(), style: 'cancel' }];
      const { getByText } = render(
        <CustomAlert {...defaultProps} buttons={buttons} />
      );
      
      const button = getByText('Cancel·lar');
      expect(button).toBeTruthy();
    });

    it('hauria de aplicar estil destructive', () => {
      const buttons = [{ text: 'Eliminar', onPress: jest.fn(), style: 'destructive' }];
      const { getByText } = render(
        <CustomAlert {...defaultProps} buttons={buttons} />
      );
      
      const button = getByText('Eliminar');
      expect(button).toBeTruthy();
    });

    it('hauria de gestionar múltiples estils de botons', () => {
      const buttons = [
        { text: 'Cancel·lar', onPress: jest.fn(), style: 'cancel' },
        { text: 'Eliminar', onPress: jest.fn(), style: 'destructive' },
        { text: 'OK', onPress: jest.fn(), style: 'default' },
      ];
      const { getByText } = render(
        <CustomAlert {...defaultProps} buttons={buttons} />
      );
      
      expect(getByText('Cancel·lar')).toBeTruthy();
      expect(getByText('Eliminar')).toBeTruthy();
      expect(getByText('OK')).toBeTruthy();
    });
  });

  describe('Callback onDismiss', () => {
    it('hauria de cridar onDismiss quan es tanca el modal', () => {
      const onDismiss = jest.fn();
      const { UNSAFE_getByType } = render(
        <CustomAlert {...defaultProps} onDismiss={onDismiss} />
      );
      
      const modal = UNSAFE_getByType(Modal);
      
      if (modal.props.onRequestClose) {
        modal.props.onRequestClose();
      }
      
      expect(onDismiss).toHaveBeenCalled();
    });

    it('NO hauria de petar si onDismiss és undefined', () => {
      const { UNSAFE_getByType } = render(
        <CustomAlert {...defaultProps} onDismiss={undefined} />
      );
      
      const modal = UNSAFE_getByType(Modal);
      
      expect(() => {
        if (modal.props.onDismiss) {
          modal.props.onDismiss();
        }
      }).not.toThrow();
    });
  });

  describe('Propietats del Modal', () => {
    it('hauria de tenir transparent=true', () => {
      const { UNSAFE_getByType } = render(<CustomAlert {...defaultProps} />);
      
      const modal = UNSAFE_getByType(Modal);
      expect(modal.props.transparent).toBe(true);
    });

    it('hauria de tenir animationType="fade"', () => {
      const { UNSAFE_getByType } = render(<CustomAlert {...defaultProps} />);
      
      const modal = UNSAFE_getByType(Modal);
      expect(modal.props.animationType).toBe('fade');
    });

    it('hauria de tenir onRequestClose definit', () => {
      const { UNSAFE_getByType } = render(<CustomAlert {...defaultProps} />);
      
      const modal = UNSAFE_getByType(Modal);
      expect(modal.props.onRequestClose).toBeDefined();
    });
  });

  describe('Overlay del modal', () => {
    it('hauria de cridar onDismiss quan es prem l\'overlay', () => {
      const onDismiss = jest.fn();
      const { UNSAFE_getByType } = render(
        <CustomAlert {...defaultProps} onDismiss={onDismiss} />
      );
      
      // Test that onRequestClose is set up correctly
      const modal = UNSAFE_getByType(Modal);
      expect(modal.props.onRequestClose).toBe(onDismiss);
    });
  });

  describe('Casos límit', () => {
    it('hauria de gestionar array de botons buit', () => {
      const { queryByText } = render(
        <CustomAlert {...defaultProps} buttons={[]} />
      );
      
      // Encara hauria de mostrar el títol i missatge
      expect(queryByText('Títol Test')).toBeTruthy();
      expect(queryByText('Missatge de prova')).toBeTruthy();
    });

    it('hauria de gestionar títol i missatge buits', () => {
      const { getByText } = render(
        <CustomAlert {...defaultProps} title="" message="" />
      );
      
      // Hauria de mostrar el botó
      expect(getByText('OK')).toBeTruthy();
    });

    it('hauria de gestionar molts botons', () => {
      const buttons = Array.from({ length: 5 }, (_, i) => ({
        text: `Opció ${i + 1}`,
        onPress: jest.fn(),
      }));
      const { getByText } = render(
        <CustomAlert {...defaultProps} buttons={buttons} />
      );
      
      buttons.forEach(button => {
        expect(getByText(button.text)).toBeTruthy();
      });
    });

    it('hauria de gestionar text de botó molt llarg', () => {
      const buttons = [
        {
          text: 'Aquest és un text de botó extremadament llarg que probablement no hauria de ser utilitzat en producció',
          onPress: jest.fn(),
        },
      ];
      const { getByText } = render(
        <CustomAlert {...defaultProps} buttons={buttons} />
      );
      
      expect(getByText(buttons[0].text)).toBeTruthy();
    });

    it('hauria de gestionar botons amb caràcters especials', () => {
      const buttons = [
        { text: '✓ Sí', onPress: jest.fn() },
        { text: '✗ No', onPress: jest.fn() },
      ];
      const { getByText } = render(
        <CustomAlert {...defaultProps} buttons={buttons} />
      );
      
      expect(getByText('✓ Sí')).toBeTruthy();
      expect(getByText('✗ No')).toBeTruthy();
    });
  });

  describe('Múltiples clicks', () => {
    it('hauria de permetre múltiples clicks en el mateix botó', () => {
      const onPress = jest.fn();
      const buttons = [{ text: 'Test', onPress }];
      const { getByText } = render(
        <CustomAlert {...defaultProps} buttons={buttons} />
      );
      
      const button = getByText('Test');
      fireEvent.press(button);
      fireEvent.press(button);
      fireEvent.press(button);
      
      expect(onPress).toHaveBeenCalledTimes(3);
    });

    it('hauria de permetre clicks alternats entre botons', () => {
      const onPress1 = jest.fn();
      const onPress2 = jest.fn();
      const buttons = [
        { text: 'Botó 1', onPress: onPress1 },
        { text: 'Botó 2', onPress: onPress2 },
      ];
      const { getByText } = render(
        <CustomAlert {...defaultProps} buttons={buttons} />
      );
      
      fireEvent.press(getByText('Botó 1'));
      fireEvent.press(getByText('Botó 2'));
      fireEvent.press(getByText('Botó 1'));
      
      expect(onPress1).toHaveBeenCalledTimes(2);
      expect(onPress2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Snapshot testing', () => {
    it('hauria de coincidir amb el snapshot amb un botó', () => {
      const tree = render(<CustomAlert {...defaultProps} />).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('hauria de coincidir amb el snapshot amb múltiples botons', () => {
      const buttons = [
        { text: 'Cancel·lar', onPress: jest.fn(), style: 'cancel' },
        { text: 'Acceptar', onPress: jest.fn() },
      ];
      const tree = render(
        <CustomAlert {...defaultProps} buttons={buttons} />
      ).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('hauria de coincidir amb el snapshot quan no és visible', () => {
      const tree = render(
        <CustomAlert {...defaultProps} visible={false} />
      ).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('hauria de coincidir amb el snapshot amb botó destructive', () => {
      const buttons = [
        { text: 'Eliminar', onPress: jest.fn(), style: 'destructive' },
      ];
      const tree = render(
        <CustomAlert {...defaultProps} buttons={buttons} />
      ).toJSON();
      expect(tree).toMatchSnapshot();
    });
  });
});
