/**
 * React Query hooks for Users API
 * 
 * SECURITY NOTE: User data cached here should NOT contain:
 * - Passwords (never returned by API)
 * - Authentication tokens (managed by Firebase/AuthContext)
 * - Sensitive personal information beyond basic profile data
 * 
 * Only public profile data (username, avatar, etc.) is cached.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UsersService } from '../services/UsersService';
import { queryKeys } from '../config/queryClient';
import { User, Location } from '../models';

/**
 * Hook to fetch a user by UID
 * Only caches public profile data (username, avatar, etc.)
 */
export function useUser(uid: string | undefined) {
  return useQuery({
    queryKey: uid ? queryKeys.user(uid) : ['users', 'detail', 'undefined'],
    queryFn: async () => {
      if (!uid) throw new Error('User UID is required');
      return await UsersService.getUserByUid(uid);
    },
    enabled: !!uid,
    // Uses default staleTime from queryClient (10 minutes)
  });
}

/**
 * Hook to fetch favourite refuges for a user
 * staleTime set to 9 minutes (URLs expire after 10 minutes)
 * Always refetches on mount if data is stale to ensure fresh presigned URLs
 */
export function useFavouriteRefuges(uid: string | undefined) {
  return useQuery({
    queryKey: uid ? queryKeys.favouriteRefuges(uid) : ['users', 'undefined', 'favouriteRefuges'],
    queryFn: async () => {
      if (!uid) throw new Error('User UID is required');
      return await UsersService.getFavouriteRefuges(uid);
    },
    enabled: !!uid,
    staleTime: 9 * 60 * 1000, // 9 minutes - invalidate before URLs expire (10 min)
    refetchOnMount: 'always', // Always refetch to get fresh presigned URLs
  });
}

/**
 * Hook to add a refuge to favourites
 * Uses optimistic updates to immediately update the UI
 * Service now returns only the added refuge (not the full list)
 */
export function useAddFavouriteRefuge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uid, refugeId }: { uid: string; refugeId: string }) => {
      return await UsersService.addFavouriteRefuge(uid, refugeId);
    },
    onMutate: async ({ uid, refugeId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.favouriteRefuges(uid) });

      // Snapshot previous values
      const previousRefuges = queryClient.getQueryData<Location[]>(queryKeys.favouriteRefuges(uid));
      const previousUser = queryClient.getQueryData<User>(queryKeys.user(uid));

      // Optimistically update by adding the refugeId to backendUser
      const userData = queryClient.getQueryData<User>(queryKeys.user(uid));
      if (userData) {
        const updatedUser = {
          ...userData,
          favourite_refuges: [...(userData.favourite_refuges || []), refugeId]
        };
        queryClient.setQueryData(queryKeys.user(uid), updatedUser);
      }

      return { previousRefuges, previousUser };
    },
    onError: (err, { uid }, context) => {
      // Revert optimistic update on error
      if (context?.previousRefuges) {
        queryClient.setQueryData(queryKeys.favouriteRefuges(uid), context.previousRefuges);
      }
      if (context?.previousUser) {
        queryClient.setQueryData(queryKeys.user(uid), context.previousUser);
      }
    },
    onSuccess: (addedRefuge, { uid, refugeId }) => {
      // Service returns only the added refuge, not the full list
      // Add the refuge to the existing list in cache if it doesn't exist
      if (addedRefuge) {
        const currentRefuges = queryClient.getQueryData<Location[]>(queryKeys.favouriteRefuges(uid)) || [];
        // Check if refuge already exists to avoid duplicates
        const refugeExists = currentRefuges.some(r => String(r.id) === String(addedRefuge.id));
        if (!refugeExists) {
          const updatedRefuges = [...currentRefuges, addedRefuge];
          queryClient.setQueryData(queryKeys.favouriteRefuges(uid), updatedRefuges);
        }
      }
      
      // Update backendUser.favourite_refuges by adding the refugeId if not exists
      const userData = queryClient.getQueryData<User>(queryKeys.user(uid));
      if (userData && addedRefuge?.id) {
        const refugeIdStr = String(addedRefuge.id);
        const favourites = userData.favourite_refuges || [];
        // Check if refugeId already exists to avoid duplicates
        if (!favourites.includes(refugeIdStr)) {
          const updatedUser = {
            ...userData,
            favourite_refuges: [...favourites, refugeIdStr]
          };
          queryClient.setQueryData(queryKeys.user(uid), updatedUser);
        }
      }
    },
  });
}

/**
 * Hook to remove a refuge from favourites
 * Uses optimistic updates to immediately update the UI
 * Service now returns boolean (not the full list)
 */
