/**
 * Tests for ExperienceService
 */

import { ExperienceService } from '../../services/ExperienceService';
import { apiGet, apiClient } from '../../services/apiClient';

// Mock apiClient
jest.mock('../../services/apiClient');

const mockedApiGet = apiGet as jest.MockedFunction<typeof apiGet>;
const mockedApiClient = apiClient as jest.MockedFunction<typeof apiClient>;

// Mock data
const mockExperienceDTO = {
  id: 'exp-1',
  refuge_id: 'refuge-1',
  user_uid: 'user-123',
  username: 'TestUser',
  comment: 'Great experience!',
  media_urls: ['https://example.com/image1.jpg'],
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
};

const mockExperienceListResponse = {
  experiences: [mockExperienceDTO],
};

const mockCreateResponse = {
  message: 'Experiència creada correctament',
  experience: mockExperienceDTO,
};

const mockUpdateResponse = {
  message: 'Experiència actualitzada correctament',
  experience: mockExperienceDTO,
};

describe('ExperienceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getExperiencesByRefuge', () => {
    it('should fetch experiences for a refuge', async () => {
      mockedApiGet.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockExperienceListResponse,
      } as Response);

      const result = await ExperienceService.getExperiencesByRefuge('refuge-1');

      expect(result).toEqual([mockExperienceDTO]);
      expect(mockedApiGet).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/experiences/?refuge_id=refuge-1'
      );
    });

    it('should return empty array when no experiences', async () => {
      mockedApiGet.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ experiences: [] }),
      } as Response);

      const result = await ExperienceService.getExperiencesByRefuge('refuge-1');

      expect(result).toEqual([]);
    });

    it('should throw error when refuge_id is missing', async () => {
      mockedApiGet.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'El refuge_id és requerit' }),
      } as Response);

      await expect(ExperienceService.getExperiencesByRefuge(''))
        .rejects.toThrow('El refuge_id és requerit');
    });

    it('should throw error when refuge not found', async () => {
      mockedApiGet.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Refugi no trobat' }),
      } as Response);

      await expect(ExperienceService.getExperiencesByRefuge('invalid'))
        .rejects.toThrow('Refugi no trobat');
    });

    it('should throw generic error on other failures', async () => {
      mockedApiGet.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
      } as Response);

      await expect(ExperienceService.getExperiencesByRefuge('refuge-1'))
        .rejects.toThrow('Error 500: Internal Server Error');
    });

    it('should handle network errors', async () => {
      mockedApiGet.mockRejectedValue(new Error('Network error'));

      await expect(ExperienceService.getExperiencesByRefuge('refuge-1'))
        .rejects.toThrow('Network error');
    });
  });

  describe('createExperience', () => {
    it('should create a new experience', async () => {
      mockedApiClient.mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => mockCreateResponse,
      } as Response);

      const request = { refuge_id: 'refuge-1', comment: 'Great experience!' };
      const result = await ExperienceService.createExperience(request);

      expect(result).toEqual(mockCreateResponse);
      expect(mockedApiClient).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/experiences/',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        })
      );
    });

    it('should create experience with files', async () => {
      mockedApiClient.mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => mockCreateResponse,
      } as Response);

      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const request = { refuge_id: 'refuge-1', comment: 'Great!', files: [mockFile] };
      
      await ExperienceService.createExperience(request);

      expect(mockedApiClient).toHaveBeenCalled();
    });

    it('should throw error on invalid data', async () => {
      mockedApiClient.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Dades invàlides' }),
      } as Response);

      await expect(ExperienceService.createExperience({ refuge_id: '', comment: '' }))
        .rejects.toThrow('Dades invàlides');
    });

    it('should throw error when not authenticated', async () => {
      mockedApiClient.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'No autenticat' }),
      } as Response);

      await expect(ExperienceService.createExperience({ refuge_id: 'refuge-1', comment: 'Test' }))
        .rejects.toThrow('No autenticat');
    });

    it('should throw error when refuge not found', async () => {
      mockedApiClient.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Refugi no trobat' }),
      } as Response);

      await expect(ExperienceService.createExperience({ refuge_id: 'invalid', comment: 'Test' }))
        .rejects.toThrow('Refugi no trobat');
    });
  });

  describe('updateExperience', () => {
    it('should update an experience', async () => {
      mockedApiClient.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockUpdateResponse,
      } as Response);

      const result = await ExperienceService.updateExperience('exp-1', { comment: 'Updated comment' });

      expect(result).toEqual(mockUpdateResponse);
      expect(mockedApiClient).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/experiences/exp-1/',
        expect.objectContaining({
          method: 'PATCH',
          body: expect.any(FormData),
        })
      );
    });

    it('should update experience with files', async () => {
      mockedApiClient.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockUpdateResponse,
      } as Response);

      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      await ExperienceService.updateExperience('exp-1', { files: [mockFile] });

      expect(mockedApiClient).toHaveBeenCalled();
    });

    it('should throw error on invalid data', async () => {
      mockedApiClient.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Dades invàlides' }),
      } as Response);

      await expect(ExperienceService.updateExperience('exp-1', {}))
        .rejects.toThrow('Dades invàlides');
    });

    it('should throw error when not authenticated', async () => {
      mockedApiClient.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'No autenticat' }),
      } as Response);

      await expect(ExperienceService.updateExperience('exp-1', { comment: 'Test' }))
        .rejects.toThrow('No autenticat');
    });

    it('should throw error when not authorized', async () => {
      mockedApiClient.mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({}),
      } as Response);

      await expect(ExperienceService.updateExperience('exp-1', { comment: 'Test' }))
        .rejects.toThrow('No tens permisos per editar aquesta experiència');
    });

    it('should throw error when experience not found', async () => {
      mockedApiClient.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Experiència no trobada' }),
      } as Response);

      await expect(ExperienceService.updateExperience('invalid', { comment: 'Test' }))
        .rejects.toThrow('Experiència no trobada');
    });
  });

  describe('deleteExperience', () => {
    it('should delete an experience', async () => {
      mockedApiClient.mockResolvedValue({
        ok: true,
        status: 204,
      } as Response);

      await expect(ExperienceService.deleteExperience('exp-1')).resolves.toBeUndefined();
      expect(mockedApiClient).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/experiences/exp-1/',
        { method: 'DELETE' }
      );
    });

    it('should throw error when not authenticated', async () => {
      mockedApiClient.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({}),
      } as Response);

      await expect(ExperienceService.deleteExperience('exp-1'))
        .rejects.toThrow('No autenticat');
    });

    it('should throw error when not authorized', async () => {
      mockedApiClient.mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({}),
      } as Response);

      await expect(ExperienceService.deleteExperience('exp-1'))
        .rejects.toThrow('No tens permisos per eliminar aquesta experiència');
    });

    it('should throw error when experience not found', async () => {
      mockedApiClient.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Experiència no trobada' }),
      } as Response);

      await expect(ExperienceService.deleteExperience('invalid'))
        .rejects.toThrow('Experiència no trobada');
    });

    it('should handle network errors', async () => {
      mockedApiClient.mockRejectedValue(new Error('Network error'));

      await expect(ExperienceService.deleteExperience('exp-1'))
        .rejects.toThrow('Network error');
    });
  });
});
