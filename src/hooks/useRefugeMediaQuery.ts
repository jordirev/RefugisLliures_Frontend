/**
 * React Query hooks for Refuge Media API
 *
 * La pujada es fa amb `useMediaUpload` (URL PUT prefirmada); aquí queden la consulta
 * i l'esborrat.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefugeMediaService } from '../services/RefugeMediaService';
import { ImageMetadata } from '../models';
import { queryKeys } from '../config/queryClient';
import { invalidateMediaQueries } from './mediaInvalidation';

/**
 * Hook per obtenir tots els mitjans d'un refugi
 */
export function useRefugeMedia(refugeId: string | undefined) {
  return useQuery({
    queryKey: refugeId ? queryKeys.refugeMedia(refugeId) : ['refugeMedia', 'undefined'],
    queryFn: async () => {
      if (!refugeId) throw new Error('Refuge ID is required');
      return await RefugeMediaService.getRefugeMedia(refugeId);
    },
    enabled: !!refugeId,
  });
}

/**
 * Hook per eliminar un mitjà d'un refugi (autor o admin).
 * Actualitza la cache eliminant el mitjà de la llista i invalida refugi, experiències,
 * llista de refugis i l'usuari (comptador de fotos).
 */
export function useDeleteRefugeMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      refugeId,
      mediaKey,
      experienceId,
      creatorUid,
    }: {
      refugeId: string;
      mediaKey: string;
      experienceId?: string | null;
      creatorUid?: string | null;
    }) => {
      await RefugeMediaService.deleteRefugeMedia(refugeId, mediaKey);
      return { refugeId, mediaKey, experienceId, creatorUid };
    },
    onSuccess: ({ refugeId, mediaKey, creatorUid }) => {
      // Eliminar el mitjà de la cache de mitjans del refugi
      queryClient.setQueryData<ImageMetadata[]>(queryKeys.refugeMedia(refugeId), (oldData) => {
        if (!oldData) return [];
        return oldData.filter((media) => media.key !== mediaKey);
      });

      invalidateMediaQueries(queryClient, { refugeId, uid: creatorUid || undefined });
    },
  });
}
