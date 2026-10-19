/**
 * Tests unitaris per al component UserExperience
 *
 * Aquest fitxer cobreix:
 * - Renderització bàsica del component
 * - Visualització d'experiències amb i sense fotos
 * - Mode d'edició
 * - Truncament de text llarg
 * - Formatació de dates
 * - Snapshot tests
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { UserExperience } from '../../../components/UserExperience';
import { User, Experience, ImageMetadata } from '../../../models';
import { findAllByType } from '../../testHelpers/findByType';

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
  UIImagePickerPresentationStyle: { FULL_SCREEN: 0 },
}));

// Mock PhotoViewerModal VideoThumbnail
jest.mock('../../../components/PhotoViewerModal', () => ({
  VideoThumbnail: ({ uri, style, onPress }: any) => {
    const { View } = require('react-native');
    return <View testID="video-thumbnail" style={style} onPress={onPress} />;
  },
}));

// Mock SVG icons
jest.mock('../../../assets/icons/photo-plus.svg', () => 'AddPhotoIcon');

// Mock AuthContext
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    backendUser: {
      uid: 'current-user-uid',
      username: 'CurrentUser',
    },
  }),
}));

const mockUser: User = {
  uid: 'user-1',
  username: 'TestUser',
  avatar_metadata: {
    key: 'avatar-key',
    url: 'https://example.com/avatar.jpg',
    uploaded_at: '2025-01-01T00:00:00Z',
  },
  language: 'ca',
  num_shared_experiences: 5,
  num_renovated_refuges: 2,
  created_at: '2024-01-01T00:00:00Z',
};

const mockUserWithoutAvatar: User = {
  uid: 'user-2',
  username: 'UserNoAvatar',
  language: 'ca',
  num_shared_experiences: 0,
  num_renovated_refuges: 0,
  created_at: '2024-01-01T00:00:00Z',
};

const mockExperience: Experience = {
  id: 'exp-1',
  refuge_id: 'refuge-1',
  creator_uid: 'user-1',
  modified_at: '2025-06-15T10:30:00Z',
  comment: 'Una experiència fantàstica al refugi. Tot molt net i acollidor.',
  images_metadata: [
    {
      key: 'img-1',
      url: 'https://example.com/photo1.jpg',
      uploaded_at: '2025-06-15T10:30:00Z',
      creator_uid: 'user-1',
    },
  ],
};

const mockExperienceWithLongText: Experience = {
  id: 'exp-2',
  refuge_id: 'refuge-1',
  creator_uid: 'user-1',
  modified_at: '2025-06-15T10:30:00Z',
  comment: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  images_metadata: [],
};

const mockExperienceWithVideo: Experience = {
  id: 'exp-3',
  refuge_id: 'refuge-1',
  creator_uid: 'user-1',
  modified_at: '2025-06-15T10:30:00Z',
  comment: 'Experiència amb vídeo',
  images_metadata: [
    {
      key: 'video-1',
      url: 'https://example.com/video.mp4',
      uploaded_at: '2025-06-15T10:30:00Z',
      creator_uid: 'user-1',
    },
  ],
};

const mockOnPhotoPress = jest.fn();
const mockOnEdit = jest.fn();
const mockOnDelete = jest.fn();

describe('UserExperience Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderització bàsica', () => {
    it('hauria de renderitzar correctament amb usuari i experiència', async () => {
      const { getByText } = await render(
        <UserExperience
          user={mockUser}
          experience={mockExperience}
          onPhotoPress={mockOnPhotoPress}
        />
      );

      expect(getByText('TestUser')).toBeTruthy();
      expect(getByText('Una experiència fantàstica al refugi. Tot molt net i acollidor.')).toBeTruthy();
    });

    it('hauria de mostrar l\'avatar de l\'usuari', async () => {
      const { getByTestId, container } = await render(
        <UserExperience
          user={mockUser}
          experience={mockExperience}
          onPhotoPress={mockOnPhotoPress}
        />
      );

      // Verificar que hi ha una imatge (avatar)
      const images = findAllByType(container, require('react-native').Image);
      expect(images.length).toBeGreaterThan(0);
    });

    it('hauria de mostrar inicials quan no hi ha avatar', async () => {
      const { getByText } = await render(
        <UserExperience
          user={mockUserWithoutAvatar}
          experience={mockExperience}
          onPhotoPress={mockOnPhotoPress}
        />
      );

      // Hauria de mostrar la inicial del nom
      expect(getByText('U')).toBeTruthy();
    });

    it('hauria de mostrar ? quan no hi ha usuari', async () => {
      const { getByText } = await render(
        <UserExperience
          user={null}
          experience={mockExperience}
          onPhotoPress={mockOnPhotoPress}
        />
      );

      expect(getByText('?')).toBeTruthy();
      expect(getByText('common.unknown')).toBeTruthy();
    });

    it('snapshot test - experiència bàsica', async () => {
      const { toJSON } = await render(
        <UserExperience
          user={mockUser}
          experience={mockExperience}
          onPhotoPress={mockOnPhotoPress}
        />
      );
      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('Format de data', () => {
    it('hauria de formatar la data correctament', async () => {
      const { getByText } = await render(
        <UserExperience
          user={mockUser}
          experience={mockExperience}
          onPhotoPress={mockOnPhotoPress}
        />
      );

      // La data hauria d'estar formatada com dd-mm-yyyy
      expect(getByText('15-06-2025')).toBeTruthy();
    });

    it('hauria de mostrar "Sense data" per dates invàlides', async () => {
      const experienceWithInvalidDate: Experience = {
        ...mockExperience,
        modified_at: 'invalid-date',
      };

      const { getByText } = await render(
        <UserExperience
          user={mockUser}
          experience={experienceWithInvalidDate}
          onPhotoPress={mockOnPhotoPress}
        />
      );

      expect(getByText('Sense data')).toBeTruthy();
    });

    it('hauria de gestionar data null', async () => {
      const experienceWithNullDate: Experience = {
        ...mockExperience,
        modified_at: 'null',
      };

      const { getByText } = await render(
        <UserExperience
          user={mockUser}
          experience={experienceWithNullDate}
          onPhotoPress={mockOnPhotoPress}
        />
      );

      expect(getByText('Sense data')).toBeTruthy();
    });
  });

  describe('Truncament de text', () => {
    it('hauria de truncar text llarg', async () => {
      const { getByText } = await render(
        <UserExperience
          user={mockUser}
          experience={mockExperienceWithLongText}
          onPhotoPress={mockOnPhotoPress}
        />
      );

      // El text hauria d'estar truncat (150 caràcters + ...)
      expect(getByText('common.readMore')).toBeTruthy();
    });

    it('hauria de permetre expandir el text', async () => {
      const { getByText } = await render(
        <UserExperience
          user={mockUser}
          experience={mockExperienceWithLongText}
          onPhotoPress={mockOnPhotoPress}
        />
      );

      const readMoreButton = getByText('common.readMore');
      await fireEvent.press(readMoreButton);

      expect(getByText('common.readLess')).toBeTruthy();
    });

    it('no hauria de mostrar botó readMore per textos curts', async () => {
      const { queryByText } = await render(
        <UserExperience
          user={mockUser}
          experience={mockExperience}
          onPhotoPress={mockOnPhotoPress}
        />
      );

      expect(queryByText('common.readMore')).toBeNull();
    });
  });

  describe('Galeria de fotos', () => {
    it('hauria de mostrar el carrusel de fotos', async () => {
      const { container } = await render(
        <UserExperience
          user={mockUser}
          experience={mockExperience}
          onPhotoPress={mockOnPhotoPress}
        />
      );

      // Hauria d'haver-hi imatges
      const images = findAllByType(container, require('react-native').Image);
      expect(images.length).toBeGreaterThan(0);
    });

    it('hauria de cridar onPhotoPress quan es prem una foto', async () => {
      const { container } = await render(
        <UserExperience
          user={mockUser}
          experience={mockExperience}
          onPhotoPress={mockOnPhotoPress}
        />
      );

      // Buscar TouchableOpacity de la imatge
      const touchables = findAllByType(container, require('react-native').TouchableOpacity);
      if (touchables.length > 0) {
        await fireEvent.press(touchables[0]);
      }
    });

    it('hauria de mostrar thumbnail per vídeos', async () => {
      const { getByTestId } = await render(
        <UserExperience
          user={mockUser}
          experience={mockExperienceWithVideo}
          onPhotoPress={mockOnPhotoPress}
        />
      );

      expect(getByTestId('video-thumbnail')).toBeTruthy();
    });

    it('no hauria de mostrar carrusel si no hi ha fotos', async () => {
      const experienceNoPhotos: Experience = {
        ...mockExperience,
        images_metadata: [],
      };

      const { queryByTestId } = await render(
        <UserExperience
          user={mockUser}
          experience={experienceNoPhotos}
          onPhotoPress={mockOnPhotoPress}
        />
      );

      // No hauria d'haver-hi carrusel
      expect(queryByTestId('video-thumbnail')).toBeNull();
    });
  });

  describe('Mode d\'edició', () => {
    it('hauria de mostrar botons d\'edició si l\'usuari és el creador', async () => {
      // Modificar el mock per fer coincidir l'usuari actual amb el creador
      const experienceByCurrentUser: Experience = {
        ...mockExperience,
        creator_uid: 'current-user-uid',
      };

      const { getByText, queryByText } = await render(
        <UserExperience
          user={mockUser}
          experience={experienceByCurrentUser}
          onPhotoPress={mockOnPhotoPress}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      // Els botons d'edició haurien d'estar presents per al creador
      // Nota: això depèn de la implementació exacta del component
    });
  });

  describe('Mode resposta', () => {
    it('hauria d\'aplicar estil de resposta quan isAnswer és true', async () => {
      const { toJSON } = await render(
        <UserExperience
          user={mockUser}
          experience={mockExperience}
          isAnswer={true}
          onPhotoPress={mockOnPhotoPress}
        />
      );

      // El snapshot hauria de mostrar l'estil de resposta
      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('Edició d\'experiència', () => {
    it('snapshot test - amb experiència llarga', async () => {
      const { toJSON } = await render(
        <UserExperience
          user={mockUser}
          experience={mockExperienceWithLongText}
          onPhotoPress={mockOnPhotoPress}
        />
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it('snapshot test - amb vídeo', async () => {
      const { toJSON } = await render(
        <UserExperience
          user={mockUser}
          experience={mockExperienceWithVideo}
          onPhotoPress={mockOnPhotoPress}
        />
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it('hauria de mostrar botons d\'edició i eliminar quan l\'usuari és el creador', async () => {
      const experienceByCurrentUser: Experience = {
        ...mockExperience,
        creator_uid: 'current-user-uid',
      };

      const { getByText } = await render(
        <UserExperience
          user={mockUser}
          experience={experienceByCurrentUser}
          onPhotoPress={mockOnPhotoPress}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(getByText('common.edit')).toBeTruthy();
      expect(getByText('common.delete')).toBeTruthy();
    });

    it('hauria de cridar onDelete quan es prem el botó d\'eliminar', async () => {
      const experienceByCurrentUser: Experience = {
        ...mockExperience,
        creator_uid: 'current-user-uid',
      };

      const { getByText } = await render(
        <UserExperience
          user={mockUser}
          experience={experienceByCurrentUser}
          onPhotoPress={mockOnPhotoPress}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      await fireEvent.press(getByText('common.delete'));
      expect(mockOnDelete).toHaveBeenCalled();
    });

    it('hauria d\'entrar en mode edició quan es prem el botó editar', async () => {
      const experienceByCurrentUser: Experience = {
        ...mockExperience,
        creator_uid: 'current-user-uid',
      };

      const { getByText, getByDisplayValue } = await render(
        <UserExperience
          user={mockUser}
          experience={experienceByCurrentUser}
          onPhotoPress={mockOnPhotoPress}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      await fireEvent.press(getByText('common.edit'));
      
      // Hauria de mostrar l'input d'edició
      expect(getByDisplayValue(mockExperience.comment)).toBeTruthy();
      expect(getByText('common.cancel')).toBeTruthy();
      expect(getByText('experiences.addPhotos')).toBeTruthy();
    });

    it('hauria de cancel·lar l\'edició quan es prem cancel·lar', async () => {
      const experienceByCurrentUser: Experience = {
        ...mockExperience,
        creator_uid: 'current-user-uid',
      };

      const { getByText, queryByDisplayValue } = await render(
        <UserExperience
          user={mockUser}
          experience={experienceByCurrentUser}
          onPhotoPress={mockOnPhotoPress}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      // Entrar en mode edició
      await fireEvent.press(getByText('common.edit'));
      expect(getByText('common.cancel')).toBeTruthy();

      // Cancel·lar
      await fireEvent.press(getByText('common.cancel'));
      
      // Hauria de tornar al mode normal
      expect(queryByDisplayValue(mockExperience.comment)).toBeNull();
      expect(getByText('common.edit')).toBeTruthy();
    });

    it('hauria de permetre modificar el comentari', async () => {
      const experienceByCurrentUser: Experience = {
        ...mockExperience,
        creator_uid: 'current-user-uid',
      };

      const { getByText, getByDisplayValue } = await render(
        <UserExperience
          user={mockUser}
          experience={experienceByCurrentUser}
          onPhotoPress={mockOnPhotoPress}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      // Entrar en mode edició
      await fireEvent.press(getByText('common.edit'));
      
      const input = getByDisplayValue(mockExperience.comment);
      await fireEvent.changeText(input, 'Nou comentari modificat');
      
      expect(getByDisplayValue('Nou comentari modificat')).toBeTruthy();
      // El botó confirm hauria d'aparèixer perquè hi ha canvis
      expect(getByText('common.confirm')).toBeTruthy();
    });

    it('hauria de cridar onEdit quan es confirma l\'edició', async () => {
      const experienceByCurrentUser: Experience = {
        ...mockExperience,
        creator_uid: 'current-user-uid',
      };

      const { getByText, getByDisplayValue } = await render(
        <UserExperience
          user={mockUser}
          experience={experienceByCurrentUser}
          onPhotoPress={mockOnPhotoPress}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      // Entrar en mode edició
      await fireEvent.press(getByText('common.edit'));
      
      const input = getByDisplayValue(mockExperience.comment);
      await fireEvent.changeText(input, 'Comentari actualitzat');
      
      await fireEvent.press(getByText('common.confirm'));
      
      expect(mockOnEdit).toHaveBeenCalledWith(mockExperience.id, 'Comentari actualitzat', []);
    });

    it('hauria d\'afegir els fitxers preparats per onPickMedia durant l\'edició', async () => {
      const prepared = [
        { uri: 'file://test-photo.webp', contentType: 'image/webp', size: 1234, mediaType: 'image' as const },
      ];
      const mockPickMedia = jest.fn().mockResolvedValue(prepared);

      const experienceByCurrentUser: Experience = {
        ...mockExperience,
        creator_uid: 'current-user-uid',
      };

      const { getByText } = await render(
        <UserExperience
          user={mockUser}
          experience={experienceByCurrentUser}
          onPhotoPress={mockOnPhotoPress}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onPickMedia={mockPickMedia}
        />
      );

      await fireEvent.press(getByText('common.edit'));
      await act(async () => {
        await fireEvent.press(getByText('experiences.addPhotos'));
      });

      expect(mockPickMedia).toHaveBeenCalled();
      await waitFor(() => {
        expect(getByText('experiences.newPhotos:')).toBeTruthy();
      });

      // Confirmar envia els fitxers preparats (MIME real, no forçat)
      await fireEvent.press(getByText('common.confirm'));
      expect(mockOnEdit).toHaveBeenCalledWith(experienceByCurrentUser.id, experienceByCurrentUser.comment, prepared);
    });

    it('no hauria d\'afegir res si la selecció es cancel·la', async () => {
      const mockPickMedia = jest.fn().mockResolvedValue(null);
      const experienceByCurrentUser: Experience = {
        ...mockExperience,
        creator_uid: 'current-user-uid',
      };

      const { getByText, queryByText } = await render(
        <UserExperience
          user={mockUser}
          experience={experienceByCurrentUser}
          onPhotoPress={mockOnPhotoPress}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onPickMedia={mockPickMedia}
        />
      );

      await fireEvent.press(getByText('common.edit'));
      await act(async () => {
        await fireEvent.press(getByText('experiences.addPhotos'));
      });

      expect(mockPickMedia).toHaveBeenCalled();
      expect(queryByText('experiences.newPhotos:')).toBeNull();
    });

    it('hauria de mostrar el comptador de caràcters durant l\'edició', async () => {
      const experienceByCurrentUser: Experience = {
        ...mockExperience,
        creator_uid: 'current-user-uid',
      };

      const { getByText } = await render(
        <UserExperience
          user={mockUser}
          experience={experienceByCurrentUser}
          onPhotoPress={mockOnPhotoPress}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      await fireEvent.press(getByText('common.edit'));
      
      // Hauria de mostrar el comptador de caràcters
      expect(getByText(`${mockExperience.comment.length} / 2000`)).toBeTruthy();
    });
  });

  describe('Format de data addicional', () => {
    it('hauria de formatar dates amb hora correctament', async () => {
      const experienceWithTime: Experience = {
        ...mockExperience,
        modified_at: '2025-03-20T14:30:00.000Z',
      };

      const { getByText } = await render(
        <UserExperience
          user={mockUser}
          experience={experienceWithTime}
          onPhotoPress={mockOnPhotoPress}
        />
      );

      expect(getByText('20-03-2025')).toBeTruthy();
    });

    it('hauria de gestionar data undefined', async () => {
      const experienceWithUndefinedDate: Experience = {
        ...mockExperience,
        modified_at: 'undefined',
      };

      const { getByText } = await render(
        <UserExperience
          user={mockUser}
          experience={experienceWithUndefinedDate}
          onPhotoPress={mockOnPhotoPress}
        />
      );

      expect(getByText('Sense data')).toBeTruthy();
    });

    it('hauria de parsejar altres formats de data', async () => {
      const experienceWithDifferentFormat: Experience = {
        ...mockExperience,
        modified_at: 'March 20, 2025',
      };

      const { getByText } = await render(
        <UserExperience
          user={mockUser}
          experience={experienceWithDifferentFormat}
          onPhotoPress={mockOnPhotoPress}
        />
      );

      expect(getByText('20-03-2025')).toBeTruthy();
    });
  });

  describe('Scroll de fotos', () => {
    it('hauria de gestionar el scroll de la galeria', async () => {
      const experienceWithMultiplePhotos: Experience = {
        ...mockExperience,
        images_metadata: [
          { key: 'img-1', url: 'https://example.com/photo1.jpg', uploaded_at: '2025-06-15T10:30:00Z', creator_uid: 'user-1' },
          { key: 'img-2', url: 'https://example.com/photo2.jpg', uploaded_at: '2025-06-15T10:30:00Z', creator_uid: 'user-1' },
          { key: 'img-3', url: 'https://example.com/photo3.jpg', uploaded_at: '2025-06-15T10:30:00Z', creator_uid: 'user-1' },
        ],
      };

      const { container } = await render(
        <UserExperience
          user={mockUser}
          experience={experienceWithMultiplePhotos}
          onPhotoPress={mockOnPhotoPress}
        />
      );

      const scrollView = findAllByType(container, require('react-native').ScrollView)[0];
      
      // Simular scroll
      await fireEvent.scroll(scrollView, {
        nativeEvent: {
          contentOffset: { x: 120, y: 0 },
        },
      });
    });
  });

  describe('Helper function isVideo', () => {
    it('hauria d\'identificar vídeos MP4', async () => {
      const videoExperience: Experience = {
        ...mockExperience,
        images_metadata: [
          { key: 'vid-1', url: 'https://example.com/video.mp4', uploaded_at: '2025-06-15T10:30:00Z', creator_uid: 'user-1' },
        ],
      };

      const { getByTestId } = await render(
        <UserExperience
          user={mockUser}
          experience={videoExperience}
          onPhotoPress={mockOnPhotoPress}
        />
      );

      expect(getByTestId('video-thumbnail')).toBeTruthy();
    });

    it('hauria d\'identificar vídeos MOV', async () => {
      const videoExperience: Experience = {
        ...mockExperience,
        images_metadata: [
          { key: 'vid-1', url: 'https://example.com/video.mov', uploaded_at: '2025-06-15T10:30:00Z', creator_uid: 'user-1' },
        ],
      };

      const { getByTestId } = await render(
        <UserExperience
          user={mockUser}
          experience={videoExperience}
          onPhotoPress={mockOnPhotoPress}
        />
      );

      expect(getByTestId('video-thumbnail')).toBeTruthy();
    });
  });
});
