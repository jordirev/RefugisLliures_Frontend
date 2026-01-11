/**
 * Tests unitaris per DoubtMapper
 * 
 * Cobreix:
 * - mapAnswerFromDTO
 * - mapDoubtFromDTO
 */

import { mapAnswerFromDTO, mapDoubtFromDTO } from '../../../services/mappers/DoubtMapper';
import { DoubtDTO, AnswerDTO } from '../../../services/dto/DoubtDTO';

describe('DoubtMapper', () => {
  describe('mapAnswerFromDTO', () => {
    it('hauria de mapejar correctament una resposta', () => {
      const answerDTO: AnswerDTO = {
        id: 'answer-1',
        creator_uid: 'user-123',
        message: 'Aquesta és una resposta de prova',
        created_at: '2025-06-15T10:30:00Z',
        parent_answer_id: null,
      };

      const result = mapAnswerFromDTO(answerDTO);

      expect(result).toEqual({
        id: 'answer-1',
        creator_uid: 'user-123',
        message: 'Aquesta és una resposta de prova',
        created_at: '2025-06-15T10:30:00Z',
        parent_answer_id: null,
      });
    });

    it('hauria de mapejar correctament una resposta amb parent_answer_id', () => {
      const answerDTO: AnswerDTO = {
        id: 'answer-2',
        creator_uid: 'user-456',
        message: 'Resposta a una resposta',
        created_at: '2025-06-16T12:00:00Z',
        parent_answer_id: 'answer-1',
      };

      const result = mapAnswerFromDTO(answerDTO);

      expect(result.parent_answer_id).toBe('answer-1');
    });

    it('hauria de convertir parent_answer_id undefined a null', () => {
      const answerDTO: AnswerDTO = {
        id: 'answer-3',
        creator_uid: 'user-789',
        message: 'Altra resposta',
        created_at: '2025-06-17T14:00:00Z',
        parent_answer_id: undefined,
      };

      const result = mapAnswerFromDTO(answerDTO);

      expect(result.parent_answer_id).toBeNull();
    });
  });

  describe('mapDoubtFromDTO', () => {
    it('hauria de mapejar correctament un dubte sense respostes', () => {
      const doubtDTO: DoubtDTO = {
        id: 'doubt-1',
        refuge_id: 'refuge-123',
        creator_uid: 'user-abc',
        message: 'Quin és el millor moment per visitar?',
        created_at: '2025-06-10T08:00:00Z',
        answers_count: 0,
        answers: [],
      };

      const result = mapDoubtFromDTO(doubtDTO);

      expect(result).toEqual({
        id: 'doubt-1',
        refuge_id: 'refuge-123',
        creator_uid: 'user-abc',
        message: 'Quin és el millor moment per visitar?',
        created_at: '2025-06-10T08:00:00Z',
        answers_count: 0,
        answers: [],
      });
    });

    it('hauria de mapejar correctament un dubte amb respostes', () => {
      const doubtDTO: DoubtDTO = {
        id: 'doubt-2',
        refuge_id: 'refuge-456',
        creator_uid: 'user-def',
        message: 'Hi ha aigua potable?',
        created_at: '2025-06-11T09:00:00Z',
        answers_count: 2,
        answers: [
          {
            id: 'answer-1',
            creator_uid: 'user-ghi',
            message: 'Sí, hi ha una font',
            created_at: '2025-06-11T10:00:00Z',
            parent_answer_id: null,
          },
          {
            id: 'answer-2',
            creator_uid: 'user-jkl',
            message: 'Cal portar filtre',
            created_at: '2025-06-11T11:00:00Z',
            parent_answer_id: 'answer-1',
          },
        ],
      };

      const result = mapDoubtFromDTO(doubtDTO);

      expect(result.answers).toHaveLength(2);
      expect(result.answers[0].message).toBe('Sí, hi ha una font');
      expect(result.answers[1].parent_answer_id).toBe('answer-1');
    });

    it('hauria de retornar array buit si answers és undefined', () => {
      const doubtDTO: DoubtDTO = {
        id: 'doubt-3',
        refuge_id: 'refuge-789',
        creator_uid: 'user-mno',
        message: 'Pregunta sense respostes',
        created_at: '2025-06-12T07:00:00Z',
        answers_count: 0,
        answers: undefined as any,
      };

      const result = mapDoubtFromDTO(doubtDTO);

      expect(result.answers).toEqual([]);
    });
  });
});
