/**
 * Mappers per convertir DTOs de propostes de refugis al format del frontend
 */

import { RefugeProposal, RefugeProposalAction, RefugeProposalStatus } from '../../models';
import { RefugeProposalDTO } from '../dto/RefugeProposalDTO';
import { mapRefugiFromDTO } from './RefugiMapper';
import { RefugiDTO } from '../dto/RefugiDTO';

/**
 * Mapa un snapshot a Location, gestionant camps opcionals
 */
function mapSnapshotFromDTO(dto: Partial<RefugiDTO> | null): any {
  if (!dto) return null;
  
  try {
    // Si té totes les propietats necessàries, usar el mapper complet
    if (dto.coord && dto.name) {
      return mapRefugiFromDTO(dto as RefugiDTO);
    }
    
    // Sinó, retornar l'objecte parcial tal qual
    return dto;
  } catch (error) {
    console.error('[RefugeProposalMapper] Error mapping snapshot:', error);
    return dto;
  }
}

/**
 * Converteix un RefugeProposalDTO al format RefugeProposal del frontend
 */
export function mapRefugeProposalFromDTO(dto: RefugeProposalDTO): RefugeProposal {
  try {
    return {
      id: dto.id,
      refuge_id: dto.refuge_id,
      refuge_snapshot: mapSnapshotFromDTO(dto.refuge_snapshot),
      action: dto.action as RefugeProposalAction,
      payload: dto.payload, // Keep payload as raw object to preserve deleted vs missing fields
      comment: dto.comment,
      status: dto.status as RefugeProposalStatus,
      creator_uid: dto.creator_uid,
      created_at: dto.created_at,
      reviewer_uid: dto.reviewer_uid,
      reviewed_at: dto.reviewed_at,
      rejection_reason: dto.rejection_reason,
    };
  } catch (error) {
    console.error('[RefugeProposalMapper] Error mapping proposal:', dto.id, error);
    console.error('[RefugeProposalMapper] DTO:', JSON.stringify(dto));
    throw error;
  }
}

/**
 * Converteix un array de RefugeProposalDTO al format RefugeProposal[]
 */
export function mapRefugeProposalsFromDTO(dtos: RefugeProposalDTO[]): RefugeProposal[] {
  return dtos.map(mapRefugeProposalFromDTO);
}
