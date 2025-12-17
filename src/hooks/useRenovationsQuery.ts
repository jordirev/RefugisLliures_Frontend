/**
 * React Query hooks for Renovations API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RenovationService, CreateRenovationRequest, UpdateRenovationRequest } from '../services/RenovationService';
import { queryKeys } from '../config/queryClient';
import { mapRenovationFromDTO } from '../services/mappers/RenovationMapper';
import { Renovation } from '../models';

/**
 * Hook to fetch all active renovations
 */
export function useRenovations() {
  return useQuery({
    queryKey: ['renovations', 'list'],
    queryFn: async () => {
      const renovationsDTO = await RenovationService.getAllRenovations();
      return renovationsDTO.map(mapRenovationFromDTO);
    },
  });
}

/**
 * Hook to fetch a single renovation by ID
 */
export function useRenovation(id: string | undefined) {
  return useQuery({
    queryKey: id ? ['renovations', 'detail', id] : ['renovations', 'detail', 'undefined'],
    queryFn: async () => {
      if (!id) throw new Error('Renovation ID is required');
      const renovationDTO = await RenovationService.getRenovationById(id);
      if (!renovationDTO) throw new Error('Renovation not found');
      return mapRenovationFromDTO(renovationDTO);
    },
    enabled: !!id,
  });
}

/**
 * Hook to fetch renovations by refuge ID
 */
export function useRefugeRenovations(refugeId: string | undefined) {
  return useQuery({
    queryKey: refugeId ? ['renovations', 'refuge', refugeId] : ['renovations', 'refuge', 'undefined'],
    queryFn: async () => {
      if (!refugeId) throw new Error('Refuge ID is required');
      const renovationsDTO = await RenovationService.getRenovationsByRefugeId(refugeId);
      return renovationsDTO.map(mapRenovationFromDTO);
    },
    enabled: !!refugeId,
  });
}

/**
 * Hook to create a renovation
 */
export function useCreateRenovation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (renovation: CreateRenovationRequest) => {
      const renovationDTO = await RenovationService.createRenovation(renovation);
      return mapRenovationFromDTO(renovationDTO);
    },
    onSuccess: (data) => {
      // Invalidate renovations queries
      queryClient.invalidateQueries({ queryKey: ['renovations'] });
      if (data.refuge_id) {
        queryClient.invalidateQueries({ queryKey: ['renovations', 'refuge', data.refuge_id] });
      }
    },
  });
}

/**
 * Hook to update a renovation
 */
export function useUpdateRenovation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateRenovationRequest }) => {
      const renovationDTO = await RenovationService.updateRenovation(id, updates);
      return mapRenovationFromDTO(renovationDTO);
    },
    onSuccess: (data) => {
      // Invalidate specific renovation and lists
      queryClient.invalidateQueries({ queryKey: ['renovations', 'detail', data.id] });
      queryClient.invalidateQueries({ queryKey: ['renovations', 'list'] });
      if (data.refuge_id) {
        queryClient.invalidateQueries({ queryKey: ['renovations', 'refuge', data.refuge_id] });
      }
    },
  });
}

/**
 * Hook to delete a renovation
 */
export function useDeleteRenovation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await RenovationService.deleteRenovation(id);
      return id;
    },
    onSuccess: () => {
      // Invalidate renovations queries
      queryClient.invalidateQueries({ queryKey: ['renovations'] });
    },
  });
}

/**
 * Hook to join a renovation
 */
export function useJoinRenovation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const renovationDTO = await RenovationService.joinRenovation(id);
      return mapRenovationFromDTO(renovationDTO);
    },
    onSuccess: (data) => {
      // Invalidate specific renovation and lists
      queryClient.invalidateQueries({ queryKey: ['renovations', 'detail', data.id] });
      queryClient.invalidateQueries({ queryKey: ['renovations', 'list'] });
      if (data.refuge_id) {
        queryClient.invalidateQueries({ queryKey: ['renovations', 'refuge', data.refuge_id] });
      }
    },
  });
}

/**
 * Hook to leave a renovation (remove participant)
 */
export function useLeaveRenovation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ renovationId, participantUid }: { renovationId: string; participantUid: string }) => {
      const renovationDTO = await RenovationService.removeParticipant(renovationId, participantUid);
      return mapRenovationFromDTO(renovationDTO);
    },
    onSuccess: (data) => {
      // Invalidate specific renovation and lists
      queryClient.invalidateQueries({ queryKey: ['renovations', 'detail', data.id] });
      queryClient.invalidateQueries({ queryKey: ['renovations', 'list'] });
      if (data.refuge_id) {
        queryClient.invalidateQueries({ queryKey: ['renovations', 'refuge', data.refuge_id] });
      }
    },
  });
}
