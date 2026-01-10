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
 * Hook personalitzat per gestionar el refresh manual directe des de l'API
 */
export function useRefreshProposals() {
  const queryClient = useQueryClient();

  return async (isAdminMode: boolean, status?: RefugeProposalStatus, refugeId?: string) => {
    // Llegir directament de l'API sense cache
    const freshData = isAdminMode
      ? await RefugeProposalsService.listProposals(status, refugeId)
      : await RefugeProposalsService.listMyProposals(status);

    // Actualitzar la cache amb les dades fresques de la query actual
    // Netegem les propietats undefined per evitar problemes amb la comparació de query keys
    const filters: { status?: RefugeProposalStatus; refugeId?: string } = {};
    if (status !== undefined) filters.status = status;
    if (refugeId !== undefined) filters.refugeId = refugeId;
    
    const queryKey = isAdminMode 
      ? queryKeys.proposalsList(Object.keys(filters).length > 0 ? filters : undefined)
      : queryKeys.myProposals(status);
    
    queryClient.setQueryData(queryKey, freshData);
    
    // IMPORTANT: Invalidar TOTES les queries de proposals per forçar que es refresquin totes
    // Això assegura que quan canviem de tab (pending -> approved -> all), totes les dades estiguin actualitzades
    await queryClient.invalidateQueries({ 
      queryKey: ['proposals'],
      refetchType: 'none' // No refetch ara, ja hem actualitzat la query actual
    });

    return freshData;
  };
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
    onMutate: async ({ proposalId, refugeId }) => {
      // Cancel·lar qualsevol refetch per evitar sobreescriptures
      await queryClient.cancelQueries({ queryKey: ['proposals'] });

      const reviewerUid = auth.currentUser?.uid || null;
      const reviewedAt = new Date().toISOString();
      const previousData: Record<string, any> = {};

      // Obtenir totes les queries de proposals actives
      queryClient.getQueriesData({ queryKey: ['proposals'] }).forEach(([queryKey, data]) => {
        if (!Array.isArray(data)) return;
        
        previousData[JSON.stringify(queryKey)] = data;

        const proposal = data.find((p: RefugeProposal) => p.id === proposalId);
        if (!proposal) return;

        const updatedProposal: RefugeProposal = {
          ...proposal,
          status: 'approved',
          reviewer_uid: reviewerUid,
          reviewed_at: reviewedAt,
        };

        // Analitzar el tipus de query basant-nos en l'estructura de la queryKey
        // queryKey pot ser: ['proposals', 'list', { status?, refugeId? }] o ['proposals', 'my', status?]
        const keyArray = queryKey as any[];
        const isAdminQuery = keyArray[1] === 'list';
        const isMyQuery = keyArray[1] === 'my';
        
        let queryStatus: string | undefined;
        
        if (isAdminQuery && keyArray[2] && typeof keyArray[2] === 'object') {
          queryStatus = keyArray[2].status;
        } else if (isMyQuery && keyArray[2]) {
          queryStatus = keyArray[2];
        }

        // Llista de PENDING: eliminar la proposal
        if (queryStatus === 'pending') {
          const newData = data.filter((p: RefugeProposal) => p.id !== proposalId);
          queryClient.setQueryData(queryKey as any, newData);
        }
        // Llista de APPROVED: afegir la proposal actualitzada
        else if (queryStatus === 'approved') {
          const newData = [...data, updatedProposal];
          queryClient.setQueryData(queryKey as any, newData);
        }
        // Llista de ALL (sense filtre de status): actualitzar in-place
        else if (queryStatus === undefined) {
          const proposalIndex = data.findIndex((p: RefugeProposal) => p.id === proposalId);
          if (proposalIndex !== -1) {
            const newData = [...data];
            newData[proposalIndex] = updatedProposal;
            queryClient.setQueryData(queryKey as any, newData);
          }
        }
      });

      return { previousData, refugeId };
    },
    onError: (_error, _variables, context) => {
      // Restaurar l'estat anterior en cas d'error
      if (context?.previousData) {
        Object.entries(context.previousData).forEach(([queryKeyStr, data]) => {
          const queryKey = JSON.parse(queryKeyStr);
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: async (_result, variables, context) => {
      const { proposalType, refugeId } = variables;

      // PRIMER: Refetch totes les queries de proposals per sincronitzar amb el servidor
      // Això assegura que totes les llistes (pending, approved, all) tinguin les dades correctes
      await queryClient.refetchQueries({ 
        queryKey: ['proposals'],
        type: 'active'
      });

      // SEGON: Invalidar les queries relacionades amb refugis
      const currentUserId = auth.currentUser?.uid;

      // Si és una proposta de crear refugi
      if (proposalType === 'create') {
        // Invalidar llista de refugis
        queryClient.invalidateQueries({ queryKey: queryKeys.refuges });
      }

      // Si és una proposta d'actualitzar refugi
      if (proposalType === 'update') {
        if (refugeId) {
          // Invalidar el refugi específic
          queryClient.invalidateQueries({ queryKey: queryKeys.refuge(refugeId) });
        }
        // Invalidar llista de refugis
        queryClient.invalidateQueries({ queryKey: queryKeys.refuges });
        
        // SEMPRE invalidar favourites i visited per actualitzar ProfileScreen i FavouritesScreen
        if (currentUserId) {
          queryClient.invalidateQueries({ queryKey: queryKeys.favouriteRefuges(currentUserId) });
          queryClient.invalidateQueries({ queryKey: queryKeys.visitedRefuges(currentUserId) });
        }
      }

      // Si és una proposta d'eliminar refugi
      if (proposalType === 'delete' && refugeId) {
        // Invalidar el refugi eliminat
        queryClient.invalidateQueries({ queryKey: queryKeys.refuge(refugeId) });
        
        // Invalidar refugis favorits i visitats (per si estava a la llista)
        if (currentUserId) {
          queryClient.invalidateQueries({ queryKey: queryKeys.favouriteRefuges(currentUserId) });
          queryClient.invalidateQueries({ queryKey: queryKeys.visitedRefuges(currentUserId) });
          queryClient.invalidateQueries({ queryKey: queryKeys.user(currentUserId) });
        }
        
        // Invalidar totes les llistes de refugis
        queryClient.invalidateQueries({ queryKey: queryKeys.refuges });
        
        // Invalidar renovacions del refugi eliminat
        queryClient.invalidateQueries({ queryKey: queryKeys.refugeRenovations(refugeId) });
      }

      // Sempre invalidar totes les queries de users (per si el refugi estava a visited/favourites)
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
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
      // Cancel·lar qualsevol refetch per evitar sobreescriptures
      await queryClient.cancelQueries({ queryKey: ['proposals'] });

      const reviewerUid = auth.currentUser?.uid || null;
      const reviewedAt = new Date().toISOString();
      const previousData: Record<string, any> = {};

      // Obtenir totes les queries de proposals actives
      queryClient.getQueriesData({ queryKey: ['proposals'] }).forEach(([queryKey, data]) => {
        if (!Array.isArray(data)) return;
        
        previousData[JSON.stringify(queryKey)] = data;

        const proposal = data.find((p: RefugeProposal) => p.id === proposalId);
        if (!proposal) return;

        const updatedProposal: RefugeProposal = {
          ...proposal,
          status: 'rejected',
          reviewer_uid: reviewerUid,
          reviewed_at: reviewedAt,
          rejection_reason: reason || null,
        };

        // Analitzar el tipus de query basant-nos en l'estructura de la queryKey
        // queryKey pot ser: ['proposals', 'list', { status?, refugeId? }] o ['proposals', 'my', status?]
        const keyArray = queryKey as any[];
        const isAdminQuery = keyArray[1] === 'list';
        const isMyQuery = keyArray[1] === 'my';
        
        let queryStatus: string | undefined;
        
        if (isAdminQuery && keyArray[2] && typeof keyArray[2] === 'object') {
          queryStatus = keyArray[2].status;
        } else if (isMyQuery && keyArray[2]) {
          queryStatus = keyArray[2];
        }

        // Llista de PENDING: eliminar la proposal
        if (queryStatus === 'pending') {
          const newData = data.filter((p: RefugeProposal) => p.id !== proposalId);
          queryClient.setQueryData(queryKey as any, newData);
        }
        // Llista de REJECTED: afegir la proposal actualitzada amb la informació de rebuig
        else if (queryStatus === 'rejected') {
          const newData = [...data, updatedProposal];
          queryClient.setQueryData(queryKey as any, newData);
        }
        // Llista de ALL (sense filtre de status): actualitzar in-place
        else if (queryStatus === undefined) {
          const proposalIndex = data.findIndex((p: RefugeProposal) => p.id === proposalId);
          if (proposalIndex !== -1) {
            const newData = [...data];
            newData[proposalIndex] = updatedProposal;
            queryClient.setQueryData(queryKey as any, newData);
          }
        }
      });

      return { previousData };
    },
    onError: (_error, _variables, context) => {
      // Restaurar l'estat anterior en cas d'error
      if (context?.previousData) {
        Object.entries(context.previousData).forEach(([queryKeyStr, data]) => {
          const queryKey = JSON.parse(queryKeyStr);
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: async () => {
      // Refetch totes les queries de proposals per sincronitzar amb el servidor
      // Això assegura que totes les llistes (pending, rejected, all) tinguin les dades correctes
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
    onSuccess: async (newProposal) => {
      // Actualització optimista: afegir la nova proposta a totes les llistes rellevants
      queryClient.getQueriesData({ queryKey: ['proposals'] }).forEach(([queryKey, data]) => {
        if (!Array.isArray(data)) return;
        
        // Analitzar el tipus de query basant-nos en l'estructura de la queryKey
        const keyArray = queryKey as any[];
        const isAdminQuery = keyArray[1] === 'list';
        const isMyQuery = keyArray[1] === 'my';
        
        let queryStatus: string | undefined;
        
        if (isAdminQuery && keyArray[2] && typeof keyArray[2] === 'object') {
          queryStatus = keyArray[2].status;
        } else if (isMyQuery && keyArray[2]) {
          queryStatus = keyArray[2];
        }
        
        // Afegir a la llista de pending (la nova proposta sempre serà pending)
        if (queryStatus === 'pending') {
          const newData = [newProposal, ...data];
          queryClient.setQueryData(queryKey as any, newData);
        }
        // Afegir a la llista de ALL (sense filtre)
        else if (queryStatus === undefined) {
          const newData = [newProposal, ...data];
          queryClient.setQueryData(queryKey as any, newData);
        }
      });

      // Invalidar per sincronitzar amb el servidor en properes lectures
      await queryClient.invalidateQueries({ 
        queryKey: ['proposals'],
        refetchType: 'none'
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
    onSuccess: async (newProposal) => {
      // Actualització optimista: afegir la nova proposta a totes les llistes rellevants
      queryClient.getQueriesData({ queryKey: ['proposals'] }).forEach(([queryKey, data]) => {
        if (!Array.isArray(data)) return;
        
        // Analitzar el tipus de query basant-nos en l'estructura de la queryKey
        const keyArray = queryKey as any[];
        const isAdminQuery = keyArray[1] === 'list';
        const isMyQuery = keyArray[1] === 'my';
        
        let queryStatus: string | undefined;
        
        if (isAdminQuery && keyArray[2] && typeof keyArray[2] === 'object') {
          queryStatus = keyArray[2].status;
        } else if (isMyQuery && keyArray[2]) {
          queryStatus = keyArray[2];
        }
        
        // Afegir a la llista de pending (la nova proposta sempre serà pending)
        if (queryStatus === 'pending') {
          const newData = [newProposal, ...data];
          queryClient.setQueryData(queryKey as any, newData);
        }
        // Afegir a la llista de ALL (sense filtre)
        else if (queryStatus === undefined) {
          const newData = [newProposal, ...data];
          queryClient.setQueryData(queryKey as any, newData);
        }
      });

      // Invalidar per sincronitzar amb el servidor en properes lectures
      await queryClient.invalidateQueries({ 
        queryKey: ['proposals'],
        refetchType: 'none'
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
    onSuccess: async (newProposal) => {
      // Actualització optimista: afegir la nova proposta a totes les llistes rellevants
      queryClient.getQueriesData({ queryKey: ['proposals'] }).forEach(([queryKey, data]) => {
        if (!Array.isArray(data)) return;
        
        // Analitzar el tipus de query basant-nos en l'estructura de la queryKey
        const keyArray = queryKey as any[];
        const isAdminQuery = keyArray[1] === 'list';
        const isMyQuery = keyArray[1] === 'my';
        
        let queryStatus: string | undefined;
        
        if (isAdminQuery && keyArray[2] && typeof keyArray[2] === 'object') {
          queryStatus = keyArray[2].status;
        } else if (isMyQuery && keyArray[2]) {
          queryStatus = keyArray[2];
        }
        
        // Afegir a la llista de pending (la nova proposta sempre serà pending)
        if (queryStatus === 'pending') {
          const newData = [newProposal, ...data];
          queryClient.setQueryData(queryKey as any, newData);
        }
        // Afegir a la llista de ALL (sense filtre)
        else if (queryStatus === undefined) {
          const newData = [newProposal, ...data];
          queryClient.setQueryData(queryKey as any, newData);
        }
      });

      // Invalidar per sincronitzar amb el servidor en properes lectures
      await queryClient.invalidateQueries({ 
        queryKey: ['proposals'],
        refetchType: 'none'
      });
    },
  });
}
