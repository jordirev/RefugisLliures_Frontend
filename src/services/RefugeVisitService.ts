/**
 * Servei per gestionar les visites a refugis
 */

import { RefugeVisit } from '../models';
import { apiGet, apiPost, apiPatch, apiDelete } from './apiClient';
import {
  RefugeVisitsResponseDTO,
  UserVisitsResponseDTO,
  CreateRefugeVisitRequestDTO,
  CreateRefugeVisitResponseDTO,
  UpdateRefugeVisitRequestDTO,
  UpdateRefugeVisitResponseDTO,
  DeleteRefugeVisitResponseDTO,
  RefugeVisitErrorResponseDTO
} from './dto/RefugeVisitDTO';
import { mapRefugeVisitFromDTO, mapRefugeVisitsFromDTO } from './mappers/RefugeVisitMapper';

const API_BASE_URL = 'https://refugislliures-backend.onrender.com/api';

/**
 * Interfície per crear una nova visita
 */
export interface CreateRefugeVisitRequest {
  num_visitors: number;
}

/**
 * Interfície per actualitzar una visita
 */
export interface UpdateRefugeVisitRequest {
  num_visitors: number;
}

/**
 * Interfície extesa de RefugeVisit que inclou refuge_id
 * Utilitzada per les visites d'usuari
 */
export interface UserRefugeVisit extends RefugeVisit {
  refuge_id: string;
}

/**
 * Servei per gestionar les visites a refugis
 */
