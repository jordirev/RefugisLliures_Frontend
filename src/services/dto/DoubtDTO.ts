/**
 * DTOs per a les respostes del backend dels Dubtes i Respostes de Refugis
 */

export interface AnswerDTO {
  id: string;
  creator_uid: string;
  message: string;
  created_at: string; // ISO 8601 format
  parent_answer_id?: string | null;
}

export interface DoubtDTO {
  id: string;
  refuge_id: string;
  creator_uid: string;
  message: string;
  created_at: string; // ISO 8601 format
  answers_count: number;
  answers?: AnswerDTO[];
}
