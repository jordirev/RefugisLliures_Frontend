import { Location } from '../types';
import { RefugisResponseDTO, RefugisSimpleResponseDTO } from './dto/RefugiDTO';
import { mapRefugisFromDTO } from './mappers/RefugiMapper';

const API_BASE_URL = 'https://refugislliures-backend.onrender.com/api';

export class RefugisService {
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
    try {
      const params = new URLSearchParams();
      
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
      if (filters?.search) {
        params.append('search', filters.search);
      }

      const url = `${API_BASE_URL}/refugis/?${params.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data: RefugisResponseDTO | RefugisSimpleResponseDTO = await response.json();
      
      // Validem que la resposta té l'estructura esperada
      if (!data || typeof data !== 'object' || !('results' in data) || !Array.isArray(data.results)) {
        console.error('Resposta del backend amb format inesperat:', data);
        return [];
      }
      
      // Convertim els DTOs al format del frontend
      return mapRefugisFromDTO(data.results);
    } catch (error) {
      console.error('Error fetching refugis:', error);
      throw error;
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
