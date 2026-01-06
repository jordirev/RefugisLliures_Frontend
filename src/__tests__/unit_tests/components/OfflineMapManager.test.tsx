/**
 * Tests unitaris per al component OfflineMapManager
 * 
 * Aquest fitxer cobreix:
 * - Renderització bàsica del component
 * - Modal visible/invisible
 * - Funcionalitat de Descarregar Mapes dels Pirineus
 * - Funcionalitat d'eliminar cache
 * - Estat del cache
 * - Progrés de descàrrega
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { OfflineMapManager } from '../../../components/OfflineMapManager';
import { MapCacheService } from '../../../services/MapCacheService';

// Variable per capturar showAlert calls - ha de començar amb 'mock'
const mockAlertState = {
  showAlertFn: jest.fn(),
  lastButtons: [] as any[],
};

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

// Mock useCustomAlert amb una funció que captura els botons de l'alerta
jest.mock('../../../hooks/useCustomAlert', () => ({
  useCustomAlert: () => {
    const mockShowAlert = jest.fn((title: string, message: string, buttons?: any[]) => {
      mockAlertState.lastButtons = buttons || [];
    });
    mockAlertState.showAlertFn = mockShowAlert;
    return {
      alertVisible: false,
      alertConfig: {},
      showAlert: mockShowAlert,
      hideAlert: jest.fn(),
    };
  },
}));

describe('OfflineMapManager Component', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockAlertState.lastButtons = [];
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

  describe('Descàrrega de mapes', () => {
    it('hauria de mostrar alerta de confirmació quan es prem descarregar', async () => {
      (MapCacheService.getCacheStatus as jest.Mock).mockResolvedValue({
        metadata: null,
        sizeInMB: 0,
      });

      const { getByText } = render(
        <OfflineMapManager visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(MapCacheService.getCacheStatus).toHaveBeenCalled();
      });

      // Buscar botó de descarregar amb regex per incloure l'emoji
      const downloadButton = getByText(/Descarregar Mapes dels Pirineus/);
      fireEvent.press(downloadButton);

      // Verificar que showAlert ha estat cridat
      expect(mockAlertState.showAlertFn).toHaveBeenCalledWith(
        'Descarregar Mapes Offline',
        expect.any(String),
        expect.arrayContaining([
          expect.objectContaining({ text: 'Cancel·lar' }),
          expect.objectContaining({ text: 'Descarregar' })
        ])
      );
    });

    it('hauria de iniciar descàrrega quan es confirma', async () => {
      (MapCacheService.getCacheStatus as jest.Mock).mockResolvedValue({
        metadata: null,
        sizeInMB: 0,
      });

      (MapCacheService.downloadTilesForArea as jest.Mock).mockImplementation(
        async (bounds, minZoom, maxZoom, progressCallback, completionCallback) => {
          // Simular progrés
          if (progressCallback) {
            progressCallback(50, 100, 50);
          }
          // Simular completar amb èxit
          if (completionCallback) {
            completionCallback(true);
          }
          return true;
        }
      );

      const { getByText } = render(
        <OfflineMapManager visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(MapCacheService.getCacheStatus).toHaveBeenCalled();
      });

      const downloadButton = getByText(/Descarregar Mapes dels Pirineus/);
      fireEvent.press(downloadButton);

      // Simular que l'usuari prem "Descarregar"
      await act(async () => {
        const downloadConfirmButton = mockAlertState.lastButtons.find((b: any) => b.text === 'Descarregar');
        if (downloadConfirmButton?.onPress) {
          await downloadConfirmButton.onPress();
        }
      });

      await waitFor(() => {
        expect(MapCacheService.downloadTilesForArea).toHaveBeenCalled();
      });
    });

    it('hauria de gestionar descàrrega fallida', async () => {
      (MapCacheService.getCacheStatus as jest.Mock).mockResolvedValue({
        metadata: null,
        sizeInMB: 0,
      });

      let completionCallbackCalled = false;
      (MapCacheService.downloadTilesForArea as jest.Mock).mockImplementation(
        async (bounds, minZoom, maxZoom, progressCallback, completionCallback) => {
          if (completionCallback) {
            completionCallback(false);
            completionCallbackCalled = true;
          }
          return false;
        }
      );

      const { getByText } = render(
        <OfflineMapManager visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(MapCacheService.getCacheStatus).toHaveBeenCalled();
      });

      const downloadButton = getByText(/Descarregar Mapes dels Pirineus/);
      fireEvent.press(downloadButton);

      await act(async () => {
        const downloadConfirmButton = mockAlertState.lastButtons.find((b: any) => b.text === 'Descarregar');
        if (downloadConfirmButton?.onPress) {
          await downloadConfirmButton.onPress();
        }
      });

      // Verificar que el completionCallback s'ha cridat amb false
      await waitFor(() => {
        expect(completionCallbackCalled).toBe(true);
      });

      // Verificar que el servei s'ha cridat
      expect(MapCacheService.downloadTilesForArea).toHaveBeenCalled();
    });

    it('hauria de gestionar errors durant la descàrrega (excepció)', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (MapCacheService.getCacheStatus as jest.Mock).mockResolvedValue({
        metadata: null,
        sizeInMB: 0,
      });
      
      (MapCacheService.downloadTilesForArea as jest.Mock).mockRejectedValue(
        new Error('Error de descàrrega')
      );

      const { getByText } = render(
        <OfflineMapManager visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(MapCacheService.getCacheStatus).toHaveBeenCalled();
      });

      const downloadButton = getByText(/Descarregar Mapes dels Pirineus/);
      fireEvent.press(downloadButton);

      await act(async () => {
        const downloadConfirmButton = mockAlertState.lastButtons.find((b: any) => b.text === 'Descarregar');
        if (downloadConfirmButton?.onPress) {
          try {
            await downloadConfirmButton.onPress();
          } catch (e) {
            // Expected
          }
        }
      });

      consoleSpy.mockRestore();
    });

    it('hauria de cancel·lar descàrrega quan es prem Cancel·lar', async () => {
      (MapCacheService.getCacheStatus as jest.Mock).mockResolvedValue({
        metadata: null,
        sizeInMB: 0,
      });

      const { getByText } = render(
        <OfflineMapManager visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(MapCacheService.getCacheStatus).toHaveBeenCalled();
      });

      const downloadButton = getByText(/Descarregar Mapes dels Pirineus/);
      fireEvent.press(downloadButton);

      // Verificar que hi ha botó de cancel·lar
      const cancelButton = mockAlertState.lastButtons.find((b: any) => b.text === 'Cancel·lar');
      expect(cancelButton).toBeDefined();
      expect(cancelButton.style).toBe('cancel');
    });
  });

  describe('Eliminació del cache', () => {
    it('hauria de mostrar alerta de confirmació quan es prem eliminar', async () => {
      (MapCacheService.getCacheStatus as jest.Mock).mockResolvedValue({
        metadata: {
          isComplete: true,
          downloadedTiles: 1000,
          totalTiles: 1000,
          downloadDate: new Date().toISOString(),
        },
        sizeInMB: 50,
      });

      const { getByText } = render(
        <OfflineMapManager visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(MapCacheService.getCacheStatus).toHaveBeenCalled();
      });

      const deleteButton = getByText(/Eliminar Mapes/);
      fireEvent.press(deleteButton);

      expect(mockAlertState.showAlertFn).toHaveBeenCalledWith(
        'Eliminar Mapes',
        expect.any(String),
        expect.arrayContaining([
          expect.objectContaining({ text: 'Cancel·lar' }),
          expect.objectContaining({ text: 'Eliminar', style: 'destructive' })
        ])
      );
    });

    it('hauria de eliminar cache quan es confirma', async () => {
      (MapCacheService.getCacheStatus as jest.Mock).mockResolvedValue({
        metadata: {
          isComplete: true,
          downloadedTiles: 1000,
          totalTiles: 1000,
          downloadDate: new Date().toISOString(),
        },
        sizeInMB: 50,
      });

      (MapCacheService.clearCache as jest.Mock).mockResolvedValue(undefined);

      const { getByText } = render(
        <OfflineMapManager visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(MapCacheService.getCacheStatus).toHaveBeenCalled();
      });

      const deleteButton = getByText(/Eliminar Mapes/);
      fireEvent.press(deleteButton);

      await act(async () => {
        const confirmDeleteButton = mockAlertState.lastButtons.find((b: any) => b.text === 'Eliminar');
        if (confirmDeleteButton?.onPress) {
          await confirmDeleteButton.onPress();
        }
      });

      // Verificar que el servei s'ha cridat
      await waitFor(() => {
        expect(MapCacheService.clearCache).toHaveBeenCalled();
      });

      // Verificar que getCacheStatus es torna a cridar per actualitzar l'estat
      expect(MapCacheService.getCacheStatus).toHaveBeenCalledTimes(2);
    });

    it('hauria de gestionar errors durant l\'eliminació', async () => {
      (MapCacheService.getCacheStatus as jest.Mock).mockResolvedValue({
        metadata: {
          isComplete: true,
          downloadedTiles: 1000,
          totalTiles: 1000,
          downloadDate: new Date().toISOString(),
        },
        sizeInMB: 50,
      });

      (MapCacheService.clearCache as jest.Mock).mockRejectedValue(
        new Error('Error d\'eliminació')
      );

      const { getByText } = render(
        <OfflineMapManager visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(MapCacheService.getCacheStatus).toHaveBeenCalled();
      });

      const deleteButton = getByText(/Eliminar Mapes/);
      fireEvent.press(deleteButton);

      await act(async () => {
        const confirmDeleteButton = mockAlertState.lastButtons.find((b: any) => b.text === 'Eliminar');
        if (confirmDeleteButton?.onPress) {
          await confirmDeleteButton.onPress();
        }
      });

      await waitFor(() => {
        expect(mockAlertState.showAlertFn).toHaveBeenCalledWith(
          'Error',
          expect.stringContaining('problema')
        );
      });
    });
  });

  describe('Progrés de descàrrega', () => {
    it('hauria de mostrar progrés durant la descàrrega', async () => {
      (MapCacheService.getCacheStatus as jest.Mock).mockResolvedValue({
        metadata: null,
        sizeInMB: 0,
      });

      let capturedProgressCallback: any = null;
      
      (MapCacheService.downloadTilesForArea as jest.Mock).mockImplementation(
        async (bounds, minZoom, maxZoom, progressCallback, completionCallback) => {
          capturedProgressCallback = progressCallback;
          // Simular progrés
          if (progressCallback) {
            progressCallback(50, 100, 50);
          }
          return true;
        }
      );

      const { getByText } = render(
        <OfflineMapManager visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(MapCacheService.getCacheStatus).toHaveBeenCalled();
      });

      const downloadButton = getByText(/Descarregar Mapes dels Pirineus/);
      fireEvent.press(downloadButton);

      // Simular confirmació
      await act(async () => {
        const downloadConfirmButton = mockAlertState.lastButtons.find((b: any) => b.text === 'Descarregar');
        if (downloadConfirmButton?.onPress) {
          await downloadConfirmButton.onPress();
        }
      });

      // Verificar que el callback de progrés es va cridar
      expect(capturedProgressCallback).not.toBeNull();
    });

    it('hauria de actualitzar estadístiques de descàrrega', async () => {
      (MapCacheService.getCacheStatus as jest.Mock).mockResolvedValue({
        metadata: null,
        sizeInMB: 0,
      });

      (MapCacheService.downloadTilesForArea as jest.Mock).mockImplementation(
        async (bounds, minZoom, maxZoom, progressCallback, completionCallback) => {
          // Simular múltiples actualitzacions de progrés
          if (progressCallback) {
            progressCallback(25, 100, 25);
            progressCallback(50, 100, 50);
            progressCallback(75, 100, 75);
          }
          if (completionCallback) {
            completionCallback(true);
          }
          return true;
        }
      );

      const { getByText } = render(
        <OfflineMapManager visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(MapCacheService.getCacheStatus).toHaveBeenCalled();
      });

      const downloadButton = getByText(/Descarregar Mapes dels Pirineus/);
      fireEvent.press(downloadButton);

      await act(async () => {
        const downloadConfirmButton = mockAlertState.lastButtons.find((b: any) => b.text === 'Descarregar');
        if (downloadConfirmButton?.onPress) {
          await downloadConfirmButton.onPress();
        }
      });

      expect(MapCacheService.downloadTilesForArea).toHaveBeenCalled();
    });
  });

  describe('Funcions auxiliars - Format i Estat', () => {
    it('hauria de mostrar mida en KB per valors petits', async () => {
      (MapCacheService.getCacheStatus as jest.Mock).mockResolvedValue({
        metadata: {
          isComplete: true,
          downloadedTiles: 10,
          totalTiles: 10,
          downloadDate: new Date().toISOString(),
        },
        sizeInMB: 0.5, // 512 KB
      });

      const { getByText } = render(
        <OfflineMapManager visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        // Cerca el text amb la mida en KB
        expect(getByText(/KB/)).toBeTruthy();
      });
    });

    it('hauria de mostrar mida en MB per valors grans', async () => {
      (MapCacheService.getCacheStatus as jest.Mock).mockResolvedValue({
        metadata: {
          isComplete: true,
          downloadedTiles: 1000,
          totalTiles: 1000,
          downloadDate: new Date().toISOString(),
        },
        sizeInMB: 50.5,
      });

      const { getByText } = render(
        <OfflineMapManager visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(getByText(/50\.5 MB/)).toBeTruthy();
      });
    });

    it('hauria de mostrar estat verd quan mapes estan complets', async () => {
      (MapCacheService.getCacheStatus as jest.Mock).mockResolvedValue({
        metadata: {
          isComplete: true,
          downloadedTiles: 1000,
          totalTiles: 1000,
          downloadDate: new Date().toISOString(),
        },
        sizeInMB: 50,
      });

      const { getByText } = render(
        <OfflineMapManager visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(getByText('Mapes offline disponibles')).toBeTruthy();
      });
    });

    it('hauria de mostrar estat groc quan descàrrega és incompleta', async () => {
      (MapCacheService.getCacheStatus as jest.Mock).mockResolvedValue({
        metadata: {
          isComplete: false,
          downloadedTiles: 500,
          totalTiles: 1000,
          downloadDate: new Date().toISOString(),
        },
        sizeInMB: 25,
      });

      const { getByText } = render(
        <OfflineMapManager visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(getByText('Descàrrega incompleta')).toBeTruthy();
      });
    });

    it('hauria de mostrar "No hi ha mapes offline" quan no hi ha metadata', async () => {
      (MapCacheService.getCacheStatus as jest.Mock).mockResolvedValue({
        metadata: null,
        sizeInMB: 0,
      });

      const { getByText } = render(
        <OfflineMapManager visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(getByText('No hi ha mapes offline')).toBeTruthy();
      });
    });

    it('hauria de mostrar refugis descarregats si disponible', async () => {
      (MapCacheService.getCacheStatus as jest.Mock).mockResolvedValue({
        metadata: {
          isComplete: true,
          downloadedTiles: 1000,
          totalTiles: 1000,
          downloadDate: new Date().toISOString(),
          refugesCount: 42,
        },
        sizeInMB: 50,
      });

      const { getByText } = render(
        <OfflineMapManager visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(getByText('Refugis descarregats:')).toBeTruthy();
        expect(getByText('42')).toBeTruthy();
      });
    });
  });
});
