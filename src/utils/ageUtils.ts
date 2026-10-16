/**
 * Utilitats d'edat (registre i confirmació d'edat).
 * L'edat mínima la imposa el backend (403 `underage`); aquí només es valida
 * per estalviar crides i comptes de Firebase innecessaris.
 */

export const MIN_AGE = 16;

/**
 * Construeix una data ISO (YYYY-MM-DD) a partir de dia/mes/any en text.
 * @returns la data ISO o null si no és una data real (p. ex. 31/02) o és futura/absurda
 */
export function buildBirthDate(day: string, month: string, year: string, today: Date = new Date()): string | null {
  if (!/^\d{1,2}$/.test(day.trim()) || !/^\d{1,2}$/.test(month.trim()) || !/^\d{4}$/.test(year.trim())) {
    return null;
  }
  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  if (y < 1900) return null;

  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;

  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  if (date.getTime() > todayUtc) return null;

  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/**
 * Edat en anys complerts a partir d'una data ISO (YYYY-MM-DD).
 */
export function computeAge(isoDate: string, today: Date = new Date()): number {
  const [y, m, d] = isoDate.split('-').map((n) => parseInt(n, 10));
  let age = today.getFullYear() - y;
  const monthDiff = today.getMonth() + 1 - m;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d)) age--;
  return age;
}

export function isUnderMinAge(isoDate: string, today: Date = new Date()): boolean {
  return computeAge(isoDate, today) < MIN_AGE;
}
