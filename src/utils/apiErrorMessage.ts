/**
 * Missatges d'UI per als errors estructurats del backend en escriure contingut
 * (visites, reformes, dubtes). Es decideix sempre pel `code` de l'`ApiError`,
 * mai pel text del missatge (docs/GOTCHAS.md, gotchas 7 i 37).
 */

type Translate = (key: string, options?: any) => string;

const CODE_TO_KEY: Record<string, string> = {
  user_blocked: 'contentErrors.userBlocked',
  age_not_confirmed: 'contentErrors.ageNotConfirmed',
  not_owner: 'contentErrors.notOwner',
  expelled: 'contentErrors.expelled',
};

/** Codis que es mostren amb el títol "Acció no permesa" */
const NOT_ALLOWED_CODES = ['user_blocked', 'age_not_confirmed', 'not_owner', 'expelled'];

/**
 * Títol i missatge per mostrar a l'usuari.
 *
 * @param error - Error llançat pel servei (pot ser un `ApiError` amb `code`)
 * @param t - Funció de traducció
 * @param fallbackKey - Clau i18n si no hi ha cap codi conegut ni missatge
 * @param extraKeys - Claus addicionals per codi (p. ex. `{ not_found: 'x.y' }`)
 */
export function getContentErrorMessage(
  error: any,
  t: Translate,
  fallbackKey: string,
  extraKeys: Record<string, string> = {}
): { title: string; message: string } {
  const code: string | undefined = typeof error?.code === 'string' ? error.code : undefined;
  const key = code ? extraKeys[code] || CODE_TO_KEY[code] : undefined;
  if (key) {
    return {
      title: code && NOT_ALLOWED_CODES.includes(code) ? t('contentErrors.notAllowedTitle') : t('common.error'),
      message: t(key),
    };
  }
  return { title: t('common.error'), message: error?.message || t(fallbackKey) };
}
