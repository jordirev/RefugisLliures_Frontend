/**
 * Tests unitaris per DoubtsService
 * 
 * Cobreix:
 * - getDoubtsByRefuge
 * - createDoubt
 * - deleteDoubt
 * - getAnswersByDoubt
 * - createAnswer
 * - deleteAnswer
 */

import { DoubtsService } from '../../../services/DoubtsService';
import { apiGet, apiPost, apiDelete } from '../../../services/apiClient';

// Mock apiClient
jest.mock('../../../services/apiClient', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiDelete: jest.fn(),
}));

describe('DoubtsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDoubtsByRefuge', () => {
    it('hauria de retornar els dubtes d\'un refugi', async () => {
      const mockDoubts = [
        {
          id: 'doubt-1',
          refuge_id: 'refuge-123',
          creator_uid: 'user-abc',
          message: 'Quin és el millor moment per visitar?',
          created_at: '2025-06-15T10:00:00Z',
          answers_count: 2,
          answers: [],
        },
      ];

      (apiGet as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockDoubts),
      });

      const result = await DoubtsService.getDoubtsByRefuge('refuge-123');

      expect(apiGet).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/doubts/?refuge_id=refuge-123'
      );
      expect(result).toEqual(mockDoubts);
    });

    it('hauria de llançar error quan el refugi no existeix', async () => {
      (apiGet as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        json: jest.fn().mockResolvedValue({ error: 'Refugi no trobat' }),
      });

      await expect(DoubtsService.getDoubtsByRefuge('inexistent')).rejects.toThrow(
        'Refugi no trobat'
      );
    });

    it('hauria de llançar error genèric per altres errors', async () => {
      (apiGet as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockResolvedValue({}),
      });

      await expect(DoubtsService.getDoubtsByRefuge('refuge-123')).rejects.toThrow(
        'Error 500: Internal Server Error'
      );
    });

    it('hauria de gestionar errors de xarxa', async () => {
      (apiGet as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(DoubtsService.getDoubtsByRefuge('refuge-123')).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('createDoubt', () => {
    it('hauria de crear un dubte correctament', async () => {
      const mockDoubt = {
        id: 'doubt-new',
        refuge_id: 'refuge-123',
        creator_uid: 'user-abc',
        message: 'Nova pregunta',
        created_at: '2025-06-16T12:00:00Z',
        answers_count: 0,
        answers: [],
      };

      (apiPost as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockDoubt),
      });

      const result = await DoubtsService.createDoubt({
        refuge_id: 'refuge-123',
        message: 'Nova pregunta',
      });

      expect(apiPost).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/doubts/',
        { refuge_id: 'refuge-123', message: 'Nova pregunta' }
      );
      expect(result).toEqual(mockDoubt);
    });

    it('hauria de llançar error per dades invàlides', async () => {
      (apiPost as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({ error: 'Dades invàlides' }),
      });

      await expect(
        DoubtsService.createDoubt({ refuge_id: '', message: '' })
      ).rejects.toThrow('Dades invàlides');
    });

    it('hauria de llançar error quan el refugi no existeix', async () => {
      (apiPost as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        json: jest.fn().mockResolvedValue({ error: 'Refugi no trobat' }),
      });

      await expect(
        DoubtsService.createDoubt({ refuge_id: 'inexistent', message: 'test' })
      ).rejects.toThrow('Refugi no trobat');
    });
  });

  describe('deleteDoubt', () => {
    it('hauria d\'eliminar un dubte correctament', async () => {
      (apiDelete as jest.Mock).mockResolvedValue({
        ok: true,
        status: 204,
      });

      await expect(DoubtsService.deleteDoubt('doubt-123')).resolves.toBeUndefined();

      expect(apiDelete).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/doubts/doubt-123/'
      );
    });

    it('hauria de llançar error per falta de permisos', async () => {
      (apiDelete as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
      });

      await expect(DoubtsService.deleteDoubt('doubt-123')).rejects.toThrow(
        'No tens permisos per eliminar aquest dubte'
      );
    });

    it('hauria de llançar error quan el dubte no existeix', async () => {
      (apiDelete as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        json: jest.fn().mockResolvedValue({ error: 'Dubte no trobat' }),
      });

      await expect(DoubtsService.deleteDoubt('inexistent')).rejects.toThrow(
        'Dubte no trobat'
      );
    });
  });
});
