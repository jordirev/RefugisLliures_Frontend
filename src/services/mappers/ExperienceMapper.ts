/**
 * Mappers per convertir DTOs del backend al format del frontend per Experiències
 */

import { Experience } from '../../models';
import { ExperienceDTO } from '../dto/ExperienceDTO';
import { mapImageMetadataFromDTO } from './RefugiMapper';

/**
 * Converteix un ExperienceDTO al format Experience del frontend
 */
export function mapExperienceFromDTO(experienceDTO: ExperienceDTO): Experience {
  return {
    id: experienceDTO.id,
    refuge_id: experienceDTO.refuge_id,
    creator_uid: experienceDTO.creator_uid,
    modified_at: experienceDTO.modified_at,
    comment: experienceDTO.comment,
    images_metadata: experienceDTO.images_metadata 
      ? experienceDTO.images_metadata.map(mapImageMetadataFromDTO)
      : undefined,
  };
}
