/**
 * Tests for useUsersQuery hooks
 */

import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useUser,
  useFavouriteRefuges,
  useAddFavouriteRefuge,
  useRemoveFavouriteRefuge,
  useVisitedRefuges,
  useAddVisitedRefuge,
  useRemoveVisitedRefuge,
  useUpdateUserProfile,
  useUsers,
  useUserExists,
} from '../../hooks/useUsersQuery';
import { UsersService } from '../../services/UsersService';

// Mock the UsersService
jest.mock('../../services/UsersService');

const mockedService = UsersService as jest.Mocked<typeof UsersService>;

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
const mockUser = {
  uid: 'user-123',
  username: 'TestUser',
  email: 'test@example.com',
  avatar: 'https://example.com/avatar.jpg',
  favourite_refuges: ['refuge-1', 'refuge-2'],
  visited_refuges: ['refuge-3'],
};

const mockRefuge = {
  id: 'refuge-1',
  name: 'Test Refuge',
  coord: '42.0,2.0',
  latitude: 42.0,
  longitude: 2.0,
  altitude: 1500,
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
  },
];

describe('useUser', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch user by UID', async () => {
    mockedService.getUserByUid.mockResolvedValue(mockUser);

    const { result } = renderHook(() => useUser('user-123'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockUser);
    expect(mockedService.getUserByUid).toHaveBeenCalledWith('user-123');
  });

  it('should not fetch when UID is undefined', async () => {
    const { result } = renderHook(() => useUser(undefined), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedService.getUserByUid).not.toHaveBeenCalled();
  });

  it('should handle error', async () => {
    mockedService.getUserByUid.mockRejectedValue(new Error('User not found'));

    const { result } = renderHook(() => useUser('invalid-user'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useFavouriteRefuges', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch favourite refuges for user', async () => {
    mockedService.getFavouriteRefuges.mockResolvedValue(mockRefugesList);

    const { result } = renderHook(() => useFavouriteRefuges('user-123'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockRefugesList);
    expect(mockedService.getFavouriteRefuges).toHaveBeenCalledWith('user-123');
  });

  it('should not fetch when UID is undefined', async () => {
    const { result } = renderHook(() => useFavouriteRefuges(undefined), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedService.getFavouriteRefuges).not.toHaveBeenCalled();
  });
});

describe('useAddFavouriteRefuge', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should add refuge to favourites', async () => {
    mockedService.addFavouriteRefuge.mockResolvedValue(mockRefuge);

    const { result } = renderHook(() => useAddFavouriteRefuge(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ uid: 'user-123', refugeId: 'refuge-1' });
    });

    expect(mockedService.addFavouriteRefuge).toHaveBeenCalledWith('user-123', 'refuge-1');
  });

  it('should handle error when adding favourite', async () => {
    mockedService.addFavouriteRefuge.mockRejectedValue(new Error('Failed to add'));

    const { result } = renderHook(() => useAddFavouriteRefuge(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({ uid: 'user-123', refugeId: 'refuge-1' });
      })
    ).rejects.toThrow('Failed to add');
  });
});

describe('useRemoveFavouriteRefuge', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should remove refuge from favourites', async () => {
    mockedService.removeFavouriteRefuge.mockResolvedValue(true);

    const { result } = renderHook(() => useRemoveFavouriteRefuge(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ uid: 'user-123', refugeId: 'refuge-1' });
    });

    expect(mockedService.removeFavouriteRefuge).toHaveBeenCalledWith('user-123', 'refuge-1');
  });

  it('should handle error when removing favourite', async () => {
    mockedService.removeFavouriteRefuge.mockRejectedValue(new Error('Failed to remove'));

    const { result } = renderHook(() => useRemoveFavouriteRefuge(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({ uid: 'user-123', refugeId: 'refuge-1' });
      })
    ).rejects.toThrow('Failed to remove');
  });
});

describe('useVisitedRefuges', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch visited refuges for user', async () => {
    mockedService.getVisitedRefuges.mockResolvedValue(mockRefugesList);

    const { result } = renderHook(() => useVisitedRefuges('user-123'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockRefugesList);
    expect(mockedService.getVisitedRefuges).toHaveBeenCalledWith('user-123');
  });

  it('should not fetch when UID is undefined', async () => {
    const { result } = renderHook(() => useVisitedRefuges(undefined), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedService.getVisitedRefuges).not.toHaveBeenCalled();
  });
});

