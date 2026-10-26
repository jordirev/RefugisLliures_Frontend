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

/**
 * Codis 403 que poden respondre els POST/PATCH d'escriptura de contingut
 * (visites, reformes, dubtes i respostes): usuari bloquejat per moderació o
 * edat no confirmada.
 */
export const CONTENT_WRITE_ERROR_CODES = ['user_blocked', 'age_not_confirmed'] as const;

/**
 * Construeix un `ApiError` a partir d'una resposta HTTP d'error del backend
 * (`{error, code, message}`). El `code` es llegeix del cos, mai del text del missatge.
 *
 * @param response - Resposta no OK
 * @param fallbackMessage - Missatge si el cos no en porta
 * @param options.knownCodes - Codis admesos; qualsevol altre queda com a `defaultCode`
 * @param options.defaultCode - Codi si el cos no en porta cap de conegut (per defecte `unknown`)
 */
export async function buildApiError(
  response: Response,
  fallbackMessage: string,
  options: { knownCodes?: readonly string[]; defaultCode?: string } = {}
): Promise<ApiError> {
  const { knownCodes, defaultCode = 'unknown' } = options;
  const data = await readJsonSafe(response);
  let code: string | null = null;
  if (data && typeof data.code === 'string' && (!knownCodes || knownCodes.includes(data.code))) {
    code = data.code;
  } else if (knownCodes) {
    code = extractApiErrorCode(data, knownCodes);
  }
  const message =
    (data && typeof data.message === 'string' && data.message) ||
    (data && typeof data.error === 'string' && data.error) ||
    fallbackMessage;
  return new ApiError(message, code || defaultCode, response.status, data);
}
