/**
 * Tests for RefugeProposalsService
 */

import { RefugeProposalsService } from '../../services/RefugeProposalsService';
import * as apiClient from '../../services/apiClient';

// Mock apiClient
jest.mock('../../services/apiClient');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Mock data
const mockProposalDTO = {
  id: 'proposal-123',
  action: 'create',
  refuge_id: null,
  payload: {
    name: 'Test Refuge',
    coordinates: '42.0,2.0',
    altitude: 1500,
    region: 'Catalunya',
  },
  comment: 'Test comment',
  status: 'pending',
  proposed_by: {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
  },
  reviewed_by: null,
  rejection_reason: null,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
};

// Mock location data with coord for create proposals
const mockLocation = {
  name: 'New Refuge',
  coord: '42.5,1.5',  // Required for create proposals
  latitude: 42.5,
  longitude: 1.5,
  altitude: 2000,
  region: 'Pyrenees',
};

// Mock location for update (without coord requirement)
const mockLocationForUpdate = {
  name: 'Updated Refuge',
  altitude: 2500,
};

describe('RefugeProposalsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProposal', () => {
    it('should create a proposal successfully', async () => {
      mockedApiClient.apiPost.mockResolvedValue({
        ok: true,
        json: async () => mockProposalDTO,
      } as Response);

      const result = await RefugeProposalsService.proposalCreateRefuge(mockLocation);

      expect(mockedApiClient.apiPost).toHaveBeenCalled();
      expect(result.id).toBe('proposal-123');
    });

    it('should handle validation error (400) with details', async () => {
      mockedApiClient.apiPost.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          error: 'Validation failed',
          details: {
            name: ['Name is required'],
            coordinates: ['Invalid format'],
          },
        }),
      } as Response);

      await expect(RefugeProposalsService.proposalCreateRefuge(mockLocation))
        .rejects.toThrow('Dades invàlides');
    });

    it('should handle validation error (400) without details', async () => {
      mockedApiClient.apiPost.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          error: 'Invalid data',
        }),
      } as Response);

      await expect(RefugeProposalsService.proposalCreateRefuge(mockLocation))
        .rejects.toThrow('Invalid data');
    });

    it('should handle unauthorized error (401)', async () => {
      mockedApiClient.apiPost.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: 'Unauthorized' }),
      } as Response);

      await expect(RefugeProposalsService.proposalCreateRefuge(mockLocation))
        .rejects.toThrow('No estàs autenticat');
    });

    it('should handle server error (500)', async () => {
      mockedApiClient.apiPost.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
      } as Response);

      await expect(RefugeProposalsService.proposalCreateRefuge(mockLocation))
        .rejects.toThrow('Error del servidor');
    });

    it('should handle json parse error', async () => {
      mockedApiClient.apiPost.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => { throw new Error('Parse error'); },
      } as Response);

      await expect(RefugeProposalsService.proposalCreateRefuge(mockLocation))
        .rejects.toThrow('Error 400: Bad Request');
    });
  });

  describe('listProposals', () => {
    it('should list all proposals', async () => {
      mockedApiClient.apiGet.mockResolvedValue({
        ok: true,
        json: async () => [mockProposalDTO],
      } as Response);

      const result = await RefugeProposalsService.listProposals();

      expect(mockedApiClient.apiGet).toHaveBeenCalledWith(
        expect.stringContaining('/refuges-proposals/')
      );
      expect(result).toHaveLength(1);
    });

    it('should list proposals with status filter', async () => {
      mockedApiClient.apiGet.mockResolvedValue({
        ok: true,
        json: async () => [mockProposalDTO],
      } as Response);

      await RefugeProposalsService.listProposals('pending');

      expect(mockedApiClient.apiGet).toHaveBeenCalledWith(
        expect.stringContaining('status=pending')
      );
    });

    it('should list proposals with refugeId filter', async () => {
      mockedApiClient.apiGet.mockResolvedValue({
        ok: true,
        json: async () => [mockProposalDTO],
      } as Response);

      await RefugeProposalsService.listProposals(undefined, 'refuge-1');

      expect(mockedApiClient.apiGet).toHaveBeenCalledWith(
        expect.stringContaining('refuge-id=refuge-1')
      );
    });

    it('should return empty array for non-array response', async () => {
      mockedApiClient.apiGet.mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'invalid' }),
      } as Response);

      const result = await RefugeProposalsService.listProposals();

      expect(result).toEqual([]);
    });

    it('should handle forbidden error (403)', async () => {
      mockedApiClient.apiGet.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ error: 'Forbidden' }),
      } as Response);

      await expect(RefugeProposalsService.listProposals())
        .rejects.toThrow('No tens permisos');
    });
  });

  describe('listMyProposals', () => {
    it('should list user proposals', async () => {
      mockedApiClient.apiGet.mockResolvedValue({
        ok: true,
        json: async () => [mockProposalDTO],
      } as Response);

      const result = await RefugeProposalsService.listMyProposals();

      expect(mockedApiClient.apiGet).toHaveBeenCalledWith(
        expect.stringContaining('/my-refuges-proposals/')
      );
      expect(result).toHaveLength(1);
    });

    it('should list user proposals with status filter', async () => {
      mockedApiClient.apiGet.mockResolvedValue({
        ok: true,
        json: async () => [mockProposalDTO],
      } as Response);

      await RefugeProposalsService.listMyProposals('approved');

      expect(mockedApiClient.apiGet).toHaveBeenCalledWith(
        expect.stringContaining('status=approved')
      );
    });

    it('should return empty array for non-array response', async () => {
      mockedApiClient.apiGet.mockResolvedValue({
        ok: true,
        json: async () => null,
      } as Response);

      const result = await RefugeProposalsService.listMyProposals();

      expect(result).toEqual([]);
    });

    it('should handle unauthorized error (401)', async () => {
      mockedApiClient.apiGet.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({}),
      } as Response);

      await expect(RefugeProposalsService.listMyProposals())
        .rejects.toThrow('No estàs autenticat');
    });

    it('should handle server error (500)', async () => {
      mockedApiClient.apiGet.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
      } as Response);

      await expect(RefugeProposalsService.listMyProposals())
        .rejects.toThrow('Error del servidor');
    });
  });

  describe('approveProposal', () => {
    it('should approve a proposal successfully', async () => {
      mockedApiClient.apiPost.mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'Approved' }),
      } as Response);

      const result = await RefugeProposalsService.approveProposal('proposal-1');

      expect(mockedApiClient.apiPost).toHaveBeenCalledWith(
        expect.stringContaining('/refuges-proposals/proposal-1/approve/'),
        {}
      );
      expect(result).toBe(true);
    });

    it('should handle not found error (404)', async () => {
      mockedApiClient.apiPost.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({}),
      } as Response);

      await expect(RefugeProposalsService.approveProposal('invalid-id'))
        .rejects.toThrow('No s\'ha trobat la proposta');
    });

    it('should handle conflict error (409)', async () => {
      mockedApiClient.apiPost.mockResolvedValue({
        ok: false,
        status: 409,
        statusText: 'Conflict',
        json: async () => ({}),
      } as Response);

      await expect(RefugeProposalsService.approveProposal('proposal-1'))
        .rejects.toThrow('ja ha estat revisada');
    });

    it('should handle forbidden error (403)', async () => {
      mockedApiClient.apiPost.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({}),
      } as Response);

      await expect(RefugeProposalsService.approveProposal('proposal-1'))
        .rejects.toThrow('No tens permisos');
    });
  });

  describe('rejectProposal', () => {
    it('should reject a proposal without reason', async () => {
      mockedApiClient.apiPost.mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'Rejected' }),
      } as Response);

      const result = await RefugeProposalsService.rejectProposal('proposal-1');

      expect(mockedApiClient.apiPost).toHaveBeenCalledWith(
        expect.stringContaining('/refuges-proposals/proposal-1/reject/'),
        {}
      );
      expect(result).toBe(true);
    });

    it('should reject a proposal with reason', async () => {
      mockedApiClient.apiPost.mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'Rejected' }),
      } as Response);

      await RefugeProposalsService.rejectProposal('proposal-1', 'Invalid data');

      expect(mockedApiClient.apiPost).toHaveBeenCalledWith(
        expect.stringContaining('/refuges-proposals/proposal-1/reject/'),
        { reason: 'Invalid data' }
      );
    });

    it('should handle not found error (404)', async () => {
      mockedApiClient.apiPost.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({}),
      } as Response);

      await expect(RefugeProposalsService.rejectProposal('invalid-id'))
        .rejects.toThrow('No s\'ha trobat la proposta');
    });

    it('should handle conflict error (409)', async () => {
      mockedApiClient.apiPost.mockResolvedValue({
        ok: false,
        status: 409,
        statusText: 'Conflict',
        json: async () => ({}),
      } as Response);

      await expect(RefugeProposalsService.rejectProposal('proposal-1'))
        .rejects.toThrow('ja ha estat revisada');
    });
  });

  describe('proposalCreateRefuge', () => {
    it('should create a create proposal', async () => {
      mockedApiClient.apiPost.mockResolvedValue({
        ok: true,
        json: async () => mockProposalDTO,
      } as Response);

      await RefugeProposalsService.proposalCreateRefuge(mockLocation, 'New refuge');

      expect(mockedApiClient.apiPost).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          action: 'create',
          comment: 'New refuge',
        })
      );
    });

    it('should create a create proposal without comment', async () => {
      mockedApiClient.apiPost.mockResolvedValue({
        ok: true,
        json: async () => mockProposalDTO,
      } as Response);

      await RefugeProposalsService.proposalCreateRefuge(mockLocation);

      expect(mockedApiClient.apiPost).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          action: 'create',
          comment: null,
        })
      );
    });
  });

  describe('proposalEditRefuge', () => {
    it('should create an update proposal', async () => {
      mockedApiClient.apiPost.mockResolvedValue({
        ok: true,
        json: async () => mockProposalDTO,
      } as Response);

      await RefugeProposalsService.proposalEditRefuge(
        'refuge-1', 
        { name: 'Updated Name' }, 
        'Correcting name'
      );

      expect(mockedApiClient.apiPost).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          action: 'update',
          refuge_id: 'refuge-1',
          comment: 'Correcting name',
        })
      );
    });

    it('should create an update proposal without comment', async () => {
      mockedApiClient.apiPost.mockResolvedValue({
        ok: true,
        json: async () => mockProposalDTO,
      } as Response);

      await RefugeProposalsService.proposalEditRefuge('refuge-1', { altitude: 2000 });

      expect(mockedApiClient.apiPost).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          action: 'update',
          refuge_id: 'refuge-1',
          comment: null,
        })
      );
    });
  });

  describe('proposalDeleteRefuge', () => {
    it('should create a delete proposal', async () => {
      mockedApiClient.apiPost.mockResolvedValue({
        ok: true,
        json: async () => mockProposalDTO,
      } as Response);

      await RefugeProposalsService.proposalDeleteRefuge('refuge-1', 'Duplicate');

      expect(mockedApiClient.apiPost).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          action: 'delete',
          refuge_id: 'refuge-1',
          comment: 'Duplicate',
        })
      );
    });

    it('should create a delete proposal without comment', async () => {
      mockedApiClient.apiPost.mockResolvedValue({
        ok: true,
        json: async () => mockProposalDTO,
      } as Response);

      await RefugeProposalsService.proposalDeleteRefuge('refuge-1');

      expect(mockedApiClient.apiPost).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          action: 'delete',
          refuge_id: 'refuge-1',
          comment: null,
        })
      );
    });
  });
});
