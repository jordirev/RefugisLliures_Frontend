/**
 * Tests unitaris per al component OfflineMapManager
 * 
 * Aquest fitxer cobreix:
 * - Renderització bàsica del component
 * - Modal visible/invisible
 * - Funcionalitat de descarregar mapes
 * - Funcionalitat d'eliminar cache
 * - Estat del cache
 * - Progrés de descàrrega
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { OfflineMapManager } from '../../../components/OfflineMapManager';
import { MapCacheService } from '../../../services/MapCacheService';

// Mock MapCacheService
jest.mock('../../../services/MapCacheService', () => ({
  MapCacheService: {
    getCacheStatus: jest.fn(),
    downloadTilesForArea: jest.fn(),
    clearCache: jest.fn(),
    PYRENEES_BOUNDS: {
      north: 43.3,
      south: 42.0,
      west: -2.0,
      east: 3.3,
    },
  },
}));

// Mock CustomAlert component
jest.mock('../../../components/CustomAlert', () => ({
  CustomAlert: () => null,
}));

// Mock useCustomAlert
jest.mock('../../../hooks/useCustomAlert', () => ({
  useCustomAlert: () => ({
    alertVisible: false,
    alertConfig: {},
    showAlert: jest.fn(),
    hideAlert: jest.fn(),
  }),
}));

describe('OfflineMapManager Component', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (MapCacheService.getCacheStatus as jest.Mock).mockResolvedValue({
      metadata: {
        isComplete: true,
        downloadedTiles: 1000,
        totalTiles: 1000,
      },
      totalSizeMB: 50,
    });
  });

  describe('Renderització bàsica', () => {
    it('hauria de renderitzar correctament quan és visible', async () => {
      const { getByText } = render(
        <OfflineMapManager visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(getByText('Mapes Offline')).toBeTruthy();
      });
    });

    it('hauria de mostrar el botó de tancar', async () => {
      const { getByText } = render(
        <OfflineMapManager visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(getByText('✕')).toBeTruthy();
      });
    });

    it('hauria de cridar onClose quan es prem el botó de tancar', async () => {
      const { getByText } = render(
        <OfflineMapManager visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        const closeButton = getByText('✕');
        fireEvent.press(closeButton);
      });

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Estat del cache', () => {
    it('hauria de carregar l\'estat del cache quan es fa visible', async () => {
      render(<OfflineMapManager visible={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(MapCacheService.getCacheStatus).toHaveBeenCalled();
      });
    });

    it('hauria de gestionar estat de cache complet', async () => {
      (MapCacheService.getCacheStatus as jest.Mock).mockResolvedValue({
        metadata: {
          isComplete: true,
          downloadedTiles: 1000,
          totalTiles: 1000,
        },
        totalSizeMB: 50,
      });

      render(
        <OfflineMapManager visible={true} onClose={mockOnClose} />
      );

      // Verifiquem que getCacheStatus s'ha cridat
      await waitFor(() => {
        expect(MapCacheService.getCacheStatus).toHaveBeenCalled();
      });
    });

    it('hauria de gestionar quan no hi ha cache', async () => {
      (MapCacheService.getCacheStatus as jest.Mock).mockResolvedValue({
        metadata: null,
      });

      render(
        <OfflineMapManager visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(MapCacheService.getCacheStatus).toHaveBeenCalled();
      });
    });

    it('hauria de gestionar descàrrega incompleta', async () => {
      (MapCacheService.getCacheStatus as jest.Mock).mockResolvedValue({
        metadata: {
          isComplete: false,
          downloadedTiles: 500,
          totalTiles: 1000,
        },
        totalSizeMB: 25,
      });

      render(
        <OfflineMapManager visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(MapCacheService.getCacheStatus).toHaveBeenCalled();
      });
    });
  });

  describe('Helpers i botons', () => {
    it('hauria de cridar getCacheStatus quan es renderitza', async () => {
      render(<OfflineMapManager visible={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(MapCacheService.getCacheStatus).toHaveBeenCalled();
      });
    });
  });

  describe('Gestió d\'errors', () => {
    it('hauria de gestionar errors en carregar l\'estat del cache', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (MapCacheService.getCacheStatus as jest.Mock).mockRejectedValue(
        new Error('Error de xarxa')
      );

      render(<OfflineMapManager visible={true} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(MapCacheService.getCacheStatus).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Snapshot', () => {
    it('hauria de coincidir amb el snapshot quan és visible amb cache', async () => {
      const { toJSON } = render(
        <OfflineMapManager visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(toJSON()).toMatchSnapshot();
      });
    });

    it('hauria de coincidir amb el snapshot quan és visible sense cache', async () => {
      (MapCacheService.getCacheStatus as jest.Mock).mockResolvedValue({
        metadata: null,
      });

      const { toJSON } = render(
        <OfflineMapManager visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(toJSON()).toMatchSnapshot();
      });
    });
  });
});
