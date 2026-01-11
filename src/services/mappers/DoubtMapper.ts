/**
 * Mappers per convertir DTOs del backend al format del frontend
 */

import { Doubt, Answer } from '../../models';
import { DoubtDTO, AnswerDTO } from '../dto/DoubtDTO';

/**
 * Converteix un AnswerDTO al format Answer del frontend
 */
export function mapAnswerFromDTO(answerDTO: AnswerDTO): Answer {
  return {
    id: answerDTO.id,
    creator_uid: answerDTO.creator_uid,
    message: answerDTO.message,
    created_at: answerDTO.created_at,
    parent_answer_id: answerDTO.parent_answer_id || null,
  };
}

/**
 * Converteix un DoubtDTO al format Doubt del frontend
 */
export function mapDoubtFromDTO(doubtDTO: DoubtDTO): Doubt {
  return {
    id: doubtDTO.id,
    refuge_id: doubtDTO.refuge_id,
    creator_uid: doubtDTO.creator_uid,
    message: doubtDTO.message,
    created_at: doubtDTO.created_at,
    answers_count: doubtDTO.answers_count,
    answers: doubtDTO.answers ? doubtDTO.answers.map(mapAnswerFromDTO) : [],
  };
}
