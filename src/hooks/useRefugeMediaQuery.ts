/**
 * React Query hooks for Refuge Media API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefugeMediaService } from '../services/RefugeMediaService';
import { ImageMetadata } from '../models';

/**
 * Hook per obtenir tots els mitjans d'un refugi
 */
export function useRefugeMedia(refugeId: string | undefined) {
  return useQuery({
    queryKey: refugeId ? ['refugeMedia', refugeId] : ['refugeMedia', 'undefined'],
    queryFn: async () => {
      if (!refugeId) throw new Error('Refuge ID is required');
      return await RefugeMediaService.getRefugeMedia(refugeId);
    },
    enabled: !!refugeId,
  });
}

/**
 * Hook per pujar mitjans a un refugi
 * Invalida la cache del refugi i dels seus mitjans
 */
export function useUploadRefugeMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      refugeId, 
      files 
    }: { 
      refugeId: string; 
      files: File[] 
    }) => {
      return await RefugeMediaService.uploadRefugeMedia(refugeId, files);
    },
    onSuccess: (data, variables) => {
      // Invalidar la cache del refugi per actualitzar images_metadata
      queryClient.invalidateQueries({
        queryKey: ['refuges', 'detail', variables.refugeId],
      });
      
      // Invalidar la cache dels mitjans del refugi
      queryClient.invalidateQueries({
        queryKey: ['refugeMedia', variables.refugeId],
      });

      // Invalidar filtres de refugis ja que les fotos afecten el refugi
      queryClient.invalidateQueries({
        queryKey: ['refuges', 'list'],
      });

      // Invalidar dades del user (uploaded_photos_keys)
      queryClient.invalidateQueries({ queryKey: ['users', 'detail'] });
    },
  });
}

/**
 * Hook per eliminar un mitjà d'un refugi
 * Actualitza la cache eliminant el mitjà de la llista i invalida el refugi
 */
export function useDeleteRefugeMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      refugeId, 
      mediaKey,
      experienceId 
    }: { 
      refugeId: string; 
      mediaKey: string;
      experienceId?: string | null;
    }) => {
      await RefugeMediaService.deleteRefugeMedia(refugeId, mediaKey);
      return { refugeId, mediaKey, experienceId };
    },
    onSuccess: ({ refugeId, mediaKey, experienceId }) => {
      // Eliminar el mitjà de la cache de mitjans del refugi
      queryClient.setQueryData<ImageMetadata[]>(
        ['refugeMedia', refugeId],
        (oldData) => {
          if (!oldData) return [];
          return oldData.filter(media => media.key !== mediaKey);
        }
      );
      
      // Invalidar la cache del refugi per actualitzar images_metadata
      queryClient.invalidateQueries({
        queryKey: ['refuges', 'detail', refugeId],
      });

      // Invalidar filtres de refugis ja que les fotos afecten el refugi
      queryClient.invalidateQueries({
        queryKey: ['refuges', 'list'],
      });
      
      // Si el mitjà pertany a una experiència, invalidar les experiències del refugi
      if (experienceId) {
        queryClient.invalidateQueries({
          queryKey: ['experiences', 'refuge', refugeId],
        });
      }

      // Invalidar dades del user (uploaded_photos_keys)
      queryClient.invalidateQueries({ queryKey: ['users', 'detail'] });
    },
  });
}
