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

/**
 * Hook per obtenir totes les experiències d'un refugi
 */
export function useExperiences(refugeId: string | undefined) {
  return useQuery({
    queryKey: refugeId ? ['experiences', 'refuge', refugeId] : ['experiences', 'refuge', 'undefined'],
    queryFn: async () => {
      if (!refugeId) throw new Error('Refuge ID is required');
      const experiencesDTO = await ExperienceService.getExperiencesByRefuge(refugeId);
      return experiencesDTO.map(mapExperienceFromDTO);
    },
    enabled: !!refugeId,
  });
}

/**
 * Hook per crear una nova experiència
 * Afegeix l'experiència a la cache en lloc d'invalidar tota la llista
 */
export function useCreateExperience() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateExperienceRequest) => {
      const response = await ExperienceService.createExperience(request);
      return {
        experience: mapExperienceFromDTO(response.experience),
        uploaded_files: response.uploaded_files,
        failed_files: response.failed_files,
        message: response.message,
        refuge_id: request.refuge_id,
        hasFiles: request.files && request.files.length > 0,
      };
    },
    onSuccess: (data, variables) => {
      // Afegir la nova experiència a la llista existent
      const refugeId = variables.refuge_id;
      const queryKey = ['experiences', 'refuge', refugeId];
      
      queryClient.setQueryData<Experience[]>(queryKey, (oldData) => {
        if (!oldData) return [data.experience];
        // Afegir al principi ja que les experiències estan ordenades per modified_at descendent
        return [data.experience, ...oldData];
      });

      // Si es pugen fotos, invalidar el refugi (les fotos també es pengen al refugi)
      if (data.hasFiles) {
        queryClient.invalidateQueries({ queryKey: ['refuges', 'detail', refugeId] });
        queryClient.invalidateQueries({ queryKey: ['refugeMedia', refugeId] });
        // Invalidar filtres de refugis ja que les fotos afecten el refugi
        queryClient.invalidateQueries({ queryKey: ['refuges', 'list'] });
      }

      // Invalidar dades del user (num_shared_experiences)
      queryClient.invalidateQueries({ queryKey: ['users', 'detail'] });
    },
  });
}

/**
 * Hook per actualitzar una experiència
 * Actualitza l'experiència a la cache en lloc d'invalidar tota la llista
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
      const response = await ExperienceService.updateExperience(experienceId, request);
      return {
        experience: response.experience ? mapExperienceFromDTO(response.experience) : undefined,
        uploaded_files: response.uploaded_files,
        failed_files: response.failed_files,
        message: response.message,
        experienceId,
        refugeId,
        hasFiles: request.files && request.files.length > 0,
      };
    },
    onSuccess: (data) => {
      if (!data.experience) return;
      
      // Actualitzar l'experiència a la llista existent
      const queryKey = ['experiences', 'refuge', data.refugeId];
      
      queryClient.setQueryData<Experience[]>(queryKey, (oldData) => {
        if (!oldData) return [data.experience!];
        
        return oldData.map(exp => 
          exp.id === data.experienceId ? data.experience! : exp
        );
      });

      // Si es pugen fotos, invalidar el refugi (les fotos també es pengen al refugi)
      if (data.hasFiles) {
        queryClient.invalidateQueries({ queryKey: ['refuges', 'detail', data.refugeId] });
        queryClient.invalidateQueries({ queryKey: ['refugeMedia', data.refugeId] });
        // Invalidar filtres de refugis ja que les fotos afecten el refugi
        queryClient.invalidateQueries({ queryKey: ['refuges', 'list'] });
      }

      // Invalidar dades del user (uploaded_photos_keys)
      if (data.hasFiles) {
        queryClient.invalidateQueries({ queryKey: ['users', 'detail'] });
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
      const queryKey = ['experiences', 'refuge', refugeId];
      
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
