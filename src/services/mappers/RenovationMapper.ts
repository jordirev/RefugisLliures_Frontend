/**
 * Mappers per convertir DTOs del backend al format del frontend
 */

import { Renovation } from '../../models'
import { RenovationDTO } from '../dto/RenovationDTO';

/**
 * Converteix un RenovationDTO al format Renovation del frontend
 */
export function mapRenovationFromDTO(renovationDTO: RenovationDTO): Renovation {
  return {
    id: renovationDTO.id,
    creator_uid: renovationDTO.creator_uid,
    refuge_id: renovationDTO.refuge_id,
    ini_date: renovationDTO.ini_date,
    fin_date: renovationDTO.fin_date,
    description: renovationDTO.description,
    materials_needed: renovationDTO.materials_needed || null,
    // La clau pot ser absent: no s'inventa cap valor
    group_link: renovationDTO.group_link ?? undefined,
    participants_uids: renovationDTO.participants_uids || [],
  };
}