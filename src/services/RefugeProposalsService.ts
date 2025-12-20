/**
 * Servei per gestionar les propostes de refugis
 */

import { RefugeProposal, Location, RefugeProposalStatus } from '../models';
import { 
  RefugeProposalDTO, 
  RefugeProposalCreateDTO, 
  RefugeProposalRejectDTO 
} from './dto/RefugeProposalDTO';
import { mapRefugeProposalFromDTO, mapRefugeProposalsFromDTO } from './mappers/RefugeProposalMapper';
import { mapPartialRefugiToDTO } from './mappers/RefugiMapper';
import { apiGet, apiPost } from './apiClient';

const API_BASE_URL = 'https://refugislliures-backend.onrender.com/api';

/**
 * Interfície per la resposta d'errors de l'API
 */
interface ApiErrorResponse {
  error: string;
  details?: Record<string, string[]>;
}

/**
 * Interfície per la resposta d'èxit de les accions
 */
interface ApiSuccessResponse {
  message: string;
}

export class RefugeProposalsService {
  /**
   * Crea una nova proposta de refugi
   * 
   * @param data - Dades de la proposta
   * @returns La proposta creada o null si hi ha error
   * @throws Error amb missatge descriptiu en cas d'error
   */
  static async createProposal(data: RefugeProposalCreateDTO): Promise<RefugeProposal> {
    try {
      const url = `${API_BASE_URL}/refuges-proposals/`;
      const response = await apiPost(url, data);
      
      if (!response.ok) {
        // Gestionar diferents codis d'error
        const errorData: ApiErrorResponse = await response.json().catch(() => ({ 
          error: `Error ${response.status}: ${response.statusText}` 
        }));
        
        if (response.status === 400) {
          // Error de validació
          if (errorData.details) {
            const errorMessages = Object.entries(errorData.details)
              .map(([field, messages]) => {
                const msgArray = Array.isArray(messages) ? messages : [messages];
                return `${field}: ${msgArray.join(', ')}`;
              })
              .join('; ');
            throw new Error(`Dades invàlides: ${errorMessages}`);
          }
          throw new Error(errorData.error || 'Dades invàlides per crear la proposta');
        } else if (response.status === 401) {
          throw new Error('No estàs autenticat. Si us plau, inicia sessió.');
        } else if (response.status === 500) {
          throw new Error('Error del servidor. Si us plau, intenta-ho més tard.');
        }
        
        throw new Error(errorData.error || 'No s\'ha pogut crear la proposta');
      }
      
      const proposalDTO: RefugeProposalDTO = await response.json();
      return mapRefugeProposalFromDTO(proposalDTO);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      console.error('Error creating refuge proposal:', error);
      throw new Error('No s\'ha pogut crear la proposta de refugi');
    }
  }

