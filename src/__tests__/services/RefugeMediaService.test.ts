/**
 * Tests for RefugeMediaService
 */

import { RefugeMediaService } from '../../services/RefugeMediaService';
import * as apiClient from '../../services/apiClient';

// Mock apiClient
jest.mock('../../services/apiClient');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Mock media data (forma MediaItem del contracte)
const mockMediaItem = {
  key: 'refugis-lliures/1/0d3c.webp',
  url: 'https://example.com/photo1.webp',
  thumb_url: 'https://example.com/photo1_thumb.webp',
  media_type: 'image',
  width: 2048,
  height: 1536,
  blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
  creator_uid: 'user-1',
  uploaded_at: '2024-01-15T10:00:00Z',
  taken_at: null,
  experience_id: null,
};

const mockMediaList = [
  mockMediaItem,
  {
    // Item antic sense miniatura ni blurhash (fallback)
    key: 'refuges/1/photo2.png',
    url: 'https://example.com/photo2.png',
    creator_uid: 'user-2',
    uploaded_at: '2024-01-16T10:00:00Z',
    experience_id: 'exp-1',
  },
];

describe('RefugeMediaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRefugeMedia', () => {
    it('should get refuge media successfully', async () => {
      mockedApiClient.apiGet.mockResolvedValue({
        ok: true,
        json: async () => ({ media: mockMediaList }),
      } as Response);

      const result = await RefugeMediaService.getRefugeMedia('refuge-1');

      expect(mockedApiClient.apiGet).toHaveBeenCalledWith(
        expect.stringContaining('/refuges/refuge-1/media/')
      );
      expect(result).toEqual(mockMediaList);
      // L'item antic no rep camps nous inventats
      expect(result[1].thumb_url).toBeUndefined();
    });

    it('should return empty array for invalid response', async () => {
      mockedApiClient.apiGet.mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'invalid' }),
      } as Response);

      const result = await RefugeMediaService.getRefugeMedia('refuge-1');

      expect(result).toEqual([]);
    });

    it('should return empty array for null media', async () => {
      mockedApiClient.apiGet.mockResolvedValue({
        ok: true,
        json: async () => ({ media: null }),
      } as Response);

      const result = await RefugeMediaService.getRefugeMedia('refuge-1');

      expect(result).toEqual([]);
    });

    it('should handle not found error (404)', async () => {
      mockedApiClient.apiGet.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({}),
      } as Response);

      await expect(RefugeMediaService.getRefugeMedia('invalid-id'))
        .rejects.toThrow('El refugi especificat no existeix');
    });

    it('should handle unauthorized error (401)', async () => {
      mockedApiClient.apiGet.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({}),
      } as Response);

      await expect(RefugeMediaService.getRefugeMedia('refuge-1'))
        .rejects.toThrow('No estàs autenticat');
    });

    it('should handle server error (500)', async () => {
      mockedApiClient.apiGet.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
      } as Response);

      await expect(RefugeMediaService.getRefugeMedia('refuge-1'))
        .rejects.toThrow('Error del servidor');
    });

    it('should handle json parse error', async () => {
      mockedApiClient.apiGet.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => { throw new Error('Parse error'); },
      } as Response);

      await expect(RefugeMediaService.getRefugeMedia('refuge-1'))
        .rejects.toThrow('Error 400: Bad Request');
    });
  });

  describe('deleteRefugeMedia', () => {
    it('should delete media successfully', async () => {
      mockedApiClient.apiDelete.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, message: 'Deleted', key: 'photo1.jpg' }),
      } as Response);

      const result = await RefugeMediaService.deleteRefugeMedia('refuge-1', 'photo1.jpg');

      expect(mockedApiClient.apiDelete).toHaveBeenCalledWith(
        expect.stringContaining('/refuges/refuge-1/media/')
      );
      expect(result).toBe(true);
    });

    it('should throw error when no mediaKey provided', async () => {
      await expect(RefugeMediaService.deleteRefugeMedia('refuge-1', ''))
        .rejects.toThrow('No s\'ha proporcionat la key');
    });

    it('should encode special characters in mediaKey', async () => {
      mockedApiClient.apiDelete.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      await RefugeMediaService.deleteRefugeMedia('refuge-1', 'path/to/photo with spaces.jpg');

      expect(mockedApiClient.apiDelete).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent('path/to/photo with spaces.jpg'))
      );
    });

    it('should handle unauthorized error (401)', async () => {
      mockedApiClient.apiDelete.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({}),
      } as Response);

      await expect(RefugeMediaService.deleteRefugeMedia('refuge-1', 'photo1.jpg'))
        .rejects.toThrow('No estàs autenticat');
    });

    it('should handle forbidden error (403)', async () => {
      mockedApiClient.apiDelete.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({}),
      } as Response);

      await expect(RefugeMediaService.deleteRefugeMedia('refuge-1', 'photo1.jpg'))
        .rejects.toThrow('No tens permisos');
    });

    it('should handle not found error (404)', async () => {
      mockedApiClient.apiDelete.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({}),
      } as Response);

      await expect(RefugeMediaService.deleteRefugeMedia('refuge-1', 'invalid.jpg'))
        .rejects.toThrow('El mitjà especificat no existeix');
    });

    it('should handle server error (500)', async () => {
      mockedApiClient.apiDelete.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
      } as Response);

      await expect(RefugeMediaService.deleteRefugeMedia('refuge-1', 'photo1.jpg'))
        .rejects.toThrow('Error del servidor');
    });
  });
});
