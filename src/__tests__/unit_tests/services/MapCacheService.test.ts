/**
 * Tests unitaris per MapCacheService
 * 
 * Aquest fitxer cobreix:
 * - Inicialització del cache (initializeCache)
 * - Conversió de coordenades a tiles (coordsToTile)
 * - Obtenció de tiles per bounds (getTilesForBounds)
 * - Descàrrega de tiles individuals (downloadTile)
 * - Descàrrega d'àrees completes (downloadTilesForArea)
 * - Gestió de metadata (saveMetadata, getMetadata)
 * - Comprovació d'existència de tiles (hasTile)
 * - Obtenció d'URLs (getTileUrl, getTileLocalPath)
 * - Estat del cache (getCacheStatus)
 * - Neteja del cache (clearCache)
 * 
 * Escenaris d'èxit i límit per màxim coverage
 */

import { MapCacheService } from '../../../services/MapCacheService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock de les dependències
jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file://documents/',
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  deleteAsync: jest.fn(),
  readDirectoryAsync: jest.fn(),
  downloadAsync: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage');

jest.mock('../../../services/fetchWithLog', () => ({
  logApi: jest.fn()
}));

// Import després dels mocks
const FileSystem = require('expo-file-system/legacy');
const { logApi } = require('../../../services/fetchWithLog');

