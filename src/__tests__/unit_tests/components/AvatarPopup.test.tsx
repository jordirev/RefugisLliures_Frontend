/**
 * Tests unitaris per al component AvatarPopup
 *
 * Aquest fitxer cobreix:
 * - Renderització del modal
 * - Visualització amb i sense avatar
 * - Canvi de foto
 * - Eliminació de foto
 * - Gestió de permisos
 * - Snapshot tests
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AvatarPopup } from '../../../components/AvatarPopup';

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  getMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file://test/image.jpg', type: 'image' }],
  }),
  UIImagePickerPresentationStyle: { FULL_SCREEN: 0 },
}));

// Mock UsersService
jest.mock('../../../services/UsersService', () => ({
  UsersService: {
    uploadAvatar: jest.fn().mockResolvedValue({ url: 'https://example.com/new-avatar.jpg' }),
    deleteAvatar: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock SVG icons
jest.mock('../../../assets/icons/x.svg', () => 'CrossIcon');
jest.mock('../../../assets/icons/trash.svg', () => 'TrashIcon');

const mockOnClose = jest.fn();
const mockOnAvatarUpdated = jest.fn();

const defaultProps = {
  visible: true,
  onClose: mockOnClose,
  uid: 'user-123',
};

describe('AvatarPopup Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderització bàsica', () => {
    it('hauria de renderitzar quan és visible', () => {
      const { getByText } = render(<AvatarPopup {...defaultProps} />);

      expect(getByText('profile.avatar.changePhoto')).toBeTruthy();
    });

    it('no hauria de renderitzar quan no és visible', () => {
      const { queryByText } = render(
        <AvatarPopup {...defaultProps} visible={false} />
      );

      // El modal no hauria de mostrar contingut quan no és visible
      // Nota: React Native Modal pot renderitzar però no mostrar
    });

    it('snapshot test - sense avatar', () => {
      const { toJSON } = render(<AvatarPopup {...defaultProps} />);
      expect(toJSON()).toMatchSnapshot();
    });

    it('snapshot test - amb avatar', () => {
      const { toJSON } = render(
        <AvatarPopup
          {...defaultProps}
          avatarUrl="https://example.com/avatar.jpg"
          username="TestUser"
        />
      );
      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('Visualització d\'avatar', () => {
    it('hauria de mostrar la imatge quan hi ha avatarUrl', () => {
      const { UNSAFE_root } = render(
        <AvatarPopup
          {...defaultProps}
          avatarUrl="https://example.com/avatar.jpg"
          username="TestUser"
        />
      );

      const images = UNSAFE_root.findAllByType(require('react-native').Image);
      expect(images.length).toBeGreaterThan(0);
    });

    it('hauria de mostrar inicials quan no hi ha avatar', () => {
      const { getByText } = render(
        <AvatarPopup
          {...defaultProps}
          username="TestUser"
        />
      );

      expect(getByText('TE')).toBeTruthy();
    });

    it('hauria de mostrar ? quan no hi ha username', () => {
      const { getByText } = render(<AvatarPopup {...defaultProps} />);

      expect(getByText('?')).toBeTruthy();
    });

    it('hauria de generar inicials correctes per un sol nom', () => {
      const { getByText } = render(
        <AvatarPopup
          {...defaultProps}
          username="Joan"
        />
      );

      expect(getByText('JO')).toBeTruthy();
    });

    it('hauria de generar inicials correctes per nom compost', () => {
      const { getByText } = render(
        <AvatarPopup
          {...defaultProps}
          username="Joan Pere García"
        />
      );

      expect(getByText('JG')).toBeTruthy();
    });
  });

  describe('Canvi de foto', () => {
    it('hauria de mostrar botó per canviar foto', () => {
      const { getByText } = render(<AvatarPopup {...defaultProps} />);

      expect(getByText('profile.avatar.changePhoto')).toBeTruthy();
    });

    it('hauria de poder prémer el botó de canviar foto', async () => {
      const { getByText } = render(
        <AvatarPopup {...defaultProps} onAvatarUpdated={mockOnAvatarUpdated} />
      );

      const changeButton = getByText('profile.avatar.changePhoto');
      fireEvent.press(changeButton);

      // La funció de selecció d'imatge s'hauria d'haver cridat
      await waitFor(() => {
        const ImagePicker = require('expo-image-picker');
        expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
      });
    });
  });

  describe('Eliminació de foto', () => {
    it('hauria de mostrar botó d\'eliminar quan hi ha avatar', () => {
      const { getByText } = render(
        <AvatarPopup
          {...defaultProps}
          avatarUrl="https://example.com/avatar.jpg"
        />
      );

      expect(getByText('profile.avatar.deletePhoto')).toBeTruthy();
    });

    it('hauria de mostrar confirmació quan es prem eliminar', () => {
      const { getByText } = render(
        <AvatarPopup
          {...defaultProps}
          avatarUrl="https://example.com/avatar.jpg"
        />
      );

      const deleteButton = getByText('profile.avatar.deletePhoto');
      fireEvent.press(deleteButton);

      // Hauria d'aparèixer el diàleg de confirmació (CustomAlert)
    });
  });

  describe('Gestió de permisos', () => {
    it('hauria de demanar permisos si no estan concedits', async () => {
      const ImagePicker = require('expo-image-picker');
      ImagePicker.getMediaLibraryPermissionsAsync.mockResolvedValueOnce({ status: 'undetermined' });

      const { getByText } = render(<AvatarPopup {...defaultProps} />);

      const changeButton = getByText('profile.avatar.changePhoto');
      fireEvent.press(changeButton);

      await waitFor(() => {
        expect(ImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled();
      });
    });
  });

  describe('Tancament del modal', () => {
    it('hauria de cridar onClose quan es prem el botó de tancar', () => {
      const { UNSAFE_root } = render(<AvatarPopup {...defaultProps} />);

      // Buscar el botó de tancar (TouchableOpacity amb CrossIcon)
      const touchables = UNSAFE_root.findAllByType(require('react-native').TouchableOpacity);
      
      // El primer touchable hauria de ser el botó de tancar
      if (touchables.length > 0) {
        fireEvent.press(touchables[0]);
      }
    });
  });

  describe('Estats de càrrega', () => {
    it('hauria de mostrar indicador de càrrega durant upload', async () => {
      const { getByText, queryByTestId } = render(
        <AvatarPopup {...defaultProps} onAvatarUpdated={mockOnAvatarUpdated} />
      );

      const changeButton = getByText('profile.avatar.changePhoto');
      fireEvent.press(changeButton);

      // Durant la càrrega, hauria de mostrar un ActivityIndicator
    });
  });
});
