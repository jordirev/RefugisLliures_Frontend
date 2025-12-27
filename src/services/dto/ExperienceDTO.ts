/**
 * DTOs per a les respostes del backend de les Experiències de Refugis
 */

import { ImageMetadataDTO } from './RefugiDTO';

/**
 * DTO per a una experiència individual
 */
export interface ExperienceDTO {
  id: string;
  refuge_id: string;
  creator_uid: string;
  modified_at: string; // Format: DD/MM/YYYY
  comment: string;
  images_metadata?: ImageMetadataDTO[];
}

/**
 * DTO per la resposta de llista d'experiències
 */
export interface ExperienceListResponseDTO {
  experiences: ExperienceDTO[];
}

/**
 * DTO per la resposta de creació/actualització d'experiència
 */
export interface ExperienceCreateResponseDTO {
  experience: ExperienceDTO;
  uploaded_files?: string[]; // Array de media_keys dels fitxers pujats
  failed_files?: string[]; // Array de noms de fitxers que han fallat
  message?: string; // Missatge d'error parcial si n'hi ha
}

/**
 * DTO per la resposta de actualització d'experiència
 */
export interface ExperienceUpdateResponseDTO {
  experience?: ExperienceDTO;
  uploaded_files?: string[]; // Array de media_keys dels fitxers pujats
  failed_files?: string[]; // Array de noms de fitxers que han fallat
  message?: string; // Missatge d'error parcial si n'hi ha
}

/**
 * DTO per la resposta d'eliminació d'experiència
 */
export interface ExperienceDeleteResponseDTO {
  success: boolean;
  message: string;
}
