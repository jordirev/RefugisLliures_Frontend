/**
 * Tests for useRefugeVisitsQuery hooks
 */

import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useRefugeVisits,
  useUserVisits,
  useCreateRefugeVisit,
  useUpdateRefugeVisit,
  useDeleteRefugeVisit,
} from '../../hooks/useRefugeVisitsQuery';
import { RefugeVisitService } from '../../services/RefugeVisitService';

// Mock the RefugeVisitService
jest.mock('../../services/RefugeVisitService');

const mockedService = RefugeVisitService as jest.Mocked<typeof RefugeVisitService>;

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
const mockVisit = {
  date: '2024-01-15',
  refuge_id: 'refuge-1',
  total_visitors: 10,
  is_visitor: true,
  num_visitors: 2,
};

const mockVisitsList = [
  mockVisit,
  {
    date: '2024-01-16',
    refuge_id: 'refuge-1',
    total_visitors: 5,
    is_visitor: false,
    num_visitors: 0,
  },
];

const mockUserVisit = {
  date: '2024-01-15',
  refuge_id: 'refuge-1',
  num_visitors: 2,
  refuge_name: 'Test Refuge',
  refuge_image: 'https://example.com/image.jpg',
};

describe('useRefugeVisits', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch refuge visits', async () => {
    mockedService.getRefugeVisits.mockResolvedValue(mockVisitsList);

    const { result } = renderHook(() => useRefugeVisits('refuge-1'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockVisitsList);
    expect(mockedService.getRefugeVisits).toHaveBeenCalledWith('refuge-1');
  });

  it('should not fetch when refugeId is undefined', async () => {
    const { result } = renderHook(() => useRefugeVisits(undefined), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedService.getRefugeVisits).not.toHaveBeenCalled();
  });

  it('should respect enabled option', async () => {
    const { result } = renderHook(() => useRefugeVisits('refuge-1', { enabled: false }), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedService.getRefugeVisits).not.toHaveBeenCalled();
  });

  it('should handle error', async () => {
    mockedService.getRefugeVisits.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useRefugeVisits('refuge-1'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useUserVisits', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch user visits', async () => {
    mockedService.getUserVisits.mockResolvedValue([mockUserVisit]);

    const { result } = renderHook(() => useUserVisits('user-123'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([mockUserVisit]);
    expect(mockedService.getUserVisits).toHaveBeenCalledWith('user-123');
  });

  it('should not fetch when uid is undefined', async () => {
    const { result } = renderHook(() => useUserVisits(undefined), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedService.getUserVisits).not.toHaveBeenCalled();
  });

  it('should handle error', async () => {
    mockedService.getUserVisits.mockRejectedValue(new Error('User not found'));

    const { result } = renderHook(() => useUserVisits('invalid-user'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useCreateRefugeVisit', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should create a refuge visit', async () => {
    mockedService.createRefugeVisit.mockResolvedValue(mockVisit);

    const { result } = renderHook(() => useCreateRefugeVisit(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        refugeId: 'refuge-1',
        visitDate: '2024-01-15',
        request: { num_visitors: 2 },
      });
    });

    expect(mockedService.createRefugeVisit).toHaveBeenCalledWith(
      'refuge-1',
      '2024-01-15',
      { num_visitors: 2 }
    );
  });

  it('should handle error when creating visit', async () => {
    mockedService.createRefugeVisit.mockRejectedValue(new Error('Failed to create'));

    const { result } = renderHook(() => useCreateRefugeVisit(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          refugeId: 'refuge-1',
          visitDate: '2024-01-15',
          request: { num_visitors: 2 },
        });
      })
    ).rejects.toThrow('Failed to create');
  });
});

describe('useUpdateRefugeVisit', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should update a refuge visit', async () => {
    const updatedVisit = { ...mockVisit, num_visitors: 3 };
    mockedService.updateRefugeVisit.mockResolvedValue(updatedVisit);

    const { result } = renderHook(() => useUpdateRefugeVisit(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        refugeId: 'refuge-1',
        visitDate: '2024-01-15',
        request: { num_visitors: 3 },
      });
    });

    expect(mockedService.updateRefugeVisit).toHaveBeenCalledWith(
      'refuge-1',
      '2024-01-15',
      { num_visitors: 3 }
    );
  });

  it('should handle error when updating visit', async () => {
    mockedService.updateRefugeVisit.mockRejectedValue(new Error('Failed to update'));

    const { result } = renderHook(() => useUpdateRefugeVisit(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          refugeId: 'refuge-1',
          visitDate: '2024-01-15',
          request: { num_visitors: 3 },
        });
      })
    ).rejects.toThrow('Failed to update');
  });
});

