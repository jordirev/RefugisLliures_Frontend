/**
 * Servei de pujada de mitjans (fotos i vídeos) amb URL PUT prefirmada.
 *
 * Flux (contracte d'API compartit, docs/integrations/backend-api.md):
 *   1. Validació local per llista blanca (MIME + extensió): només imatges i vídeos.
 *   2. Compressió al client: imatges → WebP de 2048 px de costat llarg (expo-image-manipulator);
 *      vídeos → H.264 tipus WhatsApp (react-native-compressor), màx. 60 s i 50 MB.
 *   3. POST /api/media/upload-intents/ → una URL PUT prefirmada per fitxer.
 *   4. PUT directe a R2 (sense Bearer) amb les capçaleres retornades.
 *   5. POST /api/media/upload-intents/confirm/ → {uploaded: MediaItem[], failed}.
 *
 * El backend torna a validar (magic bytes) i recodifica tot: la compressió del client
 * només estalvia dades i temps; la neteja de metadades és autoritativa al servidor.
 */

import { Platform } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { File } from 'expo-file-system';
import { createUploadTask, FileSystemUploadType } from 'expo-file-system/legacy';
import { apiPost } from './apiClient';
import { ApiError, extractApiErrorCode, readJsonSafe } from './apiErrors';
import { ImageMetadataDTO } from './dto/RefugiDTO';
import { mapImageMetadataFromDTO } from './mappers/RefugiMapper';
import { ImageMetadata, MediaType } from '../models';
import * as mediaSession from './mediaSession';

const API_BASE_URL = 'https://refugislliures-backend.onrender.com/api';

/* ------------------------------------------------------------------ */
/* Constants del contracte                                             */
/* ------------------------------------------------------------------ */

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const;

export const ALLOWED_VIDEO_MIME_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'] as const;

export const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'] as const;
export const ALLOWED_VIDEO_EXTENSIONS = ['mp4', 'mov', 'webm'] as const;

/** Extensió → MIME canònic (també per normalitzar `image/jpg`) */
const EXTENSION_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
};

export const MAX_FILES_PER_INTENT = 10;
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15 MB (límit del backend)
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB després de comprimir
export const MAX_VIDEO_DURATION_SECONDS = 60;
export const IMAGE_MAX_LONG_EDGE = 2048;
export const AVATAR_MAX_LONG_EDGE = 1024;
export const IMAGE_WEBP_QUALITY = 0.8;

/** Codis d'error de l'intent (403) definits al contracte */
export const UPLOAD_INTENT_ERROR_CODES = ['age_not_confirmed', 'user_blocked', 'not_owner'] as const;

/** Codi del 429 de l'intent: massa pujades pendents (quota de 40 intents per usuari) */
export const TOO_MANY_PENDING_UPLOADS_CODE = 'too_many_pending_uploads';

/** Motius de fallada del confirm definits al contracte */
export const CONFIRM_FAILURE_REASONS = [
  'missing_object',
  'too_large',
  'invalid_type',
  'processing_error',
  'moderation_blocked',
] as const;

/* ------------------------------------------------------------------ */
/* Tipus                                                               */
/* ------------------------------------------------------------------ */

export type UploadTarget = 'refuge' | 'experience' | 'avatar';

/** Asset tal com el retorna el picker (subconjunt d'ImagePickerAsset / crop-picker) */
export interface PickedAsset {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  width?: number | null;
  height?: number | null;
  /** Durada del vídeo en mil·lisegons (expo-image-picker) */
  duration?: number | null;
  type?: string | null;
}

/** Fitxer validat i comprimit, llest per pujar */
export interface PreparedMediaFile {
  uri: string;
  contentType: string;
  size: number;
  mediaType: MediaType;
  width?: number;
  height?: number;
}

export type LocalRejectionReason = 'invalid_type' | 'too_large' | 'too_long' | 'compression_failed';

export interface MediaValidationResult {
  ok: boolean;
  mediaType?: MediaType;
  contentType?: string;
  reason?: 'invalid_type';
}

export interface UploadIntentRequestDTO {
  target: UploadTarget;
  refuge_id?: string;
  experience_id?: string;
  rights_confirmed: true;
  files: Array<{ content_type: string; size: number }>;
}

