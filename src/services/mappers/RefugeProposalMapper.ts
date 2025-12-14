/**
 * Mappers per convertir DTOs de propostes de refugis al format del frontend
 */

import { RefugeProposal, RefugeProposalAction, RefugeProposalStatus } from '../../models';
import { RefugeProposalDTO } from '../dto/RefugeProposalDTO';
import { mapRefugiFromDTO } from './RefugiMapper';

/**
 * Converteix un RefugeProposalDTO al format RefugeProposal del frontend
 */
export function mapRefugeProposalFromDTO(dto: RefugeProposalDTO): RefugeProposal {
  return {
    id: dto.id,
    refuge_id: dto.refuge_id,
    action: dto.action as RefugeProposalAction,
    payload: dto.payload ? mapRefugiFromDTO(dto.payload as any) : null,
    comment: dto.comment,
    status: dto.status as RefugeProposalStatus,
    creator_uid: dto.creator_uid,
    created_at: dto.created_at,
    reviewer_uid: dto.reviewer_uid,
    reviewed_at: dto.reviewed_at,
    rejection_reason: dto.rejection_reason,
  };
}

/**
 * Converteix un array de RefugeProposalDTO al format RefugeProposal[]
 */
export function mapRefugeProposalsFromDTO(dtos: RefugeProposalDTO[]): RefugeProposal[] {
  return dtos.map(mapRefugeProposalFromDTO);
}
