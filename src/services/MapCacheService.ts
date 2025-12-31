import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logApi } from './fetchWithLog';

interface TileBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface TileCoord {
  x: number;
  y: number;
  z: number;
}

interface CacheMetadata {
  version: string;
  downloadDate: string;
  bounds: TileBounds;
  minZoom: number;
  maxZoom: number;
  totalTiles: number;
  downloadedTiles: number;
  isComplete: boolean;
  refugesCount?: number;
}

interface BasicRefugeInfo {
  id: string;
  name: string;
  surname?: string | null;
  coord: { lat: number; long: number };
  geohash?: string;
}

export class MapCacheService {
  private static readonly CACHE_DIR = `${FileSystem.documentDirectory!}map_cache/`;
  private static readonly METADATA_KEY = 'map_cache_metadata';
  private static readonly REFUGES_KEY = 'map_cache_refuges';
  private static readonly TILE_SERVER = 'https://a.tile.opentopomap.org';
  private static readonly API_BASE_URL = 'https://refugislliures-backend.onrender.com/api';
  
  // Bounds dels Pirineus (Espanya i França)
  public static readonly PYRENEES_BOUNDS: TileBounds = {
    north: 43.5,
    south: 41.5,
    east: 3.5,
    west: -2.5
  };

  /**
   * Inicialitza el directori de cache
   */
  static async initializeCache(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.CACHE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.CACHE_DIR, { intermediates: true });
      }
    } catch (error) {
      logApi('ERROR', `Error initializing cache directory: ${error}`);
      throw error;
    }
  }

  /**
   * Converteix coordenades geogràfiques a coordenades de tile
   */
  static coordsToTile(lat: number, lon: number, zoom: number): TileCoord {
    const x = Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
    const y = Math.floor(
      ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
        Math.pow(2, zoom)
    );
    return { x, y, z: zoom };
  }

  /**
   * Obté la llista de tots els tiles necessaris per una àrea
   */
  static getTilesForBounds(bounds: TileBounds, minZoom: number, maxZoom: number): TileCoord[] {
    const tiles: TileCoord[] = [];
    
    for (let z = minZoom; z <= maxZoom; z++) {
      const topLeft = this.coordsToTile(bounds.north, bounds.west, z);
      const bottomRight = this.coordsToTile(bounds.south, bounds.east, z);
      
      for (let x = topLeft.x; x <= bottomRight.x; x++) {
        for (let y = topLeft.y; y <= bottomRight.y; y++) {
          tiles.push({ x, y, z });
        }
      }
    }
    
    return tiles;
  }

  /**
   * Descarrega un tile individual
   */
  static async downloadTile(tile: TileCoord): Promise<boolean> {
    try {
      const tileUrl = `${this.TILE_SERVER}/${tile.z}/${tile.x}/${tile.y}.png`;
      const tilePath = `${this.CACHE_DIR}${tile.z}_${tile.x}_${tile.y}.png`;
      
      // Comprovar si ja existeix
      const fileInfo = await FileSystem.getInfoAsync(tilePath);
      if (fileInfo.exists) {
        return true;
      }

      // Descarregar el tile
      const downloadResult = await FileSystem.downloadAsync(tileUrl, tilePath);
      
      // Verificar si la descàrrega ha estat exitosa
      const downloadedInfo = await FileSystem.getInfoAsync(tilePath);
      return downloadedInfo.exists && downloadedInfo.size! > 0;
    } catch (error) {
      logApi('ERROR', `Error downloading tile ${tile.z}/${tile.x}/${tile.y}: ${error}`);
      return false;
    }
  }

  /**
   * Descarrega tots els tiles per una àrea amb callback de progrés
   */
  static async downloadTilesForArea(
    bounds: TileBounds = this.PYRENEES_BOUNDS,
    minZoom: number = 6,
    maxZoom: number = 14,
    onProgress?: (downloaded: number, total: number, percentage: number) => void,
    onComplete?: (success: boolean) => void
  ): Promise<boolean> {
    try {
      await this.initializeCache();
      
      const tiles = this.getTilesForBounds(bounds, minZoom, maxZoom);
      const totalTiles = tiles.length;
      let downloadedTiles = 0;
      let successfulDownloads = 0;

  logApi('CACHE', `Starting download of ${totalTiles} tiles for zoom levels ${minZoom}-${maxZoom}`);

      // Descarregar refugis primer
      logApi('CACHE', 'Downloading refuges list...');
      const refugesDownloaded = await this.downloadRefuges();
      const refugesCount = refugesDownloaded ? (await this.getOfflineRefuges())?.length || 0 : 0;
      logApi('CACHE', `Refuges downloaded: ${refugesCount}`);

      // Crear metadata inicial
      const metadata: CacheMetadata = {
        version: '1.0.0',
        downloadDate: new Date().toISOString(),
        bounds,
        minZoom,
        maxZoom,
        totalTiles,
        downloadedTiles: 0,
        isComplete: false,
        refugesCount
      };

      await this.saveMetadata(metadata);

      // Descarregar tiles en petits lots per evitar sobrecarregar
      const batchSize = 5;
      for (let i = 0; i < tiles.length; i += batchSize) {
        const batch = tiles.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (tile) => {
          const success = await this.downloadTile(tile);
          if (success) successfulDownloads++;
          downloadedTiles++;
          
          // Actualitzar progrés
          const percentage = (downloadedTiles / totalTiles) * 100;
          onProgress?.(downloadedTiles, totalTiles, percentage);
          
          return success;
        });

        await Promise.all(batchPromises);

        // Actualitzar metadata cada lot
        metadata.downloadedTiles = downloadedTiles;
        await this.saveMetadata(metadata);

        // Petit delay per no sobrecarregar el servidor
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Finalitzar
      metadata.isComplete = successfulDownloads === totalTiles;
      await this.saveMetadata(metadata);

  logApi('CACHE', `Download complete: ${successfulDownloads}/${totalTiles} tiles downloaded`);
      onComplete?.(metadata.isComplete);
      
      return metadata.isComplete;
    } catch (error) {
      logApi('ERROR', `Error downloading tiles: ${error}`);
      onComplete?.(false);
      return false;
    }
  }

  /**
   * Comprova si un tile existeix en cache
   */
  static async hasTile(tile: TileCoord): Promise<boolean> {
    const tilePath = `${this.CACHE_DIR}${tile.z}_${tile.x}_${tile.y}.png`;
    const fileInfo = await FileSystem.getInfoAsync(tilePath);
    return fileInfo.exists;
  }

  /**
   * Obté la ruta local d'un tile
   */
  static getTileLocalPath(tile: TileCoord): string {
    return `${this.CACHE_DIR}${tile.z}_${tile.x}_${tile.y}.png`;
  }

  /**
   * Obté la URL d'un tile (local si existeix, sinó online)
   */
  static async getTileUrl(tile: TileCoord): Promise<string> {
    const hasLocal = await this.hasTile(tile);
    if (hasLocal) {
      return this.getTileLocalPath(tile);
    }
    return `${this.TILE_SERVER}/${tile.z}/${tile.x}/${tile.y}.png`;
  }

  /**
   * Guarda metadata de cache
   */
  static async saveMetadata(metadata: CacheMetadata): Promise<void> {
    try {
      await AsyncStorage.setItem(this.METADATA_KEY, JSON.stringify(metadata));
    } catch (error) {
      logApi('ERROR', `Error saving cache metadata: ${error}`);
    }
  }

  /**
   * Obté metadata de cache
   */
  static async getMetadata(): Promise<CacheMetadata | null> {
    try {
      const data = await AsyncStorage.getItem(this.METADATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logApi('ERROR', `Error getting cache metadata: ${error}`);
      return null;
    }
  }

  /**
   * Elimina tot el cache
   */
  static async clearCache(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.CACHE_DIR);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(this.CACHE_DIR);
      }
      await AsyncStorage.removeItem(this.METADATA_KEY);
      await AsyncStorage.removeItem(this.REFUGES_KEY);
  logApi('CACHE', 'Cache cleared successfully');
    } catch (error) {
      logApi('ERROR', `Error clearing cache: ${error}`);
    }
  }

  /**
   * Obté l'estat del cache
   */
  static async getCacheStatus(): Promise<{
    isInitialized: boolean;
    metadata: CacheMetadata | null;
    sizeInMB: number;
  }> {
    try {
      const metadata = await this.getMetadata();
      const dirInfo = await FileSystem.getInfoAsync(this.CACHE_DIR);
      let sizeInMB = 0;

      if (dirInfo.exists) {
        // Calcular mida del directori sumant tots els fitxers
        try {
          const files = await FileSystem.readDirectoryAsync(this.CACHE_DIR);
          for (const file of files) {
            const fileInfo = await FileSystem.getInfoAsync(`${this.CACHE_DIR}${file}`);
            if (fileInfo.exists && fileInfo.size) {
              sizeInMB += fileInfo.size;
            }
          }
          sizeInMB = sizeInMB / (1024 * 1024);
        } catch (error) {
          logApi('ERROR', `Error calculating cache size: ${error}`);
        }
      }

      return {
        isInitialized: dirInfo.exists,
        metadata,
        sizeInMB
      };
    } catch (error) {
      logApi('ERROR', `Error getting cache status: ${error}`);
      return {
        isInitialized: false,
        metadata: null,
        sizeInMB: 0
      };
    }
  }

  /**
   * Descarrega la llista bàsica de tots els refugis
   */
  static async downloadRefuges(): Promise<boolean> {
    try {
      const url = `${this.API_BASE_URL}/refuges/`;
      const response = await fetch(url);
      
      if (!response.ok) {
        logApi('ERROR', `Error downloading refuges: ${response.status}`);
        return false;
      }
      
      const data = await response.json();
      
      if (!data || !data.results || !Array.isArray(data.results)) {
        logApi('ERROR', 'Invalid refuges data structure');
        return false;
      }

      // Extreure només la informació bàsica
      const basicRefuges: BasicRefugeInfo[] = data.results.map((refuge: any) => ({
        id: refuge.id,
        name: refuge.name,
        surname: refuge.surname || null,
        coord: {
          lat: refuge.coord?.lat || 0,
          long: refuge.coord?.long || 0
        },
        geohash: refuge.geohash || null
      }));

      // Guardar a AsyncStorage
      await AsyncStorage.setItem(this.REFUGES_KEY, JSON.stringify(basicRefuges));
      logApi('CACHE', `Saved ${basicRefuges.length} refuges to offline cache`);
      
      return true;
    } catch (error) {
      logApi('ERROR', `Error downloading refuges: ${error}`);
      return false;
    }
  }

  /**
   * Obté la llista de refugis descarregats offline
   */
  static async getOfflineRefuges(): Promise<BasicRefugeInfo[] | null> {
    try {
      const data = await AsyncStorage.getItem(this.REFUGES_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logApi('ERROR', `Error getting offline refuges: ${error}`);
      return null;
    }
  }
}