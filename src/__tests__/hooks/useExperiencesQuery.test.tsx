/**
 * Tests for useExperiencesQuery hooks
 */

import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useExperiences,
  useCreateExperience,
  useUpdateExperience,
  useDeleteExperience,
} from '../../hooks/useExperiencesQuery';
import { ExperienceService } from '../../services/ExperienceService';

// Mock the ExperienceService
jest.mock('../../services/ExperienceService');

// Mock the mappers
jest.mock('../../services/mappers/ExperienceMapper', () => ({
  mapExperienceFromDTO: jest.fn((dto) => ({
    id: dto.id,
    refuge_id: dto.refuge_id,
    user_uid: dto.user_uid,
    username: dto.username,
    comment: dto.comment,
    media_urls: dto.media_urls || [],
    created_at: dto.created_at,
    updated_at: dto.updated_at,
  })),
}));

const mockedService = ExperienceService as jest.Mocked<typeof ExperienceService>;

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
const mockExperienceDTO = {
  id: 'exp-1',
  refuge_id: 'refuge-1',
  user_uid: 'user-123',
  username: 'TestUser',
  comment: 'Great experience!',
  media_urls: ['https://example.com/image1.jpg'],
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
};

const mockCreateResponse = {
  message: 'Experiència creada correctament',
  experience: mockExperienceDTO,
  uploaded_files: ['image1.jpg'],
  failed_files: [],
};

const mockUpdateResponse = {
  message: 'Experiència actualitzada correctament',
  experience: mockExperienceDTO,
  uploaded_files: [],
  failed_files: [],
};

describe('useExperiences', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch experiences for a refuge', async () => {
    mockedService.getExperiencesByRefuge.mockResolvedValue([mockExperienceDTO]);

    const { result } = renderHook(() => useExperiences('refuge-1'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
    expect(mockedService.getExperiencesByRefuge).toHaveBeenCalledWith('refuge-1');
  });

  it('should not fetch when refugeId is undefined', async () => {
    const { result } = renderHook(() => useExperiences(undefined), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedService.getExperiencesByRefuge).not.toHaveBeenCalled();
  });

  it('should handle error', async () => {
    mockedService.getExperiencesByRefuge.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useExperiences('refuge-1'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useCreateExperience', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should create a new experience', async () => {
    mockedService.createExperience.mockResolvedValue(mockCreateResponse);

    const { result } = renderHook(() => useCreateExperience(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        refuge_id: 'refuge-1',
        comment: 'Great experience!',
      });
    });

    expect(mockedService.createExperience).toHaveBeenCalledWith({
      refuge_id: 'refuge-1',
      comment: 'Great experience!',
    });
  });

  it('should create experience with files', async () => {
    mockedService.createExperience.mockResolvedValue(mockCreateResponse);

    const { result } = renderHook(() => useCreateExperience(), {
      wrapper: createWrapper(queryClient),
    });

    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    await act(async () => {
      await result.current.mutateAsync({
        refuge_id: 'refuge-1',
        comment: 'Great!',
        files: [mockFile],
      });
    });

    expect(mockedService.createExperience).toHaveBeenCalled();
  });

  it('should handle error when creating experience', async () => {
    mockedService.createExperience.mockRejectedValue(new Error('Failed to create'));

    const { result } = renderHook(() => useCreateExperience(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          refuge_id: 'refuge-1',
          comment: 'Test',
        });
      })
    ).rejects.toThrow('Failed to create');
  });
});

describe('useUpdateExperience', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should update an experience', async () => {
    mockedService.updateExperience.mockResolvedValue(mockUpdateResponse);

    const { result } = renderHook(() => useUpdateExperience(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        experienceId: 'exp-1',
        refugeId: 'refuge-1',
        request: { comment: 'Updated comment' },
      });
    });

    expect(mockedService.updateExperience).toHaveBeenCalledWith('exp-1', { comment: 'Updated comment' });
  });

  it('should update experience with files', async () => {
    mockedService.updateExperience.mockResolvedValue(mockUpdateResponse);

    const { result } = renderHook(() => useUpdateExperience(), {
      wrapper: createWrapper(queryClient),
    });

    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    await act(async () => {
      await result.current.mutateAsync({
        experienceId: 'exp-1',
        refugeId: 'refuge-1',
        request: { files: [mockFile] },
      });
    });

    expect(mockedService.updateExperience).toHaveBeenCalled();
  });

  it('should handle error when updating experience', async () => {
    mockedService.updateExperience.mockRejectedValue(new Error('Failed to update'));

    const { result } = renderHook(() => useUpdateExperience(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          experienceId: 'exp-1',
          refugeId: 'refuge-1',
          request: { comment: 'Test' },
        });
      })
    ).rejects.toThrow('Failed to update');
  });
});

describe('useDeleteExperience', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should delete an experience', async () => {
    mockedService.deleteExperience.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteExperience(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        experienceId: 'exp-1',
        refugeId: 'refuge-1',
      });
    });

    expect(mockedService.deleteExperience).toHaveBeenCalledWith('exp-1');
  });

  it('should handle error when deleting experience', async () => {
    mockedService.deleteExperience.mockRejectedValue(new Error('Failed to delete'));

    const { result } = renderHook(() => useDeleteExperience(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          experienceId: 'exp-1',
          refugeId: 'refuge-1',
        });
      })
    ).rejects.toThrow('Failed to delete');
  });
});
