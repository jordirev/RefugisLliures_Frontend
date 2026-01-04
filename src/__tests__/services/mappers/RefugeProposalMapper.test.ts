/**
 * Tests for RefugeProposalMapper functions
 */

import {
  mapRefugeProposalFromDTO,
  mapRefugeProposalsFromDTO,
} from '../../../services/mappers/RefugeProposalMapper';

describe('RefugeProposalMapper', () => {
  const validProposalDTO = {
    id: 'proposal-1',
    refuge_id: 'refuge-1',
    refuge_snapshot: {
      id: 'refuge-1',
      name: 'Test Refuge',
      coord: { long: 1.5, lat: 42.5 },
      altitude: 2000,
    },
    action: 'edit',
    payload: {
      name: 'Updated Refuge Name',
      description: 'Updated description',
    },
    comment: 'Please review my changes',
    status: 'pending',
    creator_uid: 'user-123',
    created_at: '2024-01-15T10:00:00Z',
    reviewer_uid: null,
    reviewed_at: null,
    rejection_reason: null,
  };

  describe('mapRefugeProposalFromDTO', () => {
    it('should convert a complete proposal DTO to RefugeProposal', () => {
      const result = mapRefugeProposalFromDTO(validProposalDTO);

      expect(result.id).toBe('proposal-1');
      expect(result.refuge_id).toBe('refuge-1');
      expect(result.action).toBe('edit');
      expect(result.status).toBe('pending');
      expect(result.creator_uid).toBe('user-123');
      expect(result.payload).toEqual({
        name: 'Updated Refuge Name',
        description: 'Updated description',
      });
    });

    it('should handle proposal with null refuge_snapshot', () => {
      const dtoWithNullSnapshot = {
        ...validProposalDTO,
        refuge_snapshot: null,
      };

      const result = mapRefugeProposalFromDTO(dtoWithNullSnapshot);

      expect(result.refuge_snapshot).toBeNull();
    });

    it('should handle proposal with partial refuge_snapshot (no coord)', () => {
      const dtoWithPartialSnapshot = {
        ...validProposalDTO,
        refuge_snapshot: {
          id: 'refuge-1',
          name: 'Test Refuge',
          // missing coord
        },
      };

      const result = mapRefugeProposalFromDTO(dtoWithPartialSnapshot as any);

      // Should return the partial object as-is
      expect(result.refuge_snapshot).toBeDefined();
      expect(result.refuge_snapshot?.name).toBe('Test Refuge');
    });

    it('should handle create action proposal', () => {
      const createProposalDTO = {
        ...validProposalDTO,
        action: 'create',
        refuge_id: null,
      };

      const result = mapRefugeProposalFromDTO(createProposalDTO as any);

      expect(result.action).toBe('create');
      expect(result.refuge_id).toBeNull();
    });

    it('should handle delete action proposal', () => {
      const deleteProposalDTO = {
        ...validProposalDTO,
        action: 'delete',
        payload: null,
      };

      const result = mapRefugeProposalFromDTO(deleteProposalDTO);

      expect(result.action).toBe('delete');
      expect(result.payload).toBeNull();
    });

    it('should handle approved proposal with reviewer info', () => {
      const approvedProposalDTO = {
        ...validProposalDTO,
        status: 'approved',
        reviewer_uid: 'admin-123',
        reviewed_at: '2024-01-16T15:00:00Z',
      };

      const result = mapRefugeProposalFromDTO(approvedProposalDTO);

      expect(result.status).toBe('approved');
      expect(result.reviewer_uid).toBe('admin-123');
      expect(result.reviewed_at).toBe('2024-01-16T15:00:00Z');
    });

    it('should handle rejected proposal with rejection reason', () => {
      const rejectedProposalDTO = {
        ...validProposalDTO,
        status: 'rejected',
        reviewer_uid: 'admin-123',
        reviewed_at: '2024-01-16T15:00:00Z',
        rejection_reason: 'Insufficient information provided',
      };

      const result = mapRefugeProposalFromDTO(rejectedProposalDTO);

      expect(result.status).toBe('rejected');
      expect(result.rejection_reason).toBe('Insufficient information provided');
    });
  });

  describe('mapRefugeProposalsFromDTO', () => {
    it('should convert array of proposal DTOs', () => {
      const proposals = [
        validProposalDTO,
        {
          ...validProposalDTO,
          id: 'proposal-2',
          action: 'create',
        },
      ];

      const result = mapRefugeProposalsFromDTO(proposals);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('proposal-1');
      expect(result[1].id).toBe('proposal-2');
    });

    it('should return empty array for empty input', () => {
      const result = mapRefugeProposalsFromDTO([]);
      expect(result).toEqual([]);
    });
  });
});
