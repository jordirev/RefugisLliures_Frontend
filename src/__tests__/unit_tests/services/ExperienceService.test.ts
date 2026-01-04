/**
 * Tests unitaris per ExperienceService
 * 
 * Cobreix:
 * - getExperiencesByRefuge
 * - createExperience
 * - updateExperience
 * - deleteExperience
 */

import { ExperienceService } from '../../../services/ExperienceService';
import { apiGet, apiClient } from '../../../services/apiClient';

// Mock apiClient
jest.mock('../../../services/apiClient', () => ({
  apiGet: jest.fn(),
  apiClient: jest.fn(),
}));

describe('ExperienceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getExperiencesByRefuge', () => {
    it('hauria de retornar les experiències d\'un refugi', async () => {
      const mockExperiences = [
        {
          id: 'exp-1',
          refuge_id: 'refuge-123',
          creator_uid: 'user-abc',
          modified_at: '2025-06-15T10:00:00Z',
          comment: 'Experiència fantàstica!',
          images_metadata: [],
        },
        {
          id: 'exp-2',
          refuge_id: 'refuge-123',
          creator_uid: 'user-def',
          modified_at: '2025-06-14T08:00:00Z',
          comment: 'Molt bé',
          images_metadata: [{ url: 'https://example.com/img.jpg' }],
        },
      ];

      (apiGet as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ experiences: mockExperiences }),
      });

      const result = await ExperienceService.getExperiencesByRefuge('refuge-123');

      expect(apiGet).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/experiences/?refuge_id=refuge-123'
      );
      expect(result).toEqual(mockExperiences);
    });

    it('hauria de llançar error quan el refuge_id és requerit', async () => {
      (apiGet as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({ error: 'El refuge_id és requerit' }),
      });

      await expect(ExperienceService.getExperiencesByRefuge('')).rejects.toThrow(
        'El refuge_id és requerit'
      );
    });

    it('hauria de llançar error quan el refugi no existeix', async () => {
      (apiGet as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        json: jest.fn().mockResolvedValue({ error: 'Refugi no trobat' }),
      });

      await expect(ExperienceService.getExperiencesByRefuge('inexistent')).rejects.toThrow(
        'Refugi no trobat'
      );
    });

    it('hauria de gestionar errors de xarxa', async () => {
      (apiGet as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(ExperienceService.getExperiencesByRefuge('refuge-123')).rejects.toThrow(
        'Network error'
      );
    });

    it('hauria de llançar error genèric per errors desconeguts', async () => {
      (apiGet as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockResolvedValue({}),
      });

      await expect(ExperienceService.getExperiencesByRefuge('refuge-123')).rejects.toThrow(
        'Error 500: Internal Server Error'
      );
    });
  });

  describe('createExperience', () => {
    it('hauria de crear una experiència sense fitxers', async () => {
      const mockResponse = {
        experience: {
          id: 'exp-new',
          refuge_id: 'refuge-123',
          creator_uid: 'user-abc',
          modified_at: '2025-06-16T12:00:00Z',
          comment: 'Nova experiència',
          images_metadata: [],
        },
        message: 'Experiència creada correctament',
      };

      (apiClient as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await ExperienceService.createExperience({
        refuge_id: 'refuge-123',
        comment: 'Nova experiència',
      });

      expect(apiClient).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('hauria de llançar error per dades invàlides', async () => {
      (apiClient as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({ error: 'Comentari requerit' }),
      });

      await expect(
        ExperienceService.createExperience({ refuge_id: 'refuge-123', comment: '' })
      ).rejects.toThrow('Comentari requerit');
    });
  });
});
