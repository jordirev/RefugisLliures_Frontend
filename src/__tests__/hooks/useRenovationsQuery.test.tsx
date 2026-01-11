/**
 * Tests for useRenovationsQuery hooks
 */

import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useRenovations,
  useRenovation,
  useRefugeRenovations,
  useCreateRenovation,
  useUpdateRenovation,
  useDeleteRenovation,
  useJoinRenovation,
  useLeaveRenovation,
} from '../../hooks/useRenovationsQuery';
import { RenovationService } from '../../services/RenovationService';

// Mock the RenovationService
jest.mock('../../services/RenovationService');

// Mock the mappers
jest.mock('../../services/mappers/RenovationMapper', () => ({
  mapRenovationFromDTO: jest.fn((dto) => ({
    id: dto.id,
    refuge_id: dto.refuge_id,
    creator_uid: dto.creator_uid,
    creator_username: dto.creator_username,
    ini_date: dto.ini_date,
    fin_date: dto.fin_date,
    description: dto.description,
    materials_needed: dto.materials_needed,
    group_link: dto.group_link,
    participants: dto.participants || [],
    created_at: dto.created_at,
  })),
}));

const mockedService = RenovationService as jest.Mocked<typeof RenovationService>;

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
const mockRenovationDTO = {
  id: 'renovation-1',
  refuge_id: 'refuge-1',
  creator_uid: 'user-123',
  creator_username: 'TestUser',
  ini_date: '2024-02-01',
  fin_date: '2024-02-15',
  description: 'Test renovation',
  materials_needed: 'Wood, nails',
  group_link: 'https://t.me/group',
  participants: ['user-456'],
  created_at: '2024-01-15T10:00:00Z',
};

describe('useRenovations', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch all renovations', async () => {
    mockedService.getAllRenovations.mockResolvedValue([mockRenovationDTO]);

    const { result } = renderHook(() => useRenovations(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
    expect(mockedService.getAllRenovations).toHaveBeenCalled();
  });

  it('should handle error', async () => {
    mockedService.getAllRenovations.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useRenovations(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useRenovation', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch a single renovation', async () => {
    mockedService.getRenovationById.mockResolvedValue(mockRenovationDTO);

    const { result } = renderHook(() => useRenovation('renovation-1'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
    expect(mockedService.getRenovationById).toHaveBeenCalledWith('renovation-1');
  });

  it('should not fetch when id is undefined', async () => {
    const { result } = renderHook(() => useRenovation(undefined), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedService.getRenovationById).not.toHaveBeenCalled();
  });

  it('should handle error when renovation not found', async () => {
    mockedService.getRenovationById.mockResolvedValue(null);

    const { result } = renderHook(() => useRenovation('invalid'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useRefugeRenovations', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch renovations for a refuge', async () => {
    mockedService.getRenovationsByRefugeId.mockResolvedValue([mockRenovationDTO]);

    const { result } = renderHook(() => useRefugeRenovations('refuge-1'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
    expect(mockedService.getRenovationsByRefugeId).toHaveBeenCalledWith('refuge-1');
  });

  it('should not fetch when refugeId is undefined', async () => {
    const { result } = renderHook(() => useRefugeRenovations(undefined), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedService.getRenovationsByRefugeId).not.toHaveBeenCalled();
  });
});

describe('useCreateRenovation', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should create a new renovation', async () => {
    mockedService.createRenovation.mockResolvedValue(mockRenovationDTO);

    const { result } = renderHook(() => useCreateRenovation(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        refuge_id: 'refuge-1',
        ini_date: '2024-02-01',
        fin_date: '2024-02-15',
        description: 'Test renovation',
        group_link: 'https://t.me/group',
      });
    });

    expect(mockedService.createRenovation).toHaveBeenCalled();
  });

  it('should handle error when creating renovation', async () => {
    mockedService.createRenovation.mockRejectedValue(new Error('Failed to create'));

    const { result } = renderHook(() => useCreateRenovation(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          refuge_id: 'refuge-1',
          ini_date: '2024-02-01',
          fin_date: '2024-02-15',
          description: 'Test',
          group_link: 'https://t.me/group',
        });
      })
    ).rejects.toThrow('Failed to create');
  });
});

describe('useUpdateRenovation', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should update a renovation', async () => {
    const updatedDTO = { ...mockRenovationDTO, description: 'Updated' };
    mockedService.updateRenovation.mockResolvedValue(updatedDTO);

    const { result } = renderHook(() => useUpdateRenovation(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: 'renovation-1',
        updates: { description: 'Updated' },
      });
    });

    expect(mockedService.updateRenovation).toHaveBeenCalledWith('renovation-1', { description: 'Updated' });
  });

  it('should handle error when updating renovation', async () => {
    mockedService.updateRenovation.mockRejectedValue(new Error('Failed to update'));

    const { result } = renderHook(() => useUpdateRenovation(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          id: 'renovation-1',
          updates: { description: 'Test' },
        });
      })
    ).rejects.toThrow('Failed to update');
  });
});

describe('useDeleteRenovation', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should delete a renovation', async () => {
    mockedService.deleteRenovation.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteRenovation(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: 'renovation-1',
        refugeId: 'refuge-1',
      });
    });

    expect(mockedService.deleteRenovation).toHaveBeenCalledWith('renovation-1');
  });

  it('should handle error when deleting renovation', async () => {
    mockedService.deleteRenovation.mockRejectedValue(new Error('Failed to delete'));

    const { result } = renderHook(() => useDeleteRenovation(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          id: 'renovation-1',
        });
      })
    ).rejects.toThrow('Failed to delete');
  });
});

describe('useJoinRenovation', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should join a renovation', async () => {
    const joinedDTO = { ...mockRenovationDTO, participants: ['user-456', 'user-789'] };
    mockedService.joinRenovation.mockResolvedValue(joinedDTO);

    const { result } = renderHook(() => useJoinRenovation(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync('renovation-1');
    });

    expect(mockedService.joinRenovation).toHaveBeenCalledWith('renovation-1');
  });

  it('should handle error when joining renovation', async () => {
    mockedService.joinRenovation.mockRejectedValue(new Error('Already a participant'));

    const { result } = renderHook(() => useJoinRenovation(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync('renovation-1');
      })
    ).rejects.toThrow('Already a participant');
  });
});

describe('useLeaveRenovation', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should leave a renovation', async () => {
    const updatedDTO = { ...mockRenovationDTO, participants: [] };
    mockedService.removeParticipant.mockResolvedValue(updatedDTO);

    const { result } = renderHook(() => useLeaveRenovation(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        renovationId: 'renovation-1',
        participantUid: 'user-456',
      });
    });

    expect(mockedService.removeParticipant).toHaveBeenCalledWith('renovation-1', 'user-456');
  });

  it('should handle error when leaving renovation', async () => {
    mockedService.removeParticipant.mockRejectedValue(new Error('Not a participant'));

    const { result } = renderHook(() => useLeaveRenovation(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          renovationId: 'renovation-1',
          participantUid: 'user-456',
        });
      })
    ).rejects.toThrow('Not a participant');
  });
});
