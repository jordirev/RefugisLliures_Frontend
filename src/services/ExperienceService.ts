import { apiGet, apiClient } from './apiClient';
import { 
  ExperienceDTO, 
  ExperienceListResponseDTO,
  ExperienceCreateResponseDTO,
  ExperienceUpdateResponseDTO,
  ExperienceDeleteResponseDTO
} from './dto/ExperienceDTO';

const API_BASE_URL = 'https://refugislliures-backend.onrender.com/api';

/**
 * Interfície per crear una nova experiència
 */
export interface CreateExperienceRequest {
  refuge_id: string;
  comment: string;
  files?: File[]; // Arxius d'imatges/vídeos opcionals
}

/**
 * Interfície per actualitzar una experiència
 */
export interface UpdateExperienceRequest {
  comment?: string;
  files?: File[]; // Arxius d'imatges/vídeos opcionals
}

/**
 * Interfície per errors amb detalls addicionals
 */
export interface ExperienceErrorResponse {
  error: string;
  details?: Record<string, string[]>;
  message?: string;
}

/**
 * Servei per gestionar les experiències de refugis
 */
export class ExperienceService {
  /**
   * Obté totes les experiències d'un refugi ordenades per data de modificació descendent
   * GET /api/experiences/?refuge_id={refuge_id}
   * Requereix autenticació
   */
  static async getExperiencesByRefuge(refugeId: string): Promise<ExperienceDTO[]> {
    try {
      const url = `${API_BASE_URL}/experiences/?refuge_id=${refugeId}`;
      const response = await apiGet(url);
      
      if (response.status === 400) {
        const errorData: ExperienceErrorResponse = await response.json();
        throw new Error(errorData.error || 'El refuge_id és requerit');
      }
      
      if (response.status === 404) {
        const errorData: ExperienceErrorResponse = await response.json();
        throw new Error(errorData.error || 'Refugi no trobat');
      }
      
      if (!response.ok) {
        const errorData: ExperienceErrorResponse = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data: ExperienceListResponseDTO = await response.json();
      return data.experiences;
    } catch (error) {
      console.error('Error loading experiences:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('No s\'han pogut carregar les experiències');
    }
  }

  /**
   * Crea una nova experiència per a un refugi amb fitxers opcionals
   * POST /api/experiences/
   * Utilitza multipart/form-data per enviar fitxers
   * Requereix autenticació
   */
  static async createExperience(request: CreateExperienceRequest): Promise<ExperienceCreateResponseDTO> {
    try {
      const url = `${API_BASE_URL}/experiences/`;
      
      // Crear FormData per enviar fitxers
      const formData = new FormData();
      formData.append('refuge_id', request.refuge_id);
      formData.append('comment', request.comment);
      
      // Afegir fitxers si n'hi ha
      if (request.files && request.files.length > 0) {
        request.files.forEach((file) => {
          formData.append('files', file);
        });
      }
      
      // Utilitzar apiClient directament sense especificar Content-Type
      // perquè FormData ho gestiona automàticament
      const response = await apiClient(url, {
        method: 'POST',
        body: formData,
        // No establir Content-Type, deixar que el navegador ho faci
      });
      
      if (response.status === 400) {
        const errorData: ExperienceErrorResponse = await response.json();
        throw new Error(errorData.error || 'Dades invàlides');
      }
      
      if (response.status === 401) {
        const errorData: ExperienceErrorResponse = await response.json();
        throw new Error(errorData.error || 'No autenticat');
      }
      
      if (response.status === 404) {
        const errorData: ExperienceErrorResponse = await response.json();
        throw new Error(errorData.error || 'Refugi no trobat');
      }
      
      if (!response.ok && response.status !== 201) {
        const errorData: ExperienceErrorResponse = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data: ExperienceCreateResponseDTO = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating experience:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('No s\'ha pogut crear l\'experiència');
    }
  }

  /**
   * Actualitza una experiència existent (comentari i/o fitxers)
   * PATCH /api/experiences/{experience_id}/
   * Utilitza multipart/form-data per enviar fitxers
   * Requereix autenticació i ser el creador de l'experiència
   */
  static async updateExperience(
    experienceId: string,
    request: UpdateExperienceRequest
  ): Promise<ExperienceUpdateResponseDTO> {
    try {
      const url = `${API_BASE_URL}/experiences/${experienceId}/`;
      
      // Crear FormData per enviar fitxers
      const formData = new FormData();
      
      if (request.comment) {
        formData.append('comment', request.comment);
      }
      
      // Afegir fitxers si n'hi ha
      if (request.files && request.files.length > 0) {
        request.files.forEach((file) => {
          formData.append('files', file);
        });
      }
      
      // Utilitzar apiClient directament sense especificar Content-Type
      const response = await apiClient(url, {
        method: 'PATCH',
        body: formData,
      });
      
      if (response.status === 400) {
        const errorData: ExperienceErrorResponse = await response.json();
        throw new Error(errorData.error || 'Dades invàlides');
      }
      
      if (response.status === 401) {
        const errorData: ExperienceErrorResponse = await response.json();
        throw new Error(errorData.error || 'No autenticat');
      }
      
      if (response.status === 403) {
        throw new Error('No tens permisos per editar aquesta experiència');
      }
      
      if (response.status === 404) {
        const errorData: ExperienceErrorResponse = await response.json();
        throw new Error(errorData.error || 'Experiència no trobada');
      }
      
      if (!response.ok) {
        const errorData: ExperienceErrorResponse = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data: ExperienceUpdateResponseDTO = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating experience:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('No s\'ha pogut actualitzar l\'experiència');
    }
  }

  /**
   * Elimina una experiència i tots els seus mitjans associats
   * DELETE /api/experiences/{experience_id}/
   * Requereix autenticació i ser el creador de l'experiència
   */
  static async deleteExperience(experienceId: string): Promise<void> {
    try {
      const url = `${API_BASE_URL}/experiences/${experienceId}/`;
      const response = await apiClient(url, {
        method: 'DELETE',
      });
      
      if (response.status === 401) {
        throw new Error('No autenticat');
      }
      
      if (response.status === 403) {
        throw new Error('No tens permisos per eliminar aquesta experiència');
      }
      
      if (response.status === 404) {
        const errorData: ExperienceErrorResponse = await response.json();
        throw new Error(errorData.error || 'Experiència no trobada');
      }
      
      if (!response.ok) {
        const errorData: ExperienceErrorResponse = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting experience:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('No s\'ha pogut eliminar l\'experiència');
    }
  }
}