export interface UploadIntentDTO {
  upload_id: string;
  put_url: string;
  headers: Record<string, string>;
  expires_in: number;
}

export interface UploadIntentResponseDTO {
  uploads: UploadIntentDTO[];
}

export interface UploadFailureDTO {
  upload_id: string;
  reason: string;
}

export interface UploadConfirmResponseDTO {
  uploaded: ImageMetadataDTO[];
  failed: UploadFailureDTO[];
}

export interface MediaUploadResult {
  uploaded: ImageMetadata[];
  /** Fallades del backend (confirm) i del client (PUT fallit → `put_failed`) */
  failed: UploadFailureDTO[];
}

export interface UploadFilesParams {
  target: UploadTarget;
  refugeId?: string;
  experienceId?: string;
  files: PreparedMediaFile[];
  /** Progrés global 0..1 */
  onProgress?: (progress: number) => void;
}

/**
 * Error de pujada amb codi estable per a la UI.
 * Codis: invalid_type | too_large | too_long | compression_failed | age_not_confirmed |
 * user_blocked | not_owner | too_many_pending_uploads | not_found | validation | too_many_files |
 * put_failed | unknown
 */
export class MediaUploadError extends ApiError {
  constructor(message: string, code: string, status = 0, details?: unknown) {
    super(message, code, status, details);
    this.name = 'MediaUploadError';
  }
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Extreu l'extensió (minúscules, sense punt) d'un nom o URI; ignora la query */
export function getExtension(nameOrUri?: string | null): string | null {
  if (!nameOrUri) return null;
  const clean = nameOrUri.split('?')[0].split('#')[0];
  const last = clean.split('/').pop() || '';
  const dot = last.lastIndexOf('.');
  if (dot < 0 || dot === last.length - 1) return null;
  return last.slice(dot + 1).toLowerCase();
}

function normalizeMime(mime?: string | null): string | null {
  if (!mime) return null;
  const m = mime.toLowerCase().split(';')[0].trim();
  if (m === 'image/jpg') return 'image/jpeg';
  return m;
}

/**
 * Carrega react-native-compressor en temps d'execució: és un mòdul natiu i no existeix
 * a Expo Go ni a web. Si no hi és, el vídeo es puja sense recomprimir (si compleix límits).
 */
function loadCompressor(): any | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('react-native-compressor');
  } catch {
    return null;
  }
}

async function getFileSize(uri: string, fallback?: number | null): Promise<number> {
  try {
    const localFile = new File(uri);
    if (localFile.exists && typeof localFile.size === 'number') return localFile.size;
  } catch {
    // ignorem: fem servir el valor de reserva
  }
  return typeof fallback === 'number' ? fallback : 0;
}

/* ------------------------------------------------------------------ */
/* Servei                                                              */
/* ------------------------------------------------------------------ */

export class MediaUploadService {
  /* ----------------------------- Sessió ----------------------------- */

  static hasConfirmedRightsThisSession(): boolean {
    return mediaSession.hasConfirmedRightsThisSession();
  }

  static confirmRightsForSession(): void {
    mediaSession.confirmRightsForSession();
  }

  static resetSessionRights(): void {
    mediaSession.resetSessionRights();
  }

  /* --------------------------- Validació ---------------------------- */

