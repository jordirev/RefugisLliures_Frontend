/**
 * Tests unitaris per a AboutTheAppScreen
 *
 * Aquest fitxer cobreix:
 * - Renderització de la pantalla
 * - Navegació enrere
 * - Obertura d'enllaços externs
 * - Snapshot tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AboutTheAppScreen } from '../../../screens/AboutTheAppScreen';
import { Linking } from 'react-native';

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

// Mock Linking
jest.spyOn(Linking, 'openURL').mockResolvedValue(true);

// Mock SVG icons
jest.mock('../../../assets/icons/arrow-left.svg', () => 'BackIcon');

// Mock logo image
jest.mock('../../../assets/images/logo.png', () => 'AppLogo');

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: jest.fn(),
  }),
}));

describe('AboutTheAppScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderització bàsica', () => {
    it('hauria de renderitzar correctament', () => {
      const { getByText } = render(<AboutTheAppScreen />);

      expect(getByText('aboutApp.title')).toBeTruthy();
    });

    it('hauria de mostrar el nom de l\'app', () => {
      const { getByText } = render(<AboutTheAppScreen />);

      expect(getByText('Refugis Lliures')).toBeTruthy();
    });

    it('hauria de mostrar la descripció', () => {
      const { getByText } = render(<AboutTheAppScreen />);

      expect(getByText('aboutApp.description.intro')).toBeTruthy();
      expect(getByText('aboutApp.description.sources')).toBeTruthy();
      expect(getByText('aboutApp.description.userContributions')).toBeTruthy();
    });

    it('snapshot test', () => {
      const { toJSON } = render(<AboutTheAppScreen />);
      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('Navegació', () => {
    it('hauria de navegar enrere a Settings quan es prem el botó', () => {
      const { UNSAFE_root } = render(<AboutTheAppScreen />);

      const touchables = UNSAFE_root.findAllByType(require('react-native').TouchableOpacity);
      // El primer touchable hauria de ser el botó enrere
      if (touchables.length > 0) {
        fireEvent.press(touchables[0]);
        expect(mockNavigate).toHaveBeenCalledWith('Settings');
      }
    });
  });

  describe('Enllaços externs', () => {
    it('hauria de mostrar els enllaços de fonts', () => {
      const { getByText } = render(<AboutTheAppScreen />);

      expect(getByText('• https://www.pyrenees-refuges.com/')).toBeTruthy();
      expect(getByText('• https://www.refuges.info/')).toBeTruthy();
    });

    it('hauria d\'obrir pyrenees-refuges quan es prem l\'enllaç', () => {
      const { getByText } = render(<AboutTheAppScreen />);

      const link = getByText('• https://www.pyrenees-refuges.com/');
      fireEvent.press(link);

      expect(Linking.openURL).toHaveBeenCalledWith('https://www.pyrenees-refuges.com/');
    });

    it('hauria d\'obrir refuges.info quan es prem l\'enllaç', () => {
      const { getByText } = render(<AboutTheAppScreen />);

      const link = getByText('• https://www.refuges.info/');
      fireEvent.press(link);

      expect(Linking.openURL).toHaveBeenCalledWith('https://www.refuges.info/');
    });
  });
});
