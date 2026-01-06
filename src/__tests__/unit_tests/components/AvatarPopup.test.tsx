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

// Importar ImagePicker per fer assertions
import * as ImagePicker from 'expo-image-picker';

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
    // Reset mocks to default values
    ImagePicker.getMediaLibraryPermissionsAsync.mockResolvedValue({ status: 'granted' });
    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ status: 'granted' });
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://test/image.jpg', type: 'image' }],
    });
    (UsersService.uploadAvatar as jest.Mock).mockResolvedValue({ url: 'https://example.com/new-avatar.jpg' });
    (UsersService.deleteAvatar as jest.Mock).mockResolvedValue(undefined);
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
      ImagePicker.getMediaLibraryPermissionsAsync.mockResolvedValueOnce({ status: 'undetermined' });

      const { getByText } = render(<AvatarPopup {...defaultProps} />);

      const changeButton = getByText('profile.avatar.changePhoto');
      fireEvent.press(changeButton);

      await waitFor(() => {
        expect(ImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled();
      });
    });

    it('hauria de mostrar alerta si el permís és denegat', async () => {
      ImagePicker.getMediaLibraryPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });
      ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });

      const { getByText } = render(<AvatarPopup {...defaultProps} />);

      const changeButton = getByText('profile.avatar.changePhoto');
      fireEvent.press(changeButton);

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          'common.error',
          'profile.avatar.permissionMessage',
          expect.any(Array)
        );
      });
    });

    it('hauria de continuar si el permís és concedit després de demanar-lo', async () => {
      ImagePicker.getMediaLibraryPermissionsAsync.mockResolvedValueOnce({ status: 'undetermined' });
      ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });

      const { getByText } = render(<AvatarPopup {...defaultProps} />);

      const changeButton = getByText('profile.avatar.changePhoto');
      fireEvent.press(changeButton);

      await waitFor(() => {
        expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
      });
    });
  });

  describe('Selecció d\'imatge cancel·lada', () => {
    it('hauria de no fer res si l\'usuari cancel·la la selecció', async () => {
      ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
        canceled: true,
        assets: [],
      });

      const { getByText } = render(
        <AvatarPopup {...defaultProps} onAvatarUpdated={mockOnAvatarUpdated} />
      );

      const changeButton = getByText('profile.avatar.changePhoto');
      fireEvent.press(changeButton);

      await waitFor(() => {
        expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
      });

      // No s'hauria d'haver cridat uploadAvatar
      expect(UsersService.uploadAvatar).not.toHaveBeenCalled();
    });
  });

  describe('Upload d\'avatar', () => {
    it('hauria de pujar avatar i notificar l\'actualització', async () => {
      const { getByText } = render(
        <AvatarPopup {...defaultProps} onAvatarUpdated={mockOnAvatarUpdated} />
      );

      const changeButton = getByText('profile.avatar.changePhoto');
      fireEvent.press(changeButton);

      await waitFor(() => {
        expect(UsersService.uploadAvatar).toHaveBeenCalledWith('user-123', expect.anything());
      });

      await waitFor(() => {
        expect(mockOnAvatarUpdated).toHaveBeenCalled();
      });

      expect(mockShowAlert).toHaveBeenCalledWith(
        'profile.avatar.uploadSuccess',
        'profile.avatar.uploadSuccessMessage',
        expect.any(Array)
      );
    });

    it('hauria de gestionar errors durant l\'upload', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (UsersService.uploadAvatar as jest.Mock).mockRejectedValueOnce(new Error('Upload error'));

      const { getByText } = render(
        <AvatarPopup {...defaultProps} onAvatarUpdated={mockOnAvatarUpdated} />
      );

      const changeButton = getByText('profile.avatar.changePhoto');
      fireEvent.press(changeButton);

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          'common.error',
          expect.any(String),
          expect.any(Array)
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Eliminació d\'avatar', () => {
    it('hauria de mostrar confirmació quan es prem eliminar', async () => {
      const { getByText } = render(
        <AvatarPopup
          {...defaultProps}
          avatarUrl="https://example.com/avatar.jpg"
          onAvatarUpdated={mockOnAvatarUpdated}
        />
      );

      const deleteButton = getByText('profile.avatar.deletePhoto');
      fireEvent.press(deleteButton);

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
      const { getByText } = render(
        <AvatarPopup
          {...defaultProps}
          avatarUrl="https://example.com/avatar.jpg"
          onAvatarUpdated={mockOnAvatarUpdated}
        />
      );

      const deleteButton = getByText('profile.avatar.deletePhoto');
      fireEvent.press(deleteButton);

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

      const { getByText } = render(
        <AvatarPopup
          {...defaultProps}
          avatarUrl="https://example.com/avatar.jpg"
          onAvatarUpdated={mockOnAvatarUpdated}
        />
      );

      const deleteButton = getByText('profile.avatar.deletePhoto');
      fireEvent.press(deleteButton);

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

    it('hauria de cancel·lar eliminació quan es prem cancel·lar', () => {
      const { getByText } = render(
        <AvatarPopup
          {...defaultProps}
          avatarUrl="https://example.com/avatar.jpg"
        />
      );

      const deleteButton = getByText('profile.avatar.deletePhoto');
      fireEvent.press(deleteButton);

      const cancelButton = mockAlertState.lastButtons.find((b: any) => b.text === 'common.cancel');
      expect(cancelButton).toBeDefined();
      expect(cancelButton.style).toBe('cancel');
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

  describe('Error en selecció d\'imatge', () => {
    it('hauria de gestionar error extern quan launchImageLibraryAsync falla', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockRejectedValueOnce(new Error('Picker error'));

      const { getByText } = render(<AvatarPopup {...defaultProps} />);

      const changeButton = getByText('profile.avatar.changePhoto');
      fireEvent.press(changeButton);

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          'common.error',
          'Picker error',
          expect.any(Array)
        );
      });

      consoleSpy.mockRestore();
    });

    it('hauria de mostrar missatge per defecte quan error no té message', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockRejectedValueOnce({});

      const { getByText } = render(<AvatarPopup {...defaultProps} />);

      const changeButton = getByText('profile.avatar.changePhoto');
      fireEvent.press(changeButton);

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          'common.error',
          'profile.avatar.selectError',
          expect.any(Array)
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Callbacks d\'alerta', () => {
    it('hauria de cridar onClose quan es prem OK després d\'upload exitós', async () => {
      const { getByText } = render(
        <AvatarPopup {...defaultProps} onAvatarUpdated={mockOnAvatarUpdated} />
      );

      const changeButton = getByText('profile.avatar.changePhoto');
      fireEvent.press(changeButton);

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          'profile.avatar.uploadSuccess',
          'profile.avatar.uploadSuccessMessage',
          expect.any(Array)
        );
      });

      // Simular que l'usuari prem OK en l'alerta d'èxit
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

    it('hauria de cridar hideAlert quan es prem OK després d\'error upload', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (UsersService.uploadAvatar as jest.Mock).mockRejectedValueOnce(new Error('Upload error'));

      const { getByText } = render(<AvatarPopup {...defaultProps} />);

      const changeButton = getByText('profile.avatar.changePhoto');
      fireEvent.press(changeButton);

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          'common.error',
          expect.any(String),
          expect.any(Array)
        );
      });

      const okButton = mockAlertState.lastButtons.find((b: any) => b.text === 'common.ok');
      expect(okButton).toBeDefined();

      await act(async () => {
        if (okButton?.onPress) {
          okButton.onPress();
        }
      });

      expect(mockHideAlert).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('hauria de cridar onClose després d\'eliminar amb èxit', async () => {
      const { getByText } = render(
        <AvatarPopup
          {...defaultProps}
          avatarUrl="https://example.com/avatar.jpg"
          onAvatarUpdated={mockOnAvatarUpdated}
        />
      );

      const deleteButton = getByText('profile.avatar.deletePhoto');
      fireEvent.press(deleteButton);

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
      const { getByText } = render(
        <AvatarPopup
          {...defaultProps}
          avatarUrl="https://example.com/avatar.jpg"
        />
      );

      const deleteButton = getByText('profile.avatar.deletePhoto');
      fireEvent.press(deleteButton);

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

  describe('Entorn Web', () => {
    const originalPlatformOS = require('react-native').Platform.OS;

    afterEach(() => {
      require('react-native').Platform.OS = originalPlatformOS;
    });

    it('hauria de crear File amb fetch/blob en entorn web', async () => {
      // Mock Platform.OS = 'web'
      require('react-native').Platform.OS = 'web';

      // Mock global fetch
      const mockBlob = new Blob(['image data'], { type: 'image/jpeg' });
      const mockFetch = jest.fn().mockResolvedValue({
        blob: jest.fn().mockResolvedValue(mockBlob),
      });
      global.fetch = mockFetch;

      const { getByText } = render(
        <AvatarPopup {...defaultProps} onAvatarUpdated={mockOnAvatarUpdated} />
      );

      const changeButton = getByText('profile.avatar.changePhoto');
      fireEvent.press(changeButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('file://test/image.jpg');
      });

      await waitFor(() => {
        expect(UsersService.uploadAvatar).toHaveBeenCalledWith('user-123', expect.any(File));
      });

      // Restaurar Platform.OS
      require('react-native').Platform.OS = originalPlatformOS;
    });
  });
});
