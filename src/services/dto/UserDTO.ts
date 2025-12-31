/**
 * DTOs per a les respostes del backend d'Usuaris
 */

export interface AvatarMetadataDTO {
  key: string;
  url: string;
  uploaded_at: string; // ISO date string
}

export interface UserDTO {
    uid: string;
    username: string;
    email: string;
    avatar_metadata?: AvatarMetadataDTO | null;
    language: string;
    favourite_refuges?: string[] | null;
    visited_refuges?: string[] | null;
    renovations?: string[] | null;
    uploaded_photos_keys?: string[] | null;
    num_shared_experiences?: number | null;
    num_renovated_refuges?: number | null;
    created_at: string; // ISO date string
}