  /**
   * Valida un asset contra la llista blanca (MIME + extensió).
   * Es rebutja si el MIME o l'extensió no són a la llista, si no coincideixen de categoria
   * o si no hi ha cap dels dos. Amb `imagesOnly` (avatar) també es rebutgen els vídeos.
   */
  static validateAsset(asset: PickedAsset, options: { imagesOnly?: boolean } = {}): MediaValidationResult {
    const mime = normalizeMime(asset.mimeType);
    const ext = getExtension(asset.fileName) || getExtension(asset.uri);

    const mimeIsImage = !!mime && (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(mime);
    const mimeIsVideo = !!mime && (ALLOWED_VIDEO_MIME_TYPES as readonly string[]).includes(mime);
    const extIsImage = !!ext && (ALLOWED_IMAGE_EXTENSIONS as readonly string[]).includes(ext);
    const extIsVideo = !!ext && (ALLOWED_VIDEO_EXTENSIONS as readonly string[]).includes(ext);

    // Cap informació de tipus → no es pot verificar
    if (!mime && !ext) return { ok: false, reason: 'invalid_type' };
    // MIME present però fora de la llista blanca
    if (mime && !mimeIsImage && !mimeIsVideo) return { ok: false, reason: 'invalid_type' };
    // Extensió present però fora de la llista blanca
    if (ext && !extIsImage && !extIsVideo) return { ok: false, reason: 'invalid_type' };
    // Categories contradictòries (p. ex. image/jpeg amb .mp4)
    if (mime && ext && ((mimeIsImage && extIsVideo) || (mimeIsVideo && extIsImage))) {
      return { ok: false, reason: 'invalid_type' };
    }

    const mediaType: MediaType = mimeIsVideo || (!mime && extIsVideo) ? 'video' : 'image';
    if (options.imagesOnly && mediaType !== 'image') return { ok: false, reason: 'invalid_type' };

    const contentType = mime || EXTENSION_TO_MIME[ext as string];
    return { ok: true, mediaType, contentType };
  }

  /* --------------------------- Compressió --------------------------- */

  /**
   * Redimensiona (costat llarg ≤ maxEdge) i recodifica a WebP. En recodificar també cau l'EXIF.
   */
  static async compressImage(
    asset: PickedAsset,
    maxEdge: number = IMAGE_MAX_LONG_EDGE
  ): Promise<PreparedMediaFile> {
    const width = asset.width || 0;
    const height = asset.height || 0;
    const context = ImageManipulator.ImageManipulator.manipulate(asset.uri);
    if (width > 0 && height > 0 && Math.max(width, height) > maxEdge) {
      context.resize(width >= height ? { width: maxEdge } : { height: maxEdge });
    }

    const image = await context.renderAsync();
    const result = await image.saveAsync({
      compress: IMAGE_WEBP_QUALITY,
      format: ImageManipulator.SaveFormat.WEBP,
    });

    const size = await getFileSize(result.uri, null);
    if (size > MAX_IMAGE_BYTES) {
      throw new MediaUploadError('La imatge és massa gran fins i tot després de comprimir-la', 'too_large');
    }

    return {
      uri: result.uri,
      contentType: 'image/webp',
      size,
      mediaType: 'image',
      width: result.width,
      height: result.height,
    };
  }

  /**
   * Comprimeix un vídeo (H.264/MP4, ~720p). Rebutja > 60 s i > 50 MB després de comprimir.
   */
  static async compressVideo(asset: PickedAsset, originalContentType: string): Promise<PreparedMediaFile> {
    const compressor = loadCompressor();

    // Durada: primer la del picker (ms); si no hi és, la de les metadades del compressor (s)
    let durationSeconds: number | null =
      typeof asset.duration === 'number' && asset.duration > 0 ? asset.duration / 1000 : null;
    if (durationSeconds === null && compressor?.getVideoMetaData) {
      try {
        const meta = await compressor.getVideoMetaData(asset.uri);
        if (meta && typeof meta.duration === 'number') durationSeconds = meta.duration;
      } catch {
        // sense metadades: el backend ho tornarà a comprovar
      }
    }
    if (durationSeconds !== null && durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
      throw new MediaUploadError('El vídeo supera la durada màxima', 'too_long');
    }

    let uri = asset.uri;
    let contentType = originalContentType;
    if (compressor?.Video?.compress) {
      try {
        uri = await compressor.Video.compress(asset.uri, { compressionMethod: 'auto' });
        contentType = 'video/mp4';
      } catch (error) {
        console.warn('[MediaUploadService] No s\'ha pogut comprimir el vídeo, es puja l\'original', error);
        uri = asset.uri;
        contentType = originalContentType;
      }
    }

    const size = await getFileSize(uri, uri === asset.uri ? asset.fileSize : null);
    if (size > MAX_VIDEO_BYTES) {
      throw new MediaUploadError('El vídeo és massa gran fins i tot després de comprimir-lo', 'too_large');
    }

    return { uri, contentType, size, mediaType: 'video', width: asset.width || undefined, height: asset.height || undefined };
  }

  /**
   * Valida i comprimeix un asset. Llança MediaUploadError (`invalid_type`, `too_large`, `too_long`).
   */
  static async prepareAsset(
    asset: PickedAsset,
    options: { imagesOnly?: boolean; maxImageEdge?: number } = {}
  ): Promise<PreparedMediaFile> {
    const validation = MediaUploadService.validateAsset(asset, { imagesOnly: options.imagesOnly });
    if (!validation.ok || !validation.contentType || !validation.mediaType) {
      throw new MediaUploadError('Tipus de fitxer no permès', 'invalid_type');
    }

    if (validation.mediaType === 'video') {
      return MediaUploadService.compressVideo(asset, validation.contentType);
    }

    try {
      return await MediaUploadService.compressImage(asset, options.maxImageEdge ?? IMAGE_MAX_LONG_EDGE);
    } catch (error) {
      if (error instanceof MediaUploadError) throw error;
      // Si el manipulador falla (p. ex. format no suportat al dispositiu), es puja l'original
      console.warn('[MediaUploadService] Error comprimint la imatge, es puja l\'original', error);
      const size = await getFileSize(asset.uri, asset.fileSize);
      if (size > MAX_IMAGE_BYTES) {
        throw new MediaUploadError('La imatge és massa gran', 'too_large');
      }
      return {
        uri: asset.uri,
        contentType: validation.contentType,
        size,
        mediaType: 'image',
        width: asset.width || undefined,
        height: asset.height || undefined,
      };
    }
  }

  /* ------------------------------ API ------------------------------- */

  /**
   * POST /api/media/upload-intents/
   * @throws MediaUploadError amb codi age_not_confirmed | user_blocked | not_owner | too_many_pending_uploads (429, no es reintenta) |
   *   not_found | validation
   */
  static async createUploadIntents(body: UploadIntentRequestDTO): Promise<UploadIntentDTO[]> {
    if (!body.files.length) {
      throw new MediaUploadError('No hi ha fitxers per pujar', 'validation', 400);
    }
    if (body.files.length > MAX_FILES_PER_INTENT) {
      throw new MediaUploadError('Com a màxim es poden pujar 10 fitxers alhora', 'too_many_files', 400);
    }

    const response = await apiPost(`${API_BASE_URL}/media/upload-intents/`, body);
    if (!response.ok) {
      const data = await readJsonSafe(response);
      throw MediaUploadService.toUploadError(response.status, data);
    }

    const data: UploadIntentResponseDTO = await response.json();
    if (!data || !Array.isArray(data.uploads)) {
      throw new MediaUploadError('Resposta invàlida del servidor', 'unknown', response.status);
    }
    return data.uploads;
  }

  /**
   * POST /api/media/upload-intents/confirm/
   */
  static async confirmUploads(uploadIds: string[]): Promise<UploadConfirmResponseDTO> {
    const response = await apiPost(`${API_BASE_URL}/media/upload-intents/confirm/`, { upload_ids: uploadIds });
    if (!response.ok) {
      const data = await readJsonSafe(response);
      throw MediaUploadService.toUploadError(response.status, data);
    }
    const data: UploadConfirmResponseDTO = await response.json();
    return {
      uploaded: Array.isArray(data?.uploaded) ? data.uploaded : [],
      failed: Array.isArray(data?.failed) ? data.failed : [],
    };
  }

  /**
   * PUT directe a l'emmagatzematge (R2) amb la URL prefirmada.
   * No s'afegeix el token de Firebase: la URL ja porta la signatura.
   */
  static async putFile(
    intent: UploadIntentDTO,
    file: PreparedMediaFile,
    onProgress?: (sent: number, total: number) => void
  ): Promise<void> {
    const headers = { ...(intent.headers || {}) };

    if (Platform.OS !== 'web') {
      // La pujada es manté a l'API legacy d'expo-file-system (no deprecada a SDK 55):
      // l'API nova encara no té pujada amb progrés real i `expo/fetch` podria sobreescriure
      // el Content-Type de la URL prefirmada (risc de 403 a R2).
      const task = createUploadTask(
        intent.put_url,
        file.uri,
        {
          httpMethod: 'PUT',
          uploadType: FileSystemUploadType.BINARY_CONTENT,
          headers,
        },
        (data) => {
          onProgress?.(data.totalBytesSent, data.totalBytesExpectedToSend || file.size);
        }
      );
      const result = await task.uploadAsync();
      if (!result || result.status < 200 || result.status >= 300) {
        throw new MediaUploadError(`Error ${result?.status ?? '?'} pujant el fitxer`, 'put_failed', result?.status ?? 0);
      }
      onProgress?.(file.size, file.size);
      return;
    }

    // Web: fetch amb Blob
    const blob = await (await fetch(file.uri)).blob();
    const response = await fetch(intent.put_url, { method: 'PUT', headers, body: blob });
    if (!response.ok) {
      throw new MediaUploadError(`Error ${response.status} pujant el fitxer`, 'put_failed', response.status);
    }
    onProgress?.(file.size, file.size);
  }

  /**
   * Flux complet: intents → PUT de cada fitxer → confirm.
   * Les fallades individuals de PUT no aturen la resta; es retornen a `failed` amb `put_failed`.
   */
  static async uploadFiles(params: UploadFilesParams): Promise<MediaUploadResult> {
    const { target, refugeId, experienceId, files, onProgress } = params;

    const body: UploadIntentRequestDTO = {
      target,
      rights_confirmed: true,
      files: files.map((f) => ({ content_type: f.contentType, size: f.size })),
    };
    if (refugeId && target !== 'avatar') body.refuge_id = refugeId;
    if (experienceId && target === 'experience') body.experience_id = experienceId;

    const intents = await MediaUploadService.createUploadIntents(body);

    const totalBytes = files.reduce((sum, f) => sum + (f.size || 0), 0) || 1;
    let doneBytes = 0;
    onProgress?.(0);

    const putOk: string[] = [];
    const clientFailures: UploadFailureDTO[] = [];

    for (let i = 0; i < intents.length && i < files.length; i++) {
      const intent = intents[i];
      const file = files[i];
      try {
        await MediaUploadService.putFile(intent, file, (sent) => {
          onProgress?.(Math.min(1, (doneBytes + sent) / totalBytes));
        });
        putOk.push(intent.upload_id);
      } catch (error) {
        console.error('[MediaUploadService] PUT fallit', error);
        clientFailures.push({ upload_id: intent.upload_id, reason: 'put_failed' });
      }
      doneBytes += file.size || 0;
      onProgress?.(Math.min(1, doneBytes / totalBytes));
    }

    if (putOk.length === 0) {
      return { uploaded: [], failed: clientFailures };
    }

    const confirm = await MediaUploadService.confirmUploads(putOk);
    return {
      uploaded: confirm.uploaded.map(mapImageMetadataFromDTO),
      failed: [...confirm.failed, ...clientFailures],
    };
  }

  /**
   * Converteix una resposta d'error en MediaUploadError amb codi estable.
   */
  static toUploadError(status: number, data: any): MediaUploadError {
    const message = (data && (data.message || data.error || data.detail)) || `Error ${status}`;
    if (status === 403) {
      const code = extractApiErrorCode(data, UPLOAD_INTENT_ERROR_CODES) || 'forbidden';
      return new MediaUploadError(String(message), code, status, data);
    }
    if (status === 429) {
      // Quota de pujades pendents: codi coherent encara que el cos no en porti
      const code = extractApiErrorCode(data, [TOO_MANY_PENDING_UPLOADS_CODE]) || TOO_MANY_PENDING_UPLOADS_CODE;
      return new MediaUploadError(String(message), code, status, data);
    }
    if (status === 404) return new MediaUploadError(String(message), 'not_found', status, data);
    if (status === 400) return new MediaUploadError(String(message), 'validation', status, data);
    if (status === 401) return new MediaUploadError(String(message), 'unauthenticated', status, data);
    return new MediaUploadError(String(message), 'unknown', status, data);
  }
}
