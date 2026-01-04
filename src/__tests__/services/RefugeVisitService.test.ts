/**
 * Tests for RefugeVisitService
 */

import { RefugeVisitService } from '../../services/RefugeVisitService';
import * as apiClient from '../../services/apiClient';

// Mock apiClient
jest.mock('../../services/apiClient');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Mock visit data matching RefugeVisitListItemDTO format
const mockVisitDTO = {
  date: '2024-06-15',
  refuge_id: 'refuge-1',
  total_visitors: 2,
  is_visitor: true,
  num_visitors: 2,
};

const mockUserVisitDTO = {
  ...mockVisitDTO,
  refuge_id: 'refuge-1',
};

describe('RefugeVisitService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRefugeVisits', () => {
    it('should get refuge visits successfully', async () => {
      mockedApiClient.apiGet.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ result: [mockVisitDTO] }),
      } as Response);

      const result = await RefugeVisitService.getRefugeVisits('refuge-1');

      expect(mockedApiClient.apiGet).toHaveBeenCalledWith(
        expect.stringContaining('/refuges/refuge-1/visits/')
      );
      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2024-06-15');
    });

    it('should handle not found error (404)', async () => {
      mockedApiClient.apiGet.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({}),
      } as Response);

      await expect(RefugeVisitService.getRefugeVisits('invalid-id'))
        .rejects.toThrow('Refugi no trobat');
    });

    it('should handle unauthorized error (401)', async () => {
      mockedApiClient.apiGet.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({}),
      } as Response);

      await expect(RefugeVisitService.getRefugeVisits('refuge-1'))
        .rejects.toThrow('No autenticat');
    });

    it('should handle generic error', async () => {
      mockedApiClient.apiGet.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Server Error',
        json: async () => ({ error: 'Server error' }),
      } as Response);

      await expect(RefugeVisitService.getRefugeVisits('refuge-1'))
        .rejects.toThrow('Server error');
    });
  });

  describe('getUserVisits', () => {
    it('should get user visits successfully', async () => {
      mockedApiClient.apiGet.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ result: [mockUserVisitDTO] }),
      } as Response);

      const result = await RefugeVisitService.getUserVisits('user-1');

      expect(mockedApiClient.apiGet).toHaveBeenCalledWith(
        expect.stringContaining('/users/user-1/visits/')
      );
      expect(result).toHaveLength(1);
      expect(result[0].refuge_id).toBe('refuge-1');
    });

    it('should handle unauthorized error (401)', async () => {
      mockedApiClient.apiGet.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({}),
      } as Response);

      await expect(RefugeVisitService.getUserVisits('user-1'))
        .rejects.toThrow('No autenticat');
    });

    it('should handle forbidden error (403)', async () => {
      mockedApiClient.apiGet.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({}),
      } as Response);

      await expect(RefugeVisitService.getUserVisits('other-user'))
        .rejects.toThrow('No tens permís');
    });

    it('should handle visit without refuge_id', async () => {
      mockedApiClient.apiGet.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ result: [{ ...mockVisitDTO, refuge_id: undefined }] }),
      } as Response);

      const result = await RefugeVisitService.getUserVisits('user-1');

      expect(result[0].refuge_id).toBe('');
    });
  });

  describe('createRefugeVisit', () => {
    it('should create a visit successfully', async () => {
      mockedApiClient.apiPost.mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ visit: mockVisitDTO }),
      } as Response);

      const result = await RefugeVisitService.createRefugeVisit(
        'refuge-1',
        '2024-06-15',
        { num_visitors: 2 }
      );

      expect(mockedApiClient.apiPost).toHaveBeenCalledWith(
        expect.stringContaining('/refuges/refuge-1/visits/2024-06-15/'),
        { num_visitors: 2 }
      );
      expect(result.date).toBe('2024-06-15');
    });

    it('should handle not found error (404)', async () => {
      mockedApiClient.apiPost.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({}),
      } as Response);

      await expect(RefugeVisitService.createRefugeVisit('invalid-id', '2024-06-15', { num_visitors: 1 }))
        .rejects.toThrow('Refugi no trobat');
    });

    it('should handle unauthorized error (401)', async () => {
      mockedApiClient.apiPost.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({}),
      } as Response);

      await expect(RefugeVisitService.createRefugeVisit('refuge-1', '2024-06-15', { num_visitors: 1 }))
        .rejects.toThrow('No autenticat');
    });

    it('should handle validation error (400)', async () => {
      mockedApiClient.apiPost.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'User already registered' }),
      } as Response);

      await expect(RefugeVisitService.createRefugeVisit('refuge-1', '2024-06-15', { num_visitors: 1 }))
        .rejects.toThrow('User already registered');
    });

    it('should handle validation error without message', async () => {
      mockedApiClient.apiPost.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({}),
      } as Response);

      await expect(RefugeVisitService.createRefugeVisit('refuge-1', '2024-06-15', { num_visitors: 1 }))
        .rejects.toThrow('Paràmetres invàlids');
    });
  });

  describe('updateRefugeVisit', () => {
    it('should update a visit successfully', async () => {
      mockedApiClient.apiPatch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ visit: mockVisitDTO }),
      } as Response);

      const result = await RefugeVisitService.updateRefugeVisit(
        'refuge-1',
        '2024-06-15',
        { num_visitors: 3 }
      );

      expect(mockedApiClient.apiPatch).toHaveBeenCalledWith(
        expect.stringContaining('/refuges/refuge-1/visits/2024-06-15/'),
        { num_visitors: 3 }
      );
      expect(result.date).toBe('2024-06-15');
    });

    it('should handle not found error (404)', async () => {
      mockedApiClient.apiPatch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({}),
      } as Response);

      await expect(RefugeVisitService.updateRefugeVisit('refuge-1', '2024-06-15', { num_visitors: 1 }))
        .rejects.toThrow('Refugi o visita no trobats');
    });

    it('should handle unauthorized error (401)', async () => {
      mockedApiClient.apiPatch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({}),
      } as Response);

      await expect(RefugeVisitService.updateRefugeVisit('refuge-1', '2024-06-15', { num_visitors: 1 }))
        .rejects.toThrow('No autenticat');
    });

    it('should handle validation error (400)', async () => {
      mockedApiClient.apiPatch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Invalid number' }),
      } as Response);

      await expect(RefugeVisitService.updateRefugeVisit('refuge-1', '2024-06-15', { num_visitors: -1 }))
        .rejects.toThrow('Invalid number');
    });
  });

  describe('deleteRefugeVisit', () => {
    it('should delete a visit successfully', async () => {
      mockedApiClient.apiDelete.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ message: 'Visit deleted' }),
      } as Response);

      const result = await RefugeVisitService.deleteRefugeVisit('refuge-1', '2024-06-15');

      expect(mockedApiClient.apiDelete).toHaveBeenCalledWith(
        expect.stringContaining('/refuges/refuge-1/visits/2024-06-15/')
      );
      expect(result).toBe(true);
    });

    it('should handle not found error (404)', async () => {
      mockedApiClient.apiDelete.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({}),
      } as Response);

      await expect(RefugeVisitService.deleteRefugeVisit('refuge-1', '2024-06-15'))
        .rejects.toThrow('Refugi o visita no trobats');
    });

    it('should handle unauthorized error (401)', async () => {
      mockedApiClient.apiDelete.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({}),
      } as Response);

      await expect(RefugeVisitService.deleteRefugeVisit('refuge-1', '2024-06-15'))
        .rejects.toThrow('No autenticat');
    });

    it('should handle validation error (400)', async () => {
      mockedApiClient.apiDelete.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'User not registered' }),
      } as Response);

      await expect(RefugeVisitService.deleteRefugeVisit('refuge-1', '2024-06-15'))
        .rejects.toThrow('User not registered');
    });
  });
});
