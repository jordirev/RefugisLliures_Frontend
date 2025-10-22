import { Location } from '../types';
import { mockLocations } from '../utils/mockData';
import { RefugisResponseDTO, RefugisSimpleResponseDTO } from './dto/RefugiDTO';
import { mapRefugisFromDTO } from './mappers/RefugiMapper';
import { fetchWithLog, logApi } from './fetchWithLog';

const API_BASE_URL = 'https://refugislliures-backend.onrender.com/api';

const DEBUG = false;

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
        return mapRefugisFromDTO(data.results);
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
