/**
 * Tests for DoubtsService
 */

import { DoubtsService } from '../../services/DoubtsService';
import { apiGet, apiPost, apiDelete } from '../../services/apiClient';

// Mock apiClient
jest.mock('../../services/apiClient');

const mockedApiGet = apiGet as jest.MockedFunction<typeof apiGet>;
const mockedApiPost = apiPost as jest.MockedFunction<typeof apiPost>;
const mockedApiDelete = apiDelete as jest.MockedFunction<typeof apiDelete>;

// Mock data
const mockDoubtDTO = {
  id: 'doubt-1',
  refuge_id: 'refuge-1',
  user_uid: 'user-123',
  username: 'TestUser',
  message: 'Test doubt message',
  created_at: '2024-01-15T10:00:00Z',
  answers: [],
};

const mockAnswerDTO = {
  id: 'answer-1',
  doubt_id: 'doubt-1',
  user_uid: 'user-456',
  username: 'Answerer',
  message: 'Test answer message',
  parent_answer_id: null,
  created_at: '2024-01-15T11:00:00Z',
  replies: [],
};

describe('DoubtsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDoubtsByRefuge', () => {
    it('should fetch doubts for a refuge', async () => {
      mockedApiGet.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [mockDoubtDTO],
      } as Response);

      const result = await DoubtsService.getDoubtsByRefuge('refuge-1');

      expect(result).toEqual([mockDoubtDTO]);
      expect(mockedApiGet).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/doubts/?refuge_id=refuge-1'
      );
    });

    it('should return empty array when no doubts', async () => {
      mockedApiGet.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [],
      } as Response);

      const result = await DoubtsService.getDoubtsByRefuge('refuge-1');

      expect(result).toEqual([]);
    });

    it('should throw error when refuge not found', async () => {
      mockedApiGet.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Refugi no trobat' }),
      } as Response);

      await expect(DoubtsService.getDoubtsByRefuge('invalid')).rejects.toThrow('Refugi no trobat');
    });

    it('should throw generic error on other failures', async () => {
      mockedApiGet.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
      } as Response);

      await expect(DoubtsService.getDoubtsByRefuge('refuge-1')).rejects.toThrow('Error 500: Internal Server Error');
    });

    it('should handle network errors', async () => {
      mockedApiGet.mockRejectedValue(new Error('Network error'));

      await expect(DoubtsService.getDoubtsByRefuge('refuge-1')).rejects.toThrow('Network error');
    });
  });

  describe('createDoubt', () => {
    it('should create a new doubt', async () => {
      mockedApiPost.mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => mockDoubtDTO,
      } as Response);

      const request = { refuge_id: 'refuge-1', message: 'Test doubt message' };
      const result = await DoubtsService.createDoubt(request);

      expect(result).toEqual(mockDoubtDTO);
      expect(mockedApiPost).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/doubts/',
        request
      );
    });

    it('should throw error on invalid data', async () => {
      mockedApiPost.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Dades invàlides' }),
      } as Response);

      await expect(DoubtsService.createDoubt({ refuge_id: '', message: '' }))
        .rejects.toThrow('Dades invàlides');
    });

    it('should throw error when refuge not found', async () => {
      mockedApiPost.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Refugi no trobat' }),
      } as Response);

      await expect(DoubtsService.createDoubt({ refuge_id: 'invalid', message: 'Test' }))
        .rejects.toThrow('Refugi no trobat');
    });

    it('should handle network errors', async () => {
      mockedApiPost.mockRejectedValue(new Error('Network error'));

      await expect(DoubtsService.createDoubt({ refuge_id: 'refuge-1', message: 'Test' }))
        .rejects.toThrow('Network error');
    });
  });

  describe('deleteDoubt', () => {
    it('should delete a doubt', async () => {
      mockedApiDelete.mockResolvedValue({
        ok: true,
        status: 204,
      } as Response);

      await expect(DoubtsService.deleteDoubt('doubt-1')).resolves.toBeUndefined();
      expect(mockedApiDelete).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/doubts/doubt-1/'
      );
    });

    it('should throw error when not authorized', async () => {
      mockedApiDelete.mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({}),
      } as Response);

      await expect(DoubtsService.deleteDoubt('doubt-1'))
        .rejects.toThrow('No tens permisos per eliminar aquest dubte');
    });

    it('should throw error when doubt not found', async () => {
      mockedApiDelete.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Dubte no trobat' }),
      } as Response);

      await expect(DoubtsService.deleteDoubt('invalid'))
        .rejects.toThrow('Dubte no trobat');
    });
  });

  describe('createAnswer', () => {
    it('should create an answer to a doubt', async () => {
      mockedApiPost.mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => mockAnswerDTO,
      } as Response);

      const request = { message: 'Test answer' };
      const result = await DoubtsService.createAnswer('doubt-1', request);

      expect(result).toEqual(mockAnswerDTO);
      expect(mockedApiPost).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/doubts/doubt-1/answers/',
        request
      );
    });

    it('should throw error on invalid data', async () => {
      mockedApiPost.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Dades invàlides' }),
      } as Response);

      await expect(DoubtsService.createAnswer('doubt-1', { message: '' }))
        .rejects.toThrow('Dades invàlides');
    });

    it('should throw error when doubt not found', async () => {
      mockedApiPost.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Dubte no trobat' }),
      } as Response);

      await expect(DoubtsService.createAnswer('invalid', { message: 'Test' }))
        .rejects.toThrow('Dubte no trobat');
    });
  });

  describe('createAnswerReply', () => {
    it('should create a reply to an answer', async () => {
      const replyDTO = { ...mockAnswerDTO, id: 'answer-2', parent_answer_id: 'answer-1' };
      mockedApiPost.mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => replyDTO,
      } as Response);

      const request = { message: 'Test reply' };
      const result = await DoubtsService.createAnswerReply('doubt-1', 'answer-1', request);

      expect(result).toEqual(replyDTO);
      expect(mockedApiPost).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/doubts/doubt-1/answers/answer-1/',
        request
      );
    });

    it('should throw error on invalid data', async () => {
      mockedApiPost.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Dades invàlides' }),
      } as Response);

      await expect(DoubtsService.createAnswerReply('doubt-1', 'answer-1', { message: '' }))
        .rejects.toThrow('Dades invàlides');
    });

    it('should throw error when doubt or answer not found', async () => {
      mockedApiPost.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Dubte o resposta no trobats' }),
      } as Response);

      await expect(DoubtsService.createAnswerReply('invalid', 'answer-1', { message: 'Test' }))
        .rejects.toThrow('Dubte o resposta no trobats');
    });
  });

  describe('deleteAnswer', () => {
    it('should delete an answer', async () => {
      mockedApiDelete.mockResolvedValue({
        ok: true,
        status: 204,
      } as Response);

      await expect(DoubtsService.deleteAnswer('doubt-1', 'answer-1')).resolves.toBeUndefined();
      expect(mockedApiDelete).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/doubts/doubt-1/answers/answer-1/'
      );
    });

    it('should throw error when not authorized', async () => {
      mockedApiDelete.mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({}),
      } as Response);

      await expect(DoubtsService.deleteAnswer('doubt-1', 'answer-1'))
        .rejects.toThrow('No tens permisos per eliminar aquesta resposta');
    });

    it('should throw error when answer not found', async () => {
      mockedApiDelete.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Resposta no trobada' }),
      } as Response);

      await expect(DoubtsService.deleteAnswer('doubt-1', 'invalid'))
        .rejects.toThrow('Resposta no trobada');
    });

    it('should handle network errors', async () => {
      mockedApiDelete.mockRejectedValue(new Error('Network error'));

      await expect(DoubtsService.deleteAnswer('doubt-1', 'answer-1'))
        .rejects.toThrow('Network error');
    });
  });
});
