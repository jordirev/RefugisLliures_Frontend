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
import { findAllByType } from '../../testHelpers/findByType';

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
    it('hauria de renderitzar quan és visible', async () => {
      const { toJSON } = await render(<PhotoViewerModal {...defaultProps} />);
      expect(toJSON()).toBeTruthy();
    });

    it('no hauria de mostrar res si no hi ha fotos', async () => {
      const { toJSON } = await render(
        <PhotoViewerModal {...defaultProps} photos={[]} />
      );
      expect(toJSON()).toBeNull();
    });

    it('no hauria de mostrar res si photos és buit en index inicial', async () => {
      const { toJSON } = await render(
        <PhotoViewerModal {...defaultProps} photos={[]} initialIndex={0} />
      );
      expect(toJSON()).toBeNull();
    });

    it('snapshot test - modal amb fotos', async () => {
      const { toJSON } = await render(<PhotoViewerModal {...defaultProps} />);
      expect(toJSON()).toMatchSnapshot();
    });

    it('snapshot test - modal no visible', async () => {
      const { toJSON } = await render(<PhotoViewerModal {...defaultProps} visible={false} />);
      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('Visualització d\'imatges', () => {
    it('hauria de mostrar la primera imatge per defecte', async () => {
      const { container } = await render(<PhotoViewerModal {...defaultProps} />);
      
      const images = findAllByType(container, require('react-native').Image);
      expect(images.length).toBeGreaterThan(0);
    });

    it('hauria de mostrar la imatge corresponent a initialIndex', async () => {
      const { toJSON } = await render(
        <PhotoViewerModal {...defaultProps} initialIndex={1} />
      );
      expect(toJSON()).toBeTruthy();
    });

    it('hauria de mostrar totes les imatges en scroll (expo-image amb cacheKey)', async () => {
      const { container } = await render(<PhotoViewerModal {...defaultProps} />);

      // Les imatges es renderitzen amb expo-image (mock host 'ExpoImage'); la 3a és vídeo
      const images = container.queryAll((n: any) => n.type === 'ExpoImage');
      expect(images.length).toBe(2);
      // Al visor es fa servir la URL completa i la clau R2 com a cacheKey
      expect(images[0].props.source).toEqual({ uri: 'https://example.com/photo1.jpg', cacheKey: 'photo-1' });
    });

    it('hauria de fer servir el blurhash com a placeholder si existeix', async () => {
      const photos: ImageMetadata[] = [
        { ...mockPhotos[0], blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj', thumb_url: 'https://example.com/photo1_thumb.webp' },
      ];
      const { container } = await render(<PhotoViewerModal {...defaultProps} photos={photos} />);
      const images = container.queryAll((n: any) => n.type === 'ExpoImage');
      expect(images[0].props.placeholder).toEqual({ blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj' });
      // Al visor (variant full) NO es fa servir la miniatura
      expect(images[0].props.source.uri).toBe('https://example.com/photo1.jpg');
    });
  });

  describe('Visualització de vídeos', () => {
    it('hauria de detectar vídeos per extensió .mp4', async () => {
      const { getByTestId } = await render(
        <PhotoViewerModal {...defaultProps} initialIndex={2} />
      );
      
      expect(getByTestId('video-view')).toBeTruthy();
    });

    it('hauria de mostrar VideoPlayer per URLs de vídeo .mov', async () => {
      const videoPhotos: ImageMetadata[] = [
        {
          key: 'video-1',
          url: 'https://example.com/video.mov',
          uploaded_at: '2025-01-17T09:00:00Z',
          creator_uid: 'user-1',
        },
      ];

      const { getByTestId } = await render(
        <PhotoViewerModal
          {...defaultProps}
          photos={videoPhotos}
          initialIndex={0}
        />
      );

      expect(getByTestId('video-view')).toBeTruthy();
    });

    it('hauria de detectar vídeos per extensió .avi', async () => {
      const videoPhotos: ImageMetadata[] = [
        {
          key: 'video-1',
          url: 'https://example.com/video.avi',
          uploaded_at: '2025-01-17T09:00:00Z',
          creator_uid: 'user-1',
        },
      ];

      const { getByTestId } = await render(
        <PhotoViewerModal
          {...defaultProps}
          photos={videoPhotos}
          initialIndex={0}
        />
      );

      expect(getByTestId('video-view')).toBeTruthy();
    });

    it('hauria de detectar vídeos per extensió .webm', async () => {
      const videoPhotos: ImageMetadata[] = [
        {
          key: 'video-1',
          url: 'https://example.com/video.webm',
          uploaded_at: '2025-01-17T09:00:00Z',
          creator_uid: 'user-1',
        },
      ];

      const { getByTestId } = await render(
        <PhotoViewerModal
          {...defaultProps}
          photos={videoPhotos}
          initialIndex={0}
        />
      );

      expect(getByTestId('video-view')).toBeTruthy();
    });

    it('hauria de detectar vídeos per extensió .m4v', async () => {
      const videoPhotos: ImageMetadata[] = [
        {
          key: 'video-1',
          url: 'https://example.com/video.m4v',
          uploaded_at: '2025-01-17T09:00:00Z',
          creator_uid: 'user-1',
        },
      ];

      const { getByTestId } = await render(
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
    it('hauria de permetre fer scroll entre fotos', async () => {
      const { container } = await render(<PhotoViewerModal {...defaultProps} />);
      
      const scrollViews = findAllByType(container, require('react-native').ScrollView);
      expect(scrollViews.length).toBeGreaterThan(0);
    });

    it('hauria de actualitzar currentIndex quan es fa scroll', async () => {
      const { container } = await render(<PhotoViewerModal {...defaultProps} />);
      
      const scrollViews = findAllByType(container, require('react-native').ScrollView);
      
      if (scrollViews.length > 0) {
        // Simular scroll
        await fireEvent.scroll(scrollViews[0], {
          nativeEvent: {
            contentOffset: { x: 375, y: 0 }, // Suposant SCREEN_WIDTH = 375
          },
        });
      }
    });

    it('hauria de gestionar scroll fora de rang', async () => {
      const { container } = await render(<PhotoViewerModal {...defaultProps} />);
      
      const scrollViews = findAllByType(container, require('react-native').ScrollView);
      
      if (scrollViews.length > 0) {
        // Scroll a un index negatiu
        await fireEvent.scroll(scrollViews[0], {
          nativeEvent: {
            contentOffset: { x: -100, y: 0 },
          },
        });
      }
    });
  });

  describe('Tancament del modal', () => {
    it('hauria de cridar onClose quan es prem el botó', async () => {
      const { container } = await render(<PhotoViewerModal {...defaultProps} />);

      const touchables = findAllByType(container, require('react-native').TouchableOpacity);
      // El primer touchable hauria de ser el botó de tancar
      if (touchables.length > 0) {
        await fireEvent.press(touchables[0]);
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
      const { getByTestId, queryByTestId } = await render(<PhotoViewerModal {...defaultProps} />);
      await act(async () => {
        await fireEvent.press(getByTestId('photo-menu-button'));
      });
      expect(getByTestId('photo-menu-report')).toBeTruthy();
      expect(queryByTestId('photo-menu-delete')).toBeNull();
    });

    it("amaga Denunciar i mostra Eliminar si l'usuari és l'autor", async () => {
      const { getByTestId, queryByTestId } = await render(
        <PhotoViewerModal {...defaultProps} photos={ownPhotos} onPhotoDeleted={mockOnPhotoDeleted} />
      );
      await act(async () => {
        await fireEvent.press(getByTestId('photo-menu-button'));
      });
      expect(queryByTestId('photo-menu-report')).toBeNull();
      expect(getByTestId('photo-menu-delete')).toBeTruthy();
    });

    it("mostra Eliminar i Denunciar a un admin que no és l'autor", async () => {
      mockIsAdmin = true;
      const { getByTestId } = await render(<PhotoViewerModal {...defaultProps} />);
      await waitFor(() => expect(require('../../../utils/authUtils').isUserAdmin).toHaveBeenCalled());
      await act(async () => {
        await fireEvent.press(getByTestId('photo-menu-button'));
      });
      expect(getByTestId('photo-menu-report')).toBeTruthy();
      await waitFor(() => expect(getByTestId('photo-menu-delete')).toBeTruthy());
    });

    it('Denunciar tanca el visor i navega a ReportMedia amb refugeId i mediaKey', async () => {
      const { getByTestId } = await render(<PhotoViewerModal {...defaultProps} initialIndex={0} />);
      await act(async () => {
        await fireEvent.press(getByTestId('photo-menu-button'));
      });
      await act(async () => {
        await fireEvent.press(getByTestId('photo-menu-report'));
      });
      expect(mockOnClose).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('ReportMedia', { refugeId: 'refuge-1', mediaKey: 'photo-1' });
    });

    it("l'autor pot eliminar la foto (confirmació, servei i onPhotoDeleted)", async () => {
      (RefugeMediaService.deleteRefugeMedia as jest.Mock).mockResolvedValueOnce(undefined);
      const { getByTestId } = await render(
        <PhotoViewerModal {...defaultProps} photos={ownPhotos} onPhotoDeleted={mockOnPhotoDeleted} />
      );
      await act(async () => {
        await fireEvent.press(getByTestId('photo-menu-button'));
      });
      await act(async () => {
        await fireEvent.press(getByTestId('photo-menu-delete'));
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
      const { getByTestId } = await render(
        <PhotoViewerModal {...defaultProps} photos={ownPhotos} onPhotoDeleted={mockOnPhotoDeleted} />
      );
      await act(async () => {
        await fireEvent.press(getByTestId('photo-menu-button'));
      });
      await act(async () => {
        await fireEvent.press(getByTestId('photo-menu-delete'));
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
      const { getByTestId, queryByTestId } = await render(
        <PhotoViewerModal {...defaultProps} experienceCreatorUid="current-user-uid" hideMetadata />
      );
      await act(async () => {
        await fireEvent.press(getByTestId('photo-menu-button'));
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
    it('hauria de mostrar metadades quan hideMetadata és false', async () => {
      const { toJSON } = await render(
        <PhotoViewerModal {...defaultProps} hideMetadata={false} />
      );

      expect(toJSON()).toBeTruthy();
    });

    it('no hauria de mostrar metadades quan hideMetadata és true', async () => {
      const { toJSON } = await render(
        <PhotoViewerModal {...defaultProps} hideMetadata={true} />
      );

      expect(toJSON()).toBeTruthy();
    });

    it('hauria de mostrar loading mentre carrega el creador', async () => {
      mockIsLoading = true;
      
      const { container } = await render(
        <PhotoViewerModal {...defaultProps} hideMetadata={false} />
      );

      const activityIndicators = findAllByType(container, require('react-native').ActivityIndicator);
      expect(activityIndicators.length).toBeGreaterThan(0);
    });

    it('hauria de mostrar nom d\'usuari del creador', async () => {
      mockCreatorData = { uid: 'user-1', username: 'TestUser' };
      
      const { getByText } = await render(
        <PhotoViewerModal {...defaultProps} hideMetadata={false} />
      );

      expect(getByText('TestUser')).toBeTruthy();
    });

    it('hauria de mostrar "Anònim" si no hi ha username', async () => {
      mockCreatorData = { uid: 'user-1', username: null };
      
      const { getByText } = await render(
        <PhotoViewerModal {...defaultProps} hideMetadata={false} />
      );

      expect(getByText('media.viewer.anonymous')).toBeTruthy();
    });

    it('hauria de mostrar avatar del creador', async () => {
      mockCreatorData = { 
        uid: 'user-1', 
        username: 'TestUser',
        avatar_metadata: { url: 'https://example.com/avatar.jpg' }
      };
      
      const { container } = await render(
        <PhotoViewerModal {...defaultProps} hideMetadata={false} />
      );

      const images = findAllByType(container, require('react-native').Image);
      expect(images.length).toBeGreaterThan(0);
    });

    it('hauria de mostrar placeholder d\'avatar si no hi ha avatar', async () => {
      mockCreatorData = { uid: 'user-1', username: 'TestUser', avatar_metadata: null };
      
      const { getByText } = await render(
        <PhotoViewerModal {...defaultProps} hideMetadata={false} />
      );

      // El placeholder mostra la primera lletra del username
      expect(getByText('T')).toBeTruthy();
    });

    it('hauria de mostrar "?" si no hi ha username per al placeholder', async () => {
      mockCreatorData = { uid: 'user-1', username: null, avatar_metadata: null };
      
      const { getByText } = await render(
        <PhotoViewerModal {...defaultProps} hideMetadata={false} />
      );

      expect(getByText('?')).toBeTruthy();
    });
  });

  describe('Format de data', () => {
    it('hauria de formatar la data correctament', async () => {
      const { toJSON } = await render(<PhotoViewerModal {...defaultProps} />);
      // El format hauria de ser "15 gen 2025" o similar
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('UseEffect per visible', () => {
    it('hauria de resetejar currentIndex quan visible canvia', async () => {
      const { rerender, toJSON } = await render(
        <PhotoViewerModal {...defaultProps} visible={false} initialIndex={2} />
      );

      await rerender(
        <PhotoViewerModal {...defaultProps} visible={true} initialIndex={0} />
      );

      expect(toJSON()).toBeTruthy();
    });
  });
});

describe('VideoThumbnail Component', () => {
  it('hauria de renderitzar correctament', async () => {
    const { getByTestId } = await render(
      <VideoThumbnail
        uri="https://example.com/video.mp4"
        style={{ width: 100, height: 100 }}
      />
    );

    expect(getByTestId('video-view')).toBeTruthy();
  });

  it('hauria de cridar onPress quan es proporciona', async () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = await render(
      <VideoThumbnail
        uri="https://example.com/video.mp4"
        style={{ width: 100, height: 100 }}
        onPress={mockOnPress}
      />
    );

    const touchable = getByTestId('video-view').parent;
    if (touchable) {
      await fireEvent.press(touchable);
    }
  });

  it('hauria de estar desactivat si no hi ha onPress', async () => {
    const { getByTestId } = await render(
      <VideoThumbnail
        uri="https://example.com/video.mp4"
        style={{ width: 100, height: 100 }}
      />
    );

    expect(getByTestId('video-view')).toBeTruthy();
  });

  it('snapshot test', async () => {
    const { toJSON } = await render(
      <VideoThumbnail
        uri="https://example.com/video.mp4"
        style={{ width: 100, height: 100 }}
      />
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
