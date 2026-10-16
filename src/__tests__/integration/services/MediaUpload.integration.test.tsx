/**
 * Test d'integració (MSW) del flux de pujada de mitjans:
 *   upload-intents → PUT directe a R2 (URL prefirmada, sense Bearer) → confirm
 *
 * Es fa servir l'apiClient real (Bearer + fetchWithLog) contra handlers MSW que
 * implementen el contracte d'API compartit amb el backend.
 */

// El PUT natiu (FileSystem.createUploadTask) es redirigeix a fetch perquè MSW l'intercepti
jest.mock('expo-file-system/legacy', () => ({
  FileSystemUploadType: { BINARY_CONTENT: 0, MULTIPART: 1 },
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: true, size: 2048 })),
  createUploadTask: jest.fn((url: string, fileUri: string, options: any, callback?: any) => ({
    uploadAsync: async () => {
      const response = await fetch(url, {
        method: options.httpMethod,
        headers: options.headers,
        body: `bytes-of-${fileUri}`,
      });
      callback?.({ totalBytesSent: 2048, totalBytesExpectedToSend: 2048 });
      return { status: response.status, body: '', headers: {} };
    },
  })),
}));

// Token de Firebase fix per a l'apiClient
jest.mock('../../../services/AuthService', () => ({
  AuthService: {
    getAuthToken: jest.fn(() => Promise.resolve('mock-token-123')),
  },
}));

import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import * as ImagePicker from 'expo-image-picker';
import { server, setupMSW } from '../setup/mswServer';
import { MOCK_R2_PUT_BASE } from '../setup/mswHandlers';
import { MediaUploadService } from '../../../services/MediaUploadService';
import { useMediaUpload } from '../../../hooks/useMediaUpload';

setupMSW();

const API = 'https://refugislliures-backend.onrender.com/api';

const files = [
  { uri: 'file:///cache/a.webp', contentType: 'image/webp', size: 2048, mediaType: 'image' as const },
  { uri: 'file:///cache/b.mp4', contentType: 'video/mp4', size: 4096, mediaType: 'video' as const },
];

