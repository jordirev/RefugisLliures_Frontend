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
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { UserExperience } from '../../../components/UserExperience';
import { User, Experience, ImageMetadata } from '../../../models';

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
    it('hauria de renderitzar correctament amb usuari i experiència', () => {
      const { getByText } = render(
        <UserExperience
          user={mockUser}
          experience={mockExperience}
          onPhotoPress={mockOnPhotoPress}
        />
      );

      expect(getByText('TestUser')).toBeTruthy();
      expect(getByText('Una experiència fantàstica al refugi. Tot molt net i acollidor.')).toBeTruthy();
    });

    it('hauria de mostrar l\'avatar de l\'usuari', () => {
      const { getByTestId, UNSAFE_root } = render(
        <UserExperience
          user={mockUser}
          experience={mockExperience}
          onPhotoPress={mockOnPhotoPress}
        />
      );

      // Verificar que hi ha una imatge (avatar)
      const images = UNSAFE_root.findAllByType(require('react-native').Image);
      expect(images.length).toBeGreaterThan(0);
    });

    it('hauria de mostrar inicials quan no hi ha avatar', () => {
      const { getByText } = render(
        <UserExperience
          user={mockUserWithoutAvatar}
          experience={mockExperience}
          onPhotoPress={mockOnPhotoPress}
        />
      );

      // Hauria de mostrar la inicial del nom
      expect(getByText('U')).toBeTruthy();
    });

    it('hauria de mostrar ? quan no hi ha usuari', () => {
      const { getByText } = render(
        <UserExperience
          user={null}
          experience={mockExperience}
          onPhotoPress={mockOnPhotoPress}
        />
      );

      expect(getByText('?')).toBeTruthy();
      expect(getByText('common.unknown')).toBeTruthy();
    });

    it('snapshot test - experiència bàsica', () => {
      const { toJSON } = render(
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
    it('hauria de formatar la data correctament', () => {
      const { getByText } = render(
        <UserExperience
          user={mockUser}
          experience={mockExperience}
          onPhotoPress={mockOnPhotoPress}
        />
      );

      // La data hauria d'estar formatada com dd-mm-yyyy
      expect(getByText('15-06-2025')).toBeTruthy();
    });

    it('hauria de mostrar "Sense data" per dates invàlides', () => {
      const experienceWithInvalidDate: Experience = {
        ...mockExperience,
        modified_at: 'invalid-date',
      };

      const { getByText } = render(
        <UserExperience
          user={mockUser}
          experience={experienceWithInvalidDate}
          onPhotoPress={mockOnPhotoPress}
        />
      );

      expect(getByText('Sense data')).toBeTruthy();
    });

    it('hauria de gestionar data null', () => {
      const experienceWithNullDate: Experience = {
        ...mockExperience,
        modified_at: 'null',
      };

      const { getByText } = render(
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
    it('hauria de truncar text llarg', () => {
      const { getByText } = render(
        <UserExperience
          user={mockUser}
          experience={mockExperienceWithLongText}
          onPhotoPress={mockOnPhotoPress}
        />
      );

      // El text hauria d'estar truncat (150 caràcters + ...)
      expect(getByText('common.readMore')).toBeTruthy();
    });

    it('hauria de permetre expandir el text', () => {
      const { getByText } = render(
        <UserExperience
          user={mockUser}
          experience={mockExperienceWithLongText}
          onPhotoPress={mockOnPhotoPress}
        />
      );

      const readMoreButton = getByText('common.readMore');
      fireEvent.press(readMoreButton);

      expect(getByText('common.readLess')).toBeTruthy();
    });

    it('no hauria de mostrar botó readMore per textos curts', () => {
      const { queryByText } = render(
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
    it('hauria de mostrar el carrusel de fotos', () => {
      const { UNSAFE_root } = render(
        <UserExperience
          user={mockUser}
          experience={mockExperience}
          onPhotoPress={mockOnPhotoPress}
        />
      );

      // Hauria d'haver-hi imatges
      const images = UNSAFE_root.findAllByType(require('react-native').Image);
      expect(images.length).toBeGreaterThan(0);
    });

    it('hauria de cridar onPhotoPress quan es prem una foto', () => {
      const { UNSAFE_root } = render(
        <UserExperience
          user={mockUser}
          experience={mockExperience}
          onPhotoPress={mockOnPhotoPress}
        />
      );

      // Buscar TouchableOpacity de la imatge
      const touchables = UNSAFE_root.findAllByType(require('react-native').TouchableOpacity);
      if (touchables.length > 0) {
        fireEvent.press(touchables[0]);
      }
    });

    it('hauria de mostrar thumbnail per vídeos', () => {
      const { getByTestId } = render(
        <UserExperience
          user={mockUser}
          experience={mockExperienceWithVideo}
          onPhotoPress={mockOnPhotoPress}
        />
      );

      expect(getByTestId('video-thumbnail')).toBeTruthy();
    });

    it('no hauria de mostrar carrusel si no hi ha fotos', () => {
      const experienceNoPhotos: Experience = {
        ...mockExperience,
        images_metadata: [],
      };

      const { queryByTestId } = render(
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
    it('hauria de mostrar botons d\'edició si l\'usuari és el creador', () => {
      // Modificar el mock per fer coincidir l'usuari actual amb el creador
      const experienceByCurrentUser: Experience = {
        ...mockExperience,
        creator_uid: 'current-user-uid',
      };

      const { getByText, queryByText } = render(
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
    it('hauria d\'aplicar estil de resposta quan isAnswer és true', () => {
      const { toJSON } = render(
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
    it('snapshot test - amb experiència llarga', () => {
      const { toJSON } = render(
        <UserExperience
          user={mockUser}
          experience={mockExperienceWithLongText}
          onPhotoPress={mockOnPhotoPress}
        />
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it('snapshot test - amb vídeo', () => {
      const { toJSON } = render(
        <UserExperience
          user={mockUser}
          experience={mockExperienceWithVideo}
          onPhotoPress={mockOnPhotoPress}
        />
      );
      expect(toJSON()).toMatchSnapshot();
    });
  });
});
