/**
 * DTOs per a les respostes del backend de les Renovacions de Refugis
 */

export interface RenovationDTO {
    id: string;
    creator_uid: string;
    refuge_id: string;
    ini_date: string; // ISO date string
    fin_date: string; // ISO date string
    description: string;
    materials_needed?: string | null;
    /** Només per al creador, els participants i els admins; per a la resta, la clau s'omet
     * (també a les reformes passades d'un creador esborrat, `creator_uid: 'unknown'`) */
    group_link?: string;
    participants_uids?: string[] | null;
}
