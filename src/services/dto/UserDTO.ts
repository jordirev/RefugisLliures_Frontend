/**
 * DTOs per a les respostes del backend d'Usuaris
 */

export interface UserDTO {
    uid: string;
    username: string;
    email: string;
    avatar?: string | null;
    language: string;
    favourite_refuges?: string[] | null;
    visited_refuges?: string[] | null;
    renovations?: string[] | null;
    num_uploaded_photos?: number | null;
    num_shared_experiences?: number | null;
    num_renovated_refuges?: number | null;
    created_at: string; // ISO date string
}