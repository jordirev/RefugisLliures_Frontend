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
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { AvatarPopup } from '../../../components/AvatarPopup';
import { UsersService } from '../../../services/UsersService';

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

// Mock react-native-image-crop-picker - Definir abans dels imports
const mockImageCropPicker = {
  openPicker: jest.fn().mockResolvedValue({
    path: 'file://test/cropped-image.jpg',
    mime: 'image/jpeg',
  }),
};

jest.mock('react-native-image-crop-picker', () => ({
  __esModule: true,
  default: mockImageCropPicker,
}));

// Importar ImagePicker per fer assertions
import * as ImagePicker from 'expo-image-picker';
import { findAllByType } from '../../testHelpers/findByType';

// Mock UsersService
jest.mock('../../../services/UsersService', () => ({
  UsersService: {
    deleteAvatar: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock del hook de pujada (target=avatar)
const mockPickAndUpload = jest.fn();
const mockEnsureRights = jest.fn().mockResolvedValue(true);
let mockIsUploading = false;
jest.mock('../../../hooks/useMediaUpload', () => ({
  useMediaUpload: () => ({
    pickAndUpload: mockPickAndUpload,
    ensureRightsConfirmed: mockEnsureRights,
    isUploading: mockIsUploading,
    rightsModalProps: { visible: false, onAccept: jest.fn(), onCancel: jest.fn() },
  }),
  getFailureReasonKey: (reason: string) => `media.failureReasons.${reason || 'unknown'}`,
}));

// Mock expo-constants (per defecte: development build, no Expo Go)
jest.mock('expo-constants', () => ({ __esModule: true, default: { executionEnvironment: 'bare' } }));

// Mock SVG icons
jest.mock('../../../assets/icons/x.svg', () => 'CrossIcon');
jest.mock('../../../assets/icons/trash.svg', () => 'TrashIcon');

// Mock useCustomAlert per capturar callbacks
const mockAlertState = {
  showAlertFn: jest.fn(),
  lastButtons: [] as any[],
};
const mockShowAlert = jest.fn((title: string, message: string, buttons?: any[]) => {
  mockAlertState.lastButtons = buttons || [];
});
mockAlertState.showAlertFn = mockShowAlert;
const mockHideAlert = jest.fn();
jest.mock('../../../hooks/useCustomAlert', () => ({
  useCustomAlert: () => ({
    alertVisible: false,
    alertConfig: null,
    showAlert: mockShowAlert,
    hideAlert: mockHideAlert,
  }),
}));

// Mock useTranslation
jest.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

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
    mockAlertState.lastButtons = [];
    // Reset Platform.OS to default (non-web) for most tests
    require('react-native').Platform.OS = 'android';
    // Reset mocks to default values
    ImagePicker.getMediaLibraryPermissionsAsync.mockResolvedValue({ status: 'granted' });
    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ status: 'granted' });
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://test/image.jpg', type: 'image' }],
    });
    mockImageCropPicker.openPicker.mockResolvedValue({
      path: 'file://test/cropped-image.jpg',
      mime: 'image/jpeg',
      width: 512,
      height: 512,
      size: 2048,
    });
    (UsersService.deleteAvatar as jest.Mock).mockResolvedValue(undefined);
    mockPickAndUpload.mockResolvedValue(null);
    mockEnsureRights.mockResolvedValue(true);
    mockIsUploading = false;
  });

  describe('Renderització bàsica', () => {
    it('hauria de renderitzar quan és visible', async () => {
      const { getByText } = await render(<AvatarPopup {...defaultProps} />);

      expect(getByText('profile.avatar.changePhoto')).toBeTruthy();
    });

    it('no hauria de renderitzar quan no és visible', async () => {
      const { queryByText } = await render(
        <AvatarPopup {...defaultProps} visible={false} />
      );

      // El modal no hauria de mostrar contingut quan no és visible
      // Nota: React Native Modal pot renderitzar però no mostrar
    });

    it('snapshot test - sense avatar', async () => {
      const { toJSON } = await render(<AvatarPopup {...defaultProps} />);
      expect(toJSON()).toMatchSnapshot();
    });

    it('snapshot test - amb avatar', async () => {
      const { toJSON } = await render(
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
    it('hauria de mostrar la imatge quan hi ha avatarUrl', async () => {
      const { container } = await render(
        <AvatarPopup
          {...defaultProps}
          avatarUrl="https://example.com/avatar.jpg"
          username="TestUser"
        />
      );

      const images = findAllByType(container, require('react-native').Image);
      expect(images.length).toBeGreaterThan(0);
    });

    it('hauria de mostrar inicials quan no hi ha avatar', async () => {
      const { getByText } = await render(
        <AvatarPopup
          {...defaultProps}
          username="TestUser"
        />
      );

      expect(getByText('TE')).toBeTruthy();
    });

    it('hauria de mostrar ? quan no hi ha username', async () => {
      const { getByText } = await render(<AvatarPopup {...defaultProps} />);

      expect(getByText('?')).toBeTruthy();
    });

    it('hauria de generar inicials correctes per un sol nom', async () => {
      const { getByText } = await render(
        <AvatarPopup
          {...defaultProps}
          username="Joan"
        />
      );

      expect(getByText('JO')).toBeTruthy();
    });

    it('hauria de generar inicials correctes per nom compost', async () => {
      const { getByText } = await render(
        <AvatarPopup
          {...defaultProps}
          username="Joan Pere García"
        />
      );

      expect(getByText('JG')).toBeTruthy();
    });
  });

  describe('Canvi de foto', () => {
    it('hauria de mostrar botó per canviar foto', async () => {
      const { getByText } = await render(<AvatarPopup {...defaultProps} />);

      expect(getByText('profile.avatar.changePhoto')).toBeTruthy();
    });

    it('hauria de poder prémer el botó de canviar foto', async () => {
      const { getByText } = await render(
        <AvatarPopup {...defaultProps} onAvatarUpdated={mockOnAvatarUpdated} />
      );

      const changeButton = getByText('profile.avatar.changePhoto');
      await fireEvent.press(changeButton);

      // En mòbil (Android/iOS), s'utilitza ImageCropPicker
      await waitFor(() => {
        expect(mockImageCropPicker.openPicker).toHaveBeenCalled();
      });
    });
  });

  describe('Pujada d\'avatar (upload-intents, target=avatar)', () => {
    it('build nativa: declaració de drets, crop-picker i pickAndUpload amb l\'asset retallat', async () => {
      const { getByText } = await render(<AvatarPopup {...defaultProps} onAvatarUpdated={mockOnAvatarUpdated} />);

      await act(async () => {
        await fireEvent.press(getByText('profile.avatar.changePhoto'));
      });

      expect(mockEnsureRights).toHaveBeenCalled();
      expect(mockImageCropPicker.openPicker).toHaveBeenCalledWith(expect.objectContaining({ mediaType: 'photo' }));
      expect(mockPickAndUpload).toHaveBeenCalledWith(
        { target: 'avatar', uid: 'user-123' },
        {
          imagesOnly: true,
          multiple: false,
          assets: [
            expect.objectContaining({ uri: 'file://test/cropped-image.jpg', mimeType: 'image/jpeg', width: 512 }),
          ],
        },
        { showResultAlert: false }
      );
    });

    it('no obre el crop-picker si no s\'accepta la declaració de drets', async () => {
      mockEnsureRights.mockResolvedValueOnce(false);
      const { getByText } = await render(<AvatarPopup {...defaultProps} />);
      await act(async () => {
        await fireEvent.press(getByText('profile.avatar.changePhoto'));
      });
      expect(mockImageCropPicker.openPicker).not.toHaveBeenCalled();
      expect(mockPickAndUpload).not.toHaveBeenCalled();
    });

    it('web: usa expo-image-picker dins del hook (sense assets)', async () => {
      require('react-native').Platform.OS = 'web';
      const { getByText } = await render(<AvatarPopup {...defaultProps} />);
      await act(async () => {
        await fireEvent.press(getByText('profile.avatar.changePhoto'));
      });
      expect(mockImageCropPicker.openPicker).not.toHaveBeenCalled();
      expect(mockPickAndUpload).toHaveBeenCalledWith(
        { target: 'avatar', uid: 'user-123' },
        { imagesOnly: true, multiple: false, assets: undefined },
        { showResultAlert: false }
      );
    });

    it('èxit: notifica onAvatarUpdated i tanca amb OK', async () => {
      mockPickAndUpload.mockResolvedValueOnce({ uploaded: [{ key: 'users-avatars/user-123/u.webp' }], failed: [] });
      const { getByText } = await render(<AvatarPopup {...defaultProps} onAvatarUpdated={mockOnAvatarUpdated} />);
      await act(async () => {
        await fireEvent.press(getByText('profile.avatar.changePhoto'));
      });
      expect(mockOnAvatarUpdated).toHaveBeenCalled();
      expect(mockShowAlert).toHaveBeenCalledWith(
        'profile.avatar.uploadSuccess',
        'profile.avatar.uploadSuccessMessage',
        expect.any(Array)
      );
      await act(async () => {
        mockAlertState.lastButtons[0].onPress();
      });
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('fallada del confirm: mostra el motiu', async () => {
      mockPickAndUpload.mockResolvedValueOnce({ uploaded: [], failed: [{ upload_id: 'u1', reason: 'moderation_blocked' }] });
      const { getByText } = await render(<AvatarPopup {...defaultProps} onAvatarUpdated={mockOnAvatarUpdated} />);
      await act(async () => {
        await fireEvent.press(getByText('profile.avatar.changePhoto'));
      });
      expect(mockOnAvatarUpdated).not.toHaveBeenCalled();
      expect(mockShowAlert).toHaveBeenCalledWith(
        'common.error',
        expect.stringContaining('media.failureReasons.moderation_blocked'),
        expect.any(Array)
      );
    });

    it('cancel·lació del crop-picker: no fa res', async () => {
      const err: any = new Error('cancelled');
      err.code = 'E_PICKER_CANCELLED';
      mockImageCropPicker.openPicker.mockRejectedValueOnce(err);
      const { getByText } = await render(<AvatarPopup {...defaultProps} />);
      await act(async () => {
        await fireEvent.press(getByText('profile.avatar.changePhoto'));
      });
      expect(mockPickAndUpload).not.toHaveBeenCalled();
      expect(mockShowAlert).not.toHaveBeenCalled();
    });

    it('mostra indicador de càrrega mentre puja', async () => {
      mockIsUploading = true;
      const { container } = await render(<AvatarPopup {...defaultProps} />);
      const indicators = findAllByType(container, require('react-native').ActivityIndicator);
      expect(indicators.length).toBeGreaterThan(0);
    });
  });

  describe('Eliminació de foto', () => {
    it('hauria de mostrar botó d\'eliminar quan hi ha avatar', async () => {
      const { getByText } = await render(
        <AvatarPopup
          {...defaultProps}
          avatarUrl="https://example.com/avatar.jpg"
        />
      );

      expect(getByText('profile.avatar.deletePhoto')).toBeTruthy();
    });

    it('hauria de mostrar confirmació quan es prem eliminar', async () => {
      const { getByText } = await render(
        <AvatarPopup
          {...defaultProps}
          avatarUrl="https://example.com/avatar.jpg"
        />
      );

      const deleteButton = getByText('profile.avatar.deletePhoto');
      await fireEvent.press(deleteButton);

      // Hauria d'aparèixer el diàleg de confirmació (CustomAlert)
    });
  });

  describe('Eliminació d\'avatar', () => {
    it('hauria de mostrar confirmació quan es prem eliminar', async () => {
      const { getByText } = await render(
        <AvatarPopup
          {...defaultProps}
          avatarUrl="https://example.com/avatar.jpg"
          onAvatarUpdated={mockOnAvatarUpdated}
        />
      );

      const deleteButton = getByText('profile.avatar.deletePhoto');
      await fireEvent.press(deleteButton);

      expect(mockShowAlert).toHaveBeenCalledWith(
        'profile.avatar.deleteConfirmTitle',
        'profile.avatar.deleteConfirmMessage',
        expect.arrayContaining([
          expect.objectContaining({ text: 'common.cancel' }),
          expect.objectContaining({ text: 'common.delete', style: 'destructive' })
        ])
      );
    });

    it('hauria d\'eliminar avatar quan es confirma', async () => {
      const { getByText } = await render(
        <AvatarPopup
          {...defaultProps}
          avatarUrl="https://example.com/avatar.jpg"
          onAvatarUpdated={mockOnAvatarUpdated}
        />
      );

      const deleteButton = getByText('profile.avatar.deletePhoto');
      await fireEvent.press(deleteButton);

      // Simular que l'usuari prem "Eliminar"
      const deleteConfirmButton = mockAlertState.lastButtons.find((b: any) => b.text === 'common.delete');
      expect(deleteConfirmButton).toBeDefined();

      await act(async () => {
        if (deleteConfirmButton?.onPress) {
          await deleteConfirmButton.onPress();
        }
      });

      await waitFor(() => {
        expect(UsersService.deleteAvatar).toHaveBeenCalledWith('user-123');
      });

      await waitFor(() => {
        expect(mockOnAvatarUpdated).toHaveBeenCalled();
      });
    });

    it('hauria de gestionar errors durant l\'eliminació', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (UsersService.deleteAvatar as jest.Mock).mockRejectedValueOnce(new Error('Delete error'));

      const { getByText } = await render(
        <AvatarPopup
          {...defaultProps}
          avatarUrl="https://example.com/avatar.jpg"
          onAvatarUpdated={mockOnAvatarUpdated}
        />
      );

      const deleteButton = getByText('profile.avatar.deletePhoto');
      await fireEvent.press(deleteButton);

      const deleteConfirmButton = mockAlertState.lastButtons.find((b: any) => b.text === 'common.delete');
      
      await act(async () => {
        if (deleteConfirmButton?.onPress) {
          await deleteConfirmButton.onPress();
        }
      });

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          'common.error',
          expect.any(String),
          expect.any(Array)
        );
      });

      consoleSpy.mockRestore();
    });

    it('hauria de cancel·lar eliminació quan es prem cancel·lar', async () => {
      const { getByText } = await render(
        <AvatarPopup
          {...defaultProps}
          avatarUrl="https://example.com/avatar.jpg"
        />
      );

      const deleteButton = getByText('profile.avatar.deletePhoto');
      await fireEvent.press(deleteButton);

      const cancelButton = mockAlertState.lastButtons.find((b: any) => b.text === 'common.cancel');
      expect(cancelButton).toBeDefined();
      expect(cancelButton.style).toBe('cancel');
    });
  });

  describe('Tancament del modal', () => {
    it('hauria de cridar onClose quan es prem el botó de tancar', async () => {
      const { container } = await render(<AvatarPopup {...defaultProps} />);

      // Buscar el botó de tancar (TouchableOpacity amb CrossIcon)
      const touchables = findAllByType(container, require('react-native').TouchableOpacity);
      
      // El primer touchable hauria de ser el botó de tancar
      if (touchables.length > 0) {
        await fireEvent.press(touchables[0]);
      }
    });
  });

  describe('Callbacks d\'alerta', () => {
    it('hauria de cridar onClose després d\'eliminar amb èxit', async () => {
      const { getByText } = await render(
        <AvatarPopup
          {...defaultProps}
          avatarUrl="https://example.com/avatar.jpg"
          onAvatarUpdated={mockOnAvatarUpdated}
        />
      );

      const deleteButton = getByText('profile.avatar.deletePhoto');
      await fireEvent.press(deleteButton);

      const deleteConfirmButton = mockAlertState.lastButtons.find((b: any) => b.text === 'common.delete');

      await act(async () => {
        if (deleteConfirmButton?.onPress) {
          await deleteConfirmButton.onPress();
        }
      });

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          'profile.avatar.deleteSuccess',
          'profile.avatar.deleteSuccessMessage',
          expect.any(Array)
        );
      });

      // Simular que l'usuari prem OK
      const okButton = mockAlertState.lastButtons.find((b: any) => b.text === 'common.ok');
      expect(okButton).toBeDefined();

      await act(async () => {
        if (okButton?.onPress) {
          okButton.onPress();
        }
      });

      expect(mockHideAlert).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('hauria de cridar hideAlert al cancel·lar confirmació d\'eliminar', async () => {
      const { getByText } = await render(
        <AvatarPopup
          {...defaultProps}
          avatarUrl="https://example.com/avatar.jpg"
        />
      );

      const deleteButton = getByText('profile.avatar.deletePhoto');
      await fireEvent.press(deleteButton);

      const cancelButton = mockAlertState.lastButtons.find((b: any) => b.text === 'common.cancel');
      expect(cancelButton).toBeDefined();

      await act(async () => {
        if (cancelButton?.onPress) {
          cancelButton.onPress();
        }
      });

      expect(mockHideAlert).toHaveBeenCalled();
    });
  });

});
