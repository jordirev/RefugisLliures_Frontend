/**
 * Servei de moderació de mitjans: denúncies (usuaris), gestió de denúncies (admins)
 * i avisos de moderació (declaració de motius, art. 17 DSA).
 */

import { apiGet, apiPatch, apiPost } from './apiClient';
import { ApiError, extractApiErrorCode, readJsonSafe } from './apiErrors';
import {
  MediaReportCreateDTO,
  MediaReportDTO,
  MediaReportResolveDTO,
  ModerationNoticeDTO,
} from './dto/MediaModerationDTO';

const API_BASE_URL = 'https://refugislliures-backend.onrender.com/api';

/** Extreu una llista d'una resposta que pot ser un array o un objecte paginat */
function extractList<T>(data: any, keys: string[]): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object') {
    for (const key of keys) {
      if (Array.isArray(data[key])) return data[key] as T[];
    }
  }
  return [];
}

export class MediaModerationService {
  /**
   * Denuncia un mitjà.
   * POST /api/media/reports/
   * @throws ApiError amb codi `own_media` (403), `already_reported` (409), `validation` (400),
   *         `not_found` (404) o `unknown`
   */
  static async reportMedia(body: MediaReportCreateDTO): Promise<void> {
    const payload: MediaReportCreateDTO = {
      refuge_id: body.refuge_id,
      media_key: body.media_key,
      reason: body.reason,
    };
    if (body.details && body.details.trim()) payload.details = body.details.trim();

    const response = await apiPost(`${API_BASE_URL}/media/reports/`, payload);
    if (response.ok) return;

    const data = await readJsonSafe(response);
    const message = (data && (data.message || data.error || data.detail)) || `Error ${response.status}`;
    if (response.status === 403) {
      // L'autor no pot denunciar la seva pròpia foto; altres 403 (bloqueig) es propaguen amb el seu codi
      // Backend: {error, code, message}; codis own_media | user_blocked | age_not_confirmed
      const code = extractApiErrorCode(data, ['own_media', 'user_blocked', 'age_not_confirmed']) || 'own_media';
      throw new ApiError(String(message), code, 403, data);
    }
    if (response.status === 409) {
      throw new ApiError(String(message), extractApiErrorCode(data, ['already_reported']) || 'already_reported', 409, data);
    }
    if (response.status === 404) throw new ApiError(String(message), 'not_found', 404, data);
    if (response.status === 400) throw new ApiError(String(message), 'validation', 400, data);
    throw new ApiError(String(message), 'unknown', response.status, data);
  }

  /**
   * Llista de denúncies per a admins.
   * GET /api/admin/media-reports/?status=pending|resolved
   */
  static async getMediaReports(status: 'pending' | 'resolved' = 'pending'): Promise<MediaReportDTO[]> {
    const response = await apiGet(`${API_BASE_URL}/admin/media-reports/?status=${encodeURIComponent(status)}`);
    if (!response.ok) {
      const data = await readJsonSafe(response);
      const code = response.status === 403 ? 'forbidden' : 'unknown';
      throw new ApiError(
        (data && (data.error || data.detail)) || 'No s\'han pogut carregar les denúncies',
        code,
        response.status,
        data
      );
    }
    const data = await response.json();
    return extractList<MediaReportDTO>(data, ['results', 'reports', 'media_reports']);
  }

  /**
   * Resol una denúncia (admin).
   * PATCH /api/admin/media-reports/{id}/  {action, statement}
   */
  static async resolveMediaReport(reportId: string, body: MediaReportResolveDTO): Promise<MediaReportDTO | null> {
    if (!body.statement || !body.statement.trim()) {
      throw new ApiError('Cal una motivació', 'validation', 400);
    }
    const response = await apiPatch(
      `${API_BASE_URL}/admin/media-reports/${encodeURIComponent(reportId)}/`,
      { action: body.action, statement: body.statement.trim() }
    );
    if (!response.ok) {
      const data = await readJsonSafe(response);
      throw new ApiError(
        (data && (data.error || data.detail)) || 'No s\'ha pogut resoldre la denúncia',
        extractApiErrorCode(data, ['already_resolved']) ||
          (response.status === 404 ? 'not_found' : response.status === 403 ? 'forbidden' : response.status === 400 ? 'validation' : 'unknown'),
        response.status,
        data
      );
    }
    const data = await readJsonSafe(response);
    // Resposta: {report, resolved_report_ids, media_status, strikes, user_blocked}
    if (data && typeof data === 'object') {
      if (data.report && typeof data.report === 'object') return data.report as MediaReportDTO;
      if (data.id) return data as MediaReportDTO;
    }
    return null;
  }

  /**
   * Avisos de moderació de l'usuari actual.
   * GET /api/users/{uid}/moderation-notices/
   */
  static async getModerationNotices(uid: string): Promise<ModerationNoticeDTO[]> {
    const response = await apiGet(`${API_BASE_URL}/users/${encodeURIComponent(uid)}/moderation-notices/`);
    if (!response.ok) {
      const data = await readJsonSafe(response);
      throw new ApiError(
        (data && (data.error || data.detail)) || 'No s\'han pogut carregar els avisos',
        'unknown',
        response.status,
        data
      );
    }
    const data = await response.json();
    return extractList<ModerationNoticeDTO>(data, ['results', 'notices', 'moderation_notices']);
  }
}
