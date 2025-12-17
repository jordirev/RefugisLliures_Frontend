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
import { User } from '../models';

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
