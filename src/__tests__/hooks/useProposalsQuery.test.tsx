import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useProposals,
  useMyProposals,
  useApproveProposal,
  useRejectProposal,
  useCreateRefugeProposal,
  useUpdateRefugeProposal,
  useDeleteRefugeProposal,
} from '../../hooks/useProposalsQuery';
import { RefugeProposalsService } from '../../services/RefugeProposalsService';
import { RefugeProposalStatus, RefugeProposalType } from '../../models';

// Mock the RefugeProposalsService
jest.mock('../../services/RefugeProposalsService');

const mockedService = RefugeProposalsService as jest.Mocked<typeof RefugeProposalsService>;

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

// Mock proposal data
const mockProposal = {
  id: 'proposal-1',
  type: 'create' as RefugeProposalType,
  status: 'pending' as RefugeProposalStatus,
  refugeId: null,
  proposedBy: {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
  },
  payload: {
    name: 'Test Refuge',
    latitude: 42.0,
    longitude: 2.0,
    altitude: 1500,
    region: 'Pyrenees',
  },
  comment: 'Test comment',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('useProposals', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch all proposals', async () => {
    mockedService.listProposals.mockResolvedValue([mockProposal]);

    const { result } = renderHook(() => useProposals(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([mockProposal]);
    expect(mockedService.listProposals).toHaveBeenCalledWith(undefined, undefined);
  });

  it('should fetch proposals with status filter', async () => {
    mockedService.listProposals.mockResolvedValue([mockProposal]);

    const { result } = renderHook(() => useProposals('pending'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockedService.listProposals).toHaveBeenCalledWith('pending', undefined);
  });

  it('should fetch proposals with refugeId filter', async () => {
    mockedService.listProposals.mockResolvedValue([mockProposal]);

    const { result } = renderHook(() => useProposals(undefined, 'refuge-1'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockedService.listProposals).toHaveBeenCalledWith(undefined, 'refuge-1');
  });

  it('should handle error', async () => {
    mockedService.listProposals.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useProposals(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});

describe('useMyProposals', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch user proposals', async () => {
    mockedService.listMyProposals.mockResolvedValue([mockProposal]);

    const { result } = renderHook(() => useMyProposals(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([mockProposal]);
    expect(mockedService.listMyProposals).toHaveBeenCalledWith(undefined);
  });

  it('should fetch user proposals with status filter', async () => {
    mockedService.listMyProposals.mockResolvedValue([mockProposal]);

    const { result } = renderHook(() => useMyProposals('approved'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockedService.listMyProposals).toHaveBeenCalledWith('approved');
  });
});

describe('useApproveProposal', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should approve a proposal', async () => {
    mockedService.approveProposal.mockResolvedValue(undefined);

    const { result } = renderHook(() => useApproveProposal(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ proposalId: 'proposal-1' });
    });

    expect(mockedService.approveProposal).toHaveBeenCalledWith('proposal-1');
  });

  it('should approve a proposal with proposalType and refugeId', async () => {
    mockedService.approveProposal.mockResolvedValue(undefined);

    const { result } = renderHook(() => useApproveProposal(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      const response = await result.current.mutateAsync({ 
        proposalId: 'proposal-1', 
        proposalType: 'delete',
        refugeId: 'refuge-1'
      });
      expect(response.proposalType).toBe('delete');
      expect(response.refugeId).toBe('refuge-1');
    });

    expect(mockedService.approveProposal).toHaveBeenCalledWith('proposal-1');
  });

  it('should handle error', async () => {
    mockedService.approveProposal.mockRejectedValue(new Error('Permission denied'));

    const { result } = renderHook(() => useApproveProposal(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({ proposalId: 'proposal-1' });
      })
    ).rejects.toThrow('Permission denied');
  });
});

describe('useRejectProposal', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should reject a proposal without reason', async () => {
    mockedService.rejectProposal.mockResolvedValue(undefined);

    const { result } = renderHook(() => useRejectProposal(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ proposalId: 'proposal-1' });
    });

    expect(mockedService.rejectProposal).toHaveBeenCalledWith('proposal-1', undefined);
  });

  it('should reject a proposal with reason', async () => {
    mockedService.rejectProposal.mockResolvedValue(undefined);

    const { result } = renderHook(() => useRejectProposal(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ 
        proposalId: 'proposal-1', 
        reason: 'Invalid data' 
      });
    });

    expect(mockedService.rejectProposal).toHaveBeenCalledWith('proposal-1', 'Invalid data');
  });

  it('should handle error', async () => {
    mockedService.rejectProposal.mockRejectedValue(new Error('Permission denied'));

    const { result } = renderHook(() => useRejectProposal(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({ proposalId: 'proposal-1' });
      })
    ).rejects.toThrow('Permission denied');
  });
});

