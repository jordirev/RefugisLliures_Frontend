/**
 * Tests unitaris per als hooks useDoubtsQuery
 * 
 * Aquest fitxer cobreix:
 * - useDoubts: fetch dubtes d'un refugi
 * - useCreateDoubt: crear un dubte
 * - useDeleteDoubt: eliminar un dubte
 * - useCreateAnswer: crear resposta
 * - useCreateAnswerReply: crear resposta a una resposta
 * - useDeleteAnswer: eliminar resposta
 */

import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useDoubts,
  useCreateDoubt,
  useDeleteDoubt,
  useCreateAnswer,
  useCreateAnswerReply,
  useDeleteAnswer,
} from '../../../hooks/useDoubtsQuery';
import { DoubtsService } from '../../../services/DoubtsService';

// Mock DoubtsService
jest.mock('../../../services/DoubtsService', () => ({
  DoubtsService: {
    getDoubtsByRefuge: jest.fn(),
    createDoubt: jest.fn(),
    deleteDoubt: jest.fn(),
    createAnswer: jest.fn(),
    createAnswerReply: jest.fn(),
    deleteAnswer: jest.fn(),
  },
}));

// Mock dels mappers
jest.mock('../../../services/mappers/DoubtMapper', () => ({
  mapDoubtFromDTO: jest.fn((dto) => ({
    id: dto.id,
    refuge_id: dto.refuge_id,
    text: dto.text,
    creator_uid: dto.creator_uid,
    answers_count: dto.answers_count || 0,
    answers: dto.answers || [],
  })),
  mapAnswerFromDTO: jest.fn((dto) => ({
    id: dto.id,
    text: dto.text,
    creator_uid: dto.creator_uid,
    created_at: dto.created_at,
  })),
}));

