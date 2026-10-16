/**
 * DTOs de moderació de mitjans (denúncies, accions d'admin i avisos a l'usuari)
 */
import { ImageMetadataDTO } from './RefugiDTO';

/** Cos de POST /api/media/reports/ */
export interface MediaReportCreateDTO {
  refuge_id: string;
  media_key: string;
  reason: string;
  details?: string;
}

/** Element de GET /api/admin/media-reports/ */
export interface MediaReportDTO {
  id: string;
  refuge_id: string;
  media_key: string;
  reason: string;
  details?: string | null;
  status: string;
  reporter_uid?: string | null;
  media_creator_uid?: string | null;
  creator_uid?: string | null;
  priority?: string | null;
  reports_count?: number | null;
  created_at?: string | null;
  resolved_at?: string | null;
  resolution_action?: string | null;
  action?: string | null;
  statement?: string | null;
  media?: ImageMetadataDTO | null;
}

/** Cos de PATCH /api/admin/media-reports/{id}/ */
export interface MediaReportResolveDTO {
  action: 'dismiss' | 'remove' | 'remove_and_strike';
  statement: string;
}

/** Element de GET /api/users/{uid}/moderation-notices/ */
export interface ModerationNoticeDTO {
  id: string;
  uid?: string | null;
  type?: string | null;
  report_id?: string | null;
  automated?: boolean | null;
  /** Informació sobre vies de recurs (art. 17 DSA) */
  redress?: string | null;
  media_key?: string | null;
  refuge_id?: string | null;
  action?: string | null;
  reason?: string | null;
  statement?: string | null;
  strikes?: number | null;
  created_at?: string | null;
}