describe('Integració: pujada de mitjans (intent → PUT → confirm)', () => {
  beforeEach(() => {
    MediaUploadService.resetSessionRights();
  });

  it('completa el flux i retorna els MediaItem confirmats', async () => {
    const seen: { intentBody?: any; puts: Array<{ url: string; contentType: string | null; auth: string | null }>; confirmBody?: any } = {
      puts: [],
    };
    server.events.on('request:start', ({ request }) => {
      if (request.method === 'PUT') {
        seen.puts.push({
          url: request.url,
          contentType: request.headers.get('Content-Type'),
          auth: request.headers.get('Authorization'),
        });
      }
    });
    server.use(
      http.post(`${API}/media/upload-intents/`, async ({ request }) => {
        seen.intentBody = await request.json();
        expect(request.headers.get('Authorization')).toBe('Bearer mock-token-123');
        return HttpResponse.json(
          {
            uploads: (seen.intentBody.files as any[]).map((f, i) => ({
              upload_id: `up-${i}`,
              put_url: `${MOCK_R2_PUT_BASE}/quarantine/up-${i}?X-Amz-Signature=s`,
              headers: { 'Content-Type': f.content_type },
              expires_in: 600,
            })),
          },
          { status: 201 }
        );
      }),
      http.post(`${API}/media/upload-intents/confirm/`, async ({ request }) => {
        seen.confirmBody = await request.json();
        return HttpResponse.json({
          uploaded: [
            {
              key: 'refugis-lliures/1/up-0.webp',
              url: 'https://r2/up-0.webp',
              thumb_url: 'https://r2/up-0_thumb.webp',
              media_type: 'image',
              width: 2048,
              height: 1536,
              blurhash: 'LKO2',
              creator_uid: 'test-uid-123',
              uploaded_at: '2026-10-16T10:00:00Z',
              taken_at: '2026-08-01T09:00:00Z',
              experience_id: null,
            },
          ],
          failed: [{ upload_id: 'up-1', reason: 'invalid_type' }],
        });
      })
    );

    const result = await MediaUploadService.uploadFiles({ target: 'refuge', refugeId: '1', files });
    server.events.removeAllListeners();

    expect(seen.intentBody).toEqual({
      target: 'refuge',
      refuge_id: '1',
      rights_confirmed: true,
      files: [
        { content_type: 'image/webp', size: 2048 },
        { content_type: 'video/mp4', size: 4096 },
      ],
    });
    expect(seen.puts).toHaveLength(2);
    expect(seen.puts[0].url).toContain(`${MOCK_R2_PUT_BASE}/quarantine/up-0`);
    expect(seen.puts[0].contentType).toBe('image/webp');
    expect(seen.puts[1].contentType).toBe('video/mp4');
    // La URL prefirmada no ha de portar el token de Firebase
    expect(seen.puts.every((p) => p.auth === null)).toBe(true);
    expect(seen.confirmBody).toEqual({ upload_ids: ['up-0', 'up-1'] });

    expect(result.uploaded).toHaveLength(1);
    expect(result.uploaded[0]).toEqual(
      expect.objectContaining({
        key: 'refugis-lliures/1/up-0.webp',
        thumb_url: 'https://r2/up-0_thumb.webp',
        media_type: 'image',
        blurhash: 'LKO2',
        taken_at: '2026-08-01T09:00:00Z',
      })
    );
    expect(result.failed).toEqual([{ upload_id: 'up-1', reason: 'invalid_type' }]);
  });

  it('un PUT rebutjat per R2 no s\'inclou al confirm', async () => {
    let confirmBody: any;
    server.use(
      http.put(`${MOCK_R2_PUT_BASE}/quarantine/upload-2`, () => new HttpResponse(null, { status: 403 })),
      http.post(`${API}/media/upload-intents/confirm/`, async ({ request }) => {
        confirmBody = await request.json();
        return HttpResponse.json({ uploaded: [], failed: [] });
      })
    );

    const result = await MediaUploadService.uploadFiles({ target: 'refuge', refugeId: '1', files });

    expect(confirmBody).toEqual({ upload_ids: ['upload-1'] });
    expect(result.failed).toEqual([{ upload_id: 'upload-2', reason: 'put_failed' }]);
  });

  it.each(['age_not_confirmed', 'user_blocked', 'not_owner'])(
    'propaga el 403 %s de l\'intent amb el seu codi',
    async (code) => {
      server.use(http.post(`${API}/media/upload-intents/`, () => HttpResponse.json({ error: code }, { status: 403 })));
      await expect(
        MediaUploadService.uploadFiles({ target: 'experience', refugeId: '1', experienceId: 'e1', files })
      ).rejects.toMatchObject({ code, status: 403 });
    }
  );

  it('hook: selecció → compressió → intents → PUT → confirm → invalidacions', async () => {
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [
        { uri: 'file:///DCIM/IMG_0001.HEIC', mimeType: 'image/heic', width: 4032, height: 3024 },
        { uri: 'file:///Download/virus.exe', mimeType: 'application/octet-stream' },
      ],
    });
    let intentBody: any;
    server.use(
      http.post(`${API}/media/upload-intents/`, async ({ request }) => {
        intentBody = await request.json();
        return HttpResponse.json(
          {
            uploads: [
              {
                upload_id: 'upload-1',
                put_url: `${MOCK_R2_PUT_BASE}/quarantine/upload-1?sig=1`,
                headers: { 'Content-Type': 'image/webp' },
                expires_in: 600,
              },
            ],
          },
          { status: 201 }
        );
      })
    );

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const showAlert = jest.fn();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useMediaUpload({ showAlert }), { wrapper });

    MediaUploadService.confirmRightsForSession();
    let uploadResult: any;
    await act(async () => {
      uploadResult = await result.current.pickAndUpload({ target: 'refuge', refugeId: '1', uid: 'test-uid-123' });
    });

    // Només s'envia la foto (HEIC → WebP); l'executable es descarta abans de l'intent
    expect(intentBody.files).toEqual([{ content_type: 'image/webp', size: 2048 }]);
    expect(uploadResult.uploaded).toHaveLength(1);
    expect(showAlert).toHaveBeenCalledWith('media.errors.rejectedTitle', expect.any(String));
    const keys = invalidateSpy.mock.calls.map((c: any) => c[0].queryKey);
    expect(keys).toEqual(
      expect.arrayContaining([
        ['refuges', 'detail', '1'],
        ['refugeMedia', '1'],
        ['experiences', 'refuge', '1'],
        ['refuges', 'list'],
        ['users', 'detail', 'test-uid-123'],
      ])
    );
    queryClient.clear();
  });
});
