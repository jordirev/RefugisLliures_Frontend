/**
 * Tests per a la configuració de React Query
 * 
 * Aquest fitxer cobreix:
 * - Configuració del QueryClient
 * - Generació de query keys
 */

import { queryClient, queryKeys } from '../../config/queryClient';

describe('queryClient', () => {
  describe('QueryClient configuration', () => {
    it('should be defined', () => {
      expect(queryClient).toBeDefined();
    });

    it('should have default query options', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      expect(defaultOptions.queries).toBeDefined();
    });

    it('should have staleTime configured', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      expect(defaultOptions.queries?.staleTime).toBe(9 * 60 * 1000);
    });

    it('should have gcTime configured', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      expect(defaultOptions.queries?.gcTime).toBe(15 * 60 * 1000);
    });

    it('should have retry configured to 2', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      expect(defaultOptions.queries?.retry).toBe(2);
    });

    it('should have refetchOnWindowFocus disabled', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(false);
    });

    it('should have refetchOnReconnect enabled', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      expect(defaultOptions.queries?.refetchOnReconnect).toBe(true);
    });

    it('should have mutations retry set to 0', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      expect(defaultOptions.mutations?.retry).toBe(0);
    });
  });

  describe('queryKeys', () => {
    describe('refuges keys', () => {
      it('should have refuges base key', () => {
        expect(queryKeys.refuges).toEqual(['refuges']);
      });

      it('should generate refugesList key without filters', () => {
        const result = queryKeys.refugesList();
        expect(result).toEqual(['refuges', 'list']);
      });

      it('should generate refugesList key with filters', () => {
        const filters = { region: 'Pirineus', type: 'refuge' };
        const result = queryKeys.refugesList(filters);
        expect(result).toEqual(['refuges', 'list', filters]);
      });

      it('should generate refuge detail key', () => {
        const result = queryKeys.refuge('refuge-123');
        expect(result).toEqual(['refuges', 'detail', 'refuge-123']);
      });
    });

    describe('users keys', () => {
      it('should have users base key', () => {
        expect(queryKeys.users).toEqual(['users']);
      });

      it('should generate user detail key', () => {
        const result = queryKeys.user('user-456');
        expect(result).toEqual(['users', 'detail', 'user-456']);
      });

      it('should have currentUser key', () => {
        expect(queryKeys.currentUser).toEqual(['users', 'current']);
      });

      it('should generate favouriteRefuges key', () => {
        const result = queryKeys.favouriteRefuges('user-789');
        expect(result).toEqual(['users', 'user-789', 'favouriteRefuges']);
      });

      it('should generate visitedRefuges key', () => {
        const result = queryKeys.visitedRefuges('user-abc');
        expect(result).toEqual(['users', 'user-abc', 'visitedRefuges']);
      });
    });

    describe('renovations keys', () => {
      it('should have renovations base key', () => {
        expect(queryKeys.renovations).toEqual(['renovations']);
      });

      it('should generate renovationsList key', () => {
        const result = queryKeys.renovationsList();
        expect(result).toEqual(['renovations', 'list']);
      });

      it('should generate renovation detail key', () => {
        const result = queryKeys.renovation('renovation-123');
        expect(result).toEqual(['renovations', 'detail', 'renovation-123']);
      });

      it('should generate userRenovations key', () => {
        const result = queryKeys.userRenovations('user-xyz');
        expect(result).toEqual(['renovations', 'user', 'user-xyz']);
      });

      it('should generate refugeRenovations key', () => {
        const result = queryKeys.refugeRenovations('refuge-456');
        expect(result).toEqual(['renovations', 'refuge', 'refuge-456']);
      });
    });

    describe('proposals keys', () => {
      it('should have proposals base key', () => {
        expect(queryKeys.proposals).toEqual(['proposals']);
      });

      it('should generate proposalsList key without filters', () => {
        const result = queryKeys.proposalsList();
        expect(result).toEqual(['proposals', 'list']);
      });

      it('should generate proposalsList key with status filter', () => {
        const filters = { status: 'pending' };
        const result = queryKeys.proposalsList(filters);
        expect(result).toEqual(['proposals', 'list', filters]);
      });

      it('should generate proposalsList key with refugeId filter', () => {
        const filters = { refugeId: 'refuge-123' };
        const result = queryKeys.proposalsList(filters);
        expect(result).toEqual(['proposals', 'list', filters]);
      });

      it('should generate proposalsList key with multiple filters', () => {
        const filters = { status: 'approved', refugeId: 'refuge-789' };
        const result = queryKeys.proposalsList(filters);
        expect(result).toEqual(['proposals', 'list', filters]);
      });

      it('should generate myProposals key without status', () => {
        const result = queryKeys.myProposals();
        expect(result).toEqual(['proposals', 'my']);
      });

      it('should generate myProposals key with status', () => {
        const result = queryKeys.myProposals('pending');
        expect(result).toEqual(['proposals', 'my', 'pending']);
      });

      it('should generate myProposals key with approved status', () => {
        const result = queryKeys.myProposals('approved');
        expect(result).toEqual(['proposals', 'my', 'approved']);
      });

      it('should generate myProposals key with rejected status', () => {
        const result = queryKeys.myProposals('rejected');
        expect(result).toEqual(['proposals', 'my', 'rejected']);
      });

      it('should generate proposal detail key', () => {
        const result = queryKeys.proposal('proposal-abc');
        expect(result).toEqual(['proposals', 'detail', 'proposal-abc']);
      });
    });

    describe('edge cases', () => {
      it('should handle empty string id for refuge', () => {
        const result = queryKeys.refuge('');
        expect(result).toEqual(['refuges', 'detail', '']);
      });

      it('should handle empty string uid for user', () => {
        const result = queryKeys.user('');
        expect(result).toEqual(['users', 'detail', '']);
      });

      it('should handle special characters in id', () => {
        const result = queryKeys.refuge('refuge-with-special-chars-!@#');
        expect(result).toEqual(['refuges', 'detail', 'refuge-with-special-chars-!@#']);
      });

      it('should handle very long id', () => {
        const longId = 'a'.repeat(1000);
        const result = queryKeys.refuge(longId);
        expect(result).toEqual(['refuges', 'detail', longId]);
      });

      it('should handle undefined status in myProposals', () => {
        const result = queryKeys.myProposals(undefined);
        expect(result).toEqual(['proposals', 'my']);
      });

      it('should handle empty filters object in refugesList', () => {
        const result = queryKeys.refugesList({});
        expect(result).toEqual(['refuges', 'list', {}]);
      });

      it('should handle empty filters object in proposalsList', () => {
        const result = queryKeys.proposalsList({});
        expect(result).toEqual(['proposals', 'list', {}]);
      });
    });
  });
});
