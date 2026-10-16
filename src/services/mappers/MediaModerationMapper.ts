/**
 * Mappers de moderació de mitjans
 */
import { MediaReport, ModerationNotice } from '../../models';
import { MediaReportDTO, ModerationNoticeDTO } from '../dto/MediaModerationDTO';
import { mapImageMetadataFromDTO } from './RefugiMapper';

export function mapMediaReportFromDTO(dto: MediaReportDTO): MediaReport {
  return {
    id: dto.id,
    refuge_id: dto.refuge_id,
    media_key: dto.media_key,
    reason: dto.reason,
    details: dto.details ?? null,
    status: dto.status,
    reporter_uid: dto.reporter_uid ?? null,
    media_creator_uid: dto.media_creator_uid ?? dto.creator_uid ?? null,
    priority: dto.priority ?? null,
    reports_count: dto.reports_count ?? null,
    created_at: dto.created_at ?? null,
    resolved_at: dto.resolved_at ?? null,
    resolution_action: dto.resolution_action ?? dto.action ?? null,
    statement: dto.statement ?? null,
    media: dto.media ? mapImageMetadataFromDTO(dto.media) : null,
  };
}

export function mapModerationNoticeFromDTO(dto: ModerationNoticeDTO): ModerationNotice {
  return {
    id: dto.id,
    media_key: dto.media_key ?? null,
    refuge_id: dto.refuge_id ?? null,
    action: dto.action ?? null,
    reason: dto.reason ?? null,
    statement: dto.statement ?? null,
    strikes: dto.strikes ?? null,
    created_at: dto.created_at ?? null,
  };
}
