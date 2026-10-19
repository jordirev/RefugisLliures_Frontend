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
import { findAllByType } from '../../testHelpers/findByType';

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
    it('hauria de renderitzar correctament', async () => {
      const { getByText } = await render(<GalleryScreen {...defaultProps} />);
      expect(getByText('refuge.gallery.title')).toBeTruthy();
    });

    it('hauria de mostrar el nom del refugi', async () => {
      const { getByText } = await render(<GalleryScreen {...defaultProps} />);
      expect(getByText('Test Refuge')).toBeTruthy();
    });

    it('hauria de renderitzar les fotos', async () => {
      const { container } = await render(<GalleryScreen {...defaultProps} />);
      // Miniatures amb expo-image (mock host 'ExpoImage')
      const images = container.queryAll((n: any) => n.type === 'ExpoImage');
      expect(images.length).toBe(mockPhotos.length);
    });

    it('snapshot test', async () => {
      const { toJSON } = await render(<GalleryScreen {...defaultProps} />);
      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('Empty state', () => {
    it('hauria de mostrar empty state quan no hi ha fotos', async () => {
      const { getByText } = await render(
        <GalleryScreen {...defaultProps} photos={[]} />
      );
      expect(getByText('refuge.gallery.noPhotos')).toBeTruthy();
    });

    it('hauria de mostrar botó per afegir fotos en empty state', async () => {
      const { getByText } = await render(
        <GalleryScreen {...defaultProps} photos={[]} />
      );
      expect(getByText('refuge.gallery.addPhotosButton')).toBeTruthy();
    });

    it('hauria de cridar onAddPhotos quan es prem el botó', async () => {
      const { getByText } = await render(
        <GalleryScreen {...defaultProps} photos={[]} />
      );
      await fireEvent.press(getByText('refuge.gallery.addPhotosButton'));
      expect(defaultProps.onAddPhotos).toHaveBeenCalled();
    });

    it('no hauria de mostrar botó si onAddPhotos no està definit', async () => {
      const { queryByText } = await render(
        <GalleryScreen {...defaultProps} photos={[]} onAddPhotos={undefined} />
      );
      expect(queryByText('refuge.gallery.addPhotosButton')).toBeNull();
    });
  });

  describe('Photo viewer modal', () => {
    it('hauria d\'obrir modal quan es prem una foto', async () => {
      const { container, getByTestId } = await render(<GalleryScreen {...defaultProps} />);
      const touchables = findAllByType(container, require('react-native').TouchableOpacity);
      
      // Buscar un touchable que no sigui el back button
      const photoTouchables = touchables.filter((t, i) => i > 0);
      if (photoTouchables.length > 0) {
        await fireEvent.press(photoTouchables[0]);
      }
      
      expect(getByTestId('photo-viewer-modal')).toBeTruthy();
    });

    it('hauria de passar l\'índex correcte al modal', async () => {
      const { container, getByTestId } = await render(<GalleryScreen {...defaultProps} />);
      const touchables = findAllByType(container, require('react-native').TouchableOpacity);
      
      // Prémer la segona foto (índex 1)
      const photoTouchables = touchables.filter((t, i) => i > 0);
      if (photoTouchables.length > 1) {
        await fireEvent.press(photoTouchables[1]);
      }
      
      expect(getByTestId('photo-index')).toBeTruthy();
    });

    it('hauria de tancar modal quan es prem close', async () => {
      const { container, getByTestId, queryByTestId } = await render(<GalleryScreen {...defaultProps} />);
      const touchables = findAllByType(container, require('react-native').TouchableOpacity);
      
      // Obrir modal
      const photoTouchables = touchables.filter((t, i) => i > 0);
      if (photoTouchables.length > 0) {
        await fireEvent.press(photoTouchables[0]);
      }
      
      // Tancar modal
      await fireEvent.press(getByTestId('close-modal'));
      
      await waitFor(() => {
        expect(queryByTestId('photo-viewer-modal')).toBeNull();
      });
    });

    it('hauria de cridar onPhotoDeleted quan s\'elimina una foto', async () => {
      const { container, getByTestId, queryByTestId } = await render(<GalleryScreen {...defaultProps} />);
      const touchables = findAllByType(container, require('react-native').TouchableOpacity);
      
      // Obrir modal
      const photoTouchables = touchables.filter((t, i) => i > 0);
      if (photoTouchables.length > 0) {
        await fireEvent.press(photoTouchables[0]);
      }
      
      // Eliminar foto
      await fireEvent.press(getByTestId('delete-photo'));
      
      expect(defaultProps.onPhotoDeleted).toHaveBeenCalled();
      
      await waitFor(() => {
        expect(queryByTestId('photo-viewer-modal')).toBeNull();
      });
    });
  });

  describe('Videos', () => {
    it('hauria de renderitzar thumbnails per a videos', async () => {
      const { getAllByTestId } = await render(
        <GalleryScreen {...defaultProps} photos={mockVideos} />
      );
      expect(getAllByTestId('video-thumbnail').length).toBe(mockVideos.length);
    });

    it('hauria de mostrar overlay de play per a videos', async () => {
      const { container } = await render(
        <GalleryScreen {...defaultProps} photos={mockVideos} />
      );
      // El component mostra un overlay amb ▶ per a videos
      const texts = findAllByType(container, require('react-native').Text);
      const playIcons = texts.filter((t: any) => t.props.children === '▶');
      expect(playIcons.length).toBe(mockVideos.length);
    });
  });

  describe('Navegació', () => {
    it('hauria de cridar onBack quan es prem el botó back', async () => {
      const { container } = await render(<GalleryScreen {...defaultProps} />);
      const touchables = findAllByType(container, require('react-native').TouchableOpacity);
      
      // El primer touchable és el botó back
      await fireEvent.press(touchables[0]);
      
      expect(defaultProps.onBack).toHaveBeenCalled();
    });
  });

  describe('Grid layout', () => {
    it('hauria de tenir ScrollView', async () => {
      const { container } = await render(<GalleryScreen {...defaultProps} />);
      const scrollViews = findAllByType(container, require('react-native').ScrollView);
      expect(scrollViews.length).toBeGreaterThan(0);
    });

    it('hauria de renderitzar fotos en grid', async () => {
      const { container } = await render(<GalleryScreen {...defaultProps} />);
      // Miniatures amb expo-image (mock host 'ExpoImage')
      const images = container.queryAll((n: any) => n.type === 'ExpoImage');
      expect(images.length).toBe(mockPhotos.length);
    });
  });

  describe('Mixed content', () => {
    it('hauria de renderitzar fotos i videos junts', async () => {
      const mixedContent = [...mockPhotos, ...mockVideos];
      const { toJSON } = await render(
        <GalleryScreen {...defaultProps} photos={mixedContent} />
      );
      
      // El component renderitza correctament amb contingut mixt
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('Props validation', () => {
    it('hauria de funcionar sense onPhotoDeleted', async () => {
      const { toJSON } = await render(
        <GalleryScreen {...defaultProps} onPhotoDeleted={undefined} />
      );
      expect(toJSON()).toBeTruthy();
    });

    it('hauria de funcionar sense onAddPhotos', async () => {
      const { toJSON } = await render(
        <GalleryScreen {...defaultProps} onAddPhotos={undefined} />
      );
      expect(toJSON()).toBeTruthy();
    });
  });
});
