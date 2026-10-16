/**
 * Tests unitaris de MediaUploadService
 *
 * Cobreix:
 * - Llista blanca (MIME + extensió): només fotos i vídeos
 * - Compressió d'imatges (2048 px, WebP) i de vídeos (≤ 60 s, ≤ 50 MB)
 * - upload-intents (cos del contracte, errors 403 amb codi)
 * - confirm (uploaded/failed) i flux complet amb PUT directe
 */

import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import {
  MediaUploadService,
  MediaUploadError,
  getExtension,
  IMAGE_MAX_LONG_EDGE,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
} from '../../../services/MediaUploadService';
import { apiPost } from '../../../services/apiClient';

jest.mock('../../../services/apiClient', () => ({
  apiPost: jest.fn(),
}));

const compressor = require('react-native-compressor');
const mockedApiPost = apiPost as jest.Mock;

const jsonResponse = (status: number, body: any) => ({
  ok: status >= 200 && status < 300,
  status,
  json: jest.fn().mockResolvedValue(body),
});

describe('MediaUploadService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    MediaUploadService.resetSessionRights();
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true, size: 300 * 1024 });
    (ImageManipulator.manipulateAsync as jest.Mock).mockImplementation((uri: string) =>
      Promise.resolve({ uri: `${uri}.webp`, width: 2048, height: 1536 })
    );
    compressor.Video.compress.mockImplementation((uri: string) => Promise.resolve(`${uri}.compressed.mp4`));
  });

  describe('getExtension', () => {
    it('extreu l\'extensió ignorant la query i majúscules', () => {
      expect(getExtension('file:///a/b/IMG_0001.JPG')).toBe('jpg');
      expect(getExtension('https://x/y/video.MOV?sig=1')).toBe('mov');
      expect(getExtension('file:///a/b/sense-extensio')).toBeNull();
      expect(getExtension(null)).toBeNull();
    });
  });

  describe('validateAsset (llista blanca)', () => {
    it.each([
      [{ uri: 'file:///a.jpg', mimeType: 'image/jpeg' }, 'image', 'image/jpeg'],
      [{ uri: 'file:///a.jpeg', mimeType: 'image/jpg' }, 'image', 'image/jpeg'],
      [{ uri: 'file:///a.png', mimeType: 'image/png' }, 'image', 'image/png'],
      [{ uri: 'file:///a.webp', mimeType: 'image/webp' }, 'image', 'image/webp'],
      [{ uri: 'file:///a.heic', mimeType: 'image/heic' }, 'image', 'image/heic'],
      [{ uri: 'file:///a.heif' }, 'image', 'image/heif'],
      [{ uri: 'file:///a.mp4', mimeType: 'video/mp4' }, 'video', 'video/mp4'],
      [{ uri: 'file:///a.mov', mimeType: 'video/quicktime' }, 'video', 'video/quicktime'],
      [{ uri: 'file:///a.webm' }, 'video', 'video/webm'],
      [{ uri: 'content://media/123', mimeType: 'image/jpeg', fileName: 'foto.jpg' }, 'image', 'image/jpeg'],
    ])('accepta %o', (asset, mediaType, contentType) => {
      expect(MediaUploadService.validateAsset(asset as any)).toEqual({ ok: true, mediaType, contentType });
    });

    it.each([
      [{ uri: 'file:///a.gif', mimeType: 'image/gif' }],
      [{ uri: 'file:///a.pdf', mimeType: 'application/pdf' }],
      [{ uri: 'file:///a.avi', mimeType: 'video/x-msvideo' }],
      [{ uri: 'file:///a.svg', mimeType: 'image/svg+xml' }],
      [{ uri: 'file:///a.exe' }],
      [{ uri: 'file:///sense-extensio' }],
      [{ uri: 'file:///a.jpg', mimeType: 'application/octet-stream' }],
      // MIME vàlid però extensió fora de la llista
      [{ uri: 'file:///a.gif', mimeType: 'image/jpeg' }],
      // Categories contradictòries
      [{ uri: 'file:///a.mp4', mimeType: 'image/jpeg' }],
      [{ uri: 'file:///a.jpg', mimeType: 'video/mp4' }],
    ])('rebutja %o', (asset) => {
      expect(MediaUploadService.validateAsset(asset as any)).toEqual({ ok: false, reason: 'invalid_type' });
    });

    it('avatar (imagesOnly) rebutja vídeos', () => {
      expect(
        MediaUploadService.validateAsset({ uri: 'file:///a.mp4', mimeType: 'video/mp4' }, { imagesOnly: true })
      ).toEqual({ ok: false, reason: 'invalid_type' });
    });
  });

  describe('compressió', () => {
    it('redimensiona les imatges grans a 2048 px de costat llarg i les recodifica a WebP', async () => {
      const file = await MediaUploadService.prepareAsset({
        uri: 'file:///big.jpg',
        mimeType: 'image/jpeg',
        width: 4000,
        height: 3000,
      });

      expect(ImageManipulator.manipulateAsync).toHaveBeenCalledWith(
        'file:///big.jpg',
        [{ resize: { width: IMAGE_MAX_LONG_EDGE } }],
        { compress: 0.8, format: 'webp' }
      );
      expect(file).toEqual(
        expect.objectContaining({ uri: 'file:///big.jpg.webp', contentType: 'image/webp', mediaType: 'image', size: 300 * 1024 })
      );
    });

    it('redimensiona per alçada si la foto és vertical', async () => {
      await MediaUploadService.prepareAsset({ uri: 'file:///v.jpg', mimeType: 'image/jpeg', width: 3000, height: 4000 });
      expect((ImageManipulator.manipulateAsync as jest.Mock).mock.calls[0][1]).toEqual([
        { resize: { height: IMAGE_MAX_LONG_EDGE } },
      ]);
    });

    it('no redimensiona les imatges petites però sí les recodifica', async () => {
      await MediaUploadService.prepareAsset({ uri: 'file:///s.png', mimeType: 'image/png', width: 800, height: 600 });
      expect((ImageManipulator.manipulateAsync as jest.Mock).mock.calls[0][1]).toEqual([]);
    });

    it('rebutja una imatge > 15 MB després de comprimir', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true, size: MAX_IMAGE_BYTES + 1 });
      await expect(
        MediaUploadService.prepareAsset({ uri: 'file:///x.jpg', mimeType: 'image/jpeg', width: 100, height: 100 })
      ).rejects.toMatchObject({ code: 'too_large' });
    });

    it('comprimeix els vídeos a MP4', async () => {
      const file = await MediaUploadService.prepareAsset({
        uri: 'file:///clip.mov',
        mimeType: 'video/quicktime',
        duration: 30000,
      });
      expect(compressor.Video.compress).toHaveBeenCalledWith('file:///clip.mov', { compressionMethod: 'auto' });
      expect(file).toEqual(
        expect.objectContaining({ uri: 'file:///clip.mov.compressed.mp4', contentType: 'video/mp4', mediaType: 'video' })
      );
    });

    it('rebutja vídeos de més de 60 s sense comprimir-los', async () => {
      await expect(
        MediaUploadService.prepareAsset({ uri: 'file:///long.mp4', mimeType: 'video/mp4', duration: 61000 })
      ).rejects.toMatchObject({ code: 'too_long' });
      expect(compressor.Video.compress).not.toHaveBeenCalled();
    });

    it('usa la durada de les metadades si el picker no la dona', async () => {
      compressor.getVideoMetaData.mockResolvedValueOnce({ duration: 90 });
      await expect(
        MediaUploadService.prepareAsset({ uri: 'file:///long.mp4', mimeType: 'video/mp4' })
      ).rejects.toMatchObject({ code: 'too_long' });
    });

    it('rebutja vídeos > 50 MB després de comprimir', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true, size: MAX_VIDEO_BYTES + 1 });
      await expect(
        MediaUploadService.prepareAsset({ uri: 'file:///big.mp4', mimeType: 'video/mp4', duration: 10000 })
      ).rejects.toMatchObject({ code: 'too_large' });
    });

    it('rebutja tipus no permesos sense comprimir ni enviar res', async () => {
      await expect(
        MediaUploadService.prepareAsset({ uri: 'file:///doc.pdf', mimeType: 'application/pdf' })
      ).rejects.toBeInstanceOf(MediaUploadError);
      expect(ImageManipulator.manipulateAsync).not.toHaveBeenCalled();
      expect(mockedApiPost).not.toHaveBeenCalled();
    });
  });

  describe('createUploadIntents', () => {
    const body = {
      target: 'refuge' as const,
      refuge_id: 'r1',
      rights_confirmed: true as const,
      files: [{ content_type: 'image/webp', size: 100 }],
    };

    it('fa POST a /api/media/upload-intents/ amb el cos del contracte', async () => {
      const uploads = [{ upload_id: 'u1', put_url: 'https://r2/put', headers: { 'Content-Type': 'image/webp' }, expires_in: 600 }];
      mockedApiPost.mockResolvedValue(jsonResponse(201, { uploads }));

      const result = await MediaUploadService.createUploadIntents(body);

      expect(mockedApiPost).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/media/upload-intents/',
        body
      );
      expect(result).toEqual(uploads);
    });

    it.each([
      [{ error: 'age_not_confirmed' }, 'age_not_confirmed'],
      [{ code: 'user_blocked', message: 'Compte bloquejat' }, 'user_blocked'],
      [{ detail: 'not_owner' }, 'not_owner'],
    ])('tradueix el 403 %o al codi %s', async (respBody, code) => {
      mockedApiPost.mockResolvedValue(jsonResponse(403, respBody));
      await expect(MediaUploadService.createUploadIntents(body)).rejects.toMatchObject({ code, status: 403 });
    });

    it('404 → not_found i 400 → validation', async () => {
      mockedApiPost.mockResolvedValueOnce(jsonResponse(404, { error: 'Refugi no trobat' }));
      await expect(MediaUploadService.createUploadIntents(body)).rejects.toMatchObject({ code: 'not_found' });
      mockedApiPost.mockResolvedValueOnce(jsonResponse(400, { error: 'invalid' }));
      await expect(MediaUploadService.createUploadIntents(body)).rejects.toMatchObject({ code: 'validation' });
    });

    it('rebutja més de 10 fitxers sense cridar el backend', async () => {
      const many = { ...body, files: Array.from({ length: 11 }, () => ({ content_type: 'image/webp', size: 1 })) };
      await expect(MediaUploadService.createUploadIntents(many)).rejects.toMatchObject({ code: 'too_many_files' });
      expect(mockedApiPost).not.toHaveBeenCalled();
    });
  });

  describe('confirmUploads', () => {
    it('retorna uploaded i failed', async () => {
      mockedApiPost.mockResolvedValue(
        jsonResponse(200, { uploaded: [{ key: 'k' }], failed: [{ upload_id: 'u2', reason: 'invalid_type' }] })
      );
      const result = await MediaUploadService.confirmUploads(['u1', 'u2']);
      expect(mockedApiPost).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/media/upload-intents/confirm/',
        { upload_ids: ['u1', 'u2'] }
      );
      expect(result.failed).toEqual([{ upload_id: 'u2', reason: 'invalid_type' }]);
    });
  });

  describe('uploadFiles (flux complet)', () => {
    const files = [
      { uri: 'file:///a.webp', contentType: 'image/webp', size: 100, mediaType: 'image' as const },
      { uri: 'file:///b.mp4', contentType: 'video/mp4', size: 300, mediaType: 'video' as const },
    ];

    it('intents → PUT directe (sense Bearer) → confirm, i mapeja els MediaItem', async () => {
      mockedApiPost
        .mockResolvedValueOnce(
          jsonResponse(201, {
            uploads: [
              { upload_id: 'u1', put_url: 'https://r2/u1', headers: { 'Content-Type': 'image/webp' }, expires_in: 600 },
              { upload_id: 'u2', put_url: 'https://r2/u2', headers: { 'Content-Type': 'video/mp4' }, expires_in: 600 },
            ],
          })
        )
        .mockResolvedValueOnce(
          jsonResponse(200, {
            uploaded: [
              {
                key: 'refugis-lliures/r1/uuid.webp',
                url: 'https://r2/get',
                thumb_url: 'https://r2/thumb',
                media_type: 'image',
                width: 2048,
                height: 1536,
                blurhash: 'LKO2',
                creator_uid: 'me',
                uploaded_at: '2026-01-01T00:00:00Z',
                taken_at: null,
                experience_id: null,
              },
            ],
            failed: [{ upload_id: 'u2', reason: 'moderation_blocked' }],
          })
        );
      const onProgress = jest.fn();

      const result = await MediaUploadService.uploadFiles({ target: 'refuge', refugeId: 'r1', files, onProgress });

      // Cos de l'intent
      expect(mockedApiPost.mock.calls[0][1]).toEqual({
        target: 'refuge',
        refuge_id: 'r1',
        rights_confirmed: true,
        files: [
          { content_type: 'image/webp', size: 100 },
          { content_type: 'video/mp4', size: 300 },
        ],
      });
      // PUT amb les capçaleres retornades (cap Authorization)
      const uploadTaskCalls = (FileSystem.createUploadTask as jest.Mock).mock.calls;
      expect(uploadTaskCalls).toHaveLength(2);
      expect(uploadTaskCalls[0][0]).toBe('https://r2/u1');
      expect(uploadTaskCalls[0][1]).toBe('file:///a.webp');
      expect(uploadTaskCalls[0][2]).toEqual(
        expect.objectContaining({ httpMethod: 'PUT', headers: { 'Content-Type': 'image/webp' } })
      );
      expect(uploadTaskCalls[0][2].headers.Authorization).toBeUndefined();
      // Confirm amb tots dos ids
      expect(mockedApiPost.mock.calls[1][1]).toEqual({ upload_ids: ['u1', 'u2'] });
      // Resultat
      expect(result.uploaded[0]).toEqual(
        expect.objectContaining({ key: 'refugis-lliures/r1/uuid.webp', thumb_url: 'https://r2/thumb', blurhash: 'LKO2' })
      );
      expect(result.failed).toEqual([{ upload_id: 'u2', reason: 'moderation_blocked' }]);
      // Progrés fins a 1
      expect(onProgress).toHaveBeenLastCalledWith(1);
    });

    it('un PUT fallit no atura la resta i es retorna com a put_failed', async () => {
      (FileSystem.createUploadTask as jest.Mock)
        .mockImplementationOnce(() => ({ uploadAsync: jest.fn().mockResolvedValue({ status: 403 }) }))
        .mockImplementationOnce(() => ({ uploadAsync: jest.fn().mockResolvedValue({ status: 200 }) }));
      mockedApiPost
        .mockResolvedValueOnce(
          jsonResponse(201, {
            uploads: [
              { upload_id: 'u1', put_url: 'https://r2/u1', headers: {}, expires_in: 600 },
              { upload_id: 'u2', put_url: 'https://r2/u2', headers: {}, expires_in: 600 },
            ],
          })
        )
        .mockResolvedValueOnce(jsonResponse(200, { uploaded: [], failed: [] }));

      const result = await MediaUploadService.uploadFiles({ target: 'refuge', refugeId: 'r1', files });

      expect(mockedApiPost.mock.calls[1][1]).toEqual({ upload_ids: ['u2'] });
      expect(result.failed).toEqual([{ upload_id: 'u1', reason: 'put_failed' }]);
    });

    it('avatar: no envia refuge_id i usa target=avatar', async () => {
      mockedApiPost
        .mockResolvedValueOnce(jsonResponse(201, { uploads: [{ upload_id: 'u1', put_url: 'https://r2/u1', headers: {}, expires_in: 600 }] }))
        .mockResolvedValueOnce(jsonResponse(200, { uploaded: [], failed: [] }));
      await MediaUploadService.uploadFiles({ target: 'avatar', refugeId: 'r1', files: [files[0]] });
      expect(mockedApiPost.mock.calls[0][1]).toEqual({
        target: 'avatar',
        rights_confirmed: true,
        files: [{ content_type: 'image/webp', size: 100 }],
      });
    });

    it('experiència: envia refuge_id i experience_id', async () => {
      mockedApiPost
        .mockResolvedValueOnce(jsonResponse(201, { uploads: [{ upload_id: 'u1', put_url: 'https://r2/u1', headers: {}, expires_in: 600 }] }))
        .mockResolvedValueOnce(jsonResponse(200, { uploaded: [], failed: [] }));
      await MediaUploadService.uploadFiles({ target: 'experience', refugeId: 'r1', experienceId: 'e1', files: [files[0]] });
      expect(mockedApiPost.mock.calls[0][1]).toEqual(
        expect.objectContaining({ target: 'experience', refuge_id: 'r1', experience_id: 'e1' })
      );
    });
  });

  describe('declaració de drets per sessió', () => {
    it('es recorda fins que es reinicia (logout)', () => {
      expect(MediaUploadService.hasConfirmedRightsThisSession()).toBe(false);
      MediaUploadService.confirmRightsForSession();
      expect(MediaUploadService.hasConfirmedRightsThisSession()).toBe(true);
      MediaUploadService.resetSessionRights();
      expect(MediaUploadService.hasConfirmedRightsThisSession()).toBe(false);
    });
  });
});
