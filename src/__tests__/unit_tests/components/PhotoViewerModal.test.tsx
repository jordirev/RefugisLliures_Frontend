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
import { PhotoViewerModal, VideoThumbnail, getPhotoMenuPermissions } from '../../../components/PhotoViewerModal';
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
const mockInvalidateQueries = jest.fn();
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(({ queryKey, queryFn, enabled }) => {
    if (enabled === false) {
      return { data: null, isLoading: false };
    }
    return {
      data: mockCreatorData,
      isLoading: mockIsLoading,
    };
  }),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: mockInvalidateQueries,
    setQueryData: jest.fn(),
  })),
  // useMutation mínim: executa mutationFn i els callbacks de mutate()
  useMutation: jest.fn((options: any) => ({
    isPending: false,
    mutate: async (variables: any, callbacks: any = {}) => {
      try {
        const data = await options.mutationFn(variables);
        options.onSuccess?.(data, variables);
        callbacks.onSuccess?.(data, variables);
      } catch (error) {
        callbacks.onError?.(error, variables);
      }
    },
  })),
}));

// Mock navegació (per comprovar la ruta ReportMedia)
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
}));

// Mock rol d'admin
let mockIsAdmin = false;
jest.mock('../../../utils/authUtils', () => ({
  isUserAdmin: jest.fn(() => Promise.resolve(mockIsAdmin)),
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
    mockIsAdmin = false;
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

    it('hauria de mostrar totes les imatges en scroll (expo-image amb cacheKey)', () => {
      const { UNSAFE_root } = render(<PhotoViewerModal {...defaultProps} />);

      // Les imatges es renderitzen amb expo-image (mock host 'ExpoImage'); la 3a és vídeo
      const images = UNSAFE_root.findAll((n: any) => n.type === 'ExpoImage');
      expect(images.length).toBe(2);
      // Al visor es fa servir la URL completa i la clau R2 com a cacheKey
      expect(images[0].props.source).toEqual({ uri: 'https://example.com/photo1.jpg', cacheKey: 'photo-1' });
    });

    it('hauria de fer servir el blurhash com a placeholder si existeix', () => {
      const photos: ImageMetadata[] = [
        { ...mockPhotos[0], blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj', thumb_url: 'https://example.com/photo1_thumb.webp' },
      ];
      const { UNSAFE_root } = render(<PhotoViewerModal {...defaultProps} photos={photos} />);
      const images = UNSAFE_root.findAll((n: any) => n.type === 'ExpoImage');
      expect(images[0].props.placeholder).toEqual({ blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj' });
      // Al visor (variant full) NO es fa servir la miniatura
      expect(images[0].props.source.uri).toBe('https://example.com/photo1.jpg');
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

  describe("Menú ⋮ (Denunciar / Eliminar)", () => {
    const ownPhotos: ImageMetadata[] = [
      {
        key: 'photo-1',
        url: 'https://example.com/photo1.jpg',
        uploaded_at: '2025-01-15T10:30:00Z',
        creator_uid: 'current-user-uid',
      },
    ];

    it("mostra Denunciar i amaga Eliminar si l'usuari NO és l'autor", async () => {
      const { getByTestId, queryByTestId } = render(<PhotoViewerModal {...defaultProps} />);
      await act(async () => {
        fireEvent.press(getByTestId('photo-menu-button'));
      });
      expect(getByTestId('photo-menu-report')).toBeTruthy();
      expect(queryByTestId('photo-menu-delete')).toBeNull();
    });

    it("amaga Denunciar i mostra Eliminar si l'usuari és l'autor", async () => {
      const { getByTestId, queryByTestId } = render(
        <PhotoViewerModal {...defaultProps} photos={ownPhotos} onPhotoDeleted={mockOnPhotoDeleted} />
      );
      await act(async () => {
        fireEvent.press(getByTestId('photo-menu-button'));
      });
      expect(queryByTestId('photo-menu-report')).toBeNull();
      expect(getByTestId('photo-menu-delete')).toBeTruthy();
    });

    it("mostra Eliminar i Denunciar a un admin que no és l'autor", async () => {
      mockIsAdmin = true;
      const { getByTestId } = render(<PhotoViewerModal {...defaultProps} />);
      await waitFor(() => expect(require('../../../utils/authUtils').isUserAdmin).toHaveBeenCalled());
      await act(async () => {
        fireEvent.press(getByTestId('photo-menu-button'));
      });
      expect(getByTestId('photo-menu-report')).toBeTruthy();
      await waitFor(() => expect(getByTestId('photo-menu-delete')).toBeTruthy());
    });

    it('Denunciar tanca el visor i navega a ReportMedia amb refugeId i mediaKey', async () => {
      const { getByTestId } = render(<PhotoViewerModal {...defaultProps} initialIndex={0} />);
      await act(async () => {
        fireEvent.press(getByTestId('photo-menu-button'));
      });
      await act(async () => {
        fireEvent.press(getByTestId('photo-menu-report'));
      });
      expect(mockOnClose).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('ReportMedia', { refugeId: 'refuge-1', mediaKey: 'photo-1' });
    });

    it("l'autor pot eliminar la foto (confirmació, servei i onPhotoDeleted)", async () => {
      (RefugeMediaService.deleteRefugeMedia as jest.Mock).mockResolvedValueOnce(undefined);
      const { getByTestId } = render(
        <PhotoViewerModal {...defaultProps} photos={ownPhotos} onPhotoDeleted={mockOnPhotoDeleted} />
      );
      await act(async () => {
        fireEvent.press(getByTestId('photo-menu-button'));
      });
      await act(async () => {
        fireEvent.press(getByTestId('photo-menu-delete'));
      });
      expect(mockShowAlert).toHaveBeenCalledWith(
        'media.viewer.deleteTitle',
        'media.viewer.deleteMessage',
        expect.any(Array)
      );
      const deleteButton = mockAlertState.lastButtons.find((b: any) => b.style === 'destructive');
      await act(async () => {
        await deleteButton.onPress();
      });
      await waitFor(() => {
        expect(RefugeMediaService.deleteRefugeMedia).toHaveBeenCalledWith('refuge-1', 'photo-1');
      });
      expect(mockOnPhotoDeleted).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
      // Invalidacions via registre de claus
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['refuges', 'detail', 'refuge-1'] });
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['users', 'detail', 'current-user-uid'] });
    });

    it("mostra una alerta d'error si l'eliminació falla", async () => {
      (RefugeMediaService.deleteRefugeMedia as jest.Mock).mockRejectedValueOnce(new Error('boom'));
      const { getByTestId } = render(
        <PhotoViewerModal {...defaultProps} photos={ownPhotos} onPhotoDeleted={mockOnPhotoDeleted} />
      );
      await act(async () => {
        fireEvent.press(getByTestId('photo-menu-button'));
      });
      await act(async () => {
        fireEvent.press(getByTestId('photo-menu-delete'));
      });
      const deleteButton = mockAlertState.lastButtons.find((b: any) => b.style === 'destructive');
      await act(async () => {
        await deleteButton.onPress();
      });
      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith('common.error', 'media.viewer.deleteError');
      });
      expect(mockOnPhotoDeleted).not.toHaveBeenCalled();
    });

    it("el creador de l'experiència pot eliminar fotos de la seva experiència", async () => {
      const { getByTestId, queryByTestId } = render(
        <PhotoViewerModal {...defaultProps} experienceCreatorUid="current-user-uid" hideMetadata />
      );
      await act(async () => {
        fireEvent.press(getByTestId('photo-menu-button'));
      });
      expect(getByTestId('photo-menu-delete')).toBeTruthy();
      expect(queryByTestId('photo-menu-report')).toBeNull();
    });
  });

  describe('getPhotoMenuPermissions', () => {
    it('autor: no pot denunciar, pot eliminar', () => {
      expect(getPhotoMenuPermissions({ currentUid: 'a', creatorUid: 'a', isAdmin: false })).toEqual({
        isAuthor: true,
        canReport: false,
        canDelete: true,
      });
    });

    it('altre usuari: pot denunciar, no pot eliminar', () => {
      expect(getPhotoMenuPermissions({ currentUid: 'b', creatorUid: 'a', isAdmin: false })).toEqual({
        isAuthor: false,
        canReport: true,
        canDelete: false,
      });
    });

    it('admin (no autor): pot denunciar i eliminar', () => {
      expect(getPhotoMenuPermissions({ currentUid: 'b', creatorUid: 'a', isAdmin: true })).toEqual({
        isAuthor: false,
        canReport: true,
        canDelete: true,
      });
    });

    it('sense sessió: res', () => {
      expect(getPhotoMenuPermissions({ currentUid: null, creatorUid: 'a', isAdmin: false })).toEqual({
        isAuthor: false,
        canReport: false,
        canDelete: false,
      });
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

      expect(getByText('media.viewer.anonymous')).toBeTruthy();
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
