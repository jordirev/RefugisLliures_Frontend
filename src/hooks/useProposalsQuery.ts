/**
 * React Query hooks for Proposals API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefugeProposalsService } from '../services/RefugeProposalsService';
import { queryKeys } from '../config/queryClient';
import { RefugeProposalStatus, Location, RefugeProposal } from '../models';
import { auth } from '../services/firebase';

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
    onMutate: async ({ proposalId }) => {
      // Cancel any outgoing refetches per evitar que sobreescriguin les actualitzacions optimistes
      await queryClient.cancelQueries({ queryKey: ['proposals'] });

      // Obtenir el uid del revisor actual
      const reviewerUid = auth.currentUser?.uid || null;
      const reviewedAt = new Date().toISOString();

      // Snapshot de l'estat anterior per poder fer rollback en cas d'error
      const previousData: Record<string, any> = {};

      // Actualitzar totes les llistes de proposals de manera optimista
      // Obtenir totes les query keys de proposals que estiguin actives
      queryClient.getQueriesData({ queryKey: ['proposals'] }).forEach(([queryKey, data]) => {
        if (Array.isArray(data)) {
          // Guardar snapshot
          previousData[JSON.stringify(queryKey)] = data;

          // Trobar la proposal que s'està aprovant
          const proposalIndex = data.findIndex((p: RefugeProposal) => p.id === proposalId);
          
          if (proposalIndex !== -1) {
            const proposal = data[proposalIndex];
            const updatedProposal: RefugeProposal = {
              ...proposal,
              status: 'approved',
              reviewer_uid: reviewerUid,
              reviewed_at: reviewedAt,
            };

            // Determinar si aquesta query és de pending, approved o all
            const queryKeyStr = JSON.stringify(queryKey);
            
            // Si és la llista de pending, eliminar la proposal
            if (queryKeyStr.includes('"status":"pending"') || queryKeyStr.includes('"my","pending"')) {
              const newData = data.filter((p: RefugeProposal) => p.id !== proposalId);
              queryClient.setQueryData(queryKey as any, newData);
            }
            // Si és la llista de approved, afegir la proposal actualitzada
            else if (queryKeyStr.includes('"status":"approved"') || queryKeyStr.includes('"my","approved"')) {
              const newData = [...data, updatedProposal];
              queryClient.setQueryData(queryKey as any, newData);
            }
            // Si és la llista de all (sense filtre de status), actualitzar in-place
            else if (queryKeyStr.includes('"list"]') || queryKeyStr.includes('"my"]')) {
              const newData = [...data];
              newData[proposalIndex] = updatedProposal;
              queryClient.setQueryData(queryKey as any, newData);
            }
          }
        }
      });

      return { previousData };
    },
    onError: (_error, _variables, context) => {
      // En cas d'error, restaurar l'estat anterior
      if (context?.previousData) {
        Object.entries(context.previousData).forEach(([queryKeyStr, data]) => {
          const queryKey = JSON.parse(queryKeyStr);
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: async (data) => {
      // Després de la mutació (èxit o error), refetch per sincronitzar amb el servidor
      // Això assegura que les dades són correctes
      await queryClient.refetchQueries({ 
        queryKey: ['proposals'],
        type: 'active'
      });

      // Invalidate refuges si la proposta afecta els refugis
      queryClient.invalidateQueries({ queryKey: queryKeys.refuges });

      // Si s'ha aprovat una proposta d'eliminació de refugi
      if (data?.proposalType === 'delete' && data?.refugeId) {
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
      await RefugeProposalsService.rejectProposal(proposalId, reason);
      return { proposalId, reason };
    },
    onMutate: async ({ proposalId, reason }) => {
      // Cancel any outgoing refetches per evitar que sobreescriguin les actualitzacions optimistes
      await queryClient.cancelQueries({ queryKey: ['proposals'] });

      // Obtenir el uid del revisor actual
      const reviewerUid = auth.currentUser?.uid || null;
      const reviewedAt = new Date().toISOString();

      // Snapshot de l'estat anterior per poder fer rollback en cas d'error
      const previousData: Record<string, any> = {};

      // Actualitzar totes les llistes de proposals de manera optimista
      // Obtenir totes les query keys de proposals que estiguin actives
      queryClient.getQueriesData({ queryKey: ['proposals'] }).forEach(([queryKey, data]) => {
        if (Array.isArray(data)) {
          // Guardar snapshot
          previousData[JSON.stringify(queryKey)] = data;

          // Trobar la proposal que s'està rebutjant
          const proposalIndex = data.findIndex((p: RefugeProposal) => p.id === proposalId);
          
          if (proposalIndex !== -1) {
            const proposal = data[proposalIndex];
            const updatedProposal: RefugeProposal = {
              ...proposal,
              status: 'rejected',
              reviewer_uid: reviewerUid,
              reviewed_at: reviewedAt,
              rejection_reason: reason || null,
            };

            // Determinar si aquesta query és de pending, rejected o all
            const queryKeyStr = JSON.stringify(queryKey);
            
            // Si és la llista de pending, eliminar la proposal
            if (queryKeyStr.includes('"status":"pending"') || queryKeyStr.includes('"my","pending"')) {
              const newData = data.filter((p: RefugeProposal) => p.id !== proposalId);
              queryClient.setQueryData(queryKey as any, newData);
            }
            // Si és la llista de rejected, afegir la proposal actualitzada
            else if (queryKeyStr.includes('"status":"rejected"') || queryKeyStr.includes('"my","rejected"')) {
              const newData = [...data, updatedProposal];
              queryClient.setQueryData(queryKey as any, newData);
            }
            // Si és la llista de all (sense filtre de status), actualitzar in-place
            else if (queryKeyStr.includes('"list"]') || queryKeyStr.includes('"my"]')) {
              const newData = [...data];
              newData[proposalIndex] = updatedProposal;
              queryClient.setQueryData(queryKey as any, newData);
            }
          }
        }
      });

      return { previousData };
    },
    onError: (_error, _variables, context) => {
      // En cas d'error, restaurar l'estat anterior
      if (context?.previousData) {
        Object.entries(context.previousData).forEach(([queryKeyStr, data]) => {
          const queryKey = JSON.parse(queryKeyStr);
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: async () => {
      // Després de la mutació (èxit o error), refetch per sincronitzar amb el servidor
      // Això assegura que les dades són correctes
      await queryClient.refetchQueries({ 
        queryKey: ['proposals'],
        type: 'active'
      });
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
      // Invalidar totes les queries de proposals
      queryClient.invalidateQueries({ 
        queryKey: ['proposals'],
        refetchType: 'active'
      });
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
      // Invalidar totes les queries de proposals
      queryClient.invalidateQueries({ 
        queryKey: ['proposals'],
        refetchType: 'active'
      });
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
      // Invalidar totes les queries de proposals
      queryClient.invalidateQueries({ 
        queryKey: ['proposals'],
        refetchType: 'active'
      });
    },
  });
}
