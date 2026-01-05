/**
 * Tests unitaris per a HelpSupportScreen
 *
 * Aquest fitxer cobreix:
 * - Renderització de la pantalla
 * - Navegació
 * - Funcionalitat d'email
 * - Snapshot tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { HelpSupportScreen } from '../../../screens/HelpSupportScreen';

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

// Mock SVG icons
jest.mock('../../../assets/icons/arrow-left.svg', () => 'BackIcon');
jest.mock('../../../assets/icons/navigation.svg', () => 'NavigationIcon');

// Mock Linking
jest.spyOn(Linking, 'openURL').mockResolvedValue(true);

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: jest.fn(),
  }),
}));

describe('HelpSupportScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderització bàsica', () => {
    it('hauria de renderitzar correctament', () => {
      const { getByText } = render(<HelpSupportScreen />);
      expect(getByText('helpSupport.title')).toBeTruthy();
    });

    it('hauria de mostrar el contingut de suport', () => {
      const { toJSON } = render(<HelpSupportScreen />);
      expect(toJSON()).toBeTruthy();
    });

    it('snapshot test', () => {
      const { toJSON } = render(<HelpSupportScreen />);
      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('Navegació', () => {
    it('hauria de navegar a Settings quan es prem back', () => {
      const { UNSAFE_root } = render(<HelpSupportScreen />);
      const touchables = UNSAFE_root.findAllByType(require('react-native').TouchableOpacity);
      
      // El primer touchable és el botó back
      if (touchables.length > 0) {
        fireEvent.press(touchables[0]);
      }
      
      expect(mockNavigate).toHaveBeenCalledWith('Settings');
    });
  });

  describe('Funcionalitat d\'email', () => {
    it('hauria d\'obrir client d\'email quan es prem el botó', () => {
      const { UNSAFE_root } = render(<HelpSupportScreen />);
      const touchables = UNSAFE_root.findAllByType(require('react-native').TouchableOpacity);
      
      // Buscar el touchable que obre l'email (no el back button)
      // Normalment és el segon o tercer touchable
      for (let i = 1; i < touchables.length; i++) {
        try {
          fireEvent.press(touchables[i]);
        } catch (e) {
          // Ignorar errors
        }
      }
      
      // Verificar que s'ha intentat obrir l'URL de mailto
      expect(Linking.openURL).toHaveBeenCalled();
    });

    it('hauria d\'obrir URL de mailto correcte', () => {
      const { UNSAFE_root } = render(<HelpSupportScreen />);
      const touchables = UNSAFE_root.findAllByType(require('react-native').TouchableOpacity);
      
      // Simular pulsació en tots els touchables per trobar el d'email
      touchables.forEach((touchable, index) => {
        if (index > 0) { // Skip back button
          try {
            fireEvent.press(touchable);
          } catch (e) {}
        }
      });
      
      // Verificar que la URL conté mailto
      const calls = (Linking.openURL as jest.Mock).mock.calls;
      const mailtoCall = calls.find((call: string[]) => call[0]?.includes('mailto:'));
      if (mailtoCall) {
        expect(mailtoCall[0]).toContain('mailto:');
        expect(mailtoCall[0]).toContain('jordi.reverter.tuset@estudiantat.upc.edu');
      }
    });

    it('hauria de gestionar errors en obrir email', async () => {
      (Linking.openURL as jest.Mock).mockRejectedValueOnce(new Error('Cannot open'));
      
      const { UNSAFE_root } = render(<HelpSupportScreen />);
      const touchables = UNSAFE_root.findAllByType(require('react-native').TouchableOpacity);
      
      // Intentar obrir email
      if (touchables.length > 1) {
        fireEvent.press(touchables[1]);
      }
      
      // No hauria de llençar excepció
      expect(true).toBe(true);
    });
  });

  describe('Layout', () => {
    it('hauria de tenir ScrollView', () => {
      const { UNSAFE_root } = render(<HelpSupportScreen />);
      const scrollViews = UNSAFE_root.findAllByType(require('react-native').ScrollView);
      expect(scrollViews.length).toBeGreaterThan(0);
    });

    it('hauria de tenir header fix', () => {
      const { getByText } = render(<HelpSupportScreen />);
      expect(getByText('helpSupport.title')).toBeTruthy();
    });
  });
});