export function useRemoveFavouriteRefuge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uid, refugeId }: { uid: string; refugeId: string }) => {
      return await UsersService.removeFavouriteRefuge(uid, refugeId);
    },
    onMutate: async ({ uid, refugeId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.favouriteRefuges(uid) });

      // Snapshot previous values
      const previousRefuges = queryClient.getQueryData<Location[]>(queryKeys.favouriteRefuges(uid));
      const previousUser = queryClient.getQueryData<User>(queryKeys.user(uid));

      // Optimistically remove from favouriteRefuges
      if (previousRefuges) {
        const updatedRefuges = previousRefuges.filter(r => String(r.id) !== refugeId);
        queryClient.setQueryData(queryKeys.favouriteRefuges(uid), updatedRefuges);
      }

      // Optimistically update backendUser
      const userData = queryClient.getQueryData<User>(queryKeys.user(uid));
      if (userData) {
        const updatedUser = {
          ...userData,
          favourite_refuges: (userData.favourite_refuges || []).filter(id => id !== refugeId)
        };
        queryClient.setQueryData(queryKeys.user(uid), updatedUser);
      }

      return { previousRefuges, previousUser };
    },
    onError: (err, { uid }, context) => {
      // Revert optimistic update on error
      if (context?.previousRefuges) {
        queryClient.setQueryData(queryKeys.favouriteRefuges(uid), context.previousRefuges);
      }
      if (context?.previousUser) {
        queryClient.setQueryData(queryKeys.user(uid), context.previousUser);
      }
    },
    onSuccess: (success, { uid, refugeId }) => {
      // Service returns boolean
      // Remove the refuge from the existing list in cache
      if (success) {
        const currentRefuges = queryClient.getQueryData<Location[]>(queryKeys.favouriteRefuges(uid));
        if (currentRefuges) {
          const updatedRefuges = currentRefuges.filter(r => String(r.id) !== refugeId);
          queryClient.setQueryData(queryKeys.favouriteRefuges(uid), updatedRefuges);
        }
        
        // Update backendUser.favourite_refuges by removing the refugeId
        const userData = queryClient.getQueryData<User>(queryKeys.user(uid));
        if (userData) {
          const updatedUser = {
            ...userData,
            favourite_refuges: (userData.favourite_refuges || []).filter(id => id !== refugeId)
          };
          queryClient.setQueryData(queryKeys.user(uid), updatedUser);
        }
      }
    },
  });
}

/**
 * Hook to fetch visited refuges for a user
 * staleTime set to 9 minutes (URLs expire after 10 minutes)
 * Always refetches on mount if data is stale to ensure fresh presigned URLs
 */
export function useVisitedRefuges(uid: string | undefined) {
  return useQuery({
    queryKey: uid ? queryKeys.visitedRefuges(uid) : ['users', 'undefined', 'visitedRefuges'],
    queryFn: async () => {
      if (!uid) throw new Error('User UID is required');
      return await UsersService.getVisitedRefuges(uid);
    },
    enabled: !!uid,
    staleTime: 9 * 60 * 1000, // 9 minutes - invalidate before URLs expire (10 min)
    refetchOnMount: 'always', // Always refetch to get fresh presigned URLs
  });
}

/**
 * Hook to add a refuge to visited
 * Uses optimistic updates to immediately update the UI
 * Service now returns only the added refuge (not the full list)
 */
export function useAddVisitedRefuge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uid, refugeId }: { uid: string; refugeId: string }) => {
      return await UsersService.addVisitedRefuge(uid, refugeId);
    },
    onMutate: async ({ uid, refugeId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.visitedRefuges(uid) });

      // Snapshot previous values
      const previousRefuges = queryClient.getQueryData<Location[]>(queryKeys.visitedRefuges(uid));
      const previousUser = queryClient.getQueryData<User>(queryKeys.user(uid));

      // Optimistically update backendUser
      const userData = queryClient.getQueryData<User>(queryKeys.user(uid));
      if (userData) {
        const updatedUser = {
          ...userData,
          visited_refuges: [...(userData.visited_refuges || []), refugeId]
        };
        queryClient.setQueryData(queryKeys.user(uid), updatedUser);
      }

      return { previousRefuges, previousUser };
    },
    onError: (err, { uid }, context) => {
      // Revert optimistic update on error
      if (context?.previousRefuges) {
        queryClient.setQueryData(queryKeys.visitedRefuges(uid), context.previousRefuges);
      }
      if (context?.previousUser) {
        queryClient.setQueryData(queryKeys.user(uid), context.previousUser);
      }
    },
    onSuccess: (addedRefuge, { uid, refugeId }) => {
      // Service returns only the added refuge, not the full list
      // Add the refuge to the existing list in cache if it doesn't exist
      if (addedRefuge) {
        const currentRefuges = queryClient.getQueryData<Location[]>(queryKeys.visitedRefuges(uid)) || [];
        // Check if refuge already exists to avoid duplicates
        const refugeExists = currentRefuges.some(r => String(r.id) === String(addedRefuge.id));
        if (!refugeExists) {
          const updatedRefuges = [...currentRefuges, addedRefuge];
          queryClient.setQueryData(queryKeys.visitedRefuges(uid), updatedRefuges);
        }
      }
      
      // Update backendUser.visited_refuges by adding the refugeId if not exists
      const userData = queryClient.getQueryData<User>(queryKeys.user(uid));
      if (userData && addedRefuge?.id) {
        const refugeIdStr = String(addedRefuge.id);
        const visited = userData.visited_refuges || [];
        // Check if refugeId already exists to avoid duplicates
        if (!visited.includes(refugeIdStr)) {
          const updatedUser = {
            ...userData,
            visited_refuges: [...visited, refugeIdStr]
          };
          queryClient.setQueryData(queryKeys.user(uid), updatedUser);
        }
      }
    },
  });
}

