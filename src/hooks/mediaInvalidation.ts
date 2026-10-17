/**
 * Invalidacions de React Query compartides per tots els fluxos de mitjans
 * (pujada, esborrat, experiències i moderació). Mòdul sense dependències natives.
 */
import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '../config/queryClient';

/**
 * Invalida totes les dades que depenen dels mitjans d'un refugi/usuari:
 * `['refuges','detail',id]`, `['refugeMedia',id]`, `['experiences','refuge',id]`,
 * `['refuges','list']` i `['users','detail',uid]` (o tot `['users','detail']` si no hi ha uid).
 */
export function invalidateMediaQueries(
  queryClient: QueryClient,
  { refugeId, uid }: { refugeId?: string; uid?: string }
) {
  if (refugeId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.refuge(refugeId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.refugeMedia(refugeId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.refugeExperiences(refugeId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.refugesList() });
  }
  // Comptador de fotos de l'usuari / avatar
  queryClient.invalidateQueries({ queryKey: uid ? queryKeys.user(uid) : ['users', 'detail'] });
}