describe('useAddVisitedRefuge', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should add refuge to visited', async () => {
    mockedService.addVisitedRefuge.mockResolvedValue(mockRefuge);

    const { result } = renderHook(() => useAddVisitedRefuge(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ uid: 'user-123', refugeId: 'refuge-1' });
    });

    expect(mockedService.addVisitedRefuge).toHaveBeenCalledWith('user-123', 'refuge-1');
  });

  it('should handle error when adding visited', async () => {
    mockedService.addVisitedRefuge.mockRejectedValue(new Error('Failed to add'));

    const { result } = renderHook(() => useAddVisitedRefuge(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({ uid: 'user-123', refugeId: 'refuge-1' });
      })
    ).rejects.toThrow('Failed to add');
  });
});

describe('useRemoveVisitedRefuge', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should remove refuge from visited', async () => {
    mockedService.removeVisitedRefuge.mockResolvedValue(true);

    const { result } = renderHook(() => useRemoveVisitedRefuge(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ uid: 'user-123', refugeId: 'refuge-1' });
    });

    expect(mockedService.removeVisitedRefuge).toHaveBeenCalledWith('user-123', 'refuge-1');
  });

  it('should handle error when removing visited', async () => {
    mockedService.removeVisitedRefuge.mockRejectedValue(new Error('Failed to remove'));

    const { result } = renderHook(() => useRemoveVisitedRefuge(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({ uid: 'user-123', refugeId: 'refuge-1' });
      })
    ).rejects.toThrow('Failed to remove');
  });
});

describe('useUpdateUserProfile', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should update user profile', async () => {
    mockedService.updateUser.mockResolvedValue({ ...mockUser, username: 'UpdatedUser' });

    const { result } = renderHook(() => useUpdateUserProfile(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ 
        uid: 'user-123', 
        data: { username: 'UpdatedUser' } 
      });
    });

    expect(mockedService.updateUser).toHaveBeenCalledWith('user-123', { username: 'UpdatedUser' });
  });

  it('should handle error when updating profile', async () => {
    mockedService.updateUser.mockRejectedValue(new Error('Update failed'));

    const { result } = renderHook(() => useUpdateUserProfile(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({ uid: 'user-123', data: { username: 'Test' } });
      })
    ).rejects.toThrow('Update failed');
  });
});

describe('useUsers', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch multiple users by UIDs', async () => {
    const mockUser2 = { ...mockUser, uid: 'user-456', username: 'TestUser2' };
    mockedService.getUserByUid
      .mockResolvedValueOnce(mockUser)
      .mockResolvedValueOnce(mockUser2);

    const { result } = renderHook(() => useUsers(['user-123', 'user-456']), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(2);
    expect(mockedService.getUserByUid).toHaveBeenCalledTimes(2);
  });

  it('should not fetch when UIDs is undefined', async () => {
    const { result } = renderHook(() => useUsers(undefined), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedService.getUserByUid).not.toHaveBeenCalled();
  });

  it('should not fetch when UIDs is empty array', async () => {
    const { result } = renderHook(() => useUsers([]), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('should filter out null results on error', async () => {
    mockedService.getUserByUid
      .mockResolvedValueOnce(mockUser)
      .mockRejectedValueOnce(new Error('Not found'));

    const { result } = renderHook(() => useUsers(['user-123', 'invalid-user']), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0]).toEqual(mockUser);
  });
});

describe('useUserExists', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should return true when user exists', async () => {
    mockedService.getUserByUid.mockResolvedValue(mockUser);

    const { result } = renderHook(() => useUserExists('user-123'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBe(true);
  });

  it('should return false when user does not exist', async () => {
    mockedService.getUserByUid.mockRejectedValue(new Error('Not found'));

    const { result } = renderHook(() => useUserExists('invalid-user'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBe(false);
  });

  it('should not fetch when UID is undefined', async () => {
    const { result } = renderHook(() => useUserExists(undefined), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedService.getUserByUid).not.toHaveBeenCalled();
  });
});