  /**
   * Llista totes les propostes de refugis (només admins)
   * 
   * @param status - Filtre opcional per status (pending, approved, rejected)
   * @param refugeId - Filtre opcional per ID del refugi
   * @returns Array de propostes
   * @throws Error amb missatge descriptiu en cas d'error
   */
  static async listProposals(
    status?: RefugeProposalStatus,
    refugeId?: string
  ): Promise<RefugeProposal[]> {
    try {
      const params = new URLSearchParams();
      
      if (status) {
        params.append('status', status);
      }
      if (refugeId) {
        params.append('refuge-id', refugeId);
      }
      
      const queryString = params.toString();
      const url = `${API_BASE_URL}/refuges-proposals/${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiGet(url);
      
      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json().catch(() => ({ 
          error: `Error ${response.status}: ${response.statusText}` 
        }));
        
        if (response.status === 400) {
          throw new Error(errorData.error || 'Paràmetres de filtre invàlids');
        } else if (response.status === 401) {
          throw new Error('No estàs autenticat. Si us plau, inicia sessió.');
        } else if (response.status === 403) {
          throw new Error('No tens permisos per veure les propostes. Només els administradors poden accedir a aquesta funcionalitat.');
        } else if (response.status === 500) {
          throw new Error('Error del servidor. Si us plau, intenta-ho més tard.');
        }
        
        throw new Error(errorData.error || 'No s\'han pogut carregar les propostes');
      }
      
      const proposalsDTO: RefugeProposalDTO[] = await response.json();
      
      if (!Array.isArray(proposalsDTO)) {
        console.error('Expected array but got:', proposalsDTO);
        return [];
      }
      
      return mapRefugeProposalsFromDTO(proposalsDTO);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      console.error('Error listing refuge proposals:', error);
      throw new Error('No s\'han pogut carregar les propostes de refugis');
    }
  }

  /**
   * Llista les propostes creades per l'usuari autenticat
   *
   * @param status - Filtre opcional per status (pending, approved, rejected)
   * @returns Array de propostes creades per l'usuari
   * @throws Error amb missatge descriptiu en cas d'error
   */
  static async listMyProposals(
    status?: RefugeProposalStatus
  ): Promise<RefugeProposal[]> {
    try {
      const params = new URLSearchParams();
      if (status) {
        params.append('status', status);
      }

      const queryString = params.toString();
      const url = `${API_BASE_URL}/my-refuges-proposals/${queryString ? `?${queryString}` : ''}`;

      const response = await apiGet(url);

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json().catch(() => ({ 
          error: `Error ${response.status}: ${response.statusText}` 
        }));

        if (response.status === 400) {
          throw new Error(errorData.error || 'Paràmetres de filtre invàlids');
        } else if (response.status === 401) {
          throw new Error('No estàs autenticat. Si us plau, inicia sessió.');
        } else if (response.status === 500) {
          throw new Error('Error del servidor. Si us plau, intenta-ho més tard.');
        }

        throw new Error(errorData.error || 'No s\'han pogut carregar les teves propostes');
      }

      const proposalsDTO: RefugeProposalDTO[] = await response.json();

      if (!Array.isArray(proposalsDTO)) {
        console.error('Expected array but got:', proposalsDTO);
        return [];
      }

      console.log('[RefugeProposalsService] Mapping', proposalsDTO.length, 'proposals');
      return mapRefugeProposalsFromDTO(proposalsDTO);
    } catch (error) {
      if (error instanceof Error) {
        console.error('[RefugeProposalsService] Error in listMyProposals:', error.message, error);
        throw error;
      }
      console.error('Error listing my refuge proposals:', error);
      throw new Error('No s\'han pogut carregar les teves propostes de refugis');
    }
  }

  /**
   * Aprova una proposta de refugi (només admins)
   * 
   * @param proposalId - ID de la proposta a aprovar
   * @returns true si s'ha aprovat correctament
   * @throws Error amb missatge descriptiu en cas d'error
   */
  static async approveProposal(proposalId: string): Promise<boolean> {
    try {
      const url = `${API_BASE_URL}/refuges-proposals/${proposalId}/approve/`;
      const response = await apiPost(url, {});
      
      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json().catch(() => ({ 
          error: `Error ${response.status}: ${response.statusText}` 
        }));
        
        if (response.status === 400) {
          throw new Error(errorData.error || 'Paràmetres invàlids');
        } else if (response.status === 401) {
          throw new Error('No estàs autenticat. Si us plau, inicia sessió.');
        } else if (response.status === 403) {
          throw new Error('No tens permisos per aprovar propostes. Només els administradors poden fer aquesta acció.');
        } else if (response.status === 404) {
          throw new Error('No s\'ha trobat la proposta especificada');
        } else if (response.status === 409) {
          throw new Error('Aquesta proposta ja ha estat revisada anteriorment');
        } else if (response.status === 500) {
          throw new Error('Error del servidor. Si us plau, intenta-ho més tard.');
        }
        
        throw new Error(errorData.error || 'No s\'ha pogut aprovar la proposta');
      }
      
      return true;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      console.error('Error approving refuge proposal:', error);
      throw new Error('No s\'ha pogut aprovar la proposta de refugi');
    }
  }

  /**
   * Rebutja una proposta de refugi (només admins)
   * 
   * @param proposalId - ID de la proposta a rebutjar
   * @param reason - Raó opcional del rebuig
   * @returns true si s'ha rebutjat correctament
   * @throws Error amb missatge descriptiu en cas d'error
   */
  static async rejectProposal(
    proposalId: string, 
    reason?: string
  ): Promise<boolean> {
    try {
      const url = `${API_BASE_URL}/refuges-proposals/${proposalId}/reject/`;
      const body: RefugeProposalRejectDTO = reason ? { reason } : {};
      
      const response = await apiPost(url, body);
      
      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json().catch(() => ({ 
          error: `Error ${response.status}: ${response.statusText}` 
        }));
        
        if (response.status === 400) {
          throw new Error(errorData.error || 'Paràmetres invàlids');
        } else if (response.status === 401) {
          throw new Error('No estàs autenticat. Si us plau, inicia sessió.');
        } else if (response.status === 403) {
          throw new Error('No tens permisos per rebutjar propostes. Només els administradors poden fer aquesta acció.');
        } else if (response.status === 404) {
          throw new Error('No s\'ha trobat la proposta especificada');
        } else if (response.status === 409) {
          throw new Error('Aquesta proposta ja ha estat revisada anteriorment');
        } else if (response.status === 500) {
          throw new Error('Error del servidor. Si us plau, intenta-ho més tard.');
        }
        
        throw new Error(errorData.error || 'No s\'ha pogut rebutjar la proposta');
      }
      
      return true;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      console.error('Error rejecting refuge proposal:', error);
      throw new Error('No s\'ha pogut rebutjar la proposta de refugi');
    }
  }

  /**
   * Crea una proposta per crear un nou refugi
   * 
   * @param payload - Dades del refugi a crear (format Location del frontend)
   * @param comment - Comentari opcional de la proposta
   * @returns La proposta creada
   * @throws Error amb missatge descriptiu en cas d'error
   */
  static async proposalCreateRefuge(
    payload: Location,
    comment?: string
  ): Promise<RefugeProposal> {
    const data: RefugeProposalCreateDTO = {
      action: 'create',
      payload: mapPartialRefugiToDTO(payload, 'create'),
      comment: comment || null
    };
    
    return await this.createProposal(data);
  }

  /**
   * Crea una proposta per editar un refugi existent
   * 
   * @param refugeId - ID del refugi a editar
   * @param payload - Dades a modificar del refugi (format Partial<Location> del frontend)
   * @param comment - Comentari opcional de la proposta
   * @returns La proposta creada
   * @throws Error amb missatge descriptiu en cas d'error
   */
  static async proposalEditRefuge(
    refugeId: string,
    payload: Partial<Location>,
    comment?: string
  ): Promise<RefugeProposal> {
    const data: RefugeProposalCreateDTO = {
      refuge_id: refugeId,
      action: 'update',
      payload: mapPartialRefugiToDTO(payload, 'update'),
      comment: comment || null
    };
    
    return await this.createProposal(data);
  }

  /**
   * Crea una proposta per eliminar un refugi existent
   * 
   * @param refugeId - ID del refugi a eliminar
   * @param comment - Comentari opcional de la proposta
   * @returns La proposta creada
   * @throws Error amb missatge descriptiu en cas d'error
   */
  static async proposalDeleteRefuge(
    refugeId: string,
    comment?: string
  ): Promise<RefugeProposal> {
    const data: RefugeProposalCreateDTO = {
      refuge_id: refugeId,
      action: 'delete',
      comment: comment || null
    };
    
    return await this.createProposal(data);
  }
}
