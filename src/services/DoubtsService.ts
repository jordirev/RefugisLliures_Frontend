import { apiGet, apiPost, apiDelete } from './apiClient';
import { DoubtDTO, AnswerDTO } from './dto/DoubtDTO';

const API_BASE_URL = 'https://refugislliures-backend.onrender.com/api';

/**
 * Interfície per crear un nou dubte
 */
export interface CreateDoubtRequest {
  refuge_id: string;
  message: string;
}

/**
 * Interfície per crear una nova resposta
 */
export interface CreateAnswerRequest {
  message: string;
}

/**
 * Interfície per errors amb detalls addicionals
 */
export interface DoubtErrorResponse {
  error: string;
  details?: Record<string, string[]>;
}

/**
 * Servei per gestionar els dubtes i respostes de refugis
 */
export class DoubtsService {
  /**
   * Obté tots els dubtes d'un refugi amb les seves respostes
   * GET /api/doubts/?refuge_id={refuge_id}
   * Requereix autenticació
   */
  static async getDoubtsByRefuge(refugeId: string): Promise<DoubtDTO[]> {
    try {
      const url = `${API_BASE_URL}/doubts/?refuge_id=${refugeId}`;
      const response = await apiGet(url);
      
      if (response.status === 404) {
        const errorData: DoubtErrorResponse = await response.json();
        throw new Error(errorData.error || 'Refugi no trobat');
      }
      
      if (!response.ok) {
        const errorData: DoubtErrorResponse = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data: DoubtDTO[] = await response.json();
      return data;
    } catch (error) {
      console.error('Error loading doubts:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('No s\'han pogut carregar els dubtes');
    }
  }

  /**
   * Crea un nou dubte per a un refugi
   * POST /api/doubts/
   * Requereix autenticació
   */
  static async createDoubt(request: CreateDoubtRequest): Promise<DoubtDTO> {
    try {
      const url = `${API_BASE_URL}/doubts/`;
      const response = await apiPost(url, request);
      
      if (response.status === 400) {
        const errorData: DoubtErrorResponse = await response.json();
        throw new Error(errorData.error || 'Dades invàlides');
      }
      
      if (response.status === 404) {
        const errorData: DoubtErrorResponse = await response.json();
        throw new Error(errorData.error || 'Refugi no trobat');
      }
      
      if (!response.ok) {
        const errorData: DoubtErrorResponse = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data: DoubtDTO = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating doubt:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('No s\'ha pogut crear el dubte');
    }
  }

  /**
   * Elimina un dubte i totes les seves respostes
   * DELETE /api/doubts/{doubt_id}/
   * Requereix autenticació i ser el creador del dubte
   */
  static async deleteDoubt(doubtId: string): Promise<void> {
    try {
      const url = `${API_BASE_URL}/doubts/${doubtId}/`;
      const response = await apiDelete(url);
      
      if (response.status === 403) {
        throw new Error('No tens permisos per eliminar aquest dubte');
      }
      
      if (response.status === 404) {
        const errorData: DoubtErrorResponse = await response.json();
        throw new Error(errorData.error || 'Dubte no trobat');
      }
      
      if (!response.ok) {
        const errorData: DoubtErrorResponse = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting doubt:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('No s\'ha pogut eliminar el dubte');
    }
  }

  /**
   * Crea una nova resposta a un dubte
   * POST /api/doubts/{doubt_id}/answers/
   * Requereix autenticació
   */
  static async createAnswer(doubtId: string, request: CreateAnswerRequest): Promise<AnswerDTO> {
    try {
      const url = `${API_BASE_URL}/doubts/${doubtId}/answers/`;
      const response = await apiPost(url, request);
      
      if (response.status === 400) {
        const errorData: DoubtErrorResponse = await response.json();
        throw new Error(errorData.error || 'Dades invàlides');
      }
      
      if (response.status === 404) {
        const errorData: DoubtErrorResponse = await response.json();
        throw new Error(errorData.error || 'Dubte no trobat');
      }
      
      if (!response.ok) {
        const errorData: DoubtErrorResponse = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data: AnswerDTO = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating answer:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('No s\'ha pogut crear la resposta');
    }
  }

  /**
   * Crea una nova resposta a una resposta (reply)
   * POST /api/doubts/{doubt_id}/answers/{answer_id}/
   * Requereix autenticació
   */
  static async createAnswerReply(
    doubtId: string, 
    parentAnswerId: string, 
    request: CreateAnswerRequest
  ): Promise<AnswerDTO> {
    try {
      const url = `${API_BASE_URL}/doubts/${doubtId}/answers/${parentAnswerId}/`;
      const response = await apiPost(url, request);
      
      if (response.status === 400) {
        const errorData: DoubtErrorResponse = await response.json();
        throw new Error(errorData.error || 'Dades invàlides');
      }
      
      if (response.status === 404) {
        const errorData: DoubtErrorResponse = await response.json();
        throw new Error(errorData.error || 'Dubte o resposta no trobats');
      }
      
      if (!response.ok) {
        const errorData: DoubtErrorResponse = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data: AnswerDTO = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating answer reply:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('No s\'ha pogut crear la resposta');
    }
  }

  /**
   * Elimina una resposta
   * DELETE /api/doubts/{doubt_id}/answers/{answer_id}/
   * Requereix autenticació i ser el creador de la resposta
   */
  static async deleteAnswer(doubtId: string, answerId: string): Promise<void> {
    try {
      const url = `${API_BASE_URL}/doubts/${doubtId}/answers/${answerId}/`;
      const response = await apiDelete(url);
      
      if (response.status === 403) {
        throw new Error('No tens permisos per eliminar aquesta resposta');
      }
      
      if (response.status === 404) {
        const errorData: DoubtErrorResponse = await response.json();
        throw new Error(errorData.error || 'Resposta no trobada');
      }
      
      if (!response.ok) {
        const errorData: DoubtErrorResponse = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting answer:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('No s\'ha pogut eliminar la resposta');
    }
  }
}
