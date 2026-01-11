/**
 * Mappers per convertir DTOs del backend al format del frontend per RefugeVisit
 */

import { RefugeVisit } from '../../models';
import { RefugeVisitListItemDTO } from '../dto/RefugeVisitDTO';

/**
 * Converteix un RefugeVisitListItemDTO al format RefugeVisit del frontend
 * 
 * @param dto - DTO del backend
 * @returns Model RefugeVisit per al frontend
 */
export function mapRefugeVisitFromDTO(dto: RefugeVisitListItemDTO): RefugeVisit {
  return {
    date: dto.date,
    refuge_id: dto.refuge_id,
    total_visitors: dto.total_visitors,
    is_visitor: dto.is_visitor,
    num_visitors: dto.num_visitors,
  };
}

/**
 * Converteix un array de RefugeVisitListItemDTO al format RefugeVisit del frontend
 * 
 * @param dtos - Array de DTOs del backend
 * @returns Array de models RefugeVisit per al frontend
 */
export function mapRefugeVisitsFromDTO(dtos: RefugeVisitListItemDTO[]): RefugeVisit[] {
  return dtos.map(mapRefugeVisitFromDTO);
}
