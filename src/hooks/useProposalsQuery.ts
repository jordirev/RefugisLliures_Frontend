/**
 * React Query hooks for Proposals API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefugeProposalsService } from '../services/RefugeProposalsService';
import { queryKeys } from '../config/queryClient';
import { RefugeProposalStatus, Location } from '../models';

/**
 * Hook to fetch all proposals (admin only)
 */
export function useProposals(status?: RefugeProposalStatus, refugeId?: string) {
  const filters = { status, refugeId };
  
  return useQuery({
    queryKey: queryKeys.proposalsList(filters),
    queryFn: async () => {
      return await RefugeProposalsService.listProposals(status, refugeId);
    },
  });
}

/**
 * Hook to fetch user's own proposals
 */
export function useMyProposals(status?: RefugeProposalStatus) {
  return useQuery({
    queryKey: queryKeys.myProposals(status),
    queryFn: async () => {
      return await RefugeProposalsService.listMyProposals(status);
    },
  });
}

/**
 * Hook to approve a proposal
 */
export function useApproveProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      proposalId, 
      proposalType, 
      refugeId 
    }: { 
      proposalId: string;
      proposalType?: 'create' | 'update' | 'delete';
      refugeId?: string;
    }) => {
      await RefugeProposalsService.approveProposal(proposalId);
      return { proposalId, proposalType, refugeId };
    },
    onSuccess: (data) => {
      // Invalidate all refuge and proposal queries
      queryClient.invalidateQueries({ queryKey: queryKeys.refuges });
      queryClient.invalidateQueries({ queryKey: queryKeys.proposals });
      queryClient.invalidateQueries({ queryKey: queryKeys.myProposals() });

      // Si s'ha aprovat una proposta d'eliminació de refugi
      if (data.proposalType === 'delete' && data.refugeId) {
        // Invalidar totes les renovacions (les del refugi eliminat s'hauran eliminat)
        queryClient.invalidateQueries({ queryKey: ['renovations'] });

        // Invalidar refugis favorits i visitats (per si el refugi estava en aquestes llistes)
        queryClient.invalidateQueries({ queryKey: ['users'] });

        // Invalidar dades del user
        queryClient.invalidateQueries({ queryKey: ['users', 'detail'] });
      }
    },
  });
}

/**
 * Hook to reject a proposal
 */
export function useRejectProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ proposalId, reason }: { proposalId: string; reason?: string }) => {
      return await RefugeProposalsService.rejectProposal(proposalId, reason);
    },
    onSuccess: () => {
      // Invalidate proposal queries
      queryClient.invalidateQueries({ queryKey: queryKeys.proposals });
      queryClient.invalidateQueries({ queryKey: queryKeys.myProposals() });
    },
  });
}

/**
 * Hook to create a refuge proposal (create)
 */
export function useCreateRefugeProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ payload, comment }: { payload: Location; comment?: string }) => {
      return await RefugeProposalsService.proposalCreateRefuge(payload, comment);
    },
    onSuccess: () => {
      // Invalidate proposals
      queryClient.invalidateQueries({ queryKey: queryKeys.proposals });
      queryClient.invalidateQueries({ queryKey: queryKeys.myProposals() });
    },
  });
}

/**
 * Hook to create a refuge proposal (update)
 */
export function useUpdateRefugeProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      refugeId, 
      payload, 
      comment 
    }: { 
      refugeId: string; 
      payload: Partial<Location>; 
      comment?: string;
    }) => {
      return await RefugeProposalsService.proposalEditRefuge(refugeId, payload, comment);
    },
    onSuccess: () => {
      // Invalidate proposals
      queryClient.invalidateQueries({ queryKey: queryKeys.proposals });
      queryClient.invalidateQueries({ queryKey: queryKeys.myProposals() });
    },
  });
}

/**
 * Hook to create a refuge proposal (delete)
 */
export function useDeleteRefugeProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ refugeId, comment }: { refugeId: string; comment?: string }) => {
      return await RefugeProposalsService.proposalDeleteRefuge(refugeId, comment);
    },
    onSuccess: () => {
      // Invalidate proposals
      queryClient.invalidateQueries({ queryKey: queryKeys.proposals });
      queryClient.invalidateQueries({ queryKey: queryKeys.myProposals() });
    },
  });
}
