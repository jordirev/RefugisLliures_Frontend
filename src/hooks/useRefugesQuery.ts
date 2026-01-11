/**
 * React Query hooks for Refuges API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefugisService } from '../services/RefugisService';
import { queryKeys } from '../config/queryClient';
import { Location } from '../models';

/**
 * Hook to fetch all refuges with optional filters
 */
export function useRefuges(filters?: Record<string, any>) {
  return useQuery({
    queryKey: queryKeys.refugesList(filters),
    queryFn: async () => {
      if (!filters || Object.keys(filters).length === 0) {
        return await RefugisService.getRefugis();
      }
      return await RefugisService.getRefugis(filters);
    },
    // Uses default staleTime from queryClient (10 minutes)
  });
}

/**
 * Hook to fetch a single refuge by ID
 */
export function useRefuge(id: string | undefined) {
  return useQuery({
    queryKey: id ? queryKeys.refuge(id) : ['refuges', 'detail', 'undefined'],
    queryFn: async () => {
      if (!id) throw new Error('Refuge ID is required');
      return await RefugisService.getRefugiById(id);
    },
    enabled: !!id,
  });
}

/**
 * Hook to fetch multiple refuges by IDs simultaneously
 * Useful for batch loading refuges in RenovationsScreen
 */
export function useRefugesBatch(ids: string[] | undefined) {
  return useQuery({
    queryKey: ids ? ['refuges', 'batch', ...ids.sort()] : ['refuges', 'batch', 'undefined'],
    queryFn: async () => {
      if (!ids || ids.length === 0) return [];
      // Carregar tots els refuges en paral·lel
      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            return await RefugisService.getRefugiById(id);
          } catch (error) {
            console.error(`Error loading refuge ${id}:`, error);
            return null;
          }
        })
      );
      // Filtrar nulls i retornar Map per accés ràpid
      const refugesMap = new Map<string, Location>();
      results.forEach((refuge) => {
        if (refuge && refuge.id) {
          refugesMap.set(refuge.id, refuge);
        }
      });
      return refugesMap;
    },
    enabled: !!ids && ids.length > 0,
  });
}

/**
 * Hook to create a new refuge (via proposal)
 */
export function useCreateRefuge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { payload: Location; comment?: string }) => {
      // This will create a proposal, not directly create a refuge
      // The actual service call would be through RefugeProposalsService
      throw new Error('Use RefugeProposalsService.proposalCreateRefuge instead');
    },
    onSuccess: () => {
      // Invalidate proposals queries to show the new proposal
      queryClient.invalidateQueries({ queryKey: queryKeys.proposals });
      queryClient.invalidateQueries({ queryKey: queryKeys.myProposals() });
    },
  });
}

/**
 * Hook to update a refuge (via proposal)
 */
export function useUpdateRefuge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { refugeId: string; payload: Partial<Location>; comment?: string }) => {
      // This will create a proposal, not directly update a refuge
      throw new Error('Use RefugeProposalsService.proposalEditRefuge instead');
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific refuge and proposals
      queryClient.invalidateQueries({ queryKey: queryKeys.refuge(variables.refugeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.proposals });
      queryClient.invalidateQueries({ queryKey: queryKeys.myProposals() });
    },
  });
}

/**
 * Hook to delete a refuge (via proposal)
 */
export function useDeleteRefuge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { refugeId: string; comment?: string }) => {
      // This will create a proposal, not directly delete a refuge
      throw new Error('Use RefugeProposalsService.proposalDeleteRefuge instead');
    },
    onSuccess: () => {
      // Invalidate proposals
      queryClient.invalidateQueries({ queryKey: queryKeys.proposals });
      queryClient.invalidateQueries({ queryKey: queryKeys.myProposals() });
    },
  });
}
