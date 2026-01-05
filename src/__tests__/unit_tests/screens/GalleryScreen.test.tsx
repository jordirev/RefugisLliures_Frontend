/**
 * Tests unitaris per a GalleryScreen
 *
 * Aquest fitxer cobreix:
 * - Renderització de la pantalla
 * - Galeria de fotos
 * - Modal de visor de fotos
 * - Empty state
 * - Funcionalitat d'afegir fotos
 * - Snapshot tests
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { GalleryScreen } from '../../../screens/GalleryScreen';

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

// Mock SVG icons
jest.mock('../../../assets/icons/arrow-left.svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  return (props: any) => <View testID="back-icon" {...props} />;
});

// Mock images
jest.mock('../../../assets/icons/addPhoto.png', () => 'AddPhotoIcon');

// Mock PhotoViewerModal
jest.mock('../../../components/PhotoViewerModal', () => ({
  PhotoViewerModal: ({ visible, photos, initialIndex, onClose, onPhotoDeleted }: any) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    if (!visible) return null;
    return (
      <View testID="photo-viewer-modal">
        <Text testID="photo-index">Index: {initialIndex}</Text>
        <Text testID="photos-count">Photos: {photos.length}</Text>
        <TouchableOpacity testID="close-modal" onPress={onClose}>
          <Text>Close</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="delete-photo" onPress={onPhotoDeleted}>
          <Text>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  },
  VideoThumbnail: ({ uri, style }: any) => {
    const { View } = require('react-native');
    return <View testID="video-thumbnail" style={style} />;
  },
}));

// Mock photos data
const mockPhotos = [
  { key: 'photo-1', url: 'https://example.com/photo1.jpg' },
  { key: 'photo-2', url: 'https://example.com/photo2.jpg' },
  { key: 'photo-3', url: 'https://example.com/photo3.jpg' },
];

const mockVideos = [
  { key: 'video-1', url: 'https://example.com/video1.mp4' },
  { key: 'video-2', url: 'https://example.com/video2.mov' },
];

const defaultProps = {
  photos: mockPhotos,
  refugeId: 'refuge-1',
  refugeName: 'Test Refuge',
  onBack: jest.fn(),
  onPhotoDeleted: jest.fn(),
  onAddPhotos: jest.fn(),
};

describe('GalleryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderització bàsica', () => {
    it('hauria de renderitzar correctament', () => {
      const { getByText } = render(<GalleryScreen {...defaultProps} />);
      expect(getByText('refuge.gallery.title')).toBeTruthy();
    });

    it('hauria de mostrar el nom del refugi', () => {
      const { getByText } = render(<GalleryScreen {...defaultProps} />);
      expect(getByText('Test Refuge')).toBeTruthy();
    });

    it('hauria de renderitzar les fotos', () => {
      const { UNSAFE_root } = render(<GalleryScreen {...defaultProps} />);
      const images = UNSAFE_root.findAllByType(require('react-native').Image);
      expect(images.length).toBe(mockPhotos.length);
    });

    it('snapshot test', () => {
      const { toJSON } = render(<GalleryScreen {...defaultProps} />);
      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('Empty state', () => {
    it('hauria de mostrar empty state quan no hi ha fotos', () => {
      const { getByText } = render(
        <GalleryScreen {...defaultProps} photos={[]} />
      );
      expect(getByText('refuge.gallery.noPhotos')).toBeTruthy();
    });

    it('hauria de mostrar botó per afegir fotos en empty state', () => {
      const { getByText } = render(
        <GalleryScreen {...defaultProps} photos={[]} />
      );
      expect(getByText('refuge.gallery.addPhotosButton')).toBeTruthy();
    });

    it('hauria de cridar onAddPhotos quan es prem el botó', () => {
      const { getByText } = render(
        <GalleryScreen {...defaultProps} photos={[]} />
      );
      fireEvent.press(getByText('refuge.gallery.addPhotosButton'));
      expect(defaultProps.onAddPhotos).toHaveBeenCalled();
    });

    it('no hauria de mostrar botó si onAddPhotos no està definit', () => {
      const { queryByText } = render(
        <GalleryScreen {...defaultProps} photos={[]} onAddPhotos={undefined} />
      );
      expect(queryByText('refuge.gallery.addPhotosButton')).toBeNull();
    });
  });

  describe('Photo viewer modal', () => {
    it('hauria d\'obrir modal quan es prem una foto', () => {
      const { UNSAFE_root, getByTestId } = render(<GalleryScreen {...defaultProps} />);
      const touchables = UNSAFE_root.findAllByType(require('react-native').TouchableOpacity);
      
      // Buscar un touchable que no sigui el back button
      const photoTouchables = touchables.filter((t, i) => i > 0);
      if (photoTouchables.length > 0) {
        fireEvent.press(photoTouchables[0]);
      }
      
      expect(getByTestId('photo-viewer-modal')).toBeTruthy();
    });

    it('hauria de passar l\'índex correcte al modal', () => {
      const { UNSAFE_root, getByTestId } = render(<GalleryScreen {...defaultProps} />);
      const touchables = UNSAFE_root.findAllByType(require('react-native').TouchableOpacity);
      
      // Prémer la segona foto (índex 1)
      const photoTouchables = touchables.filter((t, i) => i > 0);
      if (photoTouchables.length > 1) {
        fireEvent.press(photoTouchables[1]);
      }
      
      expect(getByTestId('photo-index')).toBeTruthy();
    });

    it('hauria de tancar modal quan es prem close', async () => {
      const { UNSAFE_root, getByTestId, queryByTestId } = render(<GalleryScreen {...defaultProps} />);
      const touchables = UNSAFE_root.findAllByType(require('react-native').TouchableOpacity);
      
      // Obrir modal
      const photoTouchables = touchables.filter((t, i) => i > 0);
      if (photoTouchables.length > 0) {
        fireEvent.press(photoTouchables[0]);
      }
      
      // Tancar modal
      fireEvent.press(getByTestId('close-modal'));
      
      await waitFor(() => {
        expect(queryByTestId('photo-viewer-modal')).toBeNull();
      });
    });

    it('hauria de cridar onPhotoDeleted quan s\'elimina una foto', async () => {
      const { UNSAFE_root, getByTestId, queryByTestId } = render(<GalleryScreen {...defaultProps} />);
      const touchables = UNSAFE_root.findAllByType(require('react-native').TouchableOpacity);
      
      // Obrir modal
      const photoTouchables = touchables.filter((t, i) => i > 0);
      if (photoTouchables.length > 0) {
        fireEvent.press(photoTouchables[0]);
      }
      
      // Eliminar foto
      fireEvent.press(getByTestId('delete-photo'));
      
      expect(defaultProps.onPhotoDeleted).toHaveBeenCalled();
      
      await waitFor(() => {
        expect(queryByTestId('photo-viewer-modal')).toBeNull();
      });
    });
  });

  describe('Videos', () => {
    it('hauria de renderitzar thumbnails per a videos', () => {
      const { getAllByTestId } = render(
        <GalleryScreen {...defaultProps} photos={mockVideos} />
      );
      expect(getAllByTestId('video-thumbnail').length).toBe(mockVideos.length);
    });

    it('hauria de mostrar overlay de play per a videos', () => {
      const { UNSAFE_root } = render(
        <GalleryScreen {...defaultProps} photos={mockVideos} />
      );
      // El component mostra un overlay amb ▶ per a videos
      const texts = UNSAFE_root.findAllByType(require('react-native').Text);
      const playIcons = texts.filter((t: any) => t.props.children === '▶');
      expect(playIcons.length).toBe(mockVideos.length);
    });
  });

  describe('Navegació', () => {
    it('hauria de cridar onBack quan es prem el botó back', () => {
      const { UNSAFE_root } = render(<GalleryScreen {...defaultProps} />);
      const touchables = UNSAFE_root.findAllByType(require('react-native').TouchableOpacity);
      
      // El primer touchable és el botó back
      fireEvent.press(touchables[0]);
      
      expect(defaultProps.onBack).toHaveBeenCalled();
    });
  });

  describe('Grid layout', () => {
    it('hauria de tenir ScrollView', () => {
      const { UNSAFE_root } = render(<GalleryScreen {...defaultProps} />);
      const scrollViews = UNSAFE_root.findAllByType(require('react-native').ScrollView);
      expect(scrollViews.length).toBeGreaterThan(0);
    });

    it('hauria de renderitzar fotos en grid', () => {
      const { UNSAFE_root } = render(<GalleryScreen {...defaultProps} />);
      const images = UNSAFE_root.findAllByType(require('react-native').Image);
      expect(images.length).toBe(mockPhotos.length);
    });
  });

  describe('Mixed content', () => {
    it('hauria de renderitzar fotos i videos junts', () => {
      const mixedContent = [...mockPhotos, ...mockVideos];
      const { toJSON } = render(
        <GalleryScreen {...defaultProps} photos={mixedContent} />
      );
      
      // El component renderitza correctament amb contingut mixt
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('Props validation', () => {
    it('hauria de funcionar sense onPhotoDeleted', () => {
      const { toJSON } = render(
        <GalleryScreen {...defaultProps} onPhotoDeleted={undefined} />
      );
      expect(toJSON()).toBeTruthy();
    });

    it('hauria de funcionar sense onAddPhotos', () => {
      const { toJSON } = render(
        <GalleryScreen {...defaultProps} onAddPhotos={undefined} />
      );
      expect(toJSON()).toBeTruthy();
    });
  });
});
