/**
 * DTOs per a les respostes del backend d'Usuaris
 */

export interface UserDTO {
    uid: string;
    username: string;
    email: string;
    avatar?: string | null;
    idioma: string;
    refugis_favorits?: number[] | null;
    refugis_visitats?: number[] | null;
    reformes?: string[] | null;
    num_fotos_pujades?: number | null;
    num_experiencies_compartides?: number | null;
    num_refugis_reformats?: number | null;
    created_at: string; // ISO date string
}