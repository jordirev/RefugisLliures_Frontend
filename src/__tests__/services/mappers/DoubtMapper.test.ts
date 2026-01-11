/**
 * Tests for DoubtMapper functions
 */

import {
  mapAnswerFromDTO,
  mapDoubtFromDTO,
} from '../../../services/mappers/DoubtMapper';
import { AnswerDTO, DoubtDTO } from '../../../services/dto/DoubtDTO';

describe('DoubtMapper', () => {
  describe('mapAnswerFromDTO', () => {
    const validAnswerDTO: AnswerDTO = {
      id: 'answer-1',
      creator_uid: 'user-123',
      message: 'This is a helpful answer',
      created_at: '2024-01-15T10:00:00Z',
      parent_answer_id: null,
    };

    it('should convert a complete answer DTO to Answer model', () => {
      const result = mapAnswerFromDTO(validAnswerDTO);

      expect(result.id).toBe('answer-1');
      expect(result.creator_uid).toBe('user-123');
      expect(result.message).toBe('This is a helpful answer');
      expect(result.created_at).toBe('2024-01-15T10:00:00Z');
      expect(result.parent_answer_id).toBeNull();
    });

    it('should handle answer that is a reply (has parent_answer_id)', () => {
      const replyAnswerDTO: AnswerDTO = {
        ...validAnswerDTO,
        id: 'answer-2',
        parent_answer_id: 'answer-1',
      };

      const result = mapAnswerFromDTO(replyAnswerDTO);

      expect(result.parent_answer_id).toBe('answer-1');
    });

    it('should handle answer with undefined parent_answer_id', () => {
      const answerWithUndefinedParent: AnswerDTO = {
        ...validAnswerDTO,
        parent_answer_id: undefined as any,
      };

      const result = mapAnswerFromDTO(answerWithUndefinedParent);

      expect(result.parent_answer_id).toBeNull();
    });

    it('should handle answer with empty message', () => {
      const answerEmptyMessage: AnswerDTO = {
        ...validAnswerDTO,
        message: '',
      };

      const result = mapAnswerFromDTO(answerEmptyMessage);

      expect(result.message).toBe('');
    });
  });

  describe('mapDoubtFromDTO', () => {
    const validDoubtDTO: DoubtDTO = {
      id: 'doubt-1',
      refuge_id: 'refuge-1',
      creator_uid: 'user-123',
      message: 'Is there water available at this refuge?',
      created_at: '2024-01-15T10:00:00Z',
      answers_count: 2,
      answers: [
        {
          id: 'answer-1',
          creator_uid: 'user-456',
          message: 'Yes, there is a spring nearby',
          created_at: '2024-01-15T11:00:00Z',
          parent_answer_id: null,
        },
        {
          id: 'answer-2',
          creator_uid: 'user-789',
          message: 'I confirm, water is available',
          created_at: '2024-01-15T12:00:00Z',
          parent_answer_id: null,
        },
      ],
    };

    it('should convert a complete doubt DTO to Doubt model', () => {
      const result = mapDoubtFromDTO(validDoubtDTO);

      expect(result.id).toBe('doubt-1');
      expect(result.refuge_id).toBe('refuge-1');
      expect(result.creator_uid).toBe('user-123');
      expect(result.message).toBe('Is there water available at this refuge?');
      expect(result.created_at).toBe('2024-01-15T10:00:00Z');
      expect(result.answers_count).toBe(2);
      expect(result.answers).toHaveLength(2);
    });

    it('should correctly map answers within doubt', () => {
      const result = mapDoubtFromDTO(validDoubtDTO);

      expect(result.answers[0].id).toBe('answer-1');
      expect(result.answers[0].creator_uid).toBe('user-456');
      expect(result.answers[1].id).toBe('answer-2');
      expect(result.answers[1].creator_uid).toBe('user-789');
    });

    it('should handle doubt without answers (undefined)', () => {
      const doubtWithoutAnswers: DoubtDTO = {
        ...validDoubtDTO,
        answers: undefined,
        answers_count: 0,
      };

      const result = mapDoubtFromDTO(doubtWithoutAnswers);

      expect(result.answers).toEqual([]);
      expect(result.answers_count).toBe(0);
    });

    it('should handle doubt with empty answers array', () => {
      const doubtEmptyAnswers: DoubtDTO = {
        ...validDoubtDTO,
        answers: [],
        answers_count: 0,
      };

      const result = mapDoubtFromDTO(doubtEmptyAnswers);

      expect(result.answers).toEqual([]);
    });

    it('should handle doubt with nested replies', () => {
      const doubtWithReplies: DoubtDTO = {
        ...validDoubtDTO,
        answers: [
          {
            id: 'answer-1',
            creator_uid: 'user-456',
            message: 'First answer',
            created_at: '2024-01-15T11:00:00Z',
            parent_answer_id: null,
          },
          {
            id: 'answer-2',
            creator_uid: 'user-789',
            message: 'Reply to first answer',
            created_at: '2024-01-15T12:00:00Z',
            parent_answer_id: 'answer-1',
          },
        ],
      };

      const result = mapDoubtFromDTO(doubtWithReplies);

      expect(result.answers[0].parent_answer_id).toBeNull();
      expect(result.answers[1].parent_answer_id).toBe('answer-1');
    });

    it('should handle doubt with empty message', () => {
      const doubtEmptyMessage: DoubtDTO = {
        ...validDoubtDTO,
        message: '',
      };

      const result = mapDoubtFromDTO(doubtEmptyMessage);

      expect(result.message).toBe('');
    });

    it('should handle doubt with many answers', () => {
      const manyAnswers = Array.from({ length: 50 }, (_, i) => ({
        id: `answer-${i}`,
        creator_uid: `user-${i}`,
        message: `Answer number ${i}`,
        created_at: '2024-01-15T10:00:00Z',
        parent_answer_id: null,
      }));

      const doubtManyAnswers: DoubtDTO = {
        ...validDoubtDTO,
        answers: manyAnswers,
        answers_count: 50,
      };

      const result = mapDoubtFromDTO(doubtManyAnswers);

      expect(result.answers).toHaveLength(50);
      expect(result.answers_count).toBe(50);
    });
  });
});
