/**
 * React Query hooks for Doubts API
 */

import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { DoubtsService, CreateDoubtRequest, CreateAnswerRequest } from '../services/DoubtsService';
import { mapDoubtFromDTO, mapAnswerFromDTO } from '../services/mappers/DoubtMapper';
import { Doubt, Answer } from '../models';
import { DoubtDTO } from '../services/dto/DoubtDTO';

/**
 * Hook to fetch all doubts for a refuge with their answers
 */
export function useDoubts(refugeId: string | undefined) {
  return useQuery({
    queryKey: refugeId ? ['doubts', 'refuge', refugeId] : ['doubts', 'refuge', 'undefined'],
    queryFn: async () => {
      if (!refugeId) throw new Error('Refuge ID is required');
      const doubtsDTO = await DoubtsService.getDoubtsByRefuge(refugeId);
      return doubtsDTO.map(mapDoubtFromDTO);
    },
    enabled: !!refugeId,
  });
}

/**
 * Hook to create a new doubt
 * Optimistically adds the doubt to the cache
 */
export function useCreateDoubt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateDoubtRequest) => {
      const doubtDTO = await DoubtsService.createDoubt(request);
      return mapDoubtFromDTO(doubtDTO);
    },
    onSuccess: (newDoubt, variables) => {
      // Add the new doubt to the existing list instead of invalidating
      const refugeId = variables.refuge_id;
      const queryKey = ['doubts', 'refuge', refugeId];
      
      queryClient.setQueryData<Doubt[]>(queryKey, (oldData) => {
        if (!oldData) return [newDoubt];
        // Add at the beginning since doubts are sorted by created_at descending
        return [newDoubt, ...oldData];
      });
    },
  });
}

/**
 * Hook to delete a doubt
 * Optimistically removes the doubt from the cache
 */
export function useDeleteDoubt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ doubtId, refugeId }: { doubtId: string; refugeId: string }) => {
      await DoubtsService.deleteDoubt(doubtId);
      return { doubtId, refugeId };
    },
    onSuccess: ({ doubtId, refugeId }) => {
      // Remove the doubt from the existing list instead of invalidating
      const queryKey = ['doubts', 'refuge', refugeId];
      
      queryClient.setQueryData<Doubt[]>(queryKey, (oldData) => {
        if (!oldData) return [];
        return oldData.filter(doubt => doubt.id !== doubtId);
      });
    },
  });
}

/**
 * Hook to create an answer to a doubt
 * Optimistically adds the answer to the doubt and updates the counter
 */
export function useCreateAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ doubtId, refugeId, request }: { 
      doubtId: string; 
      refugeId: string; 
      request: CreateAnswerRequest 
    }) => {
      const answerDTO = await DoubtsService.createAnswer(doubtId, request);
      return { answer: mapAnswerFromDTO(answerDTO), doubtId, refugeId };
    },
    onSuccess: ({ answer, doubtId, refugeId }) => {
      // Add the answer to the doubt's answers list and increment counter
      const queryKey = ['doubts', 'refuge', refugeId];
      
      queryClient.setQueryData<Doubt[]>(queryKey, (oldData) => {
        if (!oldData) return [];
        
        return oldData.map(doubt => {
          if (doubt.id === doubtId) {
            return {
              ...doubt,
              answers_count: doubt.answers_count + 1,
              answers: [...(doubt.answers || []), answer],
            };
          }
          return doubt;
        });
      });
    },
  });
}

/**
 * Hook to create a reply to an answer
 * Optimistically adds the reply to the doubt's answers and updates the counter
 */
export function useCreateAnswerReply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      doubtId, 
      parentAnswerId, 
      refugeId, 
      request 
    }: { 
      doubtId: string; 
      parentAnswerId: string; 
      refugeId: string; 
      request: CreateAnswerRequest 
    }) => {
      const answerDTO = await DoubtsService.createAnswerReply(doubtId, parentAnswerId, request);
      return { answer: mapAnswerFromDTO(answerDTO), doubtId, refugeId };
    },
    onSuccess: ({ answer, doubtId, refugeId }) => {
      // Add the reply to the doubt's answers list and increment counter
      const queryKey = ['doubts', 'refuge', refugeId];
      
      queryClient.setQueryData<Doubt[]>(queryKey, (oldData) => {
        if (!oldData) return [];
        
        return oldData.map(doubt => {
          if (doubt.id === doubtId) {
            return {
              ...doubt,
              answers_count: doubt.answers_count + 1,
              answers: [...(doubt.answers || []), answer],
            };
          }
          return doubt;
        });
      });
    },
  });
}

/**
 * Hook to delete an answer
 * Optimistically removes the answer from the doubt and updates the counter
 */
export function useDeleteAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      doubtId, 
      answerId, 
      refugeId 
    }: { 
      doubtId: string; 
      answerId: string; 
      refugeId: string 
    }) => {
      await DoubtsService.deleteAnswer(doubtId, answerId);
      return { doubtId, answerId, refugeId };
    },
    onSuccess: ({ doubtId, answerId, refugeId }) => {
      // Remove the answer from the doubt's answers list and decrement counter
      const queryKey = ['doubts', 'refuge', refugeId];
      
      queryClient.setQueryData<Doubt[]>(queryKey, (oldData) => {
        if (!oldData) return [];
        
        return oldData.map(doubt => {
          if (doubt.id === doubtId) {
            const filteredAnswers = (doubt.answers || []).filter(answer => answer.id !== answerId);
            return {
              ...doubt,
              answers_count: doubt.answers_count - 1,
              answers: filteredAnswers,
            };
          }
          return doubt;
        });
      });
    },
  });
}
