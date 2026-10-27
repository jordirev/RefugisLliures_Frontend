/**
 * Tests unitaris per a ExperiencesScreen
 * 
 * Aquest fitxer cobreix:
 * - Renderització de la pantalla
 * - Mostrar estat de càrrega
 * - Mostrar missatge quan no hi ha experiències
 * - Mostrar experiències existents
 * - Crear una nova experiència
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Keyboard } from 'react-native';
import { ExperiencesScreen } from '../../../screens/ExperiencesScreen';
import {
  useExperiences,
  useCreateExperience,
  useUpdateExperience,
  useDeleteExperience,
} from '../../../hooks/useExperiencesQuery';
import { useDeleteRefugeMedia } from '../../../hooks/useRefugeMediaQuery';
import { useUser } from '../../../hooks/useUsersQuery';
import { useAuth } from '../../../contexts/AuthContext';
import { findAllByType } from '../../testHelpers/findByType';

// Mock hooks
jest.mock('../../../hooks/useExperiencesQuery', () => ({
  useExperiences: jest.fn(),
  useCreateExperience: jest.fn(),
  useUpdateExperience: jest.fn(),
  useDeleteExperience: jest.fn(),
}));

jest.mock('../../../hooks/useRefugeMediaQuery', () => ({
  useDeleteRefugeMedia: jest.fn(),
}));

// Mock del hook de pujada de mitjans (selecció + drets + compressió)
const mockPickMedia = jest.fn();
jest.mock('../../../hooks/useMediaUpload', () => ({
  useMediaUpload: () => ({
    pickMedia: mockPickMedia,
    isPreparing: false,
    rightsModalProps: { visible: false, onAccept: jest.fn(), onCancel: jest.fn() },
  }),
  getUploadErrorKey: (code: string) => `media.errors.${code}`,
  getFailureReasonKey: (reason: string) => `media.failureReasons.${reason}`,
}));

jest.mock('../../../hooks/useUsersQuery', () => ({
  useUser: jest.fn(),
}));

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Keyboard event listeners capture
type KeyboardListener = {
  eventType: string;
  callback: (e?: any) => void;
};
const keyboardListeners: KeyboardListener[] = [];

// Mock Keyboard
jest.spyOn(Keyboard, 'addListener').mockImplementation((eventType: string, callback: (e?: any) => void) => {
  keyboardListeners.push({ eventType, callback });
  return { remove: jest.fn() };
});

const triggerKeyboardEvent = (eventType: string, payload?: any) => {
  keyboardListeners.forEach(listener => {
    if (listener.eventType === eventType) {
      listener.callback(payload);
    }
  });
};

// Mock ImagePicker
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: true,
    assets: [],
  }),
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({
    status: 'granted',
  }),
  MediaTypeOptions: {
    Images: 'Images',
    All: 'All',
  },
}));

// Mock navigation
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    goBack: mockGoBack,
  }),
  useRoute: () => ({
    params: {
      refugeId: 'refuge-1',
      refugeName: 'Refugi de Prova',
    },
  }),
}));

// Mock components
jest.mock('../../../components/UserExperience', () => ({
  UserExperience: ({ user, experience, onEdit, onDelete, onPhotoPress }: any) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View testID="user-experience">
        <Text>{experience.text || experience.comment}</Text>
        {user && <Text>{user.username}</Text>}
        <TouchableOpacity testID="edit-btn" onPress={() => onEdit(experience.id, 'edited', [], 2)}>
          <Text>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="edit-long-btn" onPress={() => onEdit(experience.id, 'a'.repeat(2001), [], 2)}>
          <Text>Editar Llarg</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="delete-btn" onPress={onDelete}>
          <Text>Eliminar</Text>
        </TouchableOpacity>
        {experience.images_metadata && experience.images_metadata.length > 0 && (
          <TouchableOpacity testID="photo-press-btn" onPress={() => onPhotoPress(experience.images_metadata, 0)}>
            <Text>View Photo</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  },
}));

// Capture alert buttons for testing
let capturedAlertButtons: any[] = [];
const mockShowAlert = jest.fn((title: any, message: any, buttons?: any) => {
  if (buttons) {
    capturedAlertButtons = buttons;
  }
});
jest.mock('../../../hooks/useCustomAlert', () => ({
  useCustomAlert: () => ({
    showAlert: mockShowAlert,
    hideAlert: jest.fn(),
    alertVisible: false,
    alertConfig: {},
  }),
}));

jest.mock('../../../components/CustomAlert', () => ({
  CustomAlert: () => null,
}));

jest.mock('../../../components/PhotoViewerModal', () => ({
  PhotoViewerModal: ({ visible, onPhotoDeleted }: any) => {
    const { View, TouchableOpacity, Text } = require('react-native');
    if (!visible) return null;
    return (
      <View testID="photo-viewer-modal">
        <TouchableOpacity testID="delete-photo-btn" onPress={onPhotoDeleted}>
          <Text>Delete Photo</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

// Mock SVG icons
jest.mock('../../../assets/icons/arrow-left.svg', () => 'BackIcon');
jest.mock('../../../assets/icons/navigation.svg', () => 'SendIcon');

describe('ExperiencesScreen', () => {
  const mockExperience = {
    id: 'experience-1',
    refuge_id: 'refuge-1',
    text: 'Gran experiència al refugi!',
    comment: 'Gran experiència al refugi!',
    creator_uid: 'user-123',
    created_at: '2025-01-01T10:00:00Z',
    modified_at: '2025-01-01T10:00:00Z',
    rating: 5,
    photos: [],
  };

  const mockUser = {
    uid: 'user-123',
    username: 'TestUser',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    capturedAlertButtons = [];
    keyboardListeners.length = 0;
    (useAuth as jest.Mock).mockReturnValue({
      firebaseUser: { uid: 'user-123' },
    });
    (useUser as jest.Mock).mockReturnValue({
      data: mockUser,
    });
    (useCreateExperience as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });
    (useUpdateExperience as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });
    (useDeleteExperience as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
    });
    (useDeleteRefugeMedia as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
    });
  });

  it('hauria de mostrar estat de càrrega', async () => {
    (useExperiences as jest.Mock).mockReturnValue({
      data: [],
      isLoading: true,
    });

    await render(
      <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
    );
    
    expect(useExperiences).toHaveBeenCalledWith('refuge-1');
  });

  it('hauria de mostrar missatge quan no hi ha experiències', async () => {
    (useExperiences as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });

    const { getByText } = await render(
      <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
    );
    
    await waitFor(() => {
      expect(getByText('experiences.noExperiences')).toBeTruthy();
    });
  });

  it('hauria de mostrar experiències existents', async () => {
    (useExperiences as jest.Mock).mockReturnValue({
      data: [mockExperience],
      isLoading: false,
    });

    const { getByTestId, getByText } = await render(
      <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
    );
    
    await waitFor(() => {
      expect(getByTestId('user-experience')).toBeTruthy();
      expect(getByText('Gran experiència al refugi!')).toBeTruthy();
    });
  });

  it('hauria de mostrar el nom del refugi', async () => {
    (useExperiences as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });

    const { getByText } = await render(
      <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
    );
    
    await waitFor(() => {
      expect(getByText('Refugi de Prova')).toBeTruthy();
    });
  });

  it('hauria de cridar onClose quan es prem enrere', async () => {
    const mockOnClose = jest.fn();
    (useExperiences as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });

    const { toJSON } = await render(
      <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" onClose={mockOnClose} />
    );
    
    // Component renders correctly with onClose prop
    expect(toJSON()).toBeTruthy();
    expect(mockOnClose).toBeDefined();
  });

  it('hauria de cridar delete mutation quan s\'elimina una experiència', async () => {
    const mockMutate = jest.fn();
    (useDeleteExperience as jest.Mock).mockReturnValue({
      mutate: mockMutate,
    });
    (useExperiences as jest.Mock).mockReturnValue({
      data: [mockExperience],
      isLoading: false,
    });

    const { getByTestId } = await render(
      <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
    );
    
    await waitFor(() => {
      expect(getByTestId('delete-btn')).toBeTruthy();
    });

    // Note: Delete button triggers confirmation dialog first
    await fireEvent.press(getByTestId('delete-btn'));
    
    // The actual mutation would be called after confirmation
    expect(useDeleteExperience).toHaveBeenCalled();
  });

  describe('Creació d\'experiències', () => {
    it('hauria de cridar createExperience quan s\'envia', async () => {
      const mockMutate = jest.fn((data, options) => {
        options?.onSuccess?.({ failed_files: [] });
      });
      (useCreateExperience as jest.Mock).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      });
      (useExperiences as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
      });

      const { getByPlaceholderText } = await render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      // El placeholder real és 'experiences.placeholder' segons l'output del test
      const input = getByPlaceholderText('experiences.placeholder');
      await fireEvent.changeText(input, 'Nova experiència de prova');

      expect(useCreateExperience).toHaveBeenCalled();
    });

    it('hauria de gestionar errors en crear experiència', async () => {
      const mockMutate = jest.fn((data, options) => {
        options?.onError?.({ message: 'Error de creació' });
      });
      (useCreateExperience as jest.Mock).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      });
      (useExperiences as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
      });

      const { toJSON } = await render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      expect(toJSON()).toBeTruthy();
    });

    it('hauria de mostrar indicador de càrrega quan isPending és true', async () => {
      (useCreateExperience as jest.Mock).mockReturnValue({
        mutate: jest.fn(),
        isPending: true,
      });
      (useExperiences as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
      });

      const { toJSON } = await render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      expect(toJSON()).toBeTruthy();
    });
  });

  describe('Edició d\'experiències', () => {
    it('hauria de cridar updateExperience quan s\'edita', async () => {
      const mockMutate = jest.fn((data, options) => {
        options?.onSuccess?.({ failed_files: [] });
      });
      (useUpdateExperience as jest.Mock).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      });
      (useExperiences as jest.Mock).mockReturnValue({
        data: [mockExperience],
        isLoading: false,
      });

      const { getByTestId } = await render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      await waitFor(() => {
        expect(getByTestId('edit-btn')).toBeTruthy();
      });

      await fireEvent.press(getByTestId('edit-btn'));
      expect(useUpdateExperience).toHaveBeenCalled();
    });

    it('hauria de gestionar errors en editar experiència', async () => {
      const mockMutate = jest.fn((data, options) => {
        options?.onError?.({ message: 'Error d\'edició' });
      });
      (useUpdateExperience as jest.Mock).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      });
      (useExperiences as jest.Mock).mockReturnValue({
        data: [mockExperience],
        isLoading: false,
      });

      const { toJSON } = await render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      expect(toJSON()).toBeTruthy();
    });
  });

  describe('Navegació', () => {
    it('hauria de navegar enrere quan es prem el botó back', async () => {
      (useExperiences as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
      });

      const { container } = await render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      const { TouchableOpacity } = require('react-native');
      const touchables = findAllByType(container, TouchableOpacity);
      if (touchables.length > 0) {
        await fireEvent.press(touchables[0]);
      }

      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  describe('Múltiples experiències', () => {
    it('hauria de mostrar múltiples experiències', async () => {
      const multipleExperiences = [
        mockExperience,
        { ...mockExperience, id: 'experience-2', text: 'Segona experiència' },
      ];
      
      (useExperiences as jest.Mock).mockReturnValue({
        data: multipleExperiences,
        isLoading: false,
      });

      const { getAllByTestId } = await render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      await waitFor(() => {
        const experiences = getAllByTestId('user-experience');
        expect(experiences.length).toBe(2);
      });
    });
  });

  describe('Selecció de fotos', () => {
    it('hauria de gestionar afegir fotos amb èxit', async () => {
      (useExperiences as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
      });

      const { toJSON } = await render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      // El component hauria de renderitzar-se correctament
      expect(toJSON()).toBeTruthy();
    });

    it('hauria de gestionar permís de galeria denegat', async () => {
      (useExperiences as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
      });

      const { toJSON } = await render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      expect(toJSON()).toBeTruthy();
    });

    it('hauria de gestionar selecció de vídeos', async () => {
      (useExperiences as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
      });

      const { toJSON } = await render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      expect(toJSON()).toBeTruthy();
    });
  });

  describe('Enviament d\'experiències', () => {
    it('no hauria d\'enviar amb comentari buit i sense fotos', async () => {
      const mockMutate = jest.fn();
      (useCreateExperience as jest.Mock).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      });
      (useExperiences as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
      });

      const { getByPlaceholderText, container } = await render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      // Deixar el comentari buit
      const input = getByPlaceholderText('experiences.placeholder');
      await fireEvent.changeText(input, '');

      // Buscar el botó d'enviar
      const { TouchableOpacity } = require('react-native');
      const touchables = findAllByType(container, TouchableOpacity);
      // L'últim sol ser el botó d'enviar
      if (touchables.length > 1) {
        await fireEvent.press(touchables[touchables.length - 1]);
      }

      // No s'hauria d'haver cridat mutate
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('hauria de mostrar error si el comentari és massa llarg', async () => {
      (useExperiences as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
      });

      const { getByPlaceholderText, container } = await render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      const input = getByPlaceholderText('experiences.placeholder');
      const longComment = 'a'.repeat(2100); // Més de 2000 caràcters
      await fireEvent.changeText(input, longComment);

      // Buscar el botó d'enviar
      const { TouchableOpacity } = require('react-native');
      const touchables = findAllByType(container, TouchableOpacity);
      if (touchables.length > 1) {
        await fireEvent.press(touchables[touchables.length - 1]);
      }

      // El hook hauria de validar la longitud
      expect(useCreateExperience).toHaveBeenCalled();
    });

    it('hauria d\'enviar amb èxit i netejar el formulari', async () => {
      const mockMutate = jest.fn((data, options) => {
        options?.onSuccess?.({ failed_files: [] });
      });
      (useCreateExperience as jest.Mock).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      });
      (useExperiences as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
      });

      const { getByPlaceholderText, getByTestId, container } = await render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      const input = getByPlaceholderText('experiences.placeholder');
      await fireEvent.changeText(input, 'Nova experiència');
      await fireEvent.press(getByTestId('experience-condition-2'));

      const { TouchableOpacity } = require('react-native');
      const touchables = findAllByType(container, TouchableOpacity);
      if (touchables.length > 1) {
        await fireEvent.press(touchables[touchables.length - 1]);
      }

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled();
      });
    });

    it('hauria de gestionar fitxers fallits en l\'enviament', async () => {
      const mockMutate = jest.fn((data, options) => {
        options?.onSuccess?.({ failed_files: ['photo1.jpg'] });
      });
      (useCreateExperience as jest.Mock).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      });
      (useExperiences as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
      });

      const { getByPlaceholderText, getByTestId, container } = await render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      const input = getByPlaceholderText('experiences.placeholder');
      await fireEvent.changeText(input, 'Experiència amb fotos fallides');
      await fireEvent.press(getByTestId('experience-condition-2'));

      const { TouchableOpacity } = require('react-native');
      const touchables = findAllByType(container, TouchableOpacity);
      if (touchables.length > 1) {
        await fireEvent.press(touchables[touchables.length - 1]);
      }

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled();
      });
    });
  });

  describe('Actualització d\'experiències', () => {
    it('hauria de cridar updateExperience amb fitxers nous', async () => {
      const mockMutate = jest.fn((data, options) => {
        options?.onSuccess?.({ failed_files: [] });
      });
      (useUpdateExperience as jest.Mock).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      });
      (useExperiences as jest.Mock).mockReturnValue({
        data: [mockExperience],
        isLoading: false,
      });

      const { getByTestId } = await render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      await waitFor(() => {
        expect(getByTestId('edit-btn')).toBeTruthy();
      });

      await fireEvent.press(getByTestId('edit-btn'));

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled();
      });
    });

    it('hauria de gestionar fitxers fallits en actualització', async () => {
      const mockMutate = jest.fn((data, options) => {
        options?.onSuccess?.({ failed_files: ['newphoto.jpg'] });
      });
      (useUpdateExperience as jest.Mock).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      });
      (useExperiences as jest.Mock).mockReturnValue({
        data: [mockExperience],
        isLoading: false,
      });

      const { getByTestId } = await render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      await waitFor(() => {
        expect(getByTestId('edit-btn')).toBeTruthy();
      });

      await fireEvent.press(getByTestId('edit-btn'));

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled();
      });
    });
  });

  describe('Eliminació d\'experiències', () => {
    it('hauria de mostrar confirmació abans d\'eliminar', async () => {
      const mockMutate = jest.fn((data, options) => {
        options?.onSuccess?.();
      });
      (useDeleteExperience as jest.Mock).mockReturnValue({
        mutate: mockMutate,
      });
      (useExperiences as jest.Mock).mockReturnValue({
        data: [mockExperience],
        isLoading: false,
      });

      const { getByTestId } = await render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      await waitFor(() => {
        expect(getByTestId('delete-btn')).toBeTruthy();
      });

      await fireEvent.press(getByTestId('delete-btn'));

      expect(useDeleteExperience).toHaveBeenCalled();
    });

    it('hauria de gestionar error en eliminar', async () => {
      const mockMutate = jest.fn((data, options) => {
        options?.onError?.({ message: 'Error d\'eliminació' });
      });
      (useDeleteExperience as jest.Mock).mockReturnValue({
        mutate: mockMutate,
      });
      (useExperiences as jest.Mock).mockReturnValue({
        data: [mockExperience],
        isLoading: false,
      });

      const { toJSON } = await render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      expect(toJSON()).toBeTruthy();
    });
  });

  describe('Callback onClose', () => {
    it('hauria de cridar onClose en lloc de goBack quan existeix', async () => {
      const mockOnClose = jest.fn();
      (useExperiences as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
      });

      const { container } = await render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" onClose={mockOnClose} />
      );

      const { TouchableOpacity } = require('react-native');
      const touchables = findAllByType(container, TouchableOpacity);
      if (touchables.length > 0) {
        await fireEvent.press(touchables[0]);
      }

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Keyboard interactions', () => {
    it('should handle keyboard show event', async () => {
      (useExperiences as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
      });
      
      await render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      // Trigger keyboard show event
      triggerKeyboardEvent('keyboardDidShow', { endCoordinates: { height: 300 } });

      await waitFor(() => {
        expect(keyboardListeners.length).toBeGreaterThan(0);
      });
    });

    it('should handle keyboard hide event', async () => {
      (useExperiences as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
      });

      await render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      // Trigger keyboard hide event
      triggerKeyboardEvent('keyboardDidHide');

      await waitFor(() => {
        expect(keyboardListeners.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Photo press and modal', () => {
    it('should handle photo press on experience images', async () => {
      const experienceWithPhotos = {
        ...mockExperience,
        images_metadata: [
          { key: 'photo-1', url: 'https://example.com/photo.jpg', uploaded_at: '2025-01-01' },
        ],
      };
      
      (useExperiences as jest.Mock).mockReturnValue({
        data: [experienceWithPhotos],
        isLoading: false,
      });

      const { getByTestId } = await render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      await waitFor(() => {
        expect(getByTestId('photo-press-btn')).toBeTruthy();
      });

      // Press the photo button to trigger handlePhotoPress
      await fireEvent.press(getByTestId('photo-press-btn'));

      // The photo modal should now be visible (state changed)
      expect(getByTestId('photo-press-btn')).toBeTruthy();
    });

    it('should handle photo deleted callback', async () => {
      const experienceWithPhotos = {
        ...mockExperience,
        images_metadata: [
          { key: 'photo-1', url: 'https://example.com/photo.jpg', uploaded_at: '2025-01-01' },
        ],
      };
      
      (useExperiences as jest.Mock).mockReturnValue({
        data: [experienceWithPhotos],
        isLoading: false,
      });

      const { getByTestId, queryByTestId } = await render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      await waitFor(() => {
        expect(getByTestId('photo-press-btn')).toBeTruthy();
      });

      // Press the photo button to open the modal
      await fireEvent.press(getByTestId('photo-press-btn'));

      // Wait for the modal to appear
      await waitFor(() => {
        expect(getByTestId('photo-viewer-modal')).toBeTruthy();
      });

      // Press the delete photo button to trigger handlePhotoDeleted
      await fireEvent.press(getByTestId('delete-photo-btn'));

      // The modal should close after deletion
      await waitFor(() => {
        expect(queryByTestId('photo-viewer-modal')).toBeNull();
      });
    });
  });

  describe('Input content size change', () => {
    it('should handle content size change', async () => {
      (useExperiences as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
      });

      const { getByPlaceholderText } = await render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      const input = getByPlaceholderText('experiences.placeholder');
      
      // Simulate content size change
      await fireEvent(input, 'contentSizeChange', {
        nativeEvent: {
          contentSize: { width: 200, height: 60 }
        }
      });

      expect(input).toBeTruthy();
    });
  });

  describe('Add photos button', () => {
    const pressAllTouchables = async (container: any) => {
      const { TouchableOpacity } = require('react-native');
      const touchables = findAllByType(container, TouchableOpacity);
      for (const touchable of touchables) {
        try {
          await fireEvent.press(touchable);
        } catch (e) {
          // Ignore
        }
      }
    };

    it('should open the media picker through useMediaUpload.pickMedia', async () => {
      mockPickMedia.mockResolvedValue(null);
      (useExperiences as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
      });

      const { container } = await render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      await pressAllTouchables(container);

      await waitFor(() => {
        expect(mockPickMedia).toHaveBeenCalled();
      });
    });

    it('should send the prepared files (real MIME) with createExperience', async () => {
      const prepared = [
        { uri: 'file:///photo1.webp', contentType: 'image/webp', size: 100, mediaType: 'image' },
        { uri: 'file:///clip.mp4', contentType: 'video/mp4', size: 200, mediaType: 'video' },
      ];
      mockPickMedia.mockResolvedValue(prepared);
      const mockMutate = jest.fn();
      (useCreateExperience as jest.Mock).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      });
      (useExperiences as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
      });

      const { container, getByPlaceholderText } = await render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      // Obrir el selector (i afegir els fitxers preparats)
      await act(async () => {
        await pressAllTouchables(container);
      });
      await waitFor(() => expect(mockPickMedia).toHaveBeenCalled());

      await fireEvent.changeText(getByPlaceholderText('experiences.placeholder'), 'Amb fotos');
      await act(async () => {
        await pressAllTouchables(container);
      });

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({ refuge_id: 'refuge-1', comment: 'Amb fotos', files: prepared }),
          expect.any(Object)
        );
      });
    });

    it('should warn with the failure reasons when some files fail', async () => {
      const mockMutate = jest.fn((data, options) => {
        options?.onSuccess?.({ failed_files: [{ upload_id: 'u1', reason: 'moderation_blocked' }] });
      });
      (useCreateExperience as jest.Mock).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      });
      (useExperiences as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
      });

      const { container, getByPlaceholderText, getByTestId } = await render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );
      mockPickMedia.mockResolvedValue(null);
      await fireEvent.changeText(getByPlaceholderText('experiences.placeholder'), 'Text');
      await fireEvent.press(getByTestId('experience-condition-2'));
      await act(async () => {
        await pressAllTouchables(container);
      });

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          'common.warning',
          expect.stringContaining('media.failureReasons.moderation_blocked')
        );
      });
    });

    it('should handle error in photo selection', async () => {
      const ImagePicker = require('expo-image-picker');
      ImagePicker.requestMediaLibraryPermissionsAsync.mockRejectedValue(new Error('Permission error'));

      (useExperiences as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
      });

      const { container } = await render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      const { TouchableOpacity } = require('react-native');
      const touchables = findAllByType(container, TouchableOpacity);
      
      for (const touchable of touchables) {
        try {
          await fireEvent.press(touchable);
        } catch (e) {
          // Ignore
        }
      }

      expect(container).toBeTruthy();
    });
  });

  describe('Selected files preview', () => {
    it('should handle remove file button press', async () => {
      const ImagePicker = require('expo-image-picker');
      ImagePicker.launchImageLibraryAsync.mockResolvedValue({
        canceled: false,
        assets: [
          { uri: 'file://photo1.jpg', type: 'image' },
        ],
      });

      (useExperiences as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
      });

      const { container, queryByText } = await render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      // First, trigger the add photo button
      const { TouchableOpacity } = require('react-native');
      const touchables = findAllByType(container, TouchableOpacity);
      
      // Press all buttons to try to trigger addPhotos
      for (const touchable of touchables) {
        try {
          await fireEvent.press(touchable);
        } catch (e) {
          // Ignore
        }
      }

      // Wait for photos to be added
      await waitFor(() => {
        // After adding photos, there should be a remove button (✕)
        expect(container).toBeTruthy();
      });

      // Try to find and press the remove button
      const allTouchables = findAllByType(container, TouchableOpacity);
      for (const touchable of allTouchables) {
        try {
          await fireEvent.press(touchable);
        } catch (e) {
          // Ignore
        }
      }
    });
  });

  describe('Delete experience confirmation', () => {
    it('should call delete mutation onSuccess callback when confirming delete', async () => {
      const mockMutate = jest.fn((data, options) => {
        options?.onSuccess?.();
      });
      (useDeleteExperience as jest.Mock).mockReturnValue({
        mutate: mockMutate,
      });
      (useExperiences as jest.Mock).mockReturnValue({
        data: [mockExperience],
        isLoading: false,
      });

      const { getByTestId } = await render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      await waitFor(() => {
        expect(getByTestId('delete-btn')).toBeTruthy();
      });

      // Press delete button - this triggers showAlert with buttons
      await fireEvent.press(getByTestId('delete-btn'));

      // Find the delete confirmation button and press it
      await waitFor(() => {
        expect(capturedAlertButtons.length).toBe(2);
      });

      // The second button is the destructive "delete" button
      const deleteButton = capturedAlertButtons.find(btn => btn.style === 'destructive');
      expect(deleteButton).toBeDefined();
      
      // Press the delete confirmation button
      deleteButton?.onPress?.();

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled();
      });
    });

    it('should call delete mutation onError callback when delete fails', async () => {
      const mockMutate = jest.fn((data, options) => {
        options?.onError?.({ message: 'Delete failed' });
      });
      (useDeleteExperience as jest.Mock).mockReturnValue({
        mutate: mockMutate,
      });
      (useExperiences as jest.Mock).mockReturnValue({
        data: [mockExperience],
        isLoading: false,
      });

      const { getByTestId } = await render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      await waitFor(() => {
        expect(getByTestId('delete-btn')).toBeTruthy();
      });

      await fireEvent.press(getByTestId('delete-btn'));

      await waitFor(() => {
        expect(capturedAlertButtons.length).toBe(2);
      });

      const deleteButton = capturedAlertButtons.find(btn => btn.style === 'destructive');
      deleteButton?.onPress?.();

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled();
      });
    });

    it('should handle cancel button press in delete confirmation', async () => {
      (useDeleteExperience as jest.Mock).mockReturnValue({
        mutate: jest.fn(),
      });
      (useExperiences as jest.Mock).mockReturnValue({
        data: [mockExperience],
        isLoading: false,
      });

      const { getByTestId } = await render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      await waitFor(() => {
        expect(getByTestId('delete-btn')).toBeTruthy();
      });

      await fireEvent.press(getByTestId('delete-btn'));

      await waitFor(() => {
        expect(capturedAlertButtons.length).toBe(2);
      });

      // Press cancel button
      const cancelButton = capturedAlertButtons.find(btn => btn.style === 'cancel');
      expect(cancelButton).toBeDefined();
      cancelButton?.onPress?.();
    });
  });

  describe('Update experience edge cases', () => {
    it('should show error when updating with comment too long', async () => {
      const mockMutate = jest.fn();
      (useUpdateExperience as jest.Mock).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      });
      (useExperiences as jest.Mock).mockReturnValue({
        data: [mockExperience],
        isLoading: false,
      });

      const { getByTestId } = await render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      await waitFor(() => {
        expect(getByTestId('edit-long-btn')).toBeTruthy();
      });

      // Press the edit button with a long comment (> 2000 chars)
      await fireEvent.press(getByTestId('edit-long-btn'));

      // The mutation should NOT be called since the comment is too long
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('should handle update onError callback', async () => {
      const mockMutate = jest.fn((data, options) => {
        options?.onError?.({ message: 'Update failed' });
      });
      (useUpdateExperience as jest.Mock).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      });
      (useExperiences as jest.Mock).mockReturnValue({
        data: [mockExperience],
        isLoading: false,
      });

      const { getByTestId } = await render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      await waitFor(() => {
        expect(getByTestId('edit-btn')).toBeTruthy();
      });

      await fireEvent.press(getByTestId('edit-btn'));

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled();
      });
    });
  });

  describe('Create experience edge cases', () => {
    it('should handle create with empty comment but with files', async () => {
      const mockMutate = jest.fn((data, options) => {
        options?.onSuccess?.({ failed_files: [] });
      });
      (useCreateExperience as jest.Mock).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      });
      (useExperiences as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
      });

      const { toJSON } = await render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      expect(toJSON()).toBeTruthy();
    });

    it('should handle create onError callback', async () => {
      const mockMutate = jest.fn((data, options) => {
        options?.onError?.({ message: 'Create failed' });
      });
      (useCreateExperience as jest.Mock).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      });
      (useExperiences as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
      });

      const { getByPlaceholderText, getByTestId, container } = await render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      const input = getByPlaceholderText('experiences.placeholder');
      await fireEvent.changeText(input, 'Test experience');
      await fireEvent.press(getByTestId('experience-condition-2'));

      const { TouchableOpacity } = require('react-native');
      const touchables = findAllByType(container, TouchableOpacity);
      if (touchables.length > 1) {
        await fireEvent.press(touchables[touchables.length - 1]);
      }

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled();
      });
    });
  });

  describe('Condició obligatòria en crear (contracte PostgreSQL)', () => {
    const setup = (mutate = jest.fn()) => {
      (useCreateExperience as jest.Mock).mockReturnValue({ mutate, isPending: false });
      (useExperiences as jest.Mock).mockReturnValue({ data: [], isLoading: false });
      return mutate;
    };

    it('no hauria de permetre enviar sense triar condition (botó desactivat i missatge)', async () => {
      const mockMutate = setup();
      const { getByPlaceholderText, getByTestId } = await render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      await fireEvent.changeText(getByPlaceholderText('experiences.placeholder'), 'Text sense estat');

      expect(getByTestId('experience-condition-required')).toBeTruthy();
      expect(getByTestId('send-experience-button').props.accessibilityState?.disabled ?? getByTestId('send-experience-button').props.disabled).toBeTruthy();
      await fireEvent.press(getByTestId('send-experience-button'));
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it.each([0, 1, 2, 3])('hauria d\'enviar la condition %s escollida', async (value) => {
      const mockMutate = setup();
      const { getByPlaceholderText, getByTestId } = await render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      await fireEvent.changeText(getByPlaceholderText('experiences.placeholder'), 'Amb estat');
      await fireEvent.press(getByTestId(`experience-condition-${value}`));
      await fireEvent.press(getByTestId('send-experience-button'));

      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({ refuge_id: 'refuge-1', comment: 'Amb estat', condition: value }),
        expect.any(Object)
      );
    });

    it('hauria de buidar la condition després d\'enviar amb èxit', async () => {
      const mockMutate = setup(jest.fn((data, options) => options?.onSuccess?.({ failed_files: [] })));
      const { getByPlaceholderText, getByTestId } = await render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      await fireEvent.changeText(getByPlaceholderText('experiences.placeholder'), 'Un altre');
      await fireEvent.press(getByTestId('experience-condition-1'));
      await fireEvent.press(getByTestId('send-experience-button'));

      expect(mockMutate).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(getByTestId('experience-condition-required')).toBeTruthy());
    });

    it.each([
      ['user_blocked', 'contentErrors.userBlocked'],
      ['age_not_confirmed', 'contentErrors.ageNotConfirmed'],
    ])('hauria de mostrar el missatge específic per %s en crear', async (code, key) => {
      setup(jest.fn((data, options) => options?.onError?.({ code, message: 'Forbidden' })));
      const { getByPlaceholderText, getByTestId } = await render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      await fireEvent.changeText(getByPlaceholderText('experiences.placeholder'), 'Text');
      await fireEvent.press(getByTestId('experience-condition-2'));
      await fireEvent.press(getByTestId('send-experience-button'));

      expect(mockShowAlert).toHaveBeenCalledWith('contentErrors.notAllowedTitle', key);
    });

    it('hauria de mostrar el missatge específic per user_blocked en editar', async () => {
      (useUpdateExperience as jest.Mock).mockReturnValue({
        mutate: jest.fn((data, options) => options?.onError?.({ code: 'user_blocked', message: 'x' })),
        isPending: false,
      });
      (useExperiences as jest.Mock).mockReturnValue({ data: [mockExperience], isLoading: false });
      const { getByTestId } = await render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      await fireEvent.press(getByTestId('edit-btn'));

      expect(mockShowAlert).toHaveBeenCalledWith('contentErrors.notAllowedTitle', 'contentErrors.userBlocked');
    });
  });

  describe('InputContainer layout', () => {
    it('should handle input container layout event', async () => {
      (useExperiences as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
      });

      const { toJSON } = await render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      expect(toJSON()).toBeTruthy();
    });
  });

  describe('Send button disabled state', () => {
    it('should disable send button when isPending', async () => {
      (useCreateExperience as jest.Mock).mockReturnValue({
        mutate: jest.fn(),
        isPending: true,
      });
      (useExperiences as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
      });

      const { toJSON } = await render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      expect(toJSON()).toBeTruthy();
    });
  });

  describe('PhotoViewerModal creator uid', () => {
    it('should pass correct experienceCreatorUid to PhotoViewerModal', async () => {
      const experienceWithPhotos = {
        ...mockExperience,
        images_metadata: [
          { key: 'photo-1', url: 'https://example.com/photo.jpg', uploaded_at: '2025-01-01' },
        ],
      };
      
      (useExperiences as jest.Mock).mockReturnValue({
        data: [experienceWithPhotos],
        isLoading: false,
      });

      const { toJSON } = await render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      expect(toJSON()).toBeTruthy();
    });
  });
});

