/**
 * Utilitats per interpretar els errors del backend de manera estructurada.
 *
 * El backend retorna codis d'error explícits (p. ex. `age_not_confirmed`, `user_blocked`,
 * `not_owner`, `underage`) però la clau on van pot variar segons la vista
 * (`code`, `error_code`, `error` o `detail`). Aquí es normalitza perquè la UI
 * decideixi pel codi i mai pel text del missatge (vegeu docs/GOTCHAS.md).
 */

/**
 * Error d'API amb codi i status HTTP
 */
export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(message: string, code: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * Busca un codi d'error conegut dins del cos de la resposta.
 *
 * @param body - Cos JSON de la resposta (o qualsevol valor)
 * @param knownCodes - Codis que interessen; si es passa, només es retorna un d'aquests
 * @returns El codi trobat o null
 */
export function extractApiErrorCode(body: any, knownCodes?: readonly string[]): string | null {
  if (!body || typeof body !== 'object') {
    if (typeof body === 'string' && (!knownCodes || knownCodes.includes(body))) return body;
    return null;
  }

  const candidates: unknown[] = [
    body.code,
    body.error_code,
    body.error,
    body.detail,
    body.reason,
    body?.detail?.code,
    body?.error?.code,
  ];

  for (const candidate of candidates) {
    if (typeof candidate !== 'string' || !candidate) continue;
    if (!knownCodes) return candidate;
    if (knownCodes.includes(candidate)) return candidate;
    // El codi pot venir dins d'un missatge (p. ex. "age_not_confirmed: ...")
    const found = knownCodes.find((code) => candidate.includes(code));
    if (found) return found;
  }
  return null;
}

/**
 * Llegeix el cos JSON d'una resposta sense llançar si no és JSON.
 */
export async function readJsonSafe(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
