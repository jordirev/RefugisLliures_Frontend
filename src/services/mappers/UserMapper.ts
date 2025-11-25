/**
 * Mappers per convertir DTOs del backend al format del frontend
 */

import { User } from '../../models'
import { UserDTO } from '../dto/UserDTO';

/**
 * Converteix un UserDTO al format User del frontend
 */
export function mapUserFromDTO(userDTO: UserDTO): User {
  return {
    uid: userDTO.uid,
    username: userDTO.username,
    email: userDTO.email,
    avatar: userDTO.avatar || undefined,
    language: userDTO.language,
    favourite_refuges: userDTO.favourite_refuges || [],
    visited_refuges: userDTO.visited_refuges || [],
    renovations: userDTO.renovations || [],
    num_uploaded_photos: userDTO.num_uploaded_photos ?? null,
    num_shared_experiences: userDTO.num_shared_experiences ?? null,
    num_renovated_refuges: userDTO.num_renovated_refuges ?? null,
    created_at: userDTO.created_at,
  };
}