import { Location } from '../models';
import { RefugisResponseDTO, RefugisSimpleResponseDTO } from './dto/RefugiDTO';
import { mapRefugisFromDTO } from './mappers/RefugiMapper';
import { apiGet } from './apiClient';

const API_BASE_URL = 'https://refugislliures-backend.onrender.com/api';

export class RefugisService {
  /**
   * Get a single refugi by id.
   */
  static async getRefugiById(id: string): Promise<Location | null> {
    try {
      const url = `${API_BASE_URL}/refuges/${id}/`;
      // No requereix autenticació, però hem de passar el token igualmet i usem apiGet per consistència i logging.
      const response = await apiGet(url);
      
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

      // URLSearchParams encodes spaces as '+' (application/x-www-form-urlencoded).
      // The backend expects spaces encoded as '%20' in the query string, so
      // replace '+' with '%20' after serializing. This preserves proper
      // percent-encoding for accented characters while avoiding '+' for spaces.
      const queryString = params.toString().replace(/\+/g, '%20');
      const url = `${API_BASE_URL}/refuges/?${queryString}`;
      // No requereix autenticació, però hem de passar el token igualmet i usem apiGet per consistència i logging.
      const response = await apiGet(url);
      
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
}
