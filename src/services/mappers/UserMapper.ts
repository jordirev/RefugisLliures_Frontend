/**
 * Mappers per convertir DTOs del backend al format del frontend
 */

import { User } from '../../models'
import { UserDTO } from '../dto/UserDTO';

export function mapAvatarMetadataFromDTO(avatarDTO: any | undefined): any | undefined {
  if (!avatarDTO) return undefined;
  return {
    key: avatarDTO.key,
    url: avatarDTO.url,
    uploaded_at: avatarDTO.uploaded_at,
  };
}

/**
 * Converteix un UserDTO al format User del frontend
 */
export function mapUserFromDTO(userDTO: UserDTO): User {
  return {
    uid: userDTO.uid,
    username: userDTO.username,
    email: userDTO.email,
    avatar_metadata: mapAvatarMetadataFromDTO(userDTO.avatar_metadata) || null,
    language: userDTO.language,
    favourite_refuges: userDTO.favourite_refuges || [],
    visited_refuges: userDTO.visited_refuges || [],
    num_uploaded_photos: userDTO.num_uploaded_photos ?? null,
    num_shared_experiences: userDTO.num_shared_experiences ?? null,
    num_renovated_refuges: userDTO.num_renovated_refuges ?? null,
    created_at: userDTO.created_at,
  };
}