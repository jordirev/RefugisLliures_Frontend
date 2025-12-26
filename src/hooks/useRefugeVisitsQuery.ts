/**
 * React Query hooks for Refuge Visits API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  RefugeVisitService, 
  CreateRefugeVisitRequest, 
  UpdateRefugeVisitRequest,
  UserRefugeVisit 
} from '../services/RefugeVisitService';
import { mapRefugeVisitFromDTO, mapRefugeVisitsFromDTO } from '../services/mappers/RefugeVisitMapper';
import { RefugeVisit } from '../models';

/**
 * Hook to fetch refuge visits (current and future)
 */
export function useRefugeVisits(refugeId: string | undefined) {
  return useQuery({
    queryKey: refugeId ? ['refugeVisits', 'refuge', refugeId] : ['refugeVisits', 'refuge', 'undefined'],
    queryFn: async () => {
      if (!refugeId) throw new Error('Refuge ID is required');
      return await RefugeVisitService.getRefugeVisits(refugeId);
    },
    enabled: !!refugeId,
  });
}

/**
 * Hook to fetch user visits
 */
export function useUserVisits(uid: string | undefined) {
  return useQuery({
    queryKey: uid ? ['refugeVisits', 'user', uid] : ['refugeVisits', 'user', 'undefined'],
    queryFn: async () => {
      if (!uid) throw new Error('User UID is required');
      return await RefugeVisitService.getUserVisits(uid);
    },
    enabled: !!uid,
  });
}

/**
 * Hook to create a refuge visit
 */
export function useCreateRefugeVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      refugeId, 
      visitDate, 
      request 
    }: { 
      refugeId: string; 
      visitDate: string; 
      request: CreateRefugeVisitRequest 
    }) => {
      return await RefugeVisitService.createRefugeVisit(refugeId, visitDate, request);
    },
    onSuccess: (newVisit, variables) => {
      const queryKey = ['refugeVisits', 'refuge', variables.refugeId];
      
      // Update the cache with the new visit
      queryClient.setQueryData<RefugeVisit[]>(queryKey, (oldData) => {
        if (!oldData) return [newVisit];
        
        // Check if visit already exists (update it) or add it
        const existingIndex = oldData.findIndex(v => v.date === newVisit.date);
        if (existingIndex >= 0) {
          // Update existing visit
          const updatedData = [...oldData];
          updatedData[existingIndex] = newVisit;
          return updatedData;
        } else {
          // Add new visit and sort by date
          return [...oldData, newVisit].sort((a, b) => a.date.localeCompare(b.date));
        }
      });
      
      // Also invalidate user visits to refresh them on next access
      queryClient.invalidateQueries({ queryKey: ['refugeVisits', 'user'] });
    },
  });
}

/**
 * Hook to update a refuge visit
 */
export function useUpdateRefugeVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      refugeId, 
      visitDate, 
      request 
    }: { 
      refugeId: string; 
      visitDate: string; 
      request: UpdateRefugeVisitRequest 
    }) => {
      return await RefugeVisitService.updateRefugeVisit(refugeId, visitDate, request);
    },
    onSuccess: (updatedVisit, variables) => {
      const queryKey = ['refugeVisits', 'refuge', variables.refugeId];
      
      // Update the cache with the updated visit
      queryClient.setQueryData<RefugeVisit[]>(queryKey, (oldData) => {
        if (!oldData) return [updatedVisit];
        
        // Find and update the existing visit
        return oldData.map(v => v.date === updatedVisit.date ? updatedVisit : v);
      });
      
      // Also invalidate user visits to refresh them on next access
      queryClient.invalidateQueries({ queryKey: ['refugeVisits', 'user'] });
    },
  });
}

/**
 * Hook to delete a refuge visit
 */
export function useDeleteRefugeVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      refugeId, 
      visitDate 
    }: { 
      refugeId: string; 
      visitDate: string 
    }) => {
      return await RefugeVisitService.deleteRefugeVisit(refugeId, visitDate);
    },
    onSuccess: (_, variables) => {
      // Invalidate refuge visits to refresh the data since total_visitors may have changed
      queryClient.invalidateQueries({ queryKey: ['refugeVisits', 'refuge', variables.refugeId] });
      
      // Also invalidate user visits to refresh them on next access
      queryClient.invalidateQueries({ queryKey: ['refugeVisits', 'user'] });
    },
  });
}
