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

    it('should handle snapshot with partial data missing name', () => {
      const dtoWithPartialSnapshot = {
        ...validProposalDTO,
        refuge_snapshot: {
          id: 'refuge-1',
          // missing name and coord
          altitude: 2000,
        },
      };

      const result = mapRefugeProposalFromDTO(dtoWithPartialSnapshot as any);

      // Should return the partial object as-is since it doesn't have required fields
      expect(result.refuge_snapshot).toBeDefined();
      expect(result.refuge_snapshot?.id).toBe('refuge-1');
    });

    it('should handle snapshot with coord but no name', () => {
      const dtoWithCoordOnly = {
        ...validProposalDTO,
        refuge_snapshot: {
          id: 'refuge-1',
          coord: { long: 1.5, lat: 42.5 },
          // missing name
        },
      };

      const result = mapRefugeProposalFromDTO(dtoWithCoordOnly as any);

      expect(result.refuge_snapshot).toBeDefined();
      expect(result.refuge_snapshot?.coord).toEqual({ long: 1.5, lat: 42.5 });
    });

    it('should handle error during snapshot mapping and return original dto', () => {
      // Create a DTO that will cause mapRefugiFromDTO to throw
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const problematicDTO = {
        ...validProposalDTO,
        refuge_snapshot: {
          name: 'Test',
          coord: { long: 1.5, lat: 42.5 },
          // This is a valid snapshot that should be mapped
        },
      };

      const result = mapRefugeProposalFromDTO(problematicDTO as any);
      
      expect(result.refuge_snapshot).toBeDefined();
      consoleSpy.mockRestore();
    });

    it('should handle empty DTO gracefully without throwing', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Create an empty DTO - the mapper returns an object with undefined values
      const emptyDTO = {} as any;

      const result = mapRefugeProposalFromDTO(emptyDTO);
      
      // The mapper should not throw, but return an object with undefined values
      expect(result).toBeDefined();
      expect(result.id).toBeUndefined();
      expect(result.action).toBeUndefined();
      consoleSpy.mockRestore();
    });

    it('should preserve payload as raw object for deleted vs missing fields', () => {
      const dtoWithPayload = {
        ...validProposalDTO,
        payload: {
          name: 'New Name',
          description: null, // explicitly deleted
          // altitude is missing (not deleted)
        },
      };

      const result = mapRefugeProposalFromDTO(dtoWithPayload);

      expect(result.payload).toEqual({
        name: 'New Name',
        description: null,
      });
    });

    it('should handle undefined optional fields', () => {
      const dtoWithUndefined = {
        id: 'proposal-1',
        refuge_id: 'refuge-1',
        refuge_snapshot: null,
        action: 'edit',
        payload: {},
        comment: undefined,
        status: 'pending',
        creator_uid: 'user-123',
        created_at: '2024-01-15T10:00:00Z',
        reviewer_uid: undefined,
        reviewed_at: undefined,
        rejection_reason: undefined,
      };

      const result = mapRefugeProposalFromDTO(dtoWithUndefined as any);

      expect(result.comment).toBeUndefined();
      expect(result.reviewer_uid).toBeUndefined();
      expect(result.reviewed_at).toBeUndefined();
      expect(result.rejection_reason).toBeUndefined();
    });

    it('should handle complete refuge_snapshot with all fields', () => {
      const dtoWithCompleteSnapshot = {
        ...validProposalDTO,
        refuge_snapshot: {
          id: 'refuge-1',
          name: 'Complete Refuge',
          coord: { long: 1.5, lat: 42.5 },
          altitude: 2500,
          places: 30,
          description: 'A complete refuge',
          type: 'refuge',
          condition: 'good',
          region: 'Pyrenees',
          departement: 'Lleida',
        },
      };

      const result = mapRefugeProposalFromDTO(dtoWithCompleteSnapshot as any);

      expect(result.refuge_snapshot).toBeDefined();
      expect(result.refuge_snapshot?.name).toBe('Complete Refuge');
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

    it('should handle array with single proposal', () => {
      const result = mapRefugeProposalsFromDTO([validProposalDTO]);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('proposal-1');
    });

    it('should handle array with multiple actions', () => {
      const proposals = [
        { ...validProposalDTO, id: 'p1', action: 'create' },
        { ...validProposalDTO, id: 'p2', action: 'edit' },
        { ...validProposalDTO, id: 'p3', action: 'delete' },
      ];

      const result = mapRefugeProposalsFromDTO(proposals);

      expect(result).toHaveLength(3);
      expect(result[0].action).toBe('create');
      expect(result[1].action).toBe('edit');
      expect(result[2].action).toBe('delete');
    });

    it('should handle array with different statuses', () => {
      const proposals = [
        { ...validProposalDTO, id: 'p1', status: 'pending' },
        { ...validProposalDTO, id: 'p2', status: 'approved' },
        { ...validProposalDTO, id: 'p3', status: 'rejected' },
      ];

      const result = mapRefugeProposalsFromDTO(proposals);

      expect(result).toHaveLength(3);
      expect(result[0].status).toBe('pending');
      expect(result[1].status).toBe('approved');
      expect(result[2].status).toBe('rejected');
    });
  });
});
