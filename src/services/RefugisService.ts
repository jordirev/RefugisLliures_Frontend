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
  // Map of in-flight detail requests keyed by refugi id to avoid duplicate
  // simultaneous network calls for the same resource.
  private static inFlightRequests: Map<number, Promise<Location | null>> = new Map();
  // In-flight Promise for the full refugis list (no filters) to dedupe
  // concurrent full-list requests.
  private static inFlightListRequest: Promise<Location[]> | null = null;

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
    // Quick trace to help detect whether this function is being invoked more
    // than once for the same id (prints a short caller snippet).
    // tracing removed: keep only API/cache logs (handled via fetchWithLog/logApi)
    // Intentionally not logging the network call here: API logs are emitted via fetchWithLog/logApi
    if (this.cachedRefugis) {
      const found = this.cachedRefugis.find(r => r.id === id);
      if (found) {
        // We know the id from cache; still fetch the detail endpoint to get
        // the most complete/latest data. If the network call fails, return
        // the cached version as a graceful fallback.
        logApi('CACHE', `getRefugiById ${id} - hit (will fetch detail)`);
        try {
          const url = `${API_BASE_URL}/refugis/${id}/`;

          // If there's already an in-flight request for this id, reuse it
          if (this.inFlightRequests.has(id)) {
            return await this.inFlightRequests.get(id)!;
          }

          const promise = (async (): Promise<Location | null> => {
            try {
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
              // On error, return cached fallback
              return found;
            } finally {
              this.inFlightRequests.delete(id);
            }
          })();

          this.inFlightRequests.set(id, promise);
          return await promise;
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

      // Deduplicate concurrent requests for same id
      if (this.inFlightRequests.has(id)) {
        return await this.inFlightRequests.get(id)!;
      }

      const promise = (async (): Promise<Location | null> => {
        try {
          const response = await fetchWithLog(url);
          if (!response.ok) return null;
          const data = await response.json();
          // data should be a RefugiDTO
          const mapped = mapRefugisFromDTO([data]);
          return mapped.length > 0 ? mapped[0] : null;
        } catch (err) {
          logApi('ERROR', `getRefugiById ${id} failed`);
          return null;
        } finally {
          this.inFlightRequests.delete(id);
        }
      })();

      this.inFlightRequests.set(id, promise);
      return await promise;
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
    // If DEBUG mode, return mock data
    if (DEBUG){
      // Retornem dades simulades per a desenvolupament
      logApi('GET', `${API_BASE_URL}/refugis/ (mock)`, { filters });
      return mockLocations;
    }
    // Non-debug: implement cache usage and conditional fetching
    try {
      // Helper: determine if filters object contains any meaningful filters
      const hasFilters = !!filters && Object.keys(filters).some(k => {
        const v = (filters as any)[k];
        return v !== undefined && v !== null && (typeof v !== 'string' || v !== '');
      });

      // If there are no filters and we already have a cached full list, return it
      if (!hasFilters && this.cachedRefugis) {
        logApi('CACHE', 'getRefugis - hit (returning cached full list)');
        return this.cachedRefugis;
      }

      // If requesting full list (no filters) and there's an in-flight full-list
      // request, wait for it instead of starting another one.
      if (!hasFilters && this.inFlightListRequest) {
        return await this.inFlightListRequest;
      }

      const params = new URLSearchParams();
      if (filters?.search) {
        params.append('name', filters.search);
      } else {
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

      const fetchPromise = (async (): Promise<Location[]> => {
        const response = await fetchWithLog(url);
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        const data: RefugisResponseDTO | RefugisSimpleResponseDTO = await response.json();
        if (!data || typeof data !== 'object' || !('results' in data) || !Array.isArray(data.results)) {
          return [];
        }
        const mapped = mapRefugisFromDTO(data.results);

        // Only update the session cache when this was a full-list fetch (no params)
        if (params.toString().trim() === '') {
          this.cachedRefugis = mapped;
        }

        return mapped;
      })();

      // If this was a full-list fetch, set inFlightListRequest so concurrent
      // callers reuse the same promise.
      if (params.toString().trim() === '') {
        this.inFlightListRequest = fetchPromise;
        try {
          const result = await fetchPromise;
          return result;
        } finally {
          this.inFlightListRequest = null;
        }
      }

      // For filtered requests just await and return
      return await fetchPromise;
    } catch (error) {
      throw new Error('No s\'han pogut carregar els refugis');
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
    // TODO: implement adding favorite on backend
  }

  /**
   * Elimina un refugi dels favorits
   * TODO: Implementar quan el backend tingui aquesta funcionalitat
   */
  static async removeFavorite(refugiId: number): Promise<void> {
    // Placeholder
    // TODO: implement removing favorite on backend
  }
}
