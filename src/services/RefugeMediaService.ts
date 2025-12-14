/**
 * Servei per gestionar els mitjans (imatges i vídeos) dels refugis
 */

import { ImageMetadata } from '../models';
import { apiGet, apiPost, apiDelete, apiClient } from './apiClient';

const API_BASE_URL = 'https://refugislliures-backend.onrender.com/api';

/**
 * Interfície per la resposta de la llista de mitjans
 */
interface RefugeMediaListResponse {
  media: ImageMetadata[];
}

/**
 * Interfície per la resposta de pujada de mitjans
 */
interface RefugeMediaUploadResponse {
  uploaded: number;
  failed: number;
  media: ImageMetadata[];
  errors?: Array<{
    file: string;
    error: string;
  }>;
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
   * GET /api/refugis/{id}/media/
   * 
   * @param refugeId - ID del refugi
   * @returns Array de metadades dels mitjans o null si hi ha error
   * @throws Error amb missatge descriptiu en cas d'error
   */
  static async getRefugeMedia(refugeId: string): Promise<ImageMetadata[]> {
    try {
      const url = `${API_BASE_URL}/refugis/${refugeId}/media/`;
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
      
      return data.media;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      console.error('Error fetching refuge media:', error);
      throw new Error('No s\'han pogut carregar els mitjans del refugi');
    }
  }

  /**
   * Puja una o més imatges/vídeos per a un refugi específic
   * POST /api/refugis/{id}/media/
   * 
   * Formats acceptats:
   * - Imatges: JPEG, JPG, PNG, WebP, HEIC, HEIF
   * - Vídeos: MP4, MOV, AVI, WebM
   * 
   * @param refugeId - ID del refugi
   * @param files - Array de fitxers a pujar (File objects)
   * @returns Resposta amb els mitjans pujats correctament i errors si n'hi ha
   * @throws Error amb missatge descriptiu en cas d'error
   */
  static async uploadRefugeMedia(
    refugeId: string, 
    files: File[]
  ): Promise<RefugeMediaUploadResponse> {
    try {
      if (!files || files.length === 0) {
        throw new Error('No s\'han proporcionat fitxers per pujar');
      }

      const url = `${API_BASE_URL}/refugis/${refugeId}/media/`;
      
      // Crear FormData per enviar els fitxers
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      // Fer la petició amb FormData (no afegir Content-Type, el navegador ho farà automàticament)
      const response = await apiClient(url, {
        method: 'POST',
        body: formData
        // No afegir headers Content-Type per deixar que el navegador estableixi el boundary correcte
      });
      
      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json().catch(() => ({ 
          error: `Error ${response.status}: ${response.statusText}` 
        }));
        
        if (response.status === 400) {
          throw new Error(errorData.error || 'Fitxers invàlids o cap fitxer proporcionat');
        } else if (response.status === 401) {
          throw new Error('No estàs autenticat. Si us plau, inicia sessió.');
        } else if (response.status === 404) {
          throw new Error('El refugi especificat no existeix');
        } else if (response.status === 500) {
          throw new Error('Error del servidor. Si us plau, intenta-ho més tard.');
        }
        
        throw new Error(errorData.error || 'No s\'han pogut pujar els mitjans');
      }
      
      const data: RefugeMediaUploadResponse = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      console.error('Error uploading refuge media:', error);
      throw new Error('No s\'han pogut pujar els mitjans del refugi');
    }
  }

  /**
   * Elimina un mitjà específic d'un refugi utilitzant la seva key
   * DELETE /api/refugis/{id}/media/{key}
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
      const url = `${API_BASE_URL}/refugis/${refugeId}/media/${encodedKey}/`;
      
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
