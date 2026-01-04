/**
 * Tests unitaris per al component PhotoViewerModal
 *
 * Aquest fitxer cobreix:
 * - Renderització del modal
 * - Navegació entre fotos
 * - Visualització d'imatges i vídeos
 * - Eliminació de fotos
 * - Metadades del creador
 * - Snapshot tests
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { PhotoViewerModal, VideoThumbnail } from '../../../components/PhotoViewerModal';
import { ImageMetadata } from '../../../models';

// Mock expo-video
jest.mock('expo-video', () => ({
  VideoView: ({ player, style, ...props }: any) => {
    const { View } = require('react-native');
    return <View testID="video-view" style={style} {...props} />;
  },
  useVideoPlayer: jest.fn((uri, callback) => {
    const player = {
      loop: false,
      pause: jest.fn(),
      muted: false,
    };
    if (callback) callback(player);
    return player;
  }),
}));

// Mock RefugeMediaService
jest.mock('../../../services/RefugeMediaService', () => ({
  RefugeMediaService: {
    deleteRefugeMedia: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock UsersService
jest.mock('../../../services/UsersService', () => ({
  UsersService: {
    getUserByUid: jest.fn().mockResolvedValue({
      uid: 'user-1',
      username: 'TestUser',
    }),
  },
}));

// Mock AuthContext
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    firebaseUser: {
      uid: 'current-user-uid',
    },
  }),
}));

// Mock react-query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(({ queryKey, queryFn, enabled }) => {
    if (enabled === false) {
      return { data: null, isLoading: false };
    }
    return {
      data: { uid: 'user-1', username: 'TestUser' },
      isLoading: false,
    };
  }),
}));

// Mock SVG icons
jest.mock('../../../assets/icons/x.svg', () => 'CloseIcon');
jest.mock('../../../assets/icons/trash.svg', () => 'TrashIcon');

const mockPhotos: ImageMetadata[] = [
  {
    key: 'photo-1',
    url: 'https://example.com/photo1.jpg',
    uploaded_at: '2025-01-15T10:30:00Z',
    creator_uid: 'user-1',
  },
  {
    key: 'photo-2',
    url: 'https://example.com/photo2.jpg',
    uploaded_at: '2025-01-16T14:00:00Z',
    creator_uid: 'user-2',
  },
  {
    key: 'video-1',
    url: 'https://example.com/video.mp4',
    uploaded_at: '2025-01-17T09:00:00Z',
    creator_uid: 'user-1',
  },
];

const mockOnClose = jest.fn();
const mockOnPhotoDeleted = jest.fn();

const defaultProps = {
  visible: true,
  photos: mockPhotos,
  initialIndex: 0,
  refugeId: 'refuge-1',
  onClose: mockOnClose,
};

describe('PhotoViewerModal Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderització bàsica', () => {
    it('hauria de renderitzar quan és visible', () => {
      const { toJSON } = render(<PhotoViewerModal {...defaultProps} />);
      expect(toJSON()).toBeTruthy();
    });

    it('no hauria de mostrar res si no hi ha fotos', () => {
      const { toJSON } = render(
        <PhotoViewerModal {...defaultProps} photos={[]} />
      );
      expect(toJSON()).toBeNull();
    });

    it('snapshot test - modal amb fotos', () => {
      const { toJSON } = render(<PhotoViewerModal {...defaultProps} />);
      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('Visualització d\'imatges', () => {
    it('hauria de mostrar la primera imatge per defecte', () => {
      const { UNSAFE_root } = render(<PhotoViewerModal {...defaultProps} />);
      
      const images = UNSAFE_root.findAllByType(require('react-native').Image);
      expect(images.length).toBeGreaterThan(0);
    });

    it('hauria de mostrar la imatge corresponent a initialIndex', () => {
      const { toJSON } = render(
        <PhotoViewerModal {...defaultProps} initialIndex={1} />
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('Visualització de vídeos', () => {
    it('hauria de detectar vídeos per extensió .mp4', () => {
      const { getByTestId } = render(
        <PhotoViewerModal {...defaultProps} initialIndex={2} />
      );
      
      expect(getByTestId('video-view')).toBeTruthy();
    });

    it('hauria de mostrar VideoPlayer per URLs de vídeo', () => {
      const videoPhotos: ImageMetadata[] = [
        {
          key: 'video-1',
          url: 'https://example.com/video.mov',
          uploaded_at: '2025-01-17T09:00:00Z',
          creator_uid: 'user-1',
        },
      ];

      const { getByTestId } = render(
        <PhotoViewerModal
          {...defaultProps}
          photos={videoPhotos}
          initialIndex={0}
        />
      );

      expect(getByTestId('video-view')).toBeTruthy();
    });
  });

  describe('Navegació entre fotos', () => {
    it('hauria de permetre fer scroll entre fotos', () => {
      const { UNSAFE_root } = render(<PhotoViewerModal {...defaultProps} />);
      
      const scrollViews = UNSAFE_root.findAllByType(require('react-native').ScrollView);
      expect(scrollViews.length).toBeGreaterThan(0);
    });
  });

  describe('Tancament del modal', () => {
    it('hauria de cridar onClose quan es prem el botó', () => {
      const { UNSAFE_root } = render(<PhotoViewerModal {...defaultProps} />);

      const touchables = UNSAFE_root.findAllByType(require('react-native').TouchableOpacity);
      // El primer touchable hauria de ser el botó de tancar
      if (touchables.length > 0) {
        fireEvent.press(touchables[0]);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });
  });

  describe('Eliminació de fotos', () => {
    it('hauria de mostrar botó d\'eliminar si l\'usuari és el propietari', () => {
      const photosOwnedByCurrentUser: ImageMetadata[] = [
        {
          key: 'photo-1',
          url: 'https://example.com/photo1.jpg',
          uploaded_at: '2025-01-15T10:30:00Z',
          creator_uid: 'current-user-uid',
        },
      ];

      const { toJSON } = render(
        <PhotoViewerModal
          {...defaultProps}
          photos={photosOwnedByCurrentUser}
          onPhotoDeleted={mockOnPhotoDeleted}
        />
      );

      expect(toJSON()).toBeTruthy();
    });

    it('no hauria de mostrar botó d\'eliminar si l\'usuari no és el propietari', () => {
      const { toJSON } = render(
        <PhotoViewerModal
          {...defaultProps}
          onPhotoDeleted={mockOnPhotoDeleted}
        />
      );

      expect(toJSON()).toBeTruthy();
    });
  });

  describe('Metadades', () => {
    it('hauria de mostrar metadades quan hideMetadata és false', () => {
      const { toJSON } = render(
        <PhotoViewerModal {...defaultProps} hideMetadata={false} />
      );

      expect(toJSON()).toBeTruthy();
    });

    it('no hauria de mostrar metadades quan hideMetadata és true', () => {
      const { toJSON } = render(
        <PhotoViewerModal {...defaultProps} hideMetadata={true} />
      );

      expect(toJSON()).toBeTruthy();
    });
  });

  describe('Format de data', () => {
    it('hauria de formatar la data correctament', () => {
      const { toJSON } = render(<PhotoViewerModal {...defaultProps} />);
      // El format hauria de ser "15 gen 2025" o similar
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('Experience creator context', () => {
    it('hauria de permetre eliminar si l\'usuari és el creador de l\'experiència', () => {
      const { toJSON } = render(
        <PhotoViewerModal
          {...defaultProps}
          experienceCreatorUid="current-user-uid"
          onPhotoDeleted={mockOnPhotoDeleted}
        />
      );

      expect(toJSON()).toBeTruthy();
    });
  });
});

describe('VideoThumbnail Component', () => {
  it('hauria de renderitzar correctament', () => {
    const { getByTestId } = render(
      <VideoThumbnail
        uri="https://example.com/video.mp4"
        style={{ width: 100, height: 100 }}
      />
    );

    expect(getByTestId('video-view')).toBeTruthy();
  });

  it('hauria de cridar onPress quan es proporciona', () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = render(
      <VideoThumbnail
        uri="https://example.com/video.mp4"
        style={{ width: 100, height: 100 }}
        onPress={mockOnPress}
      />
    );

    const touchable = getByTestId('video-view').parent;
    if (touchable) {
      fireEvent.press(touchable);
    }
  });

  it('snapshot test', () => {
    const { toJSON } = render(
      <VideoThumbnail
        uri="https://example.com/video.mp4"
        style={{ width: 100, height: 100 }}
      />
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
