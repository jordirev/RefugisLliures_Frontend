/**
 * Tests for useDoubtsQuery hooks
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
} from '../../hooks/useDoubtsQuery';
import { DoubtsService } from '../../services/DoubtsService';

// Mock the DoubtsService
jest.mock('../../services/DoubtsService');

// Mock the mappers
jest.mock('../../services/mappers/DoubtMapper', () => ({
  mapDoubtFromDTO: jest.fn((dto) => ({
    id: dto.id,
    refuge_id: dto.refuge_id,
    user_uid: dto.user_uid,
    username: dto.username,
    message: dto.message,
    created_at: dto.created_at,
    answers_count: dto.answers?.length || 0,
    answers: dto.answers || [],
  })),
  mapAnswerFromDTO: jest.fn((dto) => ({
    id: dto.id,
    doubt_id: dto.doubt_id,
    user_uid: dto.user_uid,
    username: dto.username,
    message: dto.message,
    parent_answer_id: dto.parent_answer_id,
    created_at: dto.created_at,
  })),
}));

const mockedService = DoubtsService as jest.Mocked<typeof DoubtsService>;

// Create a fresh QueryClient for each test
const createTestQueryClient = () => new QueryClient({
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

// Create wrapper component
const createWrapper = (queryClient: QueryClient) => {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  return Wrapper;
};

// Mock data
const mockDoubtDTO = {
  id: 'doubt-1',
  refuge_id: 'refuge-1',
  user_uid: 'user-123',
  username: 'TestUser',
  message: 'Test doubt message',
  created_at: '2024-01-15T10:00:00Z',
  answers: [],
};

const mockAnswerDTO = {
  id: 'answer-1',
  doubt_id: 'doubt-1',
  user_uid: 'user-456',
  username: 'Answerer',
  message: 'Test answer message',
  parent_answer_id: null,
  created_at: '2024-01-15T11:00:00Z',
};

describe('useDoubts', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch doubts for a refuge', async () => {
    mockedService.getDoubtsByRefuge.mockResolvedValue([mockDoubtDTO]);

    const { result } = renderHook(() => useDoubts('refuge-1'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
    expect(mockedService.getDoubtsByRefuge).toHaveBeenCalledWith('refuge-1');
  });

  it('should not fetch when refugeId is undefined', async () => {
    const { result } = renderHook(() => useDoubts(undefined), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedService.getDoubtsByRefuge).not.toHaveBeenCalled();
  });

  it('should handle error', async () => {
    mockedService.getDoubtsByRefuge.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useDoubts('refuge-1'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useCreateDoubt', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should create a new doubt', async () => {
    mockedService.createDoubt.mockResolvedValue(mockDoubtDTO);

    const { result } = renderHook(() => useCreateDoubt(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        refuge_id: 'refuge-1',
        message: 'Test doubt message',
      });
    });

    expect(mockedService.createDoubt).toHaveBeenCalledWith({
      refuge_id: 'refuge-1',
      message: 'Test doubt message',
    });
  });

  it('should handle error when creating doubt', async () => {
    mockedService.createDoubt.mockRejectedValue(new Error('Failed to create'));

    const { result } = renderHook(() => useCreateDoubt(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          refuge_id: 'refuge-1',
          message: 'Test',
        });
      })
    ).rejects.toThrow('Failed to create');
  });
});

describe('useDeleteDoubt', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should delete a doubt', async () => {
    mockedService.deleteDoubt.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteDoubt(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        doubtId: 'doubt-1',
        refugeId: 'refuge-1',
      });
    });

    expect(mockedService.deleteDoubt).toHaveBeenCalledWith('doubt-1');
  });

  it('should handle error when deleting doubt', async () => {
    mockedService.deleteDoubt.mockRejectedValue(new Error('Failed to delete'));

    const { result } = renderHook(() => useDeleteDoubt(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          doubtId: 'doubt-1',
          refugeId: 'refuge-1',
        });
      })
    ).rejects.toThrow('Failed to delete');
  });
});

describe('useCreateAnswer', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should create an answer', async () => {
    mockedService.createAnswer.mockResolvedValue(mockAnswerDTO);

    const { result } = renderHook(() => useCreateAnswer(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        doubtId: 'doubt-1',
        refugeId: 'refuge-1',
        request: { message: 'Test answer' },
      });
    });

    expect(mockedService.createAnswer).toHaveBeenCalledWith('doubt-1', { message: 'Test answer' });
  });

  it('should handle error when creating answer', async () => {
    mockedService.createAnswer.mockRejectedValue(new Error('Failed to create'));

    const { result } = renderHook(() => useCreateAnswer(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          doubtId: 'doubt-1',
          refugeId: 'refuge-1',
          request: { message: 'Test' },
        });
      })
    ).rejects.toThrow('Failed to create');
  });
});

describe('useCreateAnswerReply', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should create a reply to an answer', async () => {
    const replyDTO = { ...mockAnswerDTO, id: 'answer-2', parent_answer_id: 'answer-1' };
    mockedService.createAnswerReply.mockResolvedValue(replyDTO);

    const { result } = renderHook(() => useCreateAnswerReply(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        doubtId: 'doubt-1',
        parentAnswerId: 'answer-1',
        refugeId: 'refuge-1',
        request: { message: 'Test reply' },
      });
    });

    expect(mockedService.createAnswerReply).toHaveBeenCalledWith(
      'doubt-1',
      'answer-1',
      { message: 'Test reply' }
    );
  });

  it('should handle error when creating reply', async () => {
    mockedService.createAnswerReply.mockRejectedValue(new Error('Failed to create'));

    const { result } = renderHook(() => useCreateAnswerReply(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          doubtId: 'doubt-1',
          parentAnswerId: 'answer-1',
          refugeId: 'refuge-1',
          request: { message: 'Test' },
        });
      })
    ).rejects.toThrow('Failed to create');
  });
});

describe('useDeleteAnswer', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should delete an answer', async () => {
    mockedService.deleteAnswer.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteAnswer(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        doubtId: 'doubt-1',
        answerId: 'answer-1',
        refugeId: 'refuge-1',
      });
    });

    expect(mockedService.deleteAnswer).toHaveBeenCalledWith('doubt-1', 'answer-1');
  });

  it('should handle error when deleting answer', async () => {
    mockedService.deleteAnswer.mockRejectedValue(new Error('Failed to delete'));

    const { result } = renderHook(() => useDeleteAnswer(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          doubtId: 'doubt-1',
          answerId: 'answer-1',
          refugeId: 'refuge-1',
        });
      })
    ).rejects.toThrow('Failed to delete');
  });
});
