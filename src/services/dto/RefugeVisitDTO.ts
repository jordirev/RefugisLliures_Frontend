/**
 * DTOs per a les respostes del backend de les Visites a Refugis
 */

/**
 * DTO per la llista de visites (resposta GET)
 * Inclou informació sobre si el current user és visitant
 */
export interface RefugeVisitListItemDTO {
  date: string; // Format: YYYY-MM-DD
  refuge_id: string;
  total_visitors: number;
  is_visitor: boolean;
  num_visitors: number;
}

/**
 * DTO per la resposta de GET /refuges/{id}/visits/
 */
export interface RefugeVisitsResponseDTO {
  result: RefugeVisitListItemDTO[];
}

/**
 * DTO per la resposta de GET /users/{uid}/visits/
 */
export interface UserVisitsResponseDTO {
  result: RefugeVisitListItemDTO[];
}

/**
 * DTO per crear una nova visita (POST)
 */
export interface CreateRefugeVisitRequestDTO {
  num_visitors: number;
}

/**
 * DTO per la resposta de POST /refuges/{id}/visits/{date}/
 */
export interface CreateRefugeVisitResponseDTO {
  message: string;
  visit: RefugeVisitListItemDTO;
}

/**
 * DTO per actualitzar una visita (PATCH)
 */
export interface UpdateRefugeVisitRequestDTO {
  num_visitors: number;
}

/**
 * DTO per la resposta de PATCH /refuges/{id}/visits/{date}/
 */
export interface UpdateRefugeVisitResponseDTO {
  message: string;
  visit: RefugeVisitListItemDTO;
}

/**
 * DTO per la resposta de DELETE /refuges/{id}/visits/{date}/
 */
export interface DeleteRefugeVisitResponseDTO {
  message: string;
}

/**
 * DTO per errors de l'API de visites
 */
export interface RefugeVisitErrorResponseDTO {
  error: string;
  message?: string;
}
