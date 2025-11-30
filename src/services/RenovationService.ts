import { apiGet, apiPost, apiPatch, apiDelete } from './apiClient';
import { RenovationDTO } from './dto/RenovationDTO';

const API_BASE_URL = 'https://refugislliures-backend.onrender.com/api';

/**
 * Interfície per crear una nova renovation
 */
export interface CreateRenovationRequest {
  refuge_id: string;
  ini_date: string; // Format: YYYY-MM-DD
  fin_date: string; // Format: YYYY-MM-DD
  description: string;
  materials_needed?: string;
  group_link: string;
}

/**
 * Interfície per actualitzar una renovation
 */
export interface UpdateRenovationRequest {
  ini_date?: string; // Format: YYYY-MM-DD
  fin_date?: string; // Format: YYYY-MM-DD
  description?: string;
  materials_needed?: string;
  group_link?: string;
}

/**
 * Interfície per errors amb detalls addicionals
 */
export interface RenovationErrorResponse {
  error: string;
  details?: Record<string, string[]>;
  overlapping_renovation?: RenovationDTO;
}

/**
 * Servei per gestionar les renovations de refugis
 */
export class RenovationService {
  /**
   * Obté totes les renovations actives (no finalitzades)
   * Requereix autenticació
   */
  static async getAllRenovations(): Promise<RenovationDTO[]> {
    try {
      const url = `${API_BASE_URL}/renovations/`;
      const response = await apiGet(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data: RenovationDTO[] = await response.json();
      return data;
    } catch (error) {
      console.error('Error loading renovations:', error);
      throw new Error('No s\'han pogut carregar les renovations');
    }
  }

  /**
   * Obté una renovation específica per ID
   * Requereix autenticació
   */
  static async getRenovationById(id: string): Promise<RenovationDTO | null> {
    try {
      const url = `${API_BASE_URL}/renovations/${id}/`;
      const response = await apiGet(url);
      
      if (response.status === 404) {
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data: RenovationDTO = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching renovation ${id}:`, error);
      return null;
    }
  }

  /**
   * Obté totes les renovations actives d'un refugi específic
   * Requereix autenticació
   * 
   * @param refugeId - ID del refugi
   * @returns Array de renovations actives del refugi
   */
  static async getRenovationsByRefugeId(refugeId: string): Promise<RenovationDTO[]> {
    try {
      const url = `${API_BASE_URL}/refuges/${refugeId}/renovations/`;
      const response = await apiGet(url);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data: RenovationDTO[] = await response.json();
      return data;
    } catch (error) {
      console.error(`Error loading renovations for refuge ${refugeId}:`, error);
      throw new Error('No s\'han pogut carregar les renovations del refugi');
    }
  }

  /**
   * Crea una nova renovation
   * Requereix autenticació
   * 
   * @throws Error si hi ha solapament amb una altra renovation o altres errors de validació
   */
  static async createRenovation(renovation: CreateRenovationRequest): Promise<RenovationDTO> {
    try {
      const url = `${API_BASE_URL}/renovations/`;
      const response = await apiPost(url, renovation);
      
      if (response.status === 409) {
        // Solapament amb una altra renovation
        const errorData: RenovationErrorResponse = await response.json();
        const error = new Error(errorData.error);
        (error as any).overlappingRenovation = errorData.overlapping_renovation;
        throw error;
      }
      
      if (!response.ok) {
        const errorData: RenovationErrorResponse = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data: RenovationDTO = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating renovation:', error);
      throw error;
    }
  }

  /**
   * Actualitza una renovation existent
   * Només el creador pot actualitzar-la
   * Requereix autenticació
   * 
   * @throws Error si l'usuari no és el creador o hi ha errors de validació
   */
  static async updateRenovation(
    id: string,
    updates: UpdateRenovationRequest
  ): Promise<RenovationDTO> {
    try {
      const url = `${API_BASE_URL}/renovations/${id}/?id=${id}`;
      const response = await apiPatch(url, updates);
      
      if (response.status === 403) {
        throw new Error('Només el creador pot actualitzar aquesta renovation');
      }
      
      if (response.status === 404) {
        throw new Error('Renovation no trobada');
      }
      
      if (response.status === 409) {
        // Solapament amb una altra renovation
        const errorData: RenovationErrorResponse = await response.json();
        const error = new Error(errorData.error);
        (error as any).overlappingRenovation = errorData.overlapping_renovation;
        throw error;
      }
      
      if (!response.ok) {
        const errorData: RenovationErrorResponse = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data: RenovationDTO = await response.json();
      return data;
    } catch (error) {
      console.error(`Error updating renovation ${id}:`, error);
      throw error;
    }
  }

  /**
   * Elimina una renovation
   * Només el creador pot eliminar-la
   * Requereix autenticació
   * 
   * @throws Error si l'usuari no és el creador
   */
  static async deleteRenovation(id: string): Promise<void> {
    try {
      const url = `${API_BASE_URL}/renovations/${id}/?id=${id}`;
      const response = await apiDelete(url);
      
      if (response.status === 403) {
        throw new Error('Només el creador pot eliminar aquesta renovation');
      }
      
      if (response.status === 404) {
        throw new Error('Renovation no trobada');
      }
      
      if (!response.ok) {
        const errorData: RenovationErrorResponse = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error deleting renovation ${id}:`, error);
      throw error;
    }
  }

  /**
   * Afegeix l'usuari autenticat com a participant d'una renovation
   * El creador no pot unir-se a la seva pròpia renovation
   * Requereix autenticació
   * 
   * @throws Error si l'usuari és el creador o ja és participant
   */
  static async joinRenovation(id: string): Promise<RenovationDTO> {
    try {
      const url = `${API_BASE_URL}/renovations/${id}/participants/`;
      const response = await apiPost(url, {});
      
      if (response.status === 400) {
        const errorData: RenovationErrorResponse = await response.json();
        throw new Error(errorData.error || 'No et pots unir a aquesta renovation');
      }
      
      if (response.status === 404) {
        throw new Error('Renovation no trobada');
      }
      
      if (!response.ok) {
        const errorData: RenovationErrorResponse = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data: RenovationDTO = await response.json();
      return data;
    } catch (error) {
      console.error(`Error joining renovation ${id}:`, error);
      throw error;
    }
  }

  /**
   * Elimina un participant d'una renovation
   * Un participant pot eliminar-se a si mateix
   * El creador pot eliminar qualsevol participant
   * Requereix autenticació
   * 
   * @param renovationId - ID de la renovation
   * @param participantUid - UID del participant a eliminar
   * @throws Error si no es té permís per eliminar el participant
   */
  static async removeParticipant(
    renovationId: string,
    participantUid: string
  ): Promise<RenovationDTO> {
    try {
      const url = `${API_BASE_URL}/renovations/${renovationId}/participants/${participantUid}/`;
      const response = await apiDelete(url);
      
      if (response.status === 403) {
        throw new Error('No tens permís per eliminar aquest participant');
      }
      
      if (response.status === 404) {
        throw new Error('Renovation no trobada');
      }
      
      if (!response.ok) {
        const errorData: RenovationErrorResponse = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data: RenovationDTO = await response.json();
      return data;
    } catch (error) {
      console.error(`Error removing participant ${participantUid} from renovation ${renovationId}:`, error);
      throw error;
    }
  }
}
