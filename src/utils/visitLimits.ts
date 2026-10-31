/** Màxim de visitants per inscripció a una visita (el backend respon 400 per sobre) */
export const MAX_NUM_VISITORS = 100;

/** Mesos naturals vista màxims per crear una visita (el backend respon 400 per sobre) */
export const MAX_VISIT_MONTHS_AHEAD = 12;

/** Data d'avui a Europe/Madrid en format YYYY-MM-DD */
export function getTodayMadridDateString(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const year = parts.find((p) => p.type === 'year')?.value ?? String(now.getFullYear());
  const month = parts.find((p) => p.type === 'month')?.value ?? String(now.getMonth() + 1).padStart(2, '0');
  const day = parts.find((p) => p.type === 'day')?.value ?? String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Última data (YYYY-MM-DD) en què es pot crear una visita: el mateix dia del mes
 * `MAX_VISIT_MONTHS_AHEAD` mesos després d'avui (Madrid), ajustat a l'últim dia
 * del mes si aquest dia no existeix (p. ex. 29/02 -> 28/02).
 */
export function getMaxVisitDateString(now: Date = new Date()): string {
  const [y, m, d] = getTodayMadridDateString(now).split('-').map(Number);
  const totalMonths = y * 12 + (m - 1) + MAX_VISIT_MONTHS_AHEAD;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = totalMonths % 12; // 0-11
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const day = Math.min(d, lastDay);
  return `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Indica si una data de visita (YYYY-MM-DD) està dins del rang permès [avui, avui + 12 mesos] */
export function isVisitDateAllowed(dateString: string, now: Date = new Date()): boolean {
  return dateString >= getTodayMadridDateString(now) && dateString <= getMaxVisitDateString(now);
}