export class RefugeVisitService {
  /**
   * Obté totes les visites actuals i futures d'un refugi
   * Requereix autenticació
   * 
   * @param refugeId - ID del refugi
   * @returns Array de visites del refugi ordenades per data ascendent
   * @throws Error si el refugi no es troba o hi ha un error del servidor
   */
  static async getRefugeVisits(refugeId: string): Promise<RefugeVisit[]> {
    try {
      const url = `${API_BASE_URL}/refuges/${refugeId}/visits/`;
      const response = await apiGet(url);
      
      if (response.status === 404) {
        throw new Error('Refugi no trobat');
      }
      
      if (response.status === 401) {
        throw new Error('No autenticat');
      }
      
      if (!response.ok) {
        const errorData: RefugeVisitErrorResponseDTO = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data: RefugeVisitsResponseDTO = await response.json();
      return mapRefugeVisitsFromDTO(data.result);
    } catch (error) {
      console.error(`Error loading visits for refuge ${refugeId}:`, error);
      throw error;
    }
  }

  /**
   * Obté totes les visites d'un usuari
   * Requereix autenticació i que l'usuari autenticat sigui el mateix que el uid
   * 
   * @param uid - UID de l'usuari
   * @returns Array de visites de l'usuari amb refuge_id ordenades per data descendent
   * @throws Error si no hi ha permís o hi ha un error del servidor
   */
  static async getUserVisits(uid: string): Promise<UserRefugeVisit[]> {
    try {
      const url = `${API_BASE_URL}/users/${uid}/visits/`;
      const response = await apiGet(url);
      
      if (response.status === 401) {
        throw new Error('No autenticat');
      }
      
      if (response.status === 403) {
        throw new Error('No tens permís per accedir a aquestes dades');
      }
      
      if (!response.ok) {
        const errorData: RefugeVisitErrorResponseDTO = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data: UserVisitsResponseDTO = await response.json();
      
      // Mapejar les visites d'usuari (que inclouen refuge_id)
      return data.result.map(dto => ({
        ...mapRefugeVisitFromDTO(dto),
        refuge_id: dto.refuge_id || '' // Assegurar que refuge_id està present
      }));
    } catch (error) {
      console.error(`Error loading visits for user ${uid}:`, error);
      throw error;
    }
  }

  /**
   * Crea una nova visita o afegeix un visitant a una visita existent
   * Requereix autenticació
   * 
   * @param refugeId - ID del refugi
   * @param visitDate - Data de la visita (format: YYYY-MM-DD)
   * @param request - Dades de la visita (num_visitors)
   * @returns Visita creada o actualitzada
   * @throws Error si el refugi no es troba, l'usuari ja està registrat o hi ha errors de validació
   */
  static async createRefugeVisit(
    refugeId: string,
    visitDate: string,
    request: CreateRefugeVisitRequest
  ): Promise<RefugeVisit> {
    try {
      const url = `${API_BASE_URL}/refuges/${refugeId}/visits/${visitDate}/`;
      const body: CreateRefugeVisitRequestDTO = {
        num_visitors: request.num_visitors
      };
      
      const response = await apiPost(url, body);
      
      if (response.status === 404) {
        throw new Error('Refugi no trobat');
      }
      
      if (response.status === 401) {
        throw new Error('No autenticat');
      }
      
      if (response.status === 400) {
        const errorData: RefugeVisitErrorResponseDTO = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Paràmetres invàlids o usuari ja registrat');
      }
      
      if (!response.ok) {
        const errorData: RefugeVisitErrorResponseDTO = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data: CreateRefugeVisitResponseDTO = await response.json();
      return mapRefugeVisitFromDTO(data.visit);
    } catch (error) {
      console.error(`Error creating visit for refuge ${refugeId} on ${visitDate}:`, error);
      throw error;
    }
  }

  /**
   * Actualitza el nombre de visitants d'un usuari en una visita
   * Requereix autenticació
   * 
   * @param refugeId - ID del refugi
   * @param visitDate - Data de la visita (format: YYYY-MM-DD)
   * @param request - Dades per actualitzar (num_visitors)
   * @returns Visita actualitzada
   * @throws Error si el refugi no es troba, l'usuari no està registrat o hi ha errors de validació
   */
  static async updateRefugeVisit(
    refugeId: string,
    visitDate: string,
    request: UpdateRefugeVisitRequest
  ): Promise<RefugeVisit> {
    try {
      const url = `${API_BASE_URL}/refuges/${refugeId}/visits/${visitDate}/`;
      const body: UpdateRefugeVisitRequestDTO = {
        num_visitors: request.num_visitors
      };
      
      const response = await apiPatch(url, body);
      
      if (response.status === 404) {
        throw new Error('Refugi o visita no trobats');
      }
      
      if (response.status === 401) {
        throw new Error('No autenticat');
      }
      
      if (response.status === 400) {
        const errorData: RefugeVisitErrorResponseDTO = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Paràmetres invàlids o usuari no registrat');
      }
      
      if (!response.ok) {
        const errorData: RefugeVisitErrorResponseDTO = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data: UpdateRefugeVisitResponseDTO = await response.json();
      return mapRefugeVisitFromDTO(data.visit);
    } catch (error) {
      console.error(`Error updating visit for refuge ${refugeId} on ${visitDate}:`, error);
      throw error;
    }
  }

  /**
   * Elimina un visitant d'una visita
   * Requereix autenticació
   * 
   * @param refugeId - ID del refugi
   * @param visitDate - Data de la visita (format: YYYY-MM-DD)
   * @returns true si l'eliminació ha estat exitosa
   * @throws Error si el refugi no es troba, l'usuari no està registrat o hi ha errors
   */
  static async deleteRefugeVisit(
    refugeId: string,
    visitDate: string
  ): Promise<boolean> {
    try {
      const url = `${API_BASE_URL}/refuges/${refugeId}/visits/${visitDate}/`;
      const response = await apiDelete(url);
      
      if (response.status === 404) {
        throw new Error('Refugi o visita no trobats');
      }
      
      if (response.status === 401) {
        throw new Error('No autenticat');
      }
      
      if (response.status === 400) {
        const errorData: RefugeVisitErrorResponseDTO = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Usuari no registrat a la visita');
      }
      
      if (!response.ok) {
        const errorData: RefugeVisitErrorResponseDTO = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      // La resposta és 200 OK amb un missatge
      const data: DeleteRefugeVisitResponseDTO = await response.json();
      console.log(data.message);
      return true;
    } catch (error) {
      console.error(`Error deleting visit for refuge ${refugeId} on ${visitDate}:`, error);
      throw error;
    }
  }
}
