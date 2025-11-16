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
    idioma: userDTO.idioma,
    refugis_favorits: userDTO.refugis_favorits || [],
    refugis_visitats: userDTO.refugis_visitats || [],
    reformes: userDTO.reformes || [],
    num_fotos_pujades: userDTO.num_fotos_pujades ?? null,
    num_experiencies_compartides: userDTO.num_experiencies_compartides ?? null,
    num_refugis_reformats: userDTO.num_refugis_reformats ?? null,
    created_at: userDTO.created_at,
  };
}