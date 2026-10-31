import { apiGet, apiClient, apiPost, apiPatch } from './apiClient';
import { buildApiError, CONTENT_WRITE_ERROR_CODES } from './apiErrors';
import type { PreparedMediaFile } from './MediaUploadService';
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
  /** Valoració de l'estat del refugi (0-3). Obligatori en crear (sense valor, el backend respon 400) */
  condition: number;
  /**
   * Fitxers ja validats i comprimits (useMediaUpload.pickMedia). NO s'envien amb
   * l'experiència: el hook crea l'experiència (JSON) i després fa upload-intents
   * amb target=experience.
   */
  files?: PreparedMediaFile[];
}

/**
 * Interfície per actualitzar una experiència
 */
export interface UpdateExperienceRequest {
  comment?: string;
  /** Valoració de l'estat del refugi (0-3). Al backend és opcional en editar, però l'app l'envia sempre */
  condition: number;
  /** Fitxers nous (es pugen amb upload-intents, vegeu CreateExperienceRequest) */
  files?: PreparedMediaFile[];
}

/**
 * Comprova que la valoració de l'estat és un enter entre 0 i 3
 */
function assertValidCondition(condition: unknown): asserts condition is number {
  if (typeof condition !== 'number' || !Number.isInteger(condition) || condition < 0 || condition > 3) {
    throw new Error("L'estat del refugi (condition) ha de ser un enter entre 0 i 3");
  }
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
   * Crea una nova experiència (només text) per a un refugi.
   * POST /api/experiences/  JSON {refuge_id, comment, condition}  (condition 0-3 obligatori)
   * @throws ApiError amb codi `user_blocked` o `age_not_confirmed` (403)
   * Els fitxers es pugen després amb upload-intents (target=experience).
   * Requereix autenticació
   */
  static async createExperience(request: CreateExperienceRequest): Promise<ExperienceCreateResponseDTO> {
    try {
      assertValidCondition(request.condition);
      const url = `${API_BASE_URL}/experiences/`;
      
      const response = await apiPost(url, {
        refuge_id: request.refuge_id,
        comment: request.comment,
        condition: request.condition,
      });
      
      if (response.status === 403) {
        // user_blocked / age_not_confirmed
        throw await buildApiError(response, "No tens permís per crear l'experiència", {
          knownCodes: CONTENT_WRITE_ERROR_CODES,
          defaultCode: 'forbidden',
        });
      }

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
   * Actualitza el comentari d'una experiència existent.
   * PATCH /api/experiences/{experience_id}/  JSON {comment, condition}
   * Els fitxers nous es pugen amb upload-intents (target=experience).
   * Requereix autenticació i ser el creador de l'experiència (el backend ho comprova: 403)
   * @throws ApiError amb codi `user_blocked` o `age_not_confirmed` (403)
   */
  static async updateExperience(
    experienceId: string,
    request: UpdateExperienceRequest
  ): Promise<ExperienceUpdateResponseDTO> {
    try {
      const url = `${API_BASE_URL}/experiences/${experienceId}/`;
      
      assertValidCondition(request.condition);
      const body: { comment?: string; condition: number } = { condition: request.condition };
      if (request.comment) {
        body.comment = request.comment;
      }
      
      const response = await apiPatch(url, body);
      
      if (response.status === 400) {
        const errorData: ExperienceErrorResponse = await response.json();
        throw new Error(errorData.error || 'Dades invàlides');
      }
      
      if (response.status === 401) {
        const errorData: ExperienceErrorResponse = await response.json();
        throw new Error(errorData.error || 'No autenticat');
      }
      
      if (response.status === 403) {
        // user_blocked / age_not_confirmed, o no ser el creador
        const apiError = await buildApiError(response, 'No tens permisos per editar aquesta experiència', {
          knownCodes: CONTENT_WRITE_ERROR_CODES,
          defaultCode: 'forbidden',
        });
        if (apiError.code === 'forbidden') {
          apiError.message = 'No tens permisos per editar aquesta experiència';
        }
        throw apiError;
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
