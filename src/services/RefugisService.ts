import { Location } from '../types';
import { mockLocations } from '../utils/mockData';
import { RefugisResponseDTO, RefugisSimpleResponseDTO } from './dto/RefugiDTO';
import { mapRefugisFromDTO } from './mappers/RefugiMapper';
import { fetchWithLog, logApi } from './fetchWithLog';

const API_BASE_URL = 'https://refugislliures-backend.onrender.com/api';

const DEBUG = false;

export class RefugisService {
  // Simple in-memory cache of the last full refugis result (mapped to Location[])
  private static cachedRefugis: Location[] | null = null;

  /**
   * Returns the cached refugis if any
   */
  static getCachedRefugis(): Location[] | null {
    return this.cachedRefugis;
  }

  /**
   * Get a single refugi by id. First tries the in-memory cache populated by getRefugis().
   * If not found, falls back to calling the detail endpoint `/refugis/<id>/`.
   */
  static async getRefugiById(id: number): Promise<Location | null> {
    // Intentionally not logging here: API logs are emitted via fetchWithLog/logApi
    if (this.cachedRefugis) {
      const found = this.cachedRefugis.find(r => r.id === id);
      if (found) {
        // We know the id from cache; still fetch the detail endpoint to get
        // the most complete/latest data. If the network call fails, return
        // the cached version as a graceful fallback.
        logApi('CACHE', `getRefugiById ${id} - hit (will fetch detail)`);
        try {
          const url = `${API_BASE_URL}/refugis/${id}/`;
          logApi('GET', url);
          const response = await fetchWithLog(url);
          if (response.ok) {
            const data = await response.json();
            const mapped = mapRefugisFromDTO([data]);
            return mapped.length > 0 ? mapped[0] : found;
          } else {
            // Non-ok response, fallback to cached
            logApi('ERROR', `detail fetch status=${response.status}`);
            return found;
          }
        } catch (err) {
          logApi('ERROR', `getRefugiById ${id} detail fetch failed, returning cached`);
          return found;
        }
      }
      logApi('CACHE', `getRefugiById ${id} - miss`);
    }

    if (DEBUG) {
      // In debug mode, try to find in mock data
      const mock = mockLocations.find(m => m.id === id);
      return mock || null;
    }

    try {
      const url = `${API_BASE_URL}/refugis/${id}/`;
      logApi('GET', url);
      const response = await fetchWithLog(url);
      if (!response.ok) return null;
      const data = await response.json();
      // data should be a RefugiDTO
      const mapped = mapRefugisFromDTO([data]);
      return mapped.length > 0 ? mapped[0] : null;
    } catch (err) {
      logApi('ERROR', `getRefugiById ${id} failed`);
      return null;
    }
  }
  /**
   * Obté tots els refugis amb filtres opcionals
   */
  static async getRefugis(filters?: {
    altitude_min?: number;
    altitude_max?: number;
    places_min?: number;
    places_max?: number;
    type?: string;
    condition?: string;
    search?: string;
  }): Promise<Location[]> {
    if (DEBUG){
      // Retornem dades simulades per a desenvolupament
      logApi('GET', `${API_BASE_URL}/refugis/ (mock)`, { filters });
      return mockLocations;
    }
    else {
      try {
        const params = new URLSearchParams();
        
        if (filters?.search) {
          params.append('name', filters.search);
        }
        else{
          if (filters?.altitude_min !== undefined) {
          params.append('altitude_min', filters.altitude_min.toString());
          }
          if (filters?.altitude_max !== undefined) {
              params.append('altitude_max', filters.altitude_max.toString());
          }
          if (filters?.places_min !== undefined) {
              params.append('places_min', filters.places_min.toString());
          }
          if (filters?.places_max !== undefined) {
              params.append('places_max', filters.places_max.toString());
          }
          if (filters?.type) {
              params.append('type', filters.type);
          }
          if (filters?.condition) {
              params.append('condition', filters.condition);
          }
        }

        const url = `${API_BASE_URL}/refugis/?${params.toString()}`;
        const response = await fetchWithLog(url);
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
  const data: RefugisResponseDTO | RefugisSimpleResponseDTO = await response.json();
        
        // Validem que la resposta té l'estructura esperada
        if (!data || typeof data !== 'object' || !('results' in data) || !Array.isArray(data.results)) {
          // Retornem array buit si el backend no retorna l'estructura esperada
          return [];
        }
        
  // Convertim els DTOs al format del frontend
  const mapped = mapRefugisFromDTO(data.results);
  // Store in simple in-memory cache so other parts can lookup by id without refetching all
  this.cachedRefugis = mapped;
  return mapped;
      } catch (error) {
        // En cas d'error de xarxa o servidor, rethrowem un error senzill sense
        // fer console.error per evitar missatges a la consola. Els cridants
        // manejaran l'error (p.ex. mostrant una alerta) i l'app continuarà.
        throw new Error('No s\'han pogut carregar els refugis');
      }
    }
  }

  /**
   * Obté els favorits de l'usuari
   * TODO: Implementar quan el backend tingui aquesta funcionalitat
   */
  static async getFavorites(): Promise<Location[]> {
    // Placeholder - retornar array buit fins que el backend estigui llest
    return [];
  }

  /**
   * Afegeix un refugi als favorits
   * TODO: Implementar quan el backend tingui aquesta funcionalitat
   */
  static async addFavorite(refugiId: number): Promise<void> {
    // Placeholder
    console.log('TODO: Add favorite', refugiId);
  }

  /**
   * Elimina un refugi dels favorits
   * TODO: Implementar quan el backend tingui aquesta funcionalitat
   */
  static async removeFavorite(refugiId: number): Promise<void> {
    // Placeholder
    console.log('TODO: Remove favorite', refugiId);
  }
}
