/**
 * DTOs per a les propostes de refugis
 */

import { RefugiDTO } from './RefugiDTO';

/**
 * DTO per a la resposta d'una proposta de refugi
 */
export interface RefugeProposalDTO {
  id: string;
  refuge_id: string | null;
  action: 'create' | 'update' | 'delete';
  payload: Partial<RefugiDTO> | null;
  comment: string | null;
  status: 'pending' | 'approved' | 'rejected';
  creator_uid: string;
  created_at: string; // ISO date string
  reviewer_uid: string | null;
  reviewed_at: string | null;
  rejection_reason?: string | null;
}

/**
 * DTO per crear una proposta de refugi
 */
export interface RefugeProposalCreateDTO {
  refuge_id?: string | null;
  action: 'create' | 'update' | 'delete';
  payload?: Partial<RefugiDTO> | null;
  comment?: string | null;
}

/**
 * DTO per rebutjar una proposta
 */
export interface RefugeProposalRejectDTO {
  reason?: string;
}

/**
 * DTO per la resposta de llista de propostes
 */
export type RefugeProposalListDTO = RefugeProposalDTO[];