// Type assertion for AsyncStorage mock
const mockedAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('MapCacheService', () => {
  const mockCacheDir = 'file://documents/map_cache/';

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  describe('initializeCache', () => {
    it('ha de crear el directori de cache si no existeix', async () => {
      // Arrange
      FileSystem.getInfoAsync.mockResolvedValue({
        exists: false,
        isDirectory: false,
        uri: mockCacheDir,
        size: 0,
        modificationTime: 0
      });
      FileSystem.makeDirectoryAsync.mockResolvedValue(undefined);

      // Act
      await MapCacheService.initializeCache();

      // Assert
      expect(FileSystem.getInfoAsync).toHaveBeenCalledWith(mockCacheDir);
      expect(FileSystem.makeDirectoryAsync).toHaveBeenCalledWith(mockCacheDir, { intermediates: true });
    });

    it('no ha de crear el directori si ja existeix', async () => {
      // Arrange
      FileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        isDirectory: true,
        uri: mockCacheDir,
        size: 1024,
        modificationTime: Date.now()
      });

      // Act
      await MapCacheService.initializeCache();

      // Assert
      expect(FileSystem.getInfoAsync).toHaveBeenCalledWith(mockCacheDir);
      expect(FileSystem.makeDirectoryAsync).not.toHaveBeenCalled();
    });

    it('ha de llançar error si la inicialització falla', async () => {
      // Arrange
      const error = new Error('Permission denied');
      FileSystem.getInfoAsync.mockRejectedValue(error);

      // Act & Assert
      await expect(MapCacheService.initializeCache()).rejects.toThrow('Permission denied');
      expect(logApi).toHaveBeenCalledWith('ERROR', expect.stringContaining('Error initializing cache directory'));
    });
  });

  describe('coordsToTile', () => {
    it('ha de convertir coordenades geogràfiques a tile correctament', () => {
      // Test amb coordenades dels Pirineus
      const result = MapCacheService.coordsToTile(42.5, 1.5, 10);
      
      expect(result).toHaveProperty('x');
      expect(result).toHaveProperty('y');
      expect(result).toHaveProperty('z');
      expect(result.z).toBe(10);
      expect(typeof result.x).toBe('number');
      expect(typeof result.y).toBe('number');
    });

    it('ha de funcionar amb coordenades negatives (longitud oest)', () => {
      const result = MapCacheService.coordsToTile(42.0, -1.5, 10);
      
      expect(result.z).toBe(10);
      expect(result.x).toBeGreaterThanOrEqual(0);
      expect(result.y).toBeGreaterThanOrEqual(0);
    });

    it('ha de generar tiles diferents per diferents nivells de zoom', () => {
      const lat = 42.5;
      const lon = 1.5;
      
      const zoom8 = MapCacheService.coordsToTile(lat, lon, 8);
      const zoom12 = MapCacheService.coordsToTile(lat, lon, 12);
      const zoom16 = MapCacheService.coordsToTile(lat, lon, 16);
      
      expect(zoom8.z).toBe(8);
      expect(zoom12.z).toBe(12);
      expect(zoom16.z).toBe(16);
      
      // Zoom més alt = més tiles (coordenades més grans)
      expect(zoom12.x).toBeGreaterThan(zoom8.x);
      expect(zoom16.x).toBeGreaterThan(zoom12.x);
    });

    it('ha de funcionar amb coordenades extremes', () => {
      // Polo Nord
      const north = MapCacheService.coordsToTile(85.0, 0, 10);
      expect(north).toHaveProperty('x');
      expect(north).toHaveProperty('y');
      
      // Ecuator
      const equator = MapCacheService.coordsToTile(0, 0, 10);
      expect(equator).toHaveProperty('x');
      expect(equator).toHaveProperty('y');
    });
  });

  describe('getTilesForBounds', () => {
    it('ha de retornar una llista de tiles per un àrea simple', () => {
      // Arrange
      const bounds = {
        north: 42.6,
        south: 42.4,
        east: 1.6,
        west: 1.4
      };

      // Act
      const tiles = MapCacheService.getTilesForBounds(bounds, 10, 10);

      // Assert
      expect(Array.isArray(tiles)).toBe(true);
      expect(tiles.length).toBeGreaterThan(0);
      tiles.forEach(tile => {
        expect(tile).toHaveProperty('x');
        expect(tile).toHaveProperty('y');
        expect(tile).toHaveProperty('z');
        expect(tile.z).toBe(10);
      });
    });

    it('ha de retornar més tiles per múltiples nivells de zoom', () => {
      // Arrange
      const bounds = {
        north: 42.6,
        south: 42.4,
        east: 1.6,
        west: 1.4
      };

      // Act
      const singleZoom = MapCacheService.getTilesForBounds(bounds, 10, 10);
      const multiZoom = MapCacheService.getTilesForBounds(bounds, 10, 12);

      // Assert
      expect(multiZoom.length).toBeGreaterThan(singleZoom.length);
    });

    it('ha de generar tiles per tots els nivells de zoom especificats', () => {
      // Arrange
      const bounds = {
        north: 42.6,
        south: 42.4,
        east: 1.6,
        west: 1.4
      };

      // Act
      const tiles = MapCacheService.getTilesForBounds(bounds, 8, 10);

      // Assert
      const zoomLevels = new Set(tiles.map(t => t.z));
      expect(zoomLevels.has(8)).toBe(true);
      expect(zoomLevels.has(9)).toBe(true);
      expect(zoomLevels.has(10)).toBe(true);
    });

    it('ha de funcionar amb els bounds dels Pirineus', () => {
      // Act
      const tiles = MapCacheService.getTilesForBounds(
        MapCacheService.PYRENEES_BOUNDS,
        8,
        10
      );

      // Assert
      expect(tiles.length).toBeGreaterThan(0);
      expect(tiles.every(t => t.z >= 8 && t.z <= 10)).toBe(true);
    });

    it('ha de retornar array buit si bounds són invàlids (nord < sud)', () => {
      // Arrange
      const invalidBounds = {
        north: 42.0,
        south: 43.0, // Sud més al nord que nord - invàlid
        east: 2.0,
        west: 1.0
      };

      // Act
      const tiles = MapCacheService.getTilesForBounds(invalidBounds, 10, 10);

      // Assert
      expect(tiles.length).toBe(0);
    });
  });

  describe('downloadTile', () => {
    const mockTile = { x: 100, y: 200, z: 10 };

    it('ha de descarregar un tile correctament', async () => {
      // Arrange
      FileSystem.getInfoAsync
        .mockResolvedValueOnce({ // Primera crida: comprovar si existeix
          exists: false,
          isDirectory: false,
          uri: '',
          size: 0,
          modificationTime: 0
        })
        .mockResolvedValueOnce({ // Segona crida: verificar descàrrega
          exists: true,
          isDirectory: false,
          uri: `${mockCacheDir}10_100_200.png`,
          size: 5000,
          modificationTime: Date.now()
        });

      FileSystem.downloadAsync.mockResolvedValue({
        uri: `${mockCacheDir}10_100_200.png`,
        status: 200,
        headers: {},
        md5: 'mock-md5'
      });

      // Act
      const result = await MapCacheService.downloadTile(mockTile);

      // Assert
      expect(result).toBe(true);
      expect(FileSystem.downloadAsync).toHaveBeenCalledWith(
        'https://a.tile.opentopomap.org/10/100/200.png',
        `${mockCacheDir}10_100_200.png`
      );
      expect(FileSystem.getInfoAsync).toHaveBeenCalledTimes(2);
    });

    it('ha de retornar true si el tile ja existeix', async () => {
      // Arrange
      FileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        isDirectory: false,
        uri: `${mockCacheDir}10_100_200.png`,
        size: 5000,
        modificationTime: Date.now()
      });

      // Act
      const result = await MapCacheService.downloadTile(mockTile);

      // Assert
      expect(result).toBe(true);
      expect(FileSystem.downloadAsync).not.toHaveBeenCalled();
    });

    it('ha de retornar false si la descàrrega falla', async () => {
      // Arrange
      FileSystem.getInfoAsync
        .mockResolvedValueOnce({
          exists: false,
          isDirectory: false,
          uri: '',
          size: 0,
          modificationTime: 0
        })
        .mockResolvedValueOnce({
          exists: false, // Descàrrega fallida
          isDirectory: false,
          uri: '',
          size: 0,
          modificationTime: 0
        });

      FileSystem.downloadAsync.mockResolvedValue({
        uri: '',
        status: 404,
        headers: {},
        md5: ''
      });

      // Act
      const result = await MapCacheService.downloadTile(mockTile);

      // Assert
      expect(result).toBe(false);
    });

    it('ha de retornar false si el fitxer descarregat té mida 0', async () => {
      // Arrange
      FileSystem.getInfoAsync
        .mockResolvedValueOnce({
          exists: false,
          isDirectory: false,
          uri: '',
          size: 0,
          modificationTime: 0
        })
        .mockResolvedValueOnce({
          exists: true,
          isDirectory: false,
          uri: `${mockCacheDir}10_100_200.png`,
          size: 0, // Mida 0 = descàrrega invàlida
          modificationTime: Date.now()
        });

      FileSystem.downloadAsync.mockResolvedValue({
        uri: `${mockCacheDir}10_100_200.png`,
        status: 200,
        headers: {},
        md5: ''
      });

      // Act
      const result = await MapCacheService.downloadTile(mockTile);

      // Assert
      expect(result).toBe(false);
    });

    it('ha de gestionar errors de xarxa durant la descàrrega', async () => {
      // Arrange
      FileSystem.getInfoAsync.mockResolvedValue({
        exists: false,
        isDirectory: false,
        uri: '',
        size: 0,
        modificationTime: 0
      });

      const networkError = new Error('Network connection failed');
      FileSystem.downloadAsync.mockRejectedValue(networkError);

      // Act
      const result = await MapCacheService.downloadTile(mockTile);

      // Assert
      expect(result).toBe(false);
      expect(logApi).toHaveBeenCalledWith(
        'ERROR',
        expect.stringContaining('Error downloading tile')
      );
    });
  });

  describe('downloadTilesForArea', () => {
    beforeEach(() => {
      // Reset all mocks before each test
      jest.clearAllMocks();
      
      FileSystem.getInfoAsync.mockResolvedValue({
        exists: false,
        isDirectory: false,
        uri: '',
        size: 0,
        modificationTime: 0
      });
      FileSystem.makeDirectoryAsync.mockResolvedValue(undefined);
      FileSystem.downloadAsync.mockResolvedValue({
        uri: '',
        status: 200,
        headers: {},
        md5: ''
      });
      mockedAsyncStorage.setItem.mockResolvedValue(undefined);
    });

    it('ha de descarregar tots els tiles d\'una àrea amb èxit', async () => {
      // Arrange
      const smallBounds = {
        north: 42.55,
        south: 42.45,
        east: 1.55,
        west: 1.45
      };

      FileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        isDirectory: false,
        uri: '',
        size: 5000,
        modificationTime: Date.now()
      });

      const onProgress = jest.fn();
      const onComplete = jest.fn();

      // Act
      const result = await MapCacheService.downloadTilesForArea(
        smallBounds,
        10,
        10,
        onProgress,
        onComplete
      );

      // Assert
      expect(result).toBe(true);
      expect(onProgress).toHaveBeenCalled();
      expect(onComplete).toHaveBeenCalledWith(true);
      expect(logApi).toHaveBeenCalledWith('CACHE', expect.stringContaining('Starting download'));
      expect(logApi).toHaveBeenCalledWith('CACHE', expect.stringContaining('Download complete'));
    }, 30000);

    it('ha d\'informar del progrés durant la descàrrega', async () => {
      // Arrange
      const smallBounds = {
        north: 42.52,
        south: 42.48,
        east: 1.52,
        west: 1.48
      };

      FileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        isDirectory: false,
        uri: '',
        size: 5000,
        modificationTime: Date.now()
      });

      const onProgress = jest.fn();

      // Act
      await MapCacheService.downloadTilesForArea(
        smallBounds,
        10,
        10,
        onProgress
      );

      // Assert
      expect(onProgress).toHaveBeenCalled();
      const lastCall = onProgress.mock.calls[onProgress.mock.calls.length - 1];
      const [downloaded, total, percentage] = lastCall;
      
      expect(downloaded).toBe(total);
      expect(percentage).toBe(100);
    }, 15000);

    it('ha de guardar metadata durant la descàrrega', async () => {
      // Arrange
      const smallBounds = {
        north: 42.52,
        south: 42.48,
        east: 1.52,
        west: 1.48
      };

      FileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        isDirectory: false,
        uri: '',
        size: 5000,
        modificationTime: Date.now()
      });

      // Act
      await MapCacheService.downloadTilesForArea(smallBounds, 10, 10);

      // Assert
      expect(mockedAsyncStorage.setItem).toHaveBeenCalled();
      // Find the call that saves metadata (key = 'map_cache_metadata')
      const metadataCall = mockedAsyncStorage.setItem.mock.calls.find(
        (call) => call[0] === 'map_cache_metadata'
      );
      expect(metadataCall).toBeDefined();
      const savedMetadata = JSON.parse(metadataCall![1]);
      
      expect(savedMetadata).toMatchObject({
        version: '1.0.0',
        bounds: smallBounds,
        minZoom: 10,
        maxZoom: 10
      });
      expect(savedMetadata.isComplete).toBeDefined();
    }, 15000);

    it('ha de gestionar descàrregues parcials', async () => {
      // Arrange
      const smallBounds = {
        north: 42.52,
        south: 42.48,
        east: 1.52,
        west: 1.48
      };

      FileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        isDirectory: false,
        uri: '',
        size: 5000,
        modificationTime: Date.now()
      });

      // Act
      const result = await MapCacheService.downloadTilesForArea(
        smallBounds,
        10,
        10
      );

      // Assert
      expect(typeof result).toBe('boolean');
      expect(mockedAsyncStorage.setItem).toHaveBeenCalled();
    }, 15000);

    it('ha de gestionar errors durant la descàrrega', async () => {
      // Arrange
      const error = new Error('Disk full');
      FileSystem.getInfoAsync.mockRejectedValue(error);

      const onComplete = jest.fn();

      // Act
      const result = await MapCacheService.downloadTilesForArea(
        MapCacheService.PYRENEES_BOUNDS,
        10,
        10,
        undefined,
        onComplete
      );

      // Assert
      expect(result).toBe(false);
      expect(onComplete).toHaveBeenCalledWith(false);
      expect(logApi).toHaveBeenCalledWith('ERROR', expect.stringContaining('Error downloading tiles'));
    });

    it('ha d\'utilitzar els bounds dels Pirineus per defecte', async () => {
      // Arrange
      FileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        isDirectory: false,
        uri: '',
        size: 5000,
        modificationTime: Date.now()
      });

      // Act - with reduced zoom to speed up test
      await MapCacheService.downloadTilesForArea(
        MapCacheService.PYRENEES_BOUNDS,
        8,
        9
      );

      // Assert
      // Find the call that saves metadata (key = 'map_cache_metadata')
      const metadataCall = mockedAsyncStorage.setItem.mock.calls.find(
        (call) => call[0] === 'map_cache_metadata'
      );
      expect(metadataCall).toBeDefined();
      const savedMetadata = JSON.parse(metadataCall![1]);
      expect(savedMetadata.bounds).toEqual(MapCacheService.PYRENEES_BOUNDS);
      expect(savedMetadata.minZoom).toBe(8);
      expect(savedMetadata.maxZoom).toBe(9);
    }, 30000);
  });

  describe('hasTile', () => {
    it('ha de retornar true si el tile existeix', async () => {
      // Arrange
      const tile = { x: 100, y: 200, z: 10 };
      FileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        isDirectory: false,
        uri: `${mockCacheDir}10_100_200.png`,
        size: 5000,
        modificationTime: Date.now()
      });

      // Act
      const result = await MapCacheService.hasTile(tile);

      // Assert
      expect(result).toBe(true);
    });

    it('ha de retornar false si el tile no existeix', async () => {
      // Arrange
      const tile = { x: 100, y: 200, z: 10 };
      FileSystem.getInfoAsync.mockResolvedValue({
        exists: false,
        isDirectory: false,
        uri: '',
        size: 0,
        modificationTime: 0
      });

      // Act
      const result = await MapCacheService.hasTile(tile);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getTileLocalPath', () => {
    it('ha de retornar la ruta local correcta', () => {
      // Arrange
      const tile = { x: 100, y: 200, z: 10 };

      // Act
      const path = MapCacheService.getTileLocalPath(tile);

      // Assert
      expect(path).toBe(`${mockCacheDir}10_100_200.png`);
    });

    it('ha de generar rutes diferents per tiles diferents', () => {
      // Arrange
      const tile1 = { x: 100, y: 200, z: 10 };
      const tile2 = { x: 101, y: 200, z: 10 };
      const tile3 = { x: 100, y: 200, z: 11 };

      // Act
      const path1 = MapCacheService.getTileLocalPath(tile1);
      const path2 = MapCacheService.getTileLocalPath(tile2);
      const path3 = MapCacheService.getTileLocalPath(tile3);

      // Assert
      expect(path1).not.toBe(path2);
      expect(path1).not.toBe(path3);
      expect(path2).not.toBe(path3);
    });
  });

  describe('getTileUrl', () => {
    it('ha de retornar URL local si el tile existeix en cache', async () => {
      // Arrange
      const tile = { x: 100, y: 200, z: 10 };
      FileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        isDirectory: false,
        uri: `${mockCacheDir}10_100_200.png`,
        size: 5000,
        modificationTime: Date.now()
      });

      // Act
      const url = await MapCacheService.getTileUrl(tile);

      // Assert
      expect(url).toBe(`${mockCacheDir}10_100_200.png`);
    });

    it('ha de retornar URL online si el tile no existeix en cache', async () => {
      // Arrange
      const tile = { x: 100, y: 200, z: 10 };
      FileSystem.getInfoAsync.mockResolvedValue({
        exists: false,
        isDirectory: false,
        uri: '',
        size: 0,
        modificationTime: 0
      });

      // Act
      const url = await MapCacheService.getTileUrl(tile);

      // Assert
      expect(url).toBe('https://a.tile.opentopomap.org/10/100/200.png');
    });
  });

  describe('saveMetadata', () => {
    it('ha de guardar metadata correctament', async () => {
      // Arrange
      const metadata = {
        version: '1.0.0',
        downloadDate: new Date().toISOString(),
        bounds: MapCacheService.PYRENEES_BOUNDS,
        minZoom: 8,
        maxZoom: 14,
        totalTiles: 1000,
        downloadedTiles: 500,
        isComplete: false
      };

      mockedAsyncStorage.setItem.mockResolvedValue(undefined);

      // Act
      await MapCacheService.saveMetadata(metadata);

      // Assert
      expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
        'map_cache_metadata',
        JSON.stringify(metadata)
      );
    });

    it('ha de gestionar errors al guardar metadata', async () => {
      // Arrange
      const metadata = {
        version: '1.0.0',
        downloadDate: new Date().toISOString(),
        bounds: MapCacheService.PYRENEES_BOUNDS,
        minZoom: 8,
        maxZoom: 14,
        totalTiles: 1000,
        downloadedTiles: 500,
        isComplete: false
      };

      const error = new Error('Storage quota exceeded');
      mockedAsyncStorage.setItem.mockRejectedValue(error);

      // Act
      await MapCacheService.saveMetadata(metadata);

      // Assert
      expect(logApi).toHaveBeenCalledWith('ERROR', expect.stringContaining('Error saving cache metadata'));
    });
  });

  describe('getMetadata', () => {
    it('ha de retornar metadata guardada', async () => {
      // Arrange
      const metadata = {
        version: '1.0.0',
        downloadDate: '2024-01-01T00:00:00.000Z',
        bounds: MapCacheService.PYRENEES_BOUNDS,
        minZoom: 8,
        maxZoom: 14,
        totalTiles: 1000,
        downloadedTiles: 1000,
        isComplete: true
      };

      mockedAsyncStorage.getItem.mockResolvedValue(JSON.stringify(metadata));

      // Act
      const result = await MapCacheService.getMetadata();

      // Assert
      expect(result).toEqual(metadata);
    });

    it('ha de retornar null si no hi ha metadata', async () => {
      // Arrange
      mockedAsyncStorage.getItem.mockResolvedValue(null);

      // Act
      const result = await MapCacheService.getMetadata();

      // Assert
      expect(result).toBeNull();
    });

    it('ha de gestionar errors al llegir metadata', async () => {
      // Arrange
      const error = new Error('Storage corrupted');
      mockedAsyncStorage.getItem.mockRejectedValue(error);

      // Act
      const result = await MapCacheService.getMetadata();

      // Assert
      expect(result).toBeNull();
      expect(logApi).toHaveBeenCalledWith('ERROR', expect.stringContaining('Error getting cache metadata'));
    });
  });

  describe('clearCache', () => {
    it('ha d\'eliminar el directori de cache i metadata', async () => {
      // Arrange
      FileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        isDirectory: true,
        uri: mockCacheDir,
        size: 100000,
        modificationTime: Date.now()
      });
      FileSystem.deleteAsync.mockResolvedValue(undefined);
      mockedAsyncStorage.removeItem.mockResolvedValue(undefined);

      // Act
      await MapCacheService.clearCache();

      // Assert
      expect(FileSystem.deleteAsync).toHaveBeenCalledWith(mockCacheDir);
      expect(mockedAsyncStorage.removeItem).toHaveBeenCalledWith('map_cache_metadata');
      expect(logApi).toHaveBeenCalledWith('CACHE', 'Cache cleared successfully');
    });

    it('no ha d\'intentar eliminar si el directori no existeix', async () => {
      // Arrange
      FileSystem.getInfoAsync.mockResolvedValue({
        exists: false,
        isDirectory: false,
        uri: '',
        size: 0,
        modificationTime: 0
      });
      mockedAsyncStorage.removeItem.mockResolvedValue(undefined);

      // Act
      await MapCacheService.clearCache();

      // Assert
      expect(FileSystem.deleteAsync).not.toHaveBeenCalled();
      expect(mockedAsyncStorage.removeItem).toHaveBeenCalled();
    });

    it('ha de gestionar errors durant l\'eliminació', async () => {
      // Arrange
      const error = new Error('Permission denied');
      FileSystem.getInfoAsync.mockRejectedValue(error);

      // Act
      await MapCacheService.clearCache();

      // Assert
      expect(logApi).toHaveBeenCalledWith('ERROR', expect.stringContaining('Error clearing cache'));
    });
  });

  describe('getCacheStatus', () => {
    it('ha de retornar l\'estat complet del cache', async () => {
      // Arrange
      const metadata = {
        version: '1.0.0',
        downloadDate: '2024-01-01T00:00:00.000Z',
        bounds: MapCacheService.PYRENEES_BOUNDS,
        minZoom: 8,
        maxZoom: 14,
        totalTiles: 1000,
        downloadedTiles: 1000,
        isComplete: true
      };

      mockedAsyncStorage.getItem.mockResolvedValue(JSON.stringify(metadata));
      
      FileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        isDirectory: true,
        uri: mockCacheDir,
        size: 1000000,
        modificationTime: Date.now()
      });

      FileSystem.readDirectoryAsync.mockResolvedValue([
        '10_100_200.png',
        '10_101_200.png',
        '11_200_400.png'
      ]);

      FileSystem.getInfoAsync
        .mockResolvedValueOnce({ // directori
          exists: true,
          isDirectory: true,
          uri: mockCacheDir,
          size: 1000000,
          modificationTime: Date.now()
        })
        .mockResolvedValueOnce({ // fitxer 1
          exists: true,
          isDirectory: false,
          uri: `${mockCacheDir}10_100_200.png`,
          size: 5000,
          modificationTime: Date.now()
        })
        .mockResolvedValueOnce({ // fitxer 2
          exists: true,
          isDirectory: false,
          uri: `${mockCacheDir}10_101_200.png`,
          size: 5500,
          modificationTime: Date.now()
        })
        .mockResolvedValueOnce({ // fitxer 3
          exists: true,
          isDirectory: false,
          uri: `${mockCacheDir}11_200_400.png`,
          size: 6000,
          modificationTime: Date.now()
        });

      // Act
      const status = await MapCacheService.getCacheStatus();

      // Assert
      expect(status.isInitialized).toBe(true);
      expect(status.metadata).toEqual(metadata);
      expect(status.sizeInMB).toBeGreaterThan(0);
    });

    it('ha de retornar estat no inicialitzat si el directori no existeix', async () => {
      // Arrange
      mockedAsyncStorage.getItem.mockResolvedValue(null);
      FileSystem.getInfoAsync.mockResolvedValue({
        exists: false,
        isDirectory: false,
        uri: '',
        size: 0,
        modificationTime: 0
      });

      // Act
      const status = await MapCacheService.getCacheStatus();

      // Assert
      expect(status.isInitialized).toBe(false);
      expect(status.metadata).toBeNull();
      expect(status.sizeInMB).toBe(0);
    });

    it('ha de gestionar errors al calcular la mida', async () => {
      // Arrange
      mockedAsyncStorage.getItem.mockResolvedValue(null);
      FileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        isDirectory: true,
        uri: mockCacheDir,
        size: 1000000,
        modificationTime: Date.now()
      });

      const error = new Error('Cannot read directory');
      FileSystem.readDirectoryAsync.mockRejectedValue(error);

      // Act
      const status = await MapCacheService.getCacheStatus();

      // Assert
      expect(status.isInitialized).toBe(true);
      expect(status.sizeInMB).toBe(0);
      expect(logApi).toHaveBeenCalledWith('ERROR', expect.stringContaining('Error calculating cache size'));
    });

    it('ha de gestionar errors generals', async () => {
      // Arrange
      const error = new Error('Storage unavailable');
      mockedAsyncStorage.getItem.mockRejectedValue(error);

      // Act
      const status = await MapCacheService.getCacheStatus();

      // Assert - Encara pot retornar algunes dades malgrat l'error
      expect(status).toBeDefined();
      expect(status.metadata).toBeNull();
      expect(logApi).toHaveBeenCalledWith('ERROR', expect.stringContaining('Error getting cache metadata'));
    });
  });

  describe('Constants', () => {
    it('ha de tenir definits els bounds dels Pirineus', () => {
      expect(MapCacheService.PYRENEES_BOUNDS).toBeDefined();
      expect(MapCacheService.PYRENEES_BOUNDS.north).toBeGreaterThan(MapCacheService.PYRENEES_BOUNDS.south);
      expect(MapCacheService.PYRENEES_BOUNDS.east).toBeGreaterThan(MapCacheService.PYRENEES_BOUNDS.west);
    });
  });
});

