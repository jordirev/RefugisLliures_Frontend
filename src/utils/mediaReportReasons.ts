import { MediaReportReason } from '../models';

/**
 * Motius de denúncia del contracte d'API (POST /api/media/reports/), agrupats per a la UI.
 * Les etiquetes es tradueixen amb `media.report.reasons.<reason>` i
 * `media.report.groups.<group>`.
 */
export interface MediaReportReasonGroup {
  id: string;
  reasons: MediaReportReason[];
}

export const MEDIA_REPORT_REASON_GROUPS: MediaReportReasonGroup[] = [
  { id: 'childSafety', reasons: ['child_sexual_abuse', 'child_endangerment'] },
  { id: 'sexualContent', reasons: ['sexual_nonconsensual'] },
  { id: 'violenceHate', reasons: ['violence_gore', 'terrorism_extremism', 'hate_speech', 'harassment_bullying'] },
  { id: 'animalCruelty', reasons: ['animal_cruelty'] },
  { id: 'selfHarm', reasons: ['self_harm'] },
  { id: 'illegal', reasons: ['illegal_goods'] },
  { id: 'privacyRights', reasons: ['my_image', 'privacy_personal_data', 'intellectual_property'] },
  { id: 'fraudSpam', reasons: ['fraud_scam_spam', 'misleading_irrelevant'] },
  { id: 'other', reasons: ['other'] },
];

export const MEDIA_REPORT_REASONS: MediaReportReason[] = MEDIA_REPORT_REASON_GROUPS.flatMap((g) => g.reasons);

/** Longitud màxima del camp de detalls */
export const MEDIA_REPORT_DETAILS_MAX = 1000;

/** Motius que oculten el mitjà immediatament (informatiu per a la UI) */
export const AUTO_HIDE_REASONS: MediaReportReason[] = [
  'child_sexual_abuse',
  'child_endangerment',
  'sexual_nonconsensual',
  'terrorism_extremism',
  'my_image',
];

/**
 * Valida una denúncia abans d'enviar-la.
 * @returns clau i18n de l'error o null si és vàlida
 */
export function validateMediaReport(input: {
  reason: MediaReportReason | null;
  details: string;
  goodFaith: boolean;
}): string | null {
  if (!input.reason) return 'media.report.errors.reasonRequired';
  const details = input.details.trim();
  if (input.reason === 'other' && details.length === 0) return 'media.report.errors.detailsRequired';
  if (details.length > MEDIA_REPORT_DETAILS_MAX) return 'media.report.errors.detailsTooLong';
  if (!input.goodFaith) return 'media.report.errors.goodFaithRequired';
  return null;
}