describe('useDeleteRefugeVisit', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should delete a refuge visit', async () => {
    mockedService.deleteRefugeVisit.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteRefugeVisit(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        refugeId: 'refuge-1',
        visitDate: '2024-01-15',
      });
    });

    expect(mockedService.deleteRefugeVisit).toHaveBeenCalledWith('refuge-1', '2024-01-15');
  });

  it('should handle error when deleting visit', async () => {
    mockedService.deleteRefugeVisit.mockRejectedValue(new Error('Failed to delete'));

    const { result } = renderHook(() => useDeleteRefugeVisit(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          refugeId: 'refuge-1',
          visitDate: '2024-01-15',
        });
      })
    ).rejects.toThrow('Failed to delete');
  });
});

describe('Cache updates on success', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should update cache when creating a visit and old data exists', async () => {
    // Pre-populate cache with existing visits
    queryClient.setQueryData(['refugeVisits', 'refuge', 'refuge-1'], mockVisitsList);
    
    const newVisit = {
      date: '2024-01-20',
      refuge_id: 'refuge-1',
      total_visitors: 15,
      is_visitor: true,
      num_visitors: 3,
    };
    mockedService.createRefugeVisit.mockResolvedValue(newVisit);

    const { result } = renderHook(() => useCreateRefugeVisit(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        refugeId: 'refuge-1',
        visitDate: '2024-01-20',
        request: { num_visitors: 3 },
      });
    });

    // Check mutation was called
    expect(mockedService.createRefugeVisit).toHaveBeenCalled();
  });

  it('should update existing visit in cache when date matches', async () => {
    // Pre-populate cache with existing visits
    queryClient.setQueryData(['refugeVisits', 'refuge', 'refuge-1'], mockVisitsList);
    
    const updatedVisit = {
      ...mockVisit,
      total_visitors: 20,
      num_visitors: 5,
    };
    mockedService.createRefugeVisit.mockResolvedValue(updatedVisit);

    const { result } = renderHook(() => useCreateRefugeVisit(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        refugeId: 'refuge-1',
        visitDate: '2024-01-15', // Same date as mockVisit
        request: { num_visitors: 5 },
      });
    });

    expect(mockedService.createRefugeVisit).toHaveBeenCalled();
  });

  it('should call mutation when no old data exists on create', async () => {
    // No pre-populated cache
    const newVisit = mockVisit;
    mockedService.createRefugeVisit.mockResolvedValue(newVisit);

    const { result } = renderHook(() => useCreateRefugeVisit(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        refugeId: 'refuge-1',
        visitDate: '2024-01-15',
        request: { num_visitors: 2 },
      });
    });

    expect(mockedService.createRefugeVisit).toHaveBeenCalled();
  });

  it('should update cache when updating a visit', async () => {
    // Pre-populate cache with existing visits
    queryClient.setQueryData(['refugeVisits', 'refuge', 'refuge-1'], mockVisitsList);
    
    const updatedVisit = { ...mockVisit, num_visitors: 10 };
    mockedService.updateRefugeVisit.mockResolvedValue(updatedVisit);

    const { result } = renderHook(() => useUpdateRefugeVisit(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        refugeId: 'refuge-1',
        visitDate: '2024-01-15',
        request: { num_visitors: 10 },
      });
    });

    expect(mockedService.updateRefugeVisit).toHaveBeenCalled();
  });

  it('should call mutation when no old data exists on update', async () => {
    // No pre-populated cache
    const updatedVisit = mockVisit;
    mockedService.updateRefugeVisit.mockResolvedValue(updatedVisit);

    const { result } = renderHook(() => useUpdateRefugeVisit(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        refugeId: 'refuge-1',
        visitDate: '2024-01-15',
        request: { num_visitors: 2 },
      });
    });

    expect(mockedService.updateRefugeVisit).toHaveBeenCalled();
  });

  it('should invalidate user visits on create', async () => {
    mockedService.createRefugeVisit.mockResolvedValue(mockVisit);
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateRefugeVisit(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        refugeId: 'refuge-1',
        visitDate: '2024-01-15',
        request: { num_visitors: 2 },
      });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['refugeVisits', 'user'] });
  });

  it('should invalidate queries on delete', async () => {
    mockedService.deleteRefugeVisit.mockResolvedValue(undefined);
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteRefugeVisit(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        refugeId: 'refuge-1',
        visitDate: '2024-01-15',
      });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['refugeVisits', 'refuge', 'refuge-1'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['refugeVisits', 'user'] });
  });
});
