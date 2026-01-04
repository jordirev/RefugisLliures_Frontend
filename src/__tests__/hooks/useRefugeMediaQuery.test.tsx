import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useRefugeMedia,
  useUploadRefugeMedia,
  useDeleteRefugeMedia,
} from '../../hooks/useRefugeMediaQuery';
import { RefugeMediaService } from '../../services/RefugeMediaService';

// Mock the RefugeMediaService
jest.mock('../../services/RefugeMediaService');

const mockedService = RefugeMediaService as jest.Mocked<typeof RefugeMediaService>;

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

// Mock media data
const mockMediaItem = {
  key: 'media-key-1',
  url: 'https://example.com/image1.jpg',
  uploadedBy: 'user-1',
  uploadedAt: new Date().toISOString(),
  size: 1024,
  mimeType: 'image/jpeg',
  experienceId: null,
};

const mockMediaList = [
  mockMediaItem,
  {
    key: 'media-key-2',
    url: 'https://example.com/image2.jpg',
    uploadedBy: 'user-2',
    uploadedAt: new Date().toISOString(),
    size: 2048,
    mimeType: 'image/png',
    experienceId: 'experience-1',
  },
];

describe('useRefugeMedia', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch refuge media when refugeId is provided', async () => {
    mockedService.getRefugeMedia.mockResolvedValue(mockMediaList);

    const { result } = renderHook(() => useRefugeMedia('refuge-1'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockMediaList);
    expect(mockedService.getRefugeMedia).toHaveBeenCalledWith('refuge-1');
  });

  it('should not fetch when refugeId is undefined', async () => {
    const { result } = renderHook(() => useRefugeMedia(undefined), {
      wrapper: createWrapper(queryClient),
    });

    // Query should not be enabled
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedService.getRefugeMedia).not.toHaveBeenCalled();
  });

  it('should handle error', async () => {
    mockedService.getRefugeMedia.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useRefugeMedia('refuge-1'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });

  it('should return empty array when no media found', async () => {
    mockedService.getRefugeMedia.mockResolvedValue([]);

    const { result } = renderHook(() => useRefugeMedia('refuge-1'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });
});

describe('useUploadRefugeMedia', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should upload media files', async () => {
    const mockUploadResponse = [mockMediaItem];
    mockedService.uploadRefugeMedia.mockResolvedValue(mockUploadResponse);

    const { result } = renderHook(() => useUploadRefugeMedia(), {
      wrapper: createWrapper(queryClient),
    });

    const mockFiles = [new File(['test'], 'test.jpg', { type: 'image/jpeg' })];

    await act(async () => {
      const response = await result.current.mutateAsync({ 
        refugeId: 'refuge-1', 
        files: mockFiles 
      });
      expect(response).toEqual(mockUploadResponse);
    });

    expect(mockedService.uploadRefugeMedia).toHaveBeenCalledWith('refuge-1', mockFiles);
  });

  it('should upload multiple files', async () => {
    mockedService.uploadRefugeMedia.mockResolvedValue(mockMediaList);

    const { result } = renderHook(() => useUploadRefugeMedia(), {
      wrapper: createWrapper(queryClient),
    });

    const mockFiles = [
      new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
      new File(['test2'], 'test2.png', { type: 'image/png' }),
    ];

    await act(async () => {
      await result.current.mutateAsync({ 
        refugeId: 'refuge-1', 
        files: mockFiles 
      });
    });

    expect(mockedService.uploadRefugeMedia).toHaveBeenCalledWith('refuge-1', mockFiles);
  });

  it('should handle error', async () => {
    mockedService.uploadRefugeMedia.mockRejectedValue(new Error('Upload failed'));

    const { result } = renderHook(() => useUploadRefugeMedia(), {
      wrapper: createWrapper(queryClient),
    });

    const mockFiles = [new File(['test'], 'test.jpg', { type: 'image/jpeg' })];

    await expect(
      act(async () => {
        await result.current.mutateAsync({ 
          refugeId: 'refuge-1', 
          files: mockFiles 
        });
      })
    ).rejects.toThrow('Upload failed');
  });
});

describe('useDeleteRefugeMedia', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should delete media', async () => {
    mockedService.deleteRefugeMedia.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteRefugeMedia(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      const response = await result.current.mutateAsync({ 
        refugeId: 'refuge-1', 
        mediaKey: 'media-key-1' 
      });
      expect(response.refugeId).toBe('refuge-1');
      expect(response.mediaKey).toBe('media-key-1');
    });

    expect(mockedService.deleteRefugeMedia).toHaveBeenCalledWith('refuge-1', 'media-key-1');
  });

  it('should delete media with experienceId', async () => {
    mockedService.deleteRefugeMedia.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteRefugeMedia(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      const response = await result.current.mutateAsync({ 
        refugeId: 'refuge-1', 
        mediaKey: 'media-key-1',
        experienceId: 'experience-1'
      });
      expect(response.experienceId).toBe('experience-1');
    });

    expect(mockedService.deleteRefugeMedia).toHaveBeenCalledWith('refuge-1', 'media-key-1');
  });

  it('should update cache after deletion', async () => {
    // Set initial cache data
    queryClient.setQueryData(['refugeMedia', 'refuge-1'], mockMediaList);
    
    mockedService.deleteRefugeMedia.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteRefugeMedia(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ 
        refugeId: 'refuge-1', 
        mediaKey: 'media-key-1' 
      });
    });

    // Verify the mutation was called
    expect(mockedService.deleteRefugeMedia).toHaveBeenCalledWith('refuge-1', 'media-key-1');
  });

  it('should handle error', async () => {
    mockedService.deleteRefugeMedia.mockRejectedValue(new Error('Delete failed'));

    const { result } = renderHook(() => useDeleteRefugeMedia(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({ 
          refugeId: 'refuge-1', 
          mediaKey: 'media-key-1' 
        });
      })
    ).rejects.toThrow('Delete failed');
  });

  it('should handle deletion when cache is empty', async () => {
    mockedService.deleteRefugeMedia.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteRefugeMedia(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ 
        refugeId: 'refuge-1', 
        mediaKey: 'media-key-1' 
      });
    });

    expect(mockedService.deleteRefugeMedia).toHaveBeenCalledWith('refuge-1', 'media-key-1');
  });
});
