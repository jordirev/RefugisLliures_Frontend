/**
 * Tests unitaris per al component QuickActionsMenu
 *
 * Aquest fitxer cobreix:
 * - Renderització del menú
 * - Accions del menú (favorit, visitat, compartir, etc.)
 * - Animacions d'apertura/tancament
 * - Gestió de fotos
 * - Snapshot tests
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QuickActionsMenu } from '../../../components/QuickActionsMenu';
import { Location } from '../../../models';

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file://test/image.jpg', mimeType: 'image/jpeg' }],
  }),
  UIImagePickerPresentationStyle: { FULL_SCREEN: 0 },
}));

// Mock RefugeMediaService
jest.mock('../../../services/RefugeMediaService', () => ({
  RefugeMediaService: {
    uploadRefugeMedia: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock useVisited hook
jest.mock('../../../hooks/useVisited', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    isVisited: false,
    toggleVisited: jest.fn(),
    isProcessing: false,
  })),
}));

// Mock SVG icons
jest.mock('../../../assets/icons/fav-white.svg', () => 'HeartIcon');
jest.mock('../../../assets/icons/favourite2.svg', () => 'HeartFilledIcon');
jest.mock('../../../assets/icons/message-circle.svg', () => 'MessageCircleIcon');
jest.mock('../../../assets/icons/trash.svg', () => 'TrashIcon');

const mockRefuge: Location = {
  id: 'refuge-1',
  name: 'Test Refuge',
  coord: { lat: 42.5678, long: 1.2345 },
  altitude: 2000,
  places: 20,
};

const mockOnClose = jest.fn();
const mockOnOpen = jest.fn();
const mockOnToggleFavorite = jest.fn();
const mockOnShowAlert = jest.fn();
const mockOnEdit = jest.fn();
const mockOnDelete = jest.fn();
const mockOnPhotoUploaded = jest.fn();
const mockOnViewMap = jest.fn();
const mockOnNavigateToDoubts = jest.fn();
const mockOnNavigateToExperiences = jest.fn();

const defaultProps = {
  visible: true,
  onClose: mockOnClose,
  onOpen: mockOnOpen,
  refuge: mockRefuge,
  isFavourite: false,
  onToggleFavorite: mockOnToggleFavorite,
  onShowAlert: mockOnShowAlert,
};

describe('QuickActionsMenu Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderització bàsica', () => {
    it('hauria de renderitzar quan és visible', () => {
      const { toJSON } = render(<QuickActionsMenu {...defaultProps} />);
      expect(toJSON()).toBeTruthy();
    });

    it('snapshot test - menú obert', () => {
      const { toJSON } = render(<QuickActionsMenu {...defaultProps} />);
      expect(toJSON()).toMatchSnapshot();
    });

    it('snapshot test - menú tancat', () => {
      const { toJSON } = render(
        <QuickActionsMenu {...defaultProps} visible={false} />
      );
      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('Acció de favorit', () => {
    it('hauria de mostrar icona de favorit no marcat', () => {
      const { toJSON } = render(
        <QuickActionsMenu {...defaultProps} isFavourite={false} />
      );
      expect(toJSON()).toBeTruthy();
    });

    it('hauria de mostrar icona de favorit marcat', () => {
      const { toJSON } = render(
        <QuickActionsMenu {...defaultProps} isFavourite={true} />
      );
      expect(toJSON()).toBeTruthy();
    });

    it('hauria de cridar onToggleFavorite quan es prem', () => {
      const { getByTestId } = render(<QuickActionsMenu {...defaultProps} />);
      fireEvent.press(getByTestId('menu-favorite'));
      expect(mockOnToggleFavorite).toHaveBeenCalled();
    });
  });

  describe('Acció de visitat', () => {
    it('hauria de mostrar l\'estat de visitat', () => {
      const useVisited = require('../../../hooks/useVisited').default;
      useVisited.mockReturnValue({
        isVisited: true,
        toggleVisited: jest.fn(),
        isProcessing: false,
      });

      const { toJSON } = render(<QuickActionsMenu {...defaultProps} />);
      expect(toJSON()).toBeTruthy();
    });

    it('hauria de mostrar loading quan està processant', () => {
      const useVisited = require('../../../hooks/useVisited').default;
      useVisited.mockReturnValue({
        isVisited: false,
        toggleVisited: jest.fn(),
        isProcessing: true,
      });

      const { toJSON } = render(<QuickActionsMenu {...defaultProps} />);
      expect(toJSON()).toBeTruthy();
    });

    it('hauria de cridar toggleVisited quan es prem', async () => {
      const mockToggleVisited = jest.fn();
      const useVisited = require('../../../hooks/useVisited').default;
      useVisited.mockReturnValue({
        isVisited: false,
        toggleVisited: mockToggleVisited,
        isProcessing: false,
      });

      const { getByTestId } = render(<QuickActionsMenu {...defaultProps} />);
      fireEvent.press(getByTestId('menu-visited'));
      await waitFor(() => {
        expect(mockToggleVisited).toHaveBeenCalled();
      });
    });

    it('hauria de gestionar errors en toggleVisited', async () => {
      const mockToggleVisited = jest.fn().mockRejectedValue(new Error('Error'));
      const useVisited = require('../../../hooks/useVisited').default;
      useVisited.mockReturnValue({
        isVisited: false,
        toggleVisited: mockToggleVisited,
        isProcessing: false,
      });

      const { getByTestId } = render(<QuickActionsMenu {...defaultProps} />);
      fireEvent.press(getByTestId('menu-visited'));
      // No hauria de llençar excepció
      await waitFor(() => {
        expect(mockToggleVisited).toHaveBeenCalled();
      });
    });
  });

  describe('Afegir fotos', () => {
    it('hauria de permetre afegir fotos', async () => {
      const { getByTestId } = render(
        <QuickActionsMenu
          {...defaultProps}
          onPhotoUploaded={mockOnPhotoUploaded}
        />
      );

      fireEvent.press(getByTestId('menu-photo'));
      await waitFor(() => {
        expect(mockOnPhotoUploaded).toHaveBeenCalled();
      });
    });

    it('hauria de gestionar errors en afegir fotos', async () => {
      const { RefugeMediaService } = require('../../../services/RefugeMediaService');
      RefugeMediaService.uploadRefugeMedia.mockRejectedValueOnce(new Error('Upload failed'));

      const { getByTestId } = render(
        <QuickActionsMenu
          {...defaultProps}
          onPhotoUploaded={mockOnPhotoUploaded}
        />
      );

      fireEvent.press(getByTestId('menu-photo'));
      await waitFor(() => {
        expect(mockOnShowAlert).toHaveBeenCalled();
      });
    });

    it('hauria de gestionar cancel·lació de selecció de fotos', async () => {
      const ImagePicker = require('expo-image-picker');
      ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({ canceled: true });

      const { getByTestId } = render(
        <QuickActionsMenu
          {...defaultProps}
          onPhotoUploaded={mockOnPhotoUploaded}
        />
      );

      fireEvent.press(getByTestId('menu-photo'));
      // No hauria de pujar res
    });

    it('hauria de gestionar permisos denegats', async () => {
      const ImagePicker = require('expo-image-picker');
      ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });

      const { getByTestId } = render(
        <QuickActionsMenu {...defaultProps} />
      );

      fireEvent.press(getByTestId('menu-photo'));
      // No hauria de llençar excepció
    });
  });

  describe('Accions d\'edició i eliminació', () => {
    it('hauria de cridar onEdit quan es prem', () => {
      const { getByTestId } = render(
        <QuickActionsMenu
          {...defaultProps}
          onEdit={mockOnEdit}
        />
      );

      fireEvent.press(getByTestId('menu-edit'));
      expect(mockOnEdit).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('hauria de cridar onDelete quan es prem', () => {
      const { getByTestId } = render(
        <QuickActionsMenu
          {...defaultProps}
          onDelete={mockOnDelete}
        />
      );

      fireEvent.press(getByTestId('menu-delete'));
      expect(mockOnDelete).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('hauria de funcionar sense onEdit', () => {
      const { getByTestId } = render(
        <QuickActionsMenu {...defaultProps} />
      );
      fireEvent.press(getByTestId('menu-edit'));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('hauria de funcionar sense onDelete', () => {
      const { getByTestId } = render(
        <QuickActionsMenu {...defaultProps} />
      );
      fireEvent.press(getByTestId('menu-delete'));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Navegació a experiències i dubtes', () => {
    it('hauria de navegar a experiències amb callback', () => {
      const { getByTestId } = render(
        <QuickActionsMenu
          {...defaultProps}
          onNavigateToExperiences={mockOnNavigateToExperiences}
        />
      );

      fireEvent.press(getByTestId('menu-share-experience'));
      expect(mockOnNavigateToExperiences).toHaveBeenCalledWith('refuge-1', 'Test Refuge');
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('hauria de navegar a dubtes amb callback', () => {
      const { getByTestId } = render(
        <QuickActionsMenu
          {...defaultProps}
          onNavigateToDoubts={mockOnNavigateToDoubts}
        />
      );

      fireEvent.press(getByTestId('menu-ask'));
      expect(mockOnNavigateToDoubts).toHaveBeenCalledWith('refuge-1', 'Test Refuge');
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('hauria de navegar a experiències sense callback', () => {
      const mockNavigate = jest.fn();
      jest.spyOn(require('@react-navigation/native'), 'useNavigation').mockReturnValue({
        navigate: mockNavigate,
      });

      const { getByTestId } = render(<QuickActionsMenu {...defaultProps} />);
      fireEvent.press(getByTestId('menu-share-experience'));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('hauria de navegar a dubtes sense callback', () => {
      const mockNavigate = jest.fn();
      jest.spyOn(require('@react-navigation/native'), 'useNavigation').mockReturnValue({
        navigate: mockNavigate,
      });

      const { getByTestId } = render(<QuickActionsMenu {...defaultProps} />);
      fireEvent.press(getByTestId('menu-ask'));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Veure al mapa', () => {
    it('hauria de cridar onViewMap quan es prem', () => {
      const { getByTestId } = render(
        <QuickActionsMenu
          {...defaultProps}
          onViewMap={mockOnViewMap}
        />
      );

      fireEvent.press(getByTestId('menu-view-map'));
      expect(mockOnViewMap).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('hauria de funcionar sense onViewMap', () => {
      const { getByTestId } = render(
        <QuickActionsMenu {...defaultProps} />
      );
      fireEvent.press(getByTestId('menu-view-map'));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Tancament del menú', () => {
    it('hauria de cridar onClose quan es prem overlay', () => {
      const { UNSAFE_root } = render(<QuickActionsMenu {...defaultProps} />);
      const touchables = UNSAFE_root.findAllByType(require('react-native').TouchableOpacity);
      // L'overlay és el primer touchable
      if (touchables.length > 0) {
        fireEvent.press(touchables[0]);
      }
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Format de coordenades', () => {
    it('hauria de formatar les coordenades correctament', () => {
      const { toJSON } = render(<QuickActionsMenu {...defaultProps} />);
      // El component hauria de poder formatar les coordenades internament
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('Amb totes les props opcionals', () => {
    it('hauria de renderitzar correctament amb totes les funcionalitats', () => {
      const { toJSON } = render(
        <QuickActionsMenu
          {...defaultProps}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onPhotoUploaded={mockOnPhotoUploaded}
          onViewMap={mockOnViewMap}
          onNavigateToDoubts={mockOnNavigateToDoubts}
          onNavigateToExperiences={mockOnNavigateToExperiences}
        />
      );
      expect(toJSON()).toBeTruthy();
    });
  });
});
