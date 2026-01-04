/**
 * Tests for useRefugesQuery hooks
 */

import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useRefuges,
  useRefuge,
  useRefugesBatch,
  useCreateRefuge,
  useUpdateRefuge,
  useDeleteRefuge,
} from '../../hooks/useRefugesQuery';
import { RefugisService } from '../../services/RefugisService';

// Mock the RefugisService
jest.mock('../../services/RefugisService');

const mockedService = RefugisService as jest.Mocked<typeof RefugisService>;

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

// Mock refuge data
const mockRefuge = {
  id: 'refuge-1',
  name: 'Test Refuge',
  coord: '42.0,2.0',
  latitude: 42.0,
  longitude: 2.0,
  altitude: 1500,
  region: 'Catalunya',
};

const mockRefugesList = [
  mockRefuge,
  {
    id: 'refuge-2',
    name: 'Test Refuge 2',
    coord: '42.5,2.5',
    latitude: 42.5,
    longitude: 2.5,
    altitude: 2000,
    region: 'Aragon',
  },
];

describe('useRefuges', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch all refuges', async () => {
    mockedService.getRefugis.mockResolvedValue(mockRefugesList);

    const { result } = renderHook(() => useRefuges(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockRefugesList);
    expect(mockedService.getRefugis).toHaveBeenCalledWith();
  });

  it('should fetch refuges with filters', async () => {
    mockedService.getRefugis.mockResolvedValue([mockRefuge]);

    const filters = { region: 'Catalunya' };
    const { result } = renderHook(() => useRefuges(filters), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockedService.getRefugis).toHaveBeenCalledWith(filters);
  });

  it('should handle error', async () => {
    mockedService.getRefugis.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useRefuges(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});

describe('useRefuge', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch a single refuge by ID', async () => {
    mockedService.getRefugiById.mockResolvedValue(mockRefuge);

    const { result } = renderHook(() => useRefuge('refuge-1'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockRefuge);
    expect(mockedService.getRefugiById).toHaveBeenCalledWith('refuge-1');
  });

  it('should not fetch when ID is undefined', async () => {
    const { result } = renderHook(() => useRefuge(undefined), {
      wrapper: createWrapper(queryClient),
    });

    // Query should not be enabled
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedService.getRefugiById).not.toHaveBeenCalled();
  });

  it('should handle error', async () => {
    mockedService.getRefugiById.mockRejectedValue(new Error('Not found'));

    const { result } = renderHook(() => useRefuge('invalid-id'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useRefugesBatch', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch multiple refuges by IDs', async () => {
    mockedService.getRefugiById
      .mockResolvedValueOnce(mockRefugesList[0])
      .mockResolvedValueOnce(mockRefugesList[1]);

    const { result } = renderHook(() => useRefugesBatch(['refuge-1', 'refuge-2']), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeInstanceOf(Map);
    expect(result.current.data?.get('refuge-1')).toEqual(mockRefugesList[0]);
    expect(result.current.data?.get('refuge-2')).toEqual(mockRefugesList[1]);
  });

  it('should not fetch when IDs is undefined', async () => {
    const { result } = renderHook(() => useRefugesBatch(undefined), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedService.getRefugiById).not.toHaveBeenCalled();
  });

  it('should not fetch when IDs is empty array', async () => {
    const { result } = renderHook(() => useRefugesBatch([]), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('should handle partial failures', async () => {
    mockedService.getRefugiById
      .mockResolvedValueOnce(mockRefugesList[0])
      .mockRejectedValueOnce(new Error('Not found'));

    const { result } = renderHook(() => useRefugesBatch(['refuge-1', 'invalid']), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Should still return the successful one
    expect(result.current.data?.get('refuge-1')).toEqual(mockRefugesList[0]);
    expect(result.current.data?.get('invalid')).toBeUndefined();
  });
});

describe('useCreateRefuge', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should throw error directing to use RefugeProposalsService', async () => {
    const { result } = renderHook(() => useCreateRefuge(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({ payload: mockRefuge });
      })
    ).rejects.toThrow('Use RefugeProposalsService.proposalCreateRefuge instead');
  });
});

describe('useUpdateRefuge', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should throw error directing to use RefugeProposalsService', async () => {
    const { result } = renderHook(() => useUpdateRefuge(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({ 
          refugeId: 'refuge-1', 
          payload: { name: 'Updated' } 
        });
      })
    ).rejects.toThrow('Use RefugeProposalsService.proposalEditRefuge instead');
  });
});

describe('useDeleteRefuge', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should throw error directing to use RefugeProposalsService', async () => {
    const { result } = renderHook(() => useDeleteRefuge(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({ refugeId: 'refuge-1' });
      })
    ).rejects.toThrow('Use RefugeProposalsService.proposalDeleteRefuge instead');
  });
});