describe('useCreateRefugeProposal', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should create a refuge proposal', async () => {
    mockedService.proposalCreateRefuge.mockResolvedValue(mockProposal);

    const { result } = renderHook(() => useCreateRefugeProposal(), {
      wrapper: createWrapper(queryClient),
    });

    const payload = {
      name: 'New Refuge',
      latitude: 42.5,
      longitude: 1.5,
      altitude: 2000,
      region: 'Pyrenees',
    };

    await act(async () => {
      await result.current.mutateAsync({ payload });
    });

    expect(mockedService.proposalCreateRefuge).toHaveBeenCalledWith(payload, undefined);
  });

  it('should create a refuge proposal with comment', async () => {
    mockedService.proposalCreateRefuge.mockResolvedValue(mockProposal);

    const { result } = renderHook(() => useCreateRefugeProposal(), {
      wrapper: createWrapper(queryClient),
    });

    const payload = {
      name: 'New Refuge',
      latitude: 42.5,
      longitude: 1.5,
      altitude: 2000,
      region: 'Pyrenees',
    };

    await act(async () => {
      await result.current.mutateAsync({ payload, comment: 'Please review' });
    });

    expect(mockedService.proposalCreateRefuge).toHaveBeenCalledWith(payload, 'Please review');
  });

  it('should handle error', async () => {
    mockedService.proposalCreateRefuge.mockRejectedValue(new Error('Validation error'));

    const { result } = renderHook(() => useCreateRefugeProposal(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({ 
          payload: { name: 'Test', latitude: 0, longitude: 0, altitude: 0, region: '' } 
        });
      })
    ).rejects.toThrow('Validation error');
  });
});

describe('useUpdateRefugeProposal', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should update a refuge proposal', async () => {
    mockedService.proposalEditRefuge.mockResolvedValue(mockProposal);

    const { result } = renderHook(() => useUpdateRefugeProposal(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ 
        refugeId: 'refuge-1', 
        payload: { name: 'Updated Refuge' } 
      });
    });

    expect(mockedService.proposalEditRefuge).toHaveBeenCalledWith(
      'refuge-1', 
      { name: 'Updated Refuge' }, 
      undefined
    );
  });

  it('should update a refuge proposal with comment', async () => {
    mockedService.proposalEditRefuge.mockResolvedValue(mockProposal);

    const { result } = renderHook(() => useUpdateRefugeProposal(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ 
        refugeId: 'refuge-1', 
        payload: { altitude: 2500 },
        comment: 'Correcting altitude'
      });
    });

    expect(mockedService.proposalEditRefuge).toHaveBeenCalledWith(
      'refuge-1', 
      { altitude: 2500 }, 
      'Correcting altitude'
    );
  });

  it('should handle error', async () => {
    mockedService.proposalEditRefuge.mockRejectedValue(new Error('Refuge not found'));

    const { result } = renderHook(() => useUpdateRefugeProposal(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({ 
          refugeId: 'invalid-id', 
          payload: { name: 'Test' } 
        });
      })
    ).rejects.toThrow('Refuge not found');
  });
});

describe('useDeleteRefugeProposal', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should delete a refuge proposal', async () => {
    mockedService.proposalDeleteRefuge.mockResolvedValue(mockProposal);

    const { result } = renderHook(() => useDeleteRefugeProposal(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ refugeId: 'refuge-1' });
    });

    expect(mockedService.proposalDeleteRefuge).toHaveBeenCalledWith('refuge-1', undefined);
  });

  it('should delete a refuge proposal with comment', async () => {
    mockedService.proposalDeleteRefuge.mockResolvedValue(mockProposal);

    const { result } = renderHook(() => useDeleteRefugeProposal(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ 
        refugeId: 'refuge-1', 
        comment: 'Duplicate refuge' 
      });
    });

    expect(mockedService.proposalDeleteRefuge).toHaveBeenCalledWith('refuge-1', 'Duplicate refuge');
  });

  it('should handle error', async () => {
    mockedService.proposalDeleteRefuge.mockRejectedValue(new Error('Refuge not found'));

    const { result } = renderHook(() => useDeleteRefugeProposal(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({ refugeId: 'invalid-id' });
      })
    ).rejects.toThrow('Refuge not found');
  });
});
