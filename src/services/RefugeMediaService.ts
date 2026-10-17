/**
 * Servei per gestionar els mitjans (imatges i vídeos) dels refugis.
 *
 * La pujada ja no passa per aquí (multipart antic): es fa amb URL PUT prefirmada
 * des de `MediaUploadService` + hook `useMediaUpload`.
 */

import { ImageMetadata } from '../models';
import { apiGet, apiDelete } from './apiClient';
import { ImageMetadataDTO } from './dto/RefugiDTO';
import { mapImageMetadataFromDTO } from './mappers/RefugiMapper';

const API_BASE_URL = 'https://refugislliures-backend.onrender.com/api';

/**
 * Interfície per la resposta de la llista de mitjans
 */
interface RefugeMediaListResponse {
  media: ImageMetadataDTO[];
}

/**
 * Interfície per la resposta d'eliminació de mitjà
 */
interface RefugeMediaDeleteResponse {
  success: boolean;
  message: string;
  key: string;
}

/**
 * Interfície per la resposta d'errors de l'API
 */
interface ApiErrorResponse {
  error: string;
  message?: string;
  details?: Record<string, string[]>;
}

export class RefugeMediaService {
  /**
   * Obté la llista de tots els mitjans (imatges i vídeos) d'un refugi
   * GET /api/refuges/{id}/media/
   * 
   * @param refugeId - ID del refugi
   * @returns Array de metadades dels mitjans o null si hi ha error
   * @throws Error amb missatge descriptiu en cas d'error
   */
  static async getRefugeMedia(refugeId: string): Promise<ImageMetadata[]> {
    try {
      const url = `${API_BASE_URL}/refuges/${refugeId}/media/`;
      const response = await apiGet(url);
      
      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json().catch(() => ({ 
          error: `Error ${response.status}: ${response.statusText}` 
        }));
        
        if (response.status === 404) {
          throw new Error('El refugi especificat no existeix');
        } else if (response.status === 401) {
          throw new Error('No estàs autenticat. Si us plau, inicia sessió.');
        } else if (response.status === 500) {
          throw new Error('Error del servidor. Si us plau, intenta-ho més tard.');
        }
        
        throw new Error(errorData.error || 'No s\'han pogut carregar els mitjans del refugi');
      }
      
      const data: RefugeMediaListResponse = await response.json();
      
      if (!data || !Array.isArray(data.media)) {
        console.warn('Invalid media list response:', data);
        return [];
      }
      
      return data.media.map(mapImageMetadataFromDTO);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      console.error('Error fetching refuge media:', error);
      throw new Error('No s\'han pogut carregar els mitjans del refugi');
    }
  }

  /**
   * Elimina un mitjà específic d'un refugi utilitzant la seva key
   * DELETE /api/refuges/{id}/media/{key}/
   * 
   * Requereix que l'usuari sigui el creador del mitjà o administrador
   * 
   * @param refugeId - ID del refugi
   * @param mediaKey - Key del mitjà a eliminar (path complet al fitxer)
   * @returns true si s'ha eliminat correctament
   * @throws Error amb missatge descriptiu en cas d'error
   */
  static async deleteRefugeMedia(refugeId: string, mediaKey: string): Promise<boolean> {
    try {
      if (!mediaKey) {
        throw new Error('No s\'ha proporcionat la key del mitjà a eliminar');
      }

      // Codificar la key per la URL (pot contenir caràcters especials)
      const encodedKey = encodeURIComponent(mediaKey);
      const url = `${API_BASE_URL}/refuges/${refugeId}/media/${encodedKey}/`;
      
      const response = await apiDelete(url);
      
      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json().catch(() => ({ 
          error: `Error ${response.status}: ${response.statusText}` 
        }));
        
        if (response.status === 401) {
          throw new Error('No estàs autenticat. Si us plau, inicia sessió.');
        } else if (response.status === 403) {
          throw new Error('No tens permisos per eliminar aquest mitjà. Només el creador o un administrador poden fer-ho.');
        } else if (response.status === 404) {
          throw new Error('El mitjà especificat no existeix');
        } else if (response.status === 500) {
          throw new Error('Error del servidor. Si us plau, intenta-ho més tard.');
        }
        
        throw new Error(errorData.error || 'No s\'ha pogut eliminar el mitjà');
      }
      
      return true;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      console.error('Error deleting refuge media:', error);
      throw new Error('No s\'ha pogut eliminar el mitjà del refugi');
    }
  }
}
