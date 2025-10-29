import { Location } from '../models';
import { mockLocations } from '../utils/mockData';
import { RefugisResponseDTO, RefugisSimpleResponseDTO } from './dto/RefugiDTO';
import { mapRefugisFromDTO } from './mappers/RefugiMapper';
import { fetchWithLog } from './fetchWithLog';

const API_BASE_URL = 'https://refugislliures-backend.onrender.com/api';

const DEBUG = false;

export class RefugisService {
  /**
   * Get a single refugi by id.
   */
  static async getRefugiById(id: number): Promise<Location | null> {
    if (DEBUG) {
      const mock = mockLocations.find(m => m.id === id);
      return mock || null;
    }

    try {
      const url = `${API_BASE_URL}/refugis/${id}/`;
      const response = await fetchWithLog(url);
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      const mapped = mapRefugisFromDTO([data]);
      return mapped.length > 0 ? mapped[0] : null;
    } catch (err) {
      console.error(`Error fetching refugi ${id}:`, err);
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
    if (DEBUG) {
      return mockLocations;
    }

    try {
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
      const response = await fetchWithLog(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data: RefugisResponseDTO | RefugisSimpleResponseDTO = await response.json();
      if (!data || typeof data !== 'object' || !('results' in data) || !Array.isArray(data.results)) {
        return [];
      }
      
      return mapRefugisFromDTO(data.results);
    } catch (error) {
      console.error('Error loading refugis:', error);
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
