/**
 * React Query (TanStack Query) configuration
 * Handles API data caching, fetching, and synchronization
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Create and configure the QueryClient
 * - staleTime: Time before data is considered stale (10 minutes)
 * - gcTime: Time before inactive data is garbage collected (15 minutes)
 * - retry: Number of retry attempts on failed requests
 * - refetchOnWindowFocus: Don't refetch on window focus to avoid unnecessary requests
 * 
 * IMPORTANT: React Query should NEVER cache sensitive data like:
 * - Authentication tokens (handled by Firebase/AuthContext)
 * - Passwords (never returned by API)
 * - Private keys or secrets
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 9 * 60 * 1000, // 9 minutes -> les urls prefirmades de les fotos tenen una caducitat de 10 minuts
      gcTime: 15 * 60 * 1000, // 15 minutes (previously cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

/**
 * Query keys for different API endpoints
 * Used to identify and invalidate cached data
 */
export const queryKeys = {
  // Refuges
  refuges: ['refuges'] as const,
  refugesList: (filters?: Record<string, any>) => 
    filters ? ['refuges', 'list', filters] : ['refuges', 'list'] as const,
  refuge: (id: string) => ['refuges', 'detail', id] as const,
  
  // Users
  users: ['users'] as const,
  user: (uid: string) => ['users', 'detail', uid] as const,
  currentUser: ['users', 'current'] as const,
  favouriteRefuges: (uid: string) => ['users', uid, 'favouriteRefuges'] as const,
  visitedRefuges: (uid: string) => ['users', uid, 'visitedRefuges'] as const,
  
  // Renovations
  renovations: ['renovations'] as const,
  renovationsList: () => ['renovations', 'list'] as const,
  renovation: (id: string) => ['renovations', 'detail', id] as const,
  userRenovations: (uid: string) => ['renovations', 'user', uid] as const,
  refugeRenovations: (refugeId: string) => ['renovations', 'refuge', refugeId] as const,
  
  // Proposals
  proposals: ['proposals'] as const,
  proposalsList: (filters?: { status?: string; refugeId?: string }) => 
    filters ? ['proposals', 'list', filters] : ['proposals', 'list'] as const,
  myProposals: (status?: string) => 
    status ? ['proposals', 'my', status] : ['proposals', 'my'] as const,
  proposal: (id: string) => ['proposals', 'detail', id] as const,
} as const;
