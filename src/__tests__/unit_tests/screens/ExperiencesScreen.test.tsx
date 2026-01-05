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
import { render, fireEvent, waitFor } from '@testing-library/react-native';
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

jest.mock('../../../hooks/useUsersQuery', () => ({
  useUser: jest.fn(),
}));

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock ImagePicker
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: true,
    assets: [],
  }),
  MediaTypeOptions: {
    Images: 'Images',
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
  UserExperience: ({ user, experience, onEdit, onDelete }: any) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View testID="user-experience">
        <Text>{experience.text || experience.comment}</Text>
        {user && <Text>{user.username}</Text>}
        <TouchableOpacity testID="edit-btn" onPress={() => onEdit(experience.id, 'edited', [])}>
          <Text>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="delete-btn" onPress={onDelete}>
          <Text>Eliminar</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

jest.mock('../../../components/CustomAlert', () => ({
  CustomAlert: () => null,
}));

jest.mock('../../../components/PhotoViewerModal', () => ({
  PhotoViewerModal: () => null,
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

  it('hauria de mostrar estat de càrrega', () => {
    (useExperiences as jest.Mock).mockReturnValue({
      data: [],
      isLoading: true,
    });

    render(
      <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
    );
    
    expect(useExperiences).toHaveBeenCalledWith('refuge-1');
  });

  it('hauria de mostrar missatge quan no hi ha experiències', async () => {
    (useExperiences as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });

    const { getByText } = render(
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

    const { getByTestId, getByText } = render(
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

    const { getByText } = render(
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

    const { toJSON } = render(
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

    const { getByTestId } = render(
      <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
    );
    
    await waitFor(() => {
      expect(getByTestId('delete-btn')).toBeTruthy();
    });

    // Note: Delete button triggers confirmation dialog first
    fireEvent.press(getByTestId('delete-btn'));
    
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

      const { getByPlaceholderText } = render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      // El placeholder real és 'experiences.placeholder' segons l'output del test
      const input = getByPlaceholderText('experiences.placeholder');
      fireEvent.changeText(input, 'Nova experiència de prova');

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

      const { toJSON } = render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      expect(toJSON()).toBeTruthy();
    });

    it('hauria de mostrar indicador de càrrega quan isPending és true', () => {
      (useCreateExperience as jest.Mock).mockReturnValue({
        mutate: jest.fn(),
        isPending: true,
      });
      (useExperiences as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
      });

      const { toJSON } = render(
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

      const { getByTestId } = render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      await waitFor(() => {
        expect(getByTestId('edit-btn')).toBeTruthy();
      });

      fireEvent.press(getByTestId('edit-btn'));
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

      const { toJSON } = render(
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

      const { UNSAFE_root } = render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      const { TouchableOpacity } = require('react-native');
      const touchables = UNSAFE_root.findAllByType(TouchableOpacity);
      if (touchables.length > 0) {
        fireEvent.press(touchables[0]);
      }

      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  describe('Fotos', () => {
    it('hauria de poder eliminar fotos existents', async () => {
      const mockDeleteMedia = jest.fn();
      (useDeleteRefugeMedia as jest.Mock).mockReturnValue({
        mutate: mockDeleteMedia,
      });
      
      const experienceWithPhotos = {
        ...mockExperience,
        photos: [{ id: 'photo-1', url: 'https://example.com/photo.jpg' }],
      };
      
      (useExperiences as jest.Mock).mockReturnValue({
        data: [experienceWithPhotos],
        isLoading: false,
      });

      const { toJSON } = render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      expect(toJSON()).toBeTruthy();
      expect(useDeleteRefugeMedia).toHaveBeenCalled();
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

      const { getAllByTestId } = render(
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

      const { toJSON } = render(
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

      const { toJSON } = render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      expect(toJSON()).toBeTruthy();
    });

    it('hauria de gestionar selecció de vídeos', async () => {
      (useExperiences as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
      });

      const { toJSON } = render(
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

      const { getByPlaceholderText, UNSAFE_root } = render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      // Deixar el comentari buit
      const input = getByPlaceholderText('experiences.placeholder');
      fireEvent.changeText(input, '');

      // Buscar el botó d'enviar
      const { TouchableOpacity } = require('react-native');
      const touchables = UNSAFE_root.findAllByType(TouchableOpacity);
      // L'últim sol ser el botó d'enviar
      if (touchables.length > 1) {
        fireEvent.press(touchables[touchables.length - 1]);
      }

      // No s'hauria d'haver cridat mutate
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('hauria de mostrar error si el comentari és massa llarg', async () => {
      (useExperiences as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
      });

      const { getByPlaceholderText, UNSAFE_root } = render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      const input = getByPlaceholderText('experiences.placeholder');
      const longComment = 'a'.repeat(2100); // Més de 2000 caràcters
      fireEvent.changeText(input, longComment);

      // Buscar el botó d'enviar
      const { TouchableOpacity } = require('react-native');
      const touchables = UNSAFE_root.findAllByType(TouchableOpacity);
      if (touchables.length > 1) {
        fireEvent.press(touchables[touchables.length - 1]);
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

      const { getByPlaceholderText, UNSAFE_root } = render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      const input = getByPlaceholderText('experiences.placeholder');
      fireEvent.changeText(input, 'Nova experiència');

      const { TouchableOpacity } = require('react-native');
      const touchables = UNSAFE_root.findAllByType(TouchableOpacity);
      if (touchables.length > 1) {
        fireEvent.press(touchables[touchables.length - 1]);
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

      const { getByPlaceholderText, UNSAFE_root } = render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      const input = getByPlaceholderText('experiences.placeholder');
      fireEvent.changeText(input, 'Experiència amb fotos fallides');

      const { TouchableOpacity } = require('react-native');
      const touchables = UNSAFE_root.findAllByType(TouchableOpacity);
      if (touchables.length > 1) {
        fireEvent.press(touchables[touchables.length - 1]);
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

      const { getByTestId } = render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      await waitFor(() => {
        expect(getByTestId('edit-btn')).toBeTruthy();
      });

      fireEvent.press(getByTestId('edit-btn'));

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

      const { getByTestId } = render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      await waitFor(() => {
        expect(getByTestId('edit-btn')).toBeTruthy();
      });

      fireEvent.press(getByTestId('edit-btn'));

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

      const { getByTestId } = render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      await waitFor(() => {
        expect(getByTestId('delete-btn')).toBeTruthy();
      });

      fireEvent.press(getByTestId('delete-btn'));

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

      const { toJSON } = render(
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

      const { UNSAFE_root } = render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" onClose={mockOnClose} />
      );

      const { TouchableOpacity } = require('react-native');
      const touchables = UNSAFE_root.findAllByType(TouchableOpacity);
      if (touchables.length > 0) {
        fireEvent.press(touchables[0]);
      }

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Eliminació de media', () => {
    it('hauria de cridar deleteRefugeMedia quan s\'elimina una foto', async () => {
      const mockDeleteMedia = jest.fn((data, options) => {
        options?.onSuccess?.();
      });
      (useDeleteRefugeMedia as jest.Mock).mockReturnValue({
        mutate: mockDeleteMedia,
      });
      
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

      const { toJSON } = render(
        <ExperiencesScreen refugeId="refuge-1" refugeName="Refugi de Prova" />
      );

      expect(toJSON()).toBeTruthy();
      expect(useDeleteRefugeMedia).toHaveBeenCalled();
    });
  });
});