/**
 * Hook to remove a refuge from visited
 * Uses optimistic updates to immediately update the UI
 * Service now returns boolean (not the full list)
 */
export function useRemoveVisitedRefuge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uid, refugeId }: { uid: string; refugeId: string }) => {
      return await UsersService.removeVisitedRefuge(uid, refugeId);
    },
    onMutate: async ({ uid, refugeId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.visitedRefuges(uid) });

      // Snapshot previous values
      const previousRefuges = queryClient.getQueryData<Location[]>(queryKeys.visitedRefuges(uid));
      const previousUser = queryClient.getQueryData<User>(queryKeys.user(uid));

      // Optimistically remove from visitedRefuges
      if (previousRefuges) {
        const updatedRefuges = previousRefuges.filter(r => String(r.id) !== refugeId);
        queryClient.setQueryData(queryKeys.visitedRefuges(uid), updatedRefuges);
      }

      // Optimistically update backendUser
      const userData = queryClient.getQueryData<User>(queryKeys.user(uid));
      if (userData) {
        const updatedUser = {
          ...userData,
          visited_refuges: (userData.visited_refuges || []).filter(id => id !== refugeId)
        };
        queryClient.setQueryData(queryKeys.user(uid), updatedUser);
      }

      return { previousRefuges, previousUser };
    },
    onError: (err, { uid }, context) => {
      // Revert optimistic update on error
      if (context?.previousRefuges) {
        queryClient.setQueryData(queryKeys.visitedRefuges(uid), context.previousRefuges);
      }
      if (context?.previousUser) {
        queryClient.setQueryData(queryKeys.user(uid), context.previousUser);
      }
    },
    onSuccess: (success, { uid, refugeId }) => {
      // Service returns boolean
      // Remove the refuge from the existing list in cache
      if (success) {
        const currentRefuges = queryClient.getQueryData<Location[]>(queryKeys.visitedRefuges(uid));
        if (currentRefuges) {
          const updatedRefuges = currentRefuges.filter(r => String(r.id) !== refugeId);
          queryClient.setQueryData(queryKeys.visitedRefuges(uid), updatedRefuges);
        }
        
        // Update backendUser.visited_refuges by removing the refugeId
        const userData = queryClient.getQueryData<User>(queryKeys.user(uid));
        if (userData) {
          const updatedUser = {
            ...userData,
            visited_refuges: (userData.visited_refuges || []).filter(id => id !== refugeId)
          };
          queryClient.setQueryData(queryKeys.user(uid), updatedUser);
        }
      }
    },
  });
}

/**
 * Hook to update current user profile
 */
export function useUpdateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uid, data }: { 
      uid: string; 
      data: {
        username?: string;
        email?: string;
        avatar?: string;
        language?: string;
        favourite_refuges?: number[];
        visited_refuges?: number[];
        renovations?: string[];
      }
    }) => {
      return await UsersService.updateUser(uid, data);
    },
    onSuccess: (data) => {
      // Invalidate the specific user query
      if (data?.uid) {
        queryClient.invalidateQueries({ queryKey: queryKeys.user(data.uid) });
      }
    },
  });
}

/**
 * Hook to fetch multiple users by UIDs simultaneously
 * Useful for loading participants, creators, etc.
 */
export function useUsers(uids: string[] | undefined) {
  return useQuery({
    queryKey: uids ? ['users', 'batch', ...uids.sort()] : ['users', 'batch', 'undefined'],
    queryFn: async () => {
      if (!uids || uids.length === 0) return [];
      // Carregar tots els usuaris en paral·lel
      const results = await Promise.all(
        uids.map(async (uid) => {
          try {
            return await UsersService.getUserByUid(uid);
          } catch (error) {
            console.error(`Error loading user ${uid}:`, error);
            return null;
          }
        })
      );
      // Filtrar nulls
      return results.filter((user): user is User => user !== null);
    },
    enabled: !!uids && uids.length > 0,
    // Uses default staleTime from queryClient (10 minutes)
  });
}

/**
 * Hook to check if user exists
 */
export function useUserExists(uid: string | undefined) {
  return useQuery({
    queryKey: uid ? [...queryKeys.user(uid), 'exists'] : ['users', 'exists', 'undefined'],
    queryFn: async () => {
      if (!uid) return false;
      try {
        await UsersService.getUserByUid(uid);
        return true;
      } catch (error) {
        return false;
      }
    },
    enabled: !!uid,
    staleTime: 10 * 60 * 1000,
  });
}
