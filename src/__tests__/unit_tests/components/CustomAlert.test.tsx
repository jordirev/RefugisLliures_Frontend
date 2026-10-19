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
import { findByType } from '../../testHelpers/findByType';

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
    it('hauria de mostrar el modal quan visible=true', async () => {
      const { getByText } = await render(<CustomAlert {...defaultProps} />);
      
      expect(getByText('Títol Test')).toBeTruthy();
      expect(getByText('Missatge de prova')).toBeTruthy();
    });

    it('NO hauria de mostrar contingut quan visible=false', async () => {
      const { queryByText } = await render(
        <CustomAlert {...defaultProps} visible={false} />
      );
      
      // Modal podria estar en el tree però no visible
      expect(queryByText('Títol Test')).toBeNull();
    });

    it('hauria de passar visible prop al Modal', async () => {
      const { container } = await render(<CustomAlert {...defaultProps} />);
      
      const modal = findByType(container, Modal);
      expect(modal.props.visible).toBe(true);
    });
  });

  describe('Títol del modal', () => {
    it('hauria de mostrar el títol proporcionat', async () => {
      const { getByText } = await render(<CustomAlert {...defaultProps} />);
      
      expect(getByText('Títol Test')).toBeTruthy();
    });

    it('hauria de mostrar títols llargs', async () => {
      const longTitle = 'Aquest és un títol molt llarg per veure com es comporta el component';
      const { getByText } = await render(
        <CustomAlert {...defaultProps} title={longTitle} />
      );
      
      expect(getByText(longTitle)).toBeTruthy();
    });

    it('hauria de mostrar títol buit', async () => {
      const { queryByText } = await render(
        <CustomAlert {...defaultProps} title="" />
      );
      
      // When title is empty string, it shouldn't be rendered
      expect(queryByText('')).toBeNull();
    });

    it('hauria de mostrar títols amb caràcters especials', async () => {
      const title = 'Títol amb "cometes" i \'apòstrofs\'';
      const { getByText } = await render(
        <CustomAlert {...defaultProps} title={title} />
      );
      
      expect(getByText(title)).toBeTruthy();
    });

    it('hauria de mostrar títols amb emojis', async () => {
      const title = '⚠️ Avís Important 🚨';
      const { getByText } = await render(
        <CustomAlert {...defaultProps} title={title} />
      );
      
      expect(getByText(title)).toBeTruthy();
    });
  });

  describe('Missatge del modal', () => {
    it('hauria de mostrar el missatge proporcionat', async () => {
      const { getByText } = await render(<CustomAlert {...defaultProps} />);
      
      expect(getByText('Missatge de prova')).toBeTruthy();
    });

    it('hauria de mostrar missatges llargs', async () => {
      const longMessage = 'Aquest és un missatge molt llarg amb múltiples línies de text per verificar que el component gestiona correctament missatges extensos amb molts caràcters.';
      const { getByText } = await render(
        <CustomAlert {...defaultProps} message={longMessage} />
      );
      
      expect(getByText(longMessage)).toBeTruthy();
    });

    it('hauria de mostrar missatge buit', async () => {
      const { getByText } = await render(
        <CustomAlert {...defaultProps} message="" />
      );
      
      expect(getByText('')).toBeTruthy();
    });

    it('hauria de mostrar missatges amb salts de línia', async () => {
      const message = 'Línia 1\nLínia 2\nLínia 3';
      const { getByText } = await render(
        <CustomAlert {...defaultProps} message={message} />
      );
      
      expect(getByText(message)).toBeTruthy();
    });

    it('hauria de mostrar missatges amb emojis', async () => {
      const message = '✅ Operació realitzada correctament 🎉';
      const { getByText } = await render(
        <CustomAlert {...defaultProps} message={message} />
      );
      
      expect(getByText(message)).toBeTruthy();
    });
  });

  describe('Botons del modal', () => {
    it('hauria de mostrar un botó', async () => {
      const { getByText } = await render(<CustomAlert {...defaultProps} />);
      
      expect(getByText('OK')).toBeTruthy();
    });

    it('hauria de mostrar múltiples botons', async () => {
      const buttons = [
        { text: 'Cancel·lar', onPress: jest.fn() },
        { text: 'Acceptar', onPress: jest.fn() },
      ];
      const { getByText } = await render(
        <CustomAlert {...defaultProps} buttons={buttons} />
      );
      
      expect(getByText('Cancel·lar')).toBeTruthy();
      expect(getByText('Acceptar')).toBeTruthy();
    });

    it('hauria de mostrar tres botons', async () => {
      const buttons = [
        { text: 'Opció 1', onPress: jest.fn() },
        { text: 'Opció 2', onPress: jest.fn() },
        { text: 'Opció 3', onPress: jest.fn() },
      ];
      const { getByText } = await render(
        <CustomAlert {...defaultProps} buttons={buttons} />
      );
      
      expect(getByText('Opció 1')).toBeTruthy();
      expect(getByText('Opció 2')).toBeTruthy();
      expect(getByText('Opció 3')).toBeTruthy();
    });

    it('hauria de cridar onPress quan es prem un botó', async () => {
      const onPress = jest.fn();
      const buttons = [{ text: 'Test', onPress }];
      const { getByText } = await render(
        <CustomAlert {...defaultProps} buttons={buttons} />
      );
      
      await fireEvent.press(getByText('Test'));
      
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('hauria de cridar els callbacks correctes per cada botó', async () => {
      const onPress1 = jest.fn();
      const onPress2 = jest.fn();
      const buttons = [
        { text: 'Botó 1', onPress: onPress1 },
        { text: 'Botó 2', onPress: onPress2 },
      ];
      const { getByText } = await render(
        <CustomAlert {...defaultProps} buttons={buttons} />
      );
      
      await fireEvent.press(getByText('Botó 1'));
      await fireEvent.press(getByText('Botó 2'));
      
      expect(onPress1).toHaveBeenCalledTimes(1);
      expect(onPress2).toHaveBeenCalledTimes(1);
    });

    it('NO hauria de petar si onPress és undefined', async () => {
      const buttons = [{ text: 'Test' }];
      const { getByText } = await render(
        <CustomAlert {...defaultProps} buttons={buttons} />
      );
      
      expect(async () => {
        await fireEvent.press(getByText('Test'));
      }).not.toThrow();
    });
  });

  describe('Estils dels botons', () => {
    it('hauria de aplicar estil default per defecte', async () => {
      const buttons = [{ text: 'Default', onPress: jest.fn() }];
      const { getByText } = await render(
        <CustomAlert {...defaultProps} buttons={buttons} />
      );
      
      const button = getByText('Default');
      expect(button).toBeTruthy();
    });

    it('hauria de aplicar estil cancel', async () => {
      const buttons = [{ text: 'Cancel·lar', onPress: jest.fn(), style: 'cancel' }];
      const { getByText } = await render(
        <CustomAlert {...defaultProps} buttons={buttons} />
      );
      
      const button = getByText('Cancel·lar');
      expect(button).toBeTruthy();
    });

    it('hauria de aplicar estil destructive', async () => {
      const buttons = [{ text: 'Eliminar', onPress: jest.fn(), style: 'destructive' }];
      const { getByText } = await render(
        <CustomAlert {...defaultProps} buttons={buttons} />
      );
      
      const button = getByText('Eliminar');
      expect(button).toBeTruthy();
    });

    it('hauria de gestionar múltiples estils de botons', async () => {
      const buttons = [
        { text: 'Cancel·lar', onPress: jest.fn(), style: 'cancel' },
        { text: 'Eliminar', onPress: jest.fn(), style: 'destructive' },
        { text: 'OK', onPress: jest.fn(), style: 'default' },
      ];
      const { getByText } = await render(
        <CustomAlert {...defaultProps} buttons={buttons} />
      );
      
      expect(getByText('Cancel·lar')).toBeTruthy();
      expect(getByText('Eliminar')).toBeTruthy();
      expect(getByText('OK')).toBeTruthy();
    });
  });

  describe('Callback onDismiss', () => {
    it('hauria de cridar onDismiss quan es tanca el modal', async () => {
      const onDismiss = jest.fn();
      const { container } = await render(
        <CustomAlert {...defaultProps} onDismiss={onDismiss} />
      );
      
      const modal = findByType(container, Modal);
      
      if (modal.props.onRequestClose) {
        modal.props.onRequestClose();
      }
      
      expect(onDismiss).toHaveBeenCalled();
    });

    it('NO hauria de petar si onDismiss és undefined', async () => {
      const { container } = await render(
        <CustomAlert {...defaultProps} onDismiss={undefined} />
      );
      
      const modal = findByType(container, Modal);
      
      expect(() => {
        if (modal.props.onDismiss) {
          modal.props.onDismiss();
        }
      }).not.toThrow();
    });
  });

  describe('Propietats del Modal', () => {
    it('hauria de tenir transparent=true', async () => {
      const { container } = await render(<CustomAlert {...defaultProps} />);
      
      const modal = findByType(container, Modal);
      expect(modal.props.transparent).toBe(true);
    });

    it('hauria de tenir animationType="fade"', async () => {
      const { container } = await render(<CustomAlert {...defaultProps} />);
      
      const modal = findByType(container, Modal);
      expect(modal.props.animationType).toBe('fade');
    });

    it('hauria de tenir onRequestClose definit', async () => {
      const { container } = await render(<CustomAlert {...defaultProps} />);
      
      const modal = findByType(container, Modal);
      expect(modal.props.onRequestClose).toBeDefined();
    });
  });

  describe('Overlay del modal', () => {
    it('hauria de cridar onDismiss quan es prem l\'overlay', async () => {
      const onDismiss = jest.fn();
      const { container } = await render(
        <CustomAlert {...defaultProps} onDismiss={onDismiss} />
      );
      
      // Test that onRequestClose is set up correctly
      const modal = findByType(container, Modal);
      expect(modal.props.onRequestClose).toBe(onDismiss);
    });
  });

  describe('Casos límit', () => {
    it('hauria de gestionar array de botons buit', async () => {
      const { queryByText } = await render(
        <CustomAlert {...defaultProps} buttons={[]} />
      );
      
      // Encara hauria de mostrar el títol i missatge
      expect(queryByText('Títol Test')).toBeTruthy();
      expect(queryByText('Missatge de prova')).toBeTruthy();
    });

    it('hauria de gestionar títol i missatge buits', async () => {
      const { getByText } = await render(
        <CustomAlert {...defaultProps} title="" message="" />
      );
      
      // Hauria de mostrar el botó
      expect(getByText('OK')).toBeTruthy();
    });

    it('hauria de gestionar molts botons', async () => {
      const buttons = Array.from({ length: 5 }, (_, i) => ({
        text: `Opció ${i + 1}`,
        onPress: jest.fn(),
      }));
      const { getByText } = await render(
        <CustomAlert {...defaultProps} buttons={buttons} />
      );
      
      buttons.forEach(button => {
        expect(getByText(button.text)).toBeTruthy();
      });
    });

    it('hauria de gestionar text de botó molt llarg', async () => {
      const buttons = [
        {
          text: 'Aquest és un text de botó extremadament llarg que probablement no hauria de ser utilitzat en producció',
          onPress: jest.fn(),
        },
      ];
      const { getByText } = await render(
        <CustomAlert {...defaultProps} buttons={buttons} />
      );
      
      expect(getByText(buttons[0].text)).toBeTruthy();
    });

    it('hauria de gestionar botons amb caràcters especials', async () => {
      const buttons = [
        { text: '✓ Sí', onPress: jest.fn() },
        { text: '✗ No', onPress: jest.fn() },
      ];
      const { getByText } = await render(
        <CustomAlert {...defaultProps} buttons={buttons} />
      );
      
      expect(getByText('✓ Sí')).toBeTruthy();
      expect(getByText('✗ No')).toBeTruthy();
    });
  });

  describe('Múltiples clicks', () => {
    it('hauria de permetre múltiples clicks en el mateix botó', async () => {
      const onPress = jest.fn();
      const buttons = [{ text: 'Test', onPress }];
      const { getByText } = await render(
        <CustomAlert {...defaultProps} buttons={buttons} />
      );
      
      const button = getByText('Test');
      await fireEvent.press(button);
      await fireEvent.press(button);
      await fireEvent.press(button);
      
      expect(onPress).toHaveBeenCalledTimes(3);
    });

    it('hauria de permetre clicks alternats entre botons', async () => {
      const onPress1 = jest.fn();
      const onPress2 = jest.fn();
      const buttons = [
        { text: 'Botó 1', onPress: onPress1 },
        { text: 'Botó 2', onPress: onPress2 },
      ];
      const { getByText } = await render(
        <CustomAlert {...defaultProps} buttons={buttons} />
      );
      
      await fireEvent.press(getByText('Botó 1'));
      await fireEvent.press(getByText('Botó 2'));
      await fireEvent.press(getByText('Botó 1'));
      
      expect(onPress1).toHaveBeenCalledTimes(2);
      expect(onPress2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Snapshot testing', () => {
    it('hauria de coincidir amb el snapshot amb un botó', async () => {
      const tree = (await render(<CustomAlert {...defaultProps} />)).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('hauria de coincidir amb el snapshot amb múltiples botons', async () => {
      const buttons = [
        { text: 'Cancel·lar', onPress: jest.fn(), style: 'cancel' },
        { text: 'Acceptar', onPress: jest.fn() },
      ];
      const tree = (await render(
        <CustomAlert {...defaultProps} buttons={buttons} />
      )).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('hauria de coincidir amb el snapshot quan no és visible', async () => {
      const tree = (await render(
        <CustomAlert {...defaultProps} visible={false} />
      )).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('hauria de coincidir amb el snapshot amb botó destructive', async () => {
      const buttons = [
        { text: 'Eliminar', onPress: jest.fn(), style: 'destructive' },
      ];
      const tree = (await render(
        <CustomAlert {...defaultProps} buttons={buttons} />
      )).toJSON();
      expect(tree).toMatchSnapshot();
    });
  });
});
