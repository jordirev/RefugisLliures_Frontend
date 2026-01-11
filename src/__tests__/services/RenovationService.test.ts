/**
 * Tests for RenovationService
 */

import { RenovationService } from '../../services/RenovationService';
import { apiGet, apiPost, apiPatch, apiDelete } from '../../services/apiClient';

// Mock apiClient
jest.mock('../../services/apiClient');

const mockedApiGet = apiGet as jest.MockedFunction<typeof apiGet>;
const mockedApiPost = apiPost as jest.MockedFunction<typeof apiPost>;
const mockedApiPatch = apiPatch as jest.MockedFunction<typeof apiPatch>;
const mockedApiDelete = apiDelete as jest.MockedFunction<typeof apiDelete>;

// Mock data
const mockRenovationDTO = {
  id: 'renovation-1',
  refuge_id: 'refuge-1',
  creator_uid: 'user-123',
  creator_username: 'TestUser',
  ini_date: '2024-02-01',
  fin_date: '2024-02-15',
  description: 'Test renovation',
  materials_needed: 'Wood, nails',
  group_link: 'https://t.me/group',
  participants: ['user-456'],
  created_at: '2024-01-15T10:00:00Z',
};

describe('RenovationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllRenovations', () => {
    it('should fetch all renovations', async () => {
      mockedApiGet.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [mockRenovationDTO],
      } as Response);

      const result = await RenovationService.getAllRenovations();

      expect(result).toEqual([mockRenovationDTO]);
      expect(mockedApiGet).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/renovations/'
      );
    });

    it('should throw error on failure', async () => {
      mockedApiGet.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      await expect(RenovationService.getAllRenovations())
        .rejects.toThrow("No s'han pogut carregar les renovations");
    });
  });

  describe('getRenovationById', () => {
    it('should fetch a specific renovation', async () => {
      mockedApiGet.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockRenovationDTO,
      } as Response);

      const result = await RenovationService.getRenovationById('renovation-1');

      expect(result).toEqual(mockRenovationDTO);
      expect(mockedApiGet).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/renovations/renovation-1/'
      );
    });

    it('should return null when renovation not found', async () => {
      mockedApiGet.mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      const result = await RenovationService.getRenovationById('invalid');

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      mockedApiGet.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      const result = await RenovationService.getRenovationById('renovation-1');

      expect(result).toBeNull();
    });
  });

  describe('getRenovationsByRefugeId', () => {
    it('should fetch renovations for a refuge', async () => {
      mockedApiGet.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [mockRenovationDTO],
      } as Response);

      const result = await RenovationService.getRenovationsByRefugeId('refuge-1');

      expect(result).toEqual([mockRenovationDTO]);
      expect(mockedApiGet).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/refuges/refuge-1/renovations/'
      );
    });

    it('should throw error on failure', async () => {
      mockedApiGet.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      await expect(RenovationService.getRenovationsByRefugeId('refuge-1'))
        .rejects.toThrow("No s'han pogut carregar les renovations del refugi");
    });
  });

  describe('createRenovation', () => {
    const createRequest = {
      refuge_id: 'refuge-1',
      ini_date: '2024-02-01',
      fin_date: '2024-02-15',
      description: 'Test renovation',
      group_link: 'https://t.me/group',
    };

    it('should create a new renovation', async () => {
      mockedApiPost.mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => mockRenovationDTO,
      } as Response);

      const result = await RenovationService.createRenovation(createRequest);

      expect(result).toEqual(mockRenovationDTO);
      expect(mockedApiPost).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/renovations/',
        createRequest
      );
    });

    it('should throw error with overlapping renovation info', async () => {
      mockedApiPost.mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({
          error: 'Hi ha solapament amb una altra renovation',
          overlapping_renovation: mockRenovationDTO,
        }),
      } as Response);

      try {
        await RenovationService.createRenovation(createRequest);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toBe('Hi ha solapament amb una altra renovation');
        expect(error.overlappingRenovation).toEqual(mockRenovationDTO);
      }
    });

    it('should throw error with validation details', async () => {
      mockedApiPost.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Dades invàlides',
          details: { fin_date: ['La data de fi ha de ser posterior a la data d\'inici'] },
        }),
      } as Response);

      await expect(RenovationService.createRenovation(createRequest))
        .rejects.toThrow(/Dades invàlides/);
    });
  });

  describe('updateRenovation', () => {
    it('should update a renovation', async () => {
      const updatedRenovation = { ...mockRenovationDTO, description: 'Updated' };
      mockedApiPatch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => updatedRenovation,
      } as Response);

      const result = await RenovationService.updateRenovation('renovation-1', { description: 'Updated' });

      expect(result).toEqual(updatedRenovation);
      expect(mockedApiPatch).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/renovations/renovation-1/?id=renovation-1',
        { description: 'Updated' }
      );
    });

    it('should throw error when not authorized', async () => {
      mockedApiPatch.mockResolvedValue({
        ok: false,
        status: 403,
      } as Response);

      await expect(RenovationService.updateRenovation('renovation-1', {}))
        .rejects.toThrow('Només el creador pot actualitzar aquesta renovation');
    });

    it('should throw error when not found', async () => {
      mockedApiPatch.mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      await expect(RenovationService.updateRenovation('invalid', {}))
        .rejects.toThrow('Renovation no trobada');
    });

    it('should throw error with overlapping renovation info', async () => {
      mockedApiPatch.mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({
          error: 'Hi ha solapament amb una altra renovation',
          overlapping_renovation: mockRenovationDTO,
        }),
      } as Response);

      try {
        await RenovationService.updateRenovation('renovation-1', { ini_date: '2024-02-01' });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toBe('Hi ha solapament amb una altra renovation');
        expect(error.overlappingRenovation).toEqual(mockRenovationDTO);
      }
    });
  });

  describe('deleteRenovation', () => {
    it('should delete a renovation', async () => {
      mockedApiDelete.mockResolvedValue({
        ok: true,
        status: 204,
      } as Response);

      await expect(RenovationService.deleteRenovation('renovation-1')).resolves.toBeUndefined();
      expect(mockedApiDelete).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/renovations/renovation-1/?id=renovation-1'
      );
    });

    it('should throw error when not authorized', async () => {
      mockedApiDelete.mockResolvedValue({
        ok: false,
        status: 403,
      } as Response);

      await expect(RenovationService.deleteRenovation('renovation-1'))
        .rejects.toThrow('Només el creador pot eliminar aquesta renovation');
    });

    it('should throw error when not found', async () => {
      mockedApiDelete.mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      await expect(RenovationService.deleteRenovation('invalid'))
        .rejects.toThrow('Renovation no trobada');
    });
  });

  describe('joinRenovation', () => {
    it('should join a renovation', async () => {
      const joinedRenovation = {
        ...mockRenovationDTO,
        participants: ['user-456', 'user-789'],
      };
      mockedApiPost.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => joinedRenovation,
      } as Response);

      const result = await RenovationService.joinRenovation('renovation-1');

      expect(result).toEqual(joinedRenovation);
      expect(mockedApiPost).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/renovations/renovation-1/participants/',
        {}
      );
    });

    it('should throw error when already participant or creator', async () => {
      mockedApiPost.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Ja ets participant d\'aquesta renovation' }),
      } as Response);

      await expect(RenovationService.joinRenovation('renovation-1'))
        .rejects.toThrow('Ja ets participant d\'aquesta renovation');
    });

    it('should throw error when not found', async () => {
      mockedApiPost.mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      await expect(RenovationService.joinRenovation('invalid'))
        .rejects.toThrow('Renovation no trobada');
    });
  });

  describe('removeParticipant', () => {
    it('should remove a participant', async () => {
      const updatedRenovation = {
        ...mockRenovationDTO,
        participants: [],
      };
      mockedApiDelete.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => updatedRenovation,
      } as Response);

      const result = await RenovationService.removeParticipant('renovation-1', 'user-456');

      expect(result).toEqual(updatedRenovation);
      expect(mockedApiDelete).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/renovations/renovation-1/participants/user-456/'
      );
    });

    it('should throw error when not authorized', async () => {
      mockedApiDelete.mockResolvedValue({
        ok: false,
        status: 403,
      } as Response);

      await expect(RenovationService.removeParticipant('renovation-1', 'user-456'))
        .rejects.toThrow('No tens permís per eliminar aquest participant');
    });

    it('should throw error when not found', async () => {
      mockedApiDelete.mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      await expect(RenovationService.removeParticipant('invalid', 'user-456'))
        .rejects.toThrow('Renovation no trobada');
    });
  });
});
