/**
 * React Query hooks for Experiences API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ExperienceService, 
  CreateExperienceRequest, 
  UpdateExperienceRequest 
} from '../services/ExperienceService';
import { mapExperienceFromDTO } from '../services/mappers/ExperienceMapper';
import { Experience } from '../models';
import { MediaUploadService, MediaUploadResult, UploadFailureDTO } from '../services/MediaUploadService';
import { queryKeys } from '../config/queryClient';
import { invalidateMediaQueries } from './mediaInvalidation';

/**
 * Puja els fitxers d'una experiència amb upload-intents (target=experience).
 * Un error global de pujada NO desfà l'experiència: es retorna a `uploadError`.
 */
async function uploadExperienceFiles(
  refugeId: string,
  experienceId: string,
  files: UpdateExperienceRequest['files']
): Promise<{ upload: MediaUploadResult | null; uploadError: unknown }> {
  if (!files || files.length === 0) return { upload: null, uploadError: null };
  try {
    const upload = await MediaUploadService.uploadFiles({
      target: 'experience',
      refugeId,
      experienceId,
      files,
    });
    return { upload, uploadError: null };
  } catch (error) {
    console.error('Error pujant els fitxers de l\'experiència:', error);
    return { upload: null, uploadError: error };
  }
}

/**
 * Hook per obtenir totes les experiències d'un refugi
 */
export function useExperiences(refugeId: string | undefined) {
  return useQuery({
    queryKey: refugeId ? queryKeys.refugeExperiences(refugeId) : ['experiences', 'refuge', 'undefined'],
    queryFn: async () => {
      if (!refugeId) throw new Error('Refuge ID is required');
      const experiencesDTO = await ExperienceService.getExperiencesByRefuge(refugeId);
      return experiencesDTO.map(mapExperienceFromDTO);
    },
    enabled: !!refugeId,
  });
}

/**
 * Hook per crear una nova experiència.
 * 1) POST /api/experiences/ (JSON) · 2) si hi ha fitxers, upload-intents amb target=experience
 * (PUT directe + confirm). Afegeix l'experiència a la cache i invalida el que depèn de les fotos.
 */
export function useCreateExperience() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateExperienceRequest) => {
      const response = await ExperienceService.createExperience({
        refuge_id: request.refuge_id,
        comment: request.comment,
        condition: request.condition,
      });
      const experience = mapExperienceFromDTO(response.experience);
      const { upload, uploadError } = await uploadExperienceFiles(request.refuge_id, experience.id, request.files);
      if (upload && upload.uploaded.length > 0) {
        experience.images_metadata = [...(experience.images_metadata || []), ...upload.uploaded];
      }
      const failed: UploadFailureDTO[] = upload ? upload.failed : [];
      return {
        experience,
        uploaded_files: upload ? upload.uploaded.map((m) => m.key) : [],
        failed_files: failed,
        uploadError,
        message: response.message,
        refuge_id: request.refuge_id,
        hasFiles: !!request.files && request.files.length > 0,
      };
    },
    onSuccess: (data, variables) => {
      // Afegir la nova experiència a la llista existent
      const refugeId = variables.refuge_id;
      const queryKey = queryKeys.refugeExperiences(refugeId);
      
      queryClient.setQueryData<Experience[]>(queryKey, (oldData) => {
        if (!oldData) return [data.experience];
        // Afegir al principi ja que les experiències estan ordenades per modified_at descendent
        return [data.experience, ...oldData];
      });

      if (data.hasFiles) {
        // Fotos noves: refugi, mitjans, experiències, llista i usuari
        invalidateMediaQueries(queryClient, { refugeId });
      } else {
        // Invalidar dades del user (num_shared_experiences)
        queryClient.invalidateQueries({ queryKey: ['users', 'detail'] });
      }
    },
  });
}

/**
 * Hook per actualitzar una experiència.
 * PATCH (JSON) del comentari i, si n'hi ha, pujada de fitxers nous amb target=experience.
 */
export function useUpdateExperience() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      experienceId, 
      refugeId, 
      request 
    }: { 
      experienceId: string; 
      refugeId: string; 
      request: UpdateExperienceRequest 
    }) => {
      const hasFiles = !!request.files && request.files.length > 0;
      // Sempre es fa el PATCH: porta el comentari i la valoració (condition)
      const response = await ExperienceService.updateExperience(experienceId, {
        comment: request.comment,
        condition: request.condition,
      });
      const { upload, uploadError } = await uploadExperienceFiles(refugeId, experienceId, request.files);
      return {
        experience: response?.experience ? mapExperienceFromDTO(response.experience) : undefined,
        uploaded_files: upload ? upload.uploaded.map((m) => m.key) : [],
        failed_files: upload ? upload.failed : ([] as UploadFailureDTO[]),
        uploadError,
        message: response?.message,
        experienceId,
        refugeId,
        hasFiles,
      };
    },
    onSuccess: (data) => {
      if (data.experience) {
        // Actualitzar l'experiència a la llista existent
        const queryKey = queryKeys.refugeExperiences(data.refugeId);
        
        queryClient.setQueryData<Experience[]>(queryKey, (oldData) => {
          if (!oldData) return [data.experience!];
          
          return oldData.map(exp => 
            exp.id === data.experienceId ? data.experience! : exp
          );
        });
      }

      // Si es pugen fotos, invalidar refugi, mitjans, experiències, llista i usuari
      if (data.hasFiles) {
        invalidateMediaQueries(queryClient, { refugeId: data.refugeId });
      }
    },
  });
}

/**
 * Hook per eliminar una experiència
 * Elimina l'experiència de la cache en lloc d'invalidar tota la llista
 */
export function useDeleteExperience() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      experienceId, 
      refugeId 
    }: { 
      experienceId: string; 
      refugeId: string 
    }) => {
      await ExperienceService.deleteExperience(experienceId);
      return { experienceId, refugeId };
    },
    onSuccess: ({ experienceId, refugeId }) => {
      // Eliminar l'experiència de la llista existent
      const queryKey = queryKeys.refugeExperiences(refugeId);
      
      queryClient.setQueryData<Experience[]>(queryKey, (oldData) => {
        if (!oldData) return [];
        return oldData.filter(exp => exp.id !== experienceId);
      });

      // Invalidar el refugi (les fotos de l'experiència també estan al refugi)
      queryClient.invalidateQueries({ queryKey: ['refuges', 'detail', refugeId] });
      queryClient.invalidateQueries({ queryKey: ['refugeMedia', refugeId] });
      // Invalidar filtres de refugis ja que les fotos afecten el refugi
      queryClient.invalidateQueries({ queryKey: ['refuges', 'list'] });

      // Invalidar dades del user (num_shared_experiences, uploaded_photos_keys)
      queryClient.invalidateQueries({ queryKey: ['users', 'detail'] });
    },
  });
}