describe('useDoubtsQuery Hooks', () => {
  let queryClient: QueryClient;

  const mockDoubtDTO = {
    id: 'doubt-1',
    refuge_id: 'refuge-1',
    text: 'Quin és el millor camí?',
    creator_uid: 'user-123',
    answers_count: 2,
    answers: [
      { id: 'answer-1', text: 'Pel nord', creator_uid: 'user-456', created_at: '2025-01-01' },
    ],
  };

  const mockAnswerDTO = {
    id: 'answer-new',
    text: 'Nova resposta',
    creator_uid: 'user-789',
    created_at: '2025-01-02',
  };

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('useDoubts', () => {
    it('hauria de fer fetch dels dubtes d\'un refugi', async () => {
      (DoubtsService.getDoubtsByRefuge as jest.Mock).mockResolvedValue([mockDoubtDTO]);

      const { result } = renderHook(() => useDoubts('refuge-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(DoubtsService.getDoubtsByRefuge).toHaveBeenCalledWith('refuge-1');
      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0].text).toBe('Quin és el millor camí?');
    });

    it('no hauria de fer fetch si no hi ha refugeId', async () => {
      const { result } = renderHook(() => useDoubts(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(DoubtsService.getDoubtsByRefuge).not.toHaveBeenCalled();
    });

    it('hauria de gestionar errors', async () => {
      (DoubtsService.getDoubtsByRefuge as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => useDoubts('refuge-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Network error');
    });

    it('hauria de retornar llista buida si no hi ha dubtes', async () => {
      (DoubtsService.getDoubtsByRefuge as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => useDoubts('refuge-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(0);
    });
  });

  describe('useCreateDoubt', () => {
    it('hauria de crear un nou dubte', async () => {
      const newDoubtDTO = { ...mockDoubtDTO, id: 'doubt-new', answers_count: 0, answers: [] };
      (DoubtsService.createDoubt as jest.Mock).mockResolvedValue(newDoubtDTO);

      const { result } = renderHook(() => useCreateDoubt(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({
          refuge_id: 'refuge-1',
          text: 'Nou dubte',
        });
      });

      expect(DoubtsService.createDoubt).toHaveBeenCalledWith({
        refuge_id: 'refuge-1',
        text: 'Nou dubte',
      });
    });

    it('hauria d\'afegir el nou dubte a la cache', async () => {
      // Primer carreguem dubtes existents
      (DoubtsService.getDoubtsByRefuge as jest.Mock).mockResolvedValue([mockDoubtDTO]);
      
      const { result: doubtsResult } = renderHook(() => useDoubts('refuge-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(doubtsResult.current.isSuccess).toBe(true);
      });

      // Ara creem un nou dubte
      const newDoubtDTO = { id: 'doubt-new', refuge_id: 'refuge-1', text: 'Nou dubte', creator_uid: 'user-new', answers_count: 0, answers: [] };
      (DoubtsService.createDoubt as jest.Mock).mockResolvedValue(newDoubtDTO);

      const { result: createResult } = renderHook(() => useCreateDoubt(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await createResult.current.mutateAsync({
          refuge_id: 'refuge-1',
          text: 'Nou dubte',
        });
      });

      // Verifiquem que el dubte s'ha afegit a la cache
      const cachedData = queryClient.getQueryData(['doubts', 'refuge', 'refuge-1']);
      expect(cachedData).toBeDefined();
    });

    it('hauria de gestionar errors de creació', async () => {
      (DoubtsService.createDoubt as jest.Mock).mockRejectedValue(
        new Error('No tens permisos')
      );

      const { result } = renderHook(() => useCreateDoubt(), {
        wrapper: createWrapper(),
      });

      let thrownError: Error | null = null;
      await act(async () => {
        try {
          await result.current.mutateAsync({
            refuge_id: 'refuge-1',
            text: 'Nou dubte',
          });
        } catch (error) {
          thrownError = error as Error;
        }
      });

      expect(thrownError).not.toBeNull();
      expect(thrownError?.message).toBe('No tens permisos');
    });
  });

  describe('useDeleteDoubt', () => {
    it('hauria d\'eliminar un dubte', async () => {
      (DoubtsService.deleteDoubt as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteDoubt(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({
          doubtId: 'doubt-1',
          refugeId: 'refuge-1',
        });
      });

      expect(DoubtsService.deleteDoubt).toHaveBeenCalledWith('doubt-1');
    });

    it('hauria d\'eliminar el dubte de la cache', async () => {
      // Primer carreguem dubtes existents
      (DoubtsService.getDoubtsByRefuge as jest.Mock).mockResolvedValue([mockDoubtDTO]);
      
      const { result: doubtsResult } = renderHook(() => useDoubts('refuge-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(doubtsResult.current.isSuccess).toBe(true);
      });

      // Ara eliminem el dubte
      (DoubtsService.deleteDoubt as jest.Mock).mockResolvedValue(undefined);

      const { result: deleteResult } = renderHook(() => useDeleteDoubt(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await deleteResult.current.mutateAsync({
          doubtId: 'doubt-1',
          refugeId: 'refuge-1',
        });
      });

      // Verifiquem que el dubte s'ha eliminat de la cache
      const cachedData = queryClient.getQueryData<any[]>(['doubts', 'refuge', 'refuge-1']);
      expect(cachedData?.find(d => d.id === 'doubt-1')).toBeUndefined();
    });
  });

  describe('useCreateAnswer', () => {
    it('hauria de crear una resposta', async () => {
      (DoubtsService.createAnswer as jest.Mock).mockResolvedValue(mockAnswerDTO);

      const { result } = renderHook(() => useCreateAnswer(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({
          doubtId: 'doubt-1',
          refugeId: 'refuge-1',
          request: { text: 'Nova resposta' },
        });
      });

      expect(DoubtsService.createAnswer).toHaveBeenCalledWith('doubt-1', { text: 'Nova resposta' });
    });
  });

  describe('useCreateAnswerReply', () => {
    it('hauria de crear una resposta a una resposta', async () => {
      (DoubtsService.createAnswerReply as jest.Mock).mockResolvedValue(mockAnswerDTO);

      const { result } = renderHook(() => useCreateAnswerReply(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({
          doubtId: 'doubt-1',
          parentAnswerId: 'answer-1',
          refugeId: 'refuge-1',
          request: { text: 'Resposta a resposta' },
        });
      });

      expect(DoubtsService.createAnswerReply).toHaveBeenCalledWith(
        'doubt-1',
        'answer-1',
        { text: 'Resposta a resposta' }
      );
    });
  });

  describe('useDeleteAnswer', () => {
    it('hauria d\'eliminar una resposta', async () => {
      (DoubtsService.deleteAnswer as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteAnswer(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({
          doubtId: 'doubt-1',
          answerId: 'answer-1',
          refugeId: 'refuge-1',
        });
      });

      expect(DoubtsService.deleteAnswer).toHaveBeenCalledWith('doubt-1', 'answer-1');
    });

    it('hauria d\'eliminar la resposta de la cache del dubte', async () => {
      // Primer carreguem dubtes existents amb respostes
      const doubtWithAnswers = {
        ...mockDoubtDTO,
        answers: [
          { id: 'answer-1', text: 'Resposta 1', creator_uid: 'user-1', created_at: '2025-01-01' },
          { id: 'answer-2', text: 'Resposta 2', creator_uid: 'user-2', created_at: '2025-01-02' },
        ],
        answers_count: 2,
      };
      (DoubtsService.getDoubtsByRefuge as jest.Mock).mockResolvedValue([doubtWithAnswers]);
      
      const { result: doubtsResult } = renderHook(() => useDoubts('refuge-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(doubtsResult.current.isSuccess).toBe(true);
      });

      // Ara eliminem una resposta
      (DoubtsService.deleteAnswer as jest.Mock).mockResolvedValue(undefined);

      const { result: deleteResult } = renderHook(() => useDeleteAnswer(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await deleteResult.current.mutateAsync({
          doubtId: 'doubt-1',
          answerId: 'answer-1',
          refugeId: 'refuge-1',
        });
      });

      // Verifiquem que la resposta s'ha eliminat de la cache
      const cachedData = queryClient.getQueryData<any[]>(['doubts', 'refuge', 'refuge-1']);
      const doubtInCache = cachedData?.find(d => d.id === 'doubt-1');
      expect(doubtInCache?.answers?.find((a: any) => a.id === 'answer-1')).toBeUndefined();
      expect(doubtInCache?.answers_count).toBe(1);
    });

    it('hauria de gestionar eliminació quan no hi ha cache', async () => {
      (DoubtsService.deleteAnswer as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteAnswer(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({
          doubtId: 'doubt-1',
          answerId: 'answer-1',
          refugeId: 'refuge-no-cache',
        });
      });

      expect(DoubtsService.deleteAnswer).toHaveBeenCalledWith('doubt-1', 'answer-1');
    });
  });

  describe('useCreateAnswer - cache update scenarios', () => {
    it('hauria d\'afegir la resposta a la cache del dubte existent', async () => {
      // Primer carreguem dubtes existents
      const doubtWithoutAnswers = {
        ...mockDoubtDTO,
        answers: [],
        answers_count: 0,
      };
      (DoubtsService.getDoubtsByRefuge as jest.Mock).mockResolvedValue([doubtWithoutAnswers]);
      
      const { result: doubtsResult } = renderHook(() => useDoubts('refuge-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(doubtsResult.current.isSuccess).toBe(true);
      });

      // Ara creem una resposta
      (DoubtsService.createAnswer as jest.Mock).mockResolvedValue(mockAnswerDTO);

      const { result: createResult } = renderHook(() => useCreateAnswer(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await createResult.current.mutateAsync({
          doubtId: 'doubt-1',
          refugeId: 'refuge-1',
          request: { text: 'Nova resposta' },
        });
      });

      // Verifiquem que la resposta s'ha afegit a la cache
      const cachedData = queryClient.getQueryData<any[]>(['doubts', 'refuge', 'refuge-1']);
      const doubtInCache = cachedData?.find(d => d.id === 'doubt-1');
      expect(doubtInCache?.answers_count).toBe(1);
    });

    it('hauria de gestionar crear resposta quan no hi ha cache', async () => {
      (DoubtsService.createAnswer as jest.Mock).mockResolvedValue(mockAnswerDTO);

      const { result } = renderHook(() => useCreateAnswer(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({
          doubtId: 'doubt-1',
          refugeId: 'refuge-no-cache',
          request: { text: 'Nova resposta' },
        });
      });

      expect(DoubtsService.createAnswer).toHaveBeenCalledWith('doubt-1', { text: 'Nova resposta' });
    });
  });

  describe('useCreateAnswerReply - cache update scenarios', () => {
    it('hauria d\'afegir la resposta a la cache del dubte existent', async () => {
      // Primer carreguem dubtes existents amb una resposta
      const doubtWithAnswer = {
        ...mockDoubtDTO,
        answers: [{ id: 'answer-1', text: 'Resposta original', creator_uid: 'user-1', created_at: '2025-01-01' }],
        answers_count: 1,
      };
      (DoubtsService.getDoubtsByRefuge as jest.Mock).mockResolvedValue([doubtWithAnswer]);
      
      const { result: doubtsResult } = renderHook(() => useDoubts('refuge-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(doubtsResult.current.isSuccess).toBe(true);
      });

      // Ara creem una resposta a la resposta
      (DoubtsService.createAnswerReply as jest.Mock).mockResolvedValue(mockAnswerDTO);

      const { result: createResult } = renderHook(() => useCreateAnswerReply(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await createResult.current.mutateAsync({
          doubtId: 'doubt-1',
          parentAnswerId: 'answer-1',
          refugeId: 'refuge-1',
          request: { text: 'Resposta a resposta' },
        });
      });

      // Verifiquem que la resposta s'ha afegit a la cache
      const cachedData = queryClient.getQueryData<any[]>(['doubts', 'refuge', 'refuge-1']);
      const doubtInCache = cachedData?.find(d => d.id === 'doubt-1');
      expect(doubtInCache?.answers_count).toBe(2);
    });

    it('hauria de gestionar crear resposta a resposta quan no hi ha cache', async () => {
      (DoubtsService.createAnswerReply as jest.Mock).mockResolvedValue(mockAnswerDTO);

      const { result } = renderHook(() => useCreateAnswerReply(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({
          doubtId: 'doubt-1',
          parentAnswerId: 'answer-1',
          refugeId: 'refuge-no-cache',
          request: { text: 'Resposta a resposta' },
        });
      });

      expect(DoubtsService.createAnswerReply).toHaveBeenCalledWith(
        'doubt-1',
        'answer-1',
        { text: 'Resposta a resposta' }
      );
    });
  });

  describe('useCreateDoubt - cache edge cases', () => {
    it('hauria de crear cache nova si no existeix', async () => {
      const newDoubtDTO = { id: 'doubt-new', refuge_id: 'refuge-no-cache', text: 'Nou dubte', creator_uid: 'user-new', answers_count: 0, answers: [] };
      (DoubtsService.createDoubt as jest.Mock).mockResolvedValue(newDoubtDTO);

      const { result } = renderHook(() => useCreateDoubt(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({
          refuge_id: 'refuge-no-cache',
          text: 'Nou dubte',
        });
      });

      // Esperar que la cache s'actualitzi amb waitFor
      await waitFor(() => {
        const cachedData = queryClient.getQueryData<any[]>(['doubts', 'refuge', 'refuge-no-cache']);
        expect(cachedData).toBeDefined();
        expect(cachedData).toHaveLength(1);
        expect(cachedData?.[0].text).toBe('Nou dubte');
      });
    });
  });

  describe('useDeleteDoubt - cache edge cases', () => {
    it('hauria de gestionar eliminació quan no hi ha cache', async () => {
      (DoubtsService.deleteDoubt as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteDoubt(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({
          doubtId: 'doubt-1',
          refugeId: 'refuge-no-cache',
        });
      });

      expect(DoubtsService.deleteDoubt).toHaveBeenCalledWith('doubt-1');
    });
  });
});
