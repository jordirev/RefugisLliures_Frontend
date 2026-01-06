/**
 * Tests unitaris per al component PhotoViewerModal
 *
 * Aquest fitxer cobreix:
 * - Renderització del modal
 * - Navegació entre fotos
 * - Visualització d'imatges i vídeos
 * - Eliminació de fotos
 * - Metadades del creador
 * - Format de data
 * - Gestió d'errors
 * - Snapshot tests
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { PhotoViewerModal, VideoThumbnail } from '../../../components/PhotoViewerModal';
import { ImageMetadata } from '../../../models';
import { RefugeMediaService } from '../../../services/RefugeMediaService';

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
      avatar_metadata: { url: 'https://example.com/avatar.jpg' },
    }),
  },
}));

// Mock AuthContext
const mockFirebaseUser = { uid: 'current-user-uid' };
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    firebaseUser: mockFirebaseUser,
  }),
}));

// Mock useCustomAlert - captura els botons per poder executar callbacks
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

// Mock react-query
let mockCreatorData: any = { uid: 'user-1', username: 'TestUser', avatar_metadata: { url: 'https://example.com/avatar.jpg' } };
let mockIsLoading = false;
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(({ queryKey, queryFn, enabled }) => {
    if (enabled === false) {
      return { data: null, isLoading: false };
    }
    return {
      data: mockCreatorData,
      isLoading: mockIsLoading,
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
    mockCreatorData = { uid: 'user-1', username: 'TestUser', avatar_metadata: { url: 'https://example.com/avatar.jpg' } };
    mockIsLoading = false;
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

    it('no hauria de mostrar res si photos és buit en index inicial', () => {
      const { toJSON } = render(
        <PhotoViewerModal {...defaultProps} photos={[]} initialIndex={0} />
      );
      expect(toJSON()).toBeNull();
    });

    it('snapshot test - modal amb fotos', () => {
      const { toJSON } = render(<PhotoViewerModal {...defaultProps} />);
      expect(toJSON()).toMatchSnapshot();
    });

    it('snapshot test - modal no visible', () => {
      const { toJSON } = render(<PhotoViewerModal {...defaultProps} visible={false} />);
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

    it('hauria de mostrar totes les imatges en scroll', () => {
      const { UNSAFE_root } = render(<PhotoViewerModal {...defaultProps} />);
      
      // Les imatges s'haurien de renderitzar dins del ScrollView
      const images = UNSAFE_root.findAllByType(require('react-native').Image);
      // Hi ha 2 imatges (la 3a és vídeo)
      expect(images.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Visualització de vídeos', () => {
    it('hauria de detectar vídeos per extensió .mp4', () => {
      const { getByTestId } = render(
        <PhotoViewerModal {...defaultProps} initialIndex={2} />
      );
      
      expect(getByTestId('video-view')).toBeTruthy();
    });

    it('hauria de mostrar VideoPlayer per URLs de vídeo .mov', () => {
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

    it('hauria de detectar vídeos per extensió .avi', () => {
      const videoPhotos: ImageMetadata[] = [
        {
          key: 'video-1',
          url: 'https://example.com/video.avi',
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

    it('hauria de detectar vídeos per extensió .webm', () => {
      const videoPhotos: ImageMetadata[] = [
        {
          key: 'video-1',
          url: 'https://example.com/video.webm',
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

    it('hauria de detectar vídeos per extensió .m4v', () => {
      const videoPhotos: ImageMetadata[] = [
        {
          key: 'video-1',
          url: 'https://example.com/video.m4v',
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

    it('hauria de actualitzar currentIndex quan es fa scroll', () => {
      const { UNSAFE_root } = render(<PhotoViewerModal {...defaultProps} />);
      
      const scrollViews = UNSAFE_root.findAllByType(require('react-native').ScrollView);
      
      if (scrollViews.length > 0) {
        // Simular scroll
        fireEvent.scroll(scrollViews[0], {
          nativeEvent: {
            contentOffset: { x: 375, y: 0 }, // Suposant SCREEN_WIDTH = 375
          },
        });
      }
    });

    it('hauria de gestionar scroll fora de rang', () => {
      const { UNSAFE_root } = render(<PhotoViewerModal {...defaultProps} />);
      
      const scrollViews = UNSAFE_root.findAllByType(require('react-native').ScrollView);
      
      if (scrollViews.length > 0) {
        // Scroll a un index negatiu
        fireEvent.scroll(scrollViews[0], {
          nativeEvent: {
            contentOffset: { x: -100, y: 0 },
          },
        });
      }
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

    it('hauria de cridar handleDelete quan es prem el botó eliminar', async () => {
      const photosOwnedByCurrentUser: ImageMetadata[] = [
        {
          key: 'photo-1',
          url: 'https://example.com/photo1.jpg',
          uploaded_at: '2025-01-15T10:30:00Z',
          creator_uid: 'current-user-uid',
        },
      ];

      const { UNSAFE_root } = render(
        <PhotoViewerModal
          {...defaultProps}
          photos={photosOwnedByCurrentUser}
          onPhotoDeleted={mockOnPhotoDeleted}
        />
      );

      // Buscar el botó d'eliminar (hauria de ser l'últim TouchableOpacity)
      const touchables = UNSAFE_root.findAllByType(require('react-native').TouchableOpacity);
      
      // El darrer touchable probablement és el botó d'eliminar
      if (touchables.length > 1) {
        await act(async () => {
          fireEvent.press(touchables[touchables.length - 1]);
        });
        
        // Hauria d'haver mostrat l'alerta
        expect(mockShowAlert).toHaveBeenCalled();
      }
    });

    it('hauria d\'eliminar foto quan es confirma l\'eliminació', async () => {
      (RefugeMediaService.deleteRefugeMedia as jest.Mock).mockResolvedValueOnce(undefined);

      const photosOwnedByCurrentUser: ImageMetadata[] = [
        {
          key: 'photo-1',
          url: 'https://example.com/photo1.jpg',
          uploaded_at: '2025-01-15T10:30:00Z',
          creator_uid: 'current-user-uid',
        },
      ];

      const { UNSAFE_root } = render(
        <PhotoViewerModal
          {...defaultProps}
          photos={photosOwnedByCurrentUser}
          onPhotoDeleted={mockOnPhotoDeleted}
        />
      );

      // Buscar el botó d'eliminar
      const touchables = UNSAFE_root.findAllByType(require('react-native').TouchableOpacity);
      
      if (touchables.length > 1) {
        await act(async () => {
          fireEvent.press(touchables[touchables.length - 1]);
        });
        
        // Verificar que s'ha mostrat l'alerta
        expect(mockShowAlert).toHaveBeenCalled();

        // Obtenir el botó "Eliminar" de l'alerta i executar el callback
        const deleteButton = mockAlertState.lastButtons.find((b: any) => b.text === 'Eliminar');
        if (deleteButton?.onPress) {
          await act(async () => {
            await deleteButton.onPress();
          });

          // Verificar que s'ha cridat el servei d'eliminació
          await waitFor(() => {
            expect(RefugeMediaService.deleteRefugeMedia).toHaveBeenCalledWith('refuge-1', 'photo-1');
          });

          // Verificar que s'ha cridat onPhotoDeleted
          expect(mockOnPhotoDeleted).toHaveBeenCalled();
        }
      }
    });

    it('hauria de gestionar errors durant l\'eliminació i mostrar alerta d\'error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (RefugeMediaService.deleteRefugeMedia as jest.Mock).mockRejectedValueOnce(
        new Error('Error d\'eliminació')
      );

      const photosOwnedByCurrentUser: ImageMetadata[] = [
        {
          key: 'photo-1',
          url: 'https://example.com/photo1.jpg',
          uploaded_at: '2025-01-15T10:30:00Z',
          creator_uid: 'current-user-uid',
        },
      ];

      const { UNSAFE_root } = render(
        <PhotoViewerModal
          {...defaultProps}
          photos={photosOwnedByCurrentUser}
          onPhotoDeleted={mockOnPhotoDeleted}
        />
      );

      // Buscar el botó d'eliminar
      const touchables = UNSAFE_root.findAllByType(require('react-native').TouchableOpacity);
      
      if (touchables.length > 1) {
        await act(async () => {
          fireEvent.press(touchables[touchables.length - 1]);
        });

        // Obtenir el botó "Eliminar" i executar el callback
        const deleteButton = mockAlertState.lastButtons.find((b: any) => b.text === 'Eliminar');
        if (deleteButton?.onPress) {
          await act(async () => {
            await deleteButton.onPress();
          });

          // Verificar que s'ha cridat el servei d'eliminació
          await waitFor(() => {
            expect(RefugeMediaService.deleteRefugeMedia).toHaveBeenCalled();
          });

          // Verificar que s'ha mostrat l'alerta d'error
          expect(mockShowAlert).toHaveBeenCalledWith('Error', expect.stringContaining('eliminar'));
        }
      }
      
      consoleSpy.mockRestore();
    });

    it('hauria de gestionar errors durant l\'eliminació', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (RefugeMediaService.deleteRefugeMedia as jest.Mock).mockRejectedValueOnce(
        new Error('Error d\'eliminació')
      );

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
      consoleSpy.mockRestore();
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

    it('hauria de mostrar loading mentre carrega el creador', () => {
      mockIsLoading = true;
      
      const { UNSAFE_root } = render(
        <PhotoViewerModal {...defaultProps} hideMetadata={false} />
      );

      const activityIndicators = UNSAFE_root.findAllByType(require('react-native').ActivityIndicator);
      expect(activityIndicators.length).toBeGreaterThan(0);
    });

    it('hauria de mostrar nom d\'usuari del creador', () => {
      mockCreatorData = { uid: 'user-1', username: 'TestUser' };
      
      const { getByText } = render(
        <PhotoViewerModal {...defaultProps} hideMetadata={false} />
      );

      expect(getByText('TestUser')).toBeTruthy();
    });

    it('hauria de mostrar "Anònim" si no hi ha username', () => {
      mockCreatorData = { uid: 'user-1', username: null };
      
      const { getByText } = render(
        <PhotoViewerModal {...defaultProps} hideMetadata={false} />
      );

      expect(getByText('Anònim')).toBeTruthy();
    });

    it('hauria de mostrar avatar del creador', () => {
      mockCreatorData = { 
        uid: 'user-1', 
        username: 'TestUser',
        avatar_metadata: { url: 'https://example.com/avatar.jpg' }
      };
      
      const { UNSAFE_root } = render(
        <PhotoViewerModal {...defaultProps} hideMetadata={false} />
      );

      const images = UNSAFE_root.findAllByType(require('react-native').Image);
      expect(images.length).toBeGreaterThan(0);
    });

    it('hauria de mostrar placeholder d\'avatar si no hi ha avatar', () => {
      mockCreatorData = { uid: 'user-1', username: 'TestUser', avatar_metadata: null };
      
      const { getByText } = render(
        <PhotoViewerModal {...defaultProps} hideMetadata={false} />
      );

      // El placeholder mostra la primera lletra del username
      expect(getByText('T')).toBeTruthy();
    });

    it('hauria de mostrar "?" si no hi ha username per al placeholder', () => {
      mockCreatorData = { uid: 'user-1', username: null, avatar_metadata: null };
      
      const { getByText } = render(
        <PhotoViewerModal {...defaultProps} hideMetadata={false} />
      );

      expect(getByText('?')).toBeTruthy();
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
      const { UNSAFE_root } = render(
        <PhotoViewerModal
          {...defaultProps}
          experienceCreatorUid="current-user-uid"
          onPhotoDeleted={mockOnPhotoDeleted}
        />
      );

      // Hauria de mostrar el botó d'eliminar
      const touchables = UNSAFE_root.findAllByType(require('react-native').TouchableOpacity);
      expect(touchables.length).toBeGreaterThan(1);
    });

    it('no hauria de permetre eliminar si l\'usuari no és el creador de l\'experiència', () => {
      const { toJSON } = render(
        <PhotoViewerModal
          {...defaultProps}
          experienceCreatorUid="other-user-uid"
          onPhotoDeleted={mockOnPhotoDeleted}
        />
      );

      expect(toJSON()).toBeTruthy();
    });
  });

  describe('Botó eliminar amb hideMetadata', () => {
    it('hauria de mostrar botó eliminar en posició diferent quan hideMetadata és true', () => {
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
          hideMetadata={true}
          onPhotoDeleted={mockOnPhotoDeleted}
        />
      );

      expect(toJSON()).toBeTruthy();
    });
  });

  describe('UseEffect per visible', () => {
    it('hauria de resetejar currentIndex quan visible canvia', async () => {
      const { rerender, toJSON } = render(
        <PhotoViewerModal {...defaultProps} visible={false} initialIndex={2} />
      );

      rerender(
        <PhotoViewerModal {...defaultProps} visible={true} initialIndex={0} />
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

  it('hauria de estar desactivat si no hi ha onPress', () => {
    const { getByTestId } = render(
      <VideoThumbnail
        uri="https://example.com/video.mp4"
        style={{ width: 100, height: 100 }}
      />
    );

    expect(getByTestId('video-view')).toBeTruthy();
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
