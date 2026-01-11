/**
 * Tests unitaris per als hooks useExperiencesQuery
 * 
 * Aquest fitxer cobreix:
 * - useExperiences: fetch experiències d'un refugi
 * - useCreateExperience: crear una experiència
 * - useUpdateExperience: actualitzar una experiència
 * - useDeleteExperience: eliminar una experiència
 */

import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useExperiences,
  useCreateExperience,
  useUpdateExperience,
  useDeleteExperience,
} from '../../../hooks/useExperiencesQuery';
import { ExperienceService } from '../../../services/ExperienceService';

// Mock ExperienceService
jest.mock('../../../services/ExperienceService', () => ({
  ExperienceService: {
    getExperiencesByRefuge: jest.fn(),
    createExperience: jest.fn(),
    updateExperience: jest.fn(),
    deleteExperience: jest.fn(),
  },
}));

// Mock del mapper
jest.mock('../../../services/mappers/ExperienceMapper', () => ({
  mapExperienceFromDTO: jest.fn((dto) => ({
    id: dto.id,
    refuge_id: dto.refuge_id,
    title: dto.title,
    description: dto.description,
    rating: dto.rating,
    creator_uid: dto.creator_uid,
    created_at: dto.created_at,
    modified_at: dto.modified_at,
  })),
}));

describe('useExperiencesQuery Hooks', () => {
  let queryClient: QueryClient;

  const mockExperienceDTO = {
    id: 'experience-1',
    refuge_id: 'refuge-1',
    title: 'Gran experiència',
    description: 'Descripció de la experiència',
    rating: 5,
    creator_uid: 'user-123',
    created_at: '2025-01-01T10:00:00Z',
    modified_at: '2025-01-01T10:00:00Z',
  };

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('useExperiences', () => {
    it('hauria de fer fetch de les experiències d\'un refugi', async () => {
      (ExperienceService.getExperiencesByRefuge as jest.Mock).mockResolvedValue([mockExperienceDTO]);

      const { result } = renderHook(() => useExperiences('refuge-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(ExperienceService.getExperiencesByRefuge).toHaveBeenCalledWith('refuge-1');
      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0].title).toBe('Gran experiència');
    });

    it('no hauria de fer fetch si no hi ha refugeId', async () => {
      const { result } = renderHook(() => useExperiences(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(ExperienceService.getExperiencesByRefuge).not.toHaveBeenCalled();
    });

    it('hauria de gestionar errors', async () => {
      (ExperienceService.getExperiencesByRefuge as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => useExperiences('refuge-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Network error');
    });

    it('hauria de retornar llista buida si no hi ha experiències', async () => {
      (ExperienceService.getExperiencesByRefuge as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => useExperiences('refuge-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(0);
    });
  });

  describe('useCreateExperience', () => {
    it('hauria de crear una nova experiència', async () => {
      (ExperienceService.createExperience as jest.Mock).mockResolvedValue({
        experience: mockExperienceDTO,
        uploaded_files: [],
        failed_files: [],
        message: 'Success',
      });

      const { result } = renderHook(() => useCreateExperience(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({
          refuge_id: 'refuge-1',
          title: 'Nova experiència',
          description: 'Descripció',
          rating: 4,
        });
      });

      expect(ExperienceService.createExperience).toHaveBeenCalled();
    });

    it('hauria d\'afegir l\'experiència a la cache', async () => {
      // Primer carreguem experiències existents
      (ExperienceService.getExperiencesByRefuge as jest.Mock).mockResolvedValue([mockExperienceDTO]);
      
      const { result: expResult } = renderHook(() => useExperiences('refuge-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(expResult.current.isSuccess).toBe(true);
      });

      // Ara creem una nova experiència
      const newExperienceDTO = { ...mockExperienceDTO, id: 'experience-new' };
      (ExperienceService.createExperience as jest.Mock).mockResolvedValue({
        experience: newExperienceDTO,
        uploaded_files: [],
        failed_files: [],
        message: 'Success',
      });

      const { result: createResult } = renderHook(() => useCreateExperience(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await createResult.current.mutateAsync({
          refuge_id: 'refuge-1',
          title: 'Nova experiència',
          description: 'Descripció',
          rating: 4,
        });
      });

      // Verifiquem que l'experiència s'ha afegit a la cache
      const cachedData = queryClient.getQueryData(['experiences', 'refuge', 'refuge-1']);
      expect(cachedData).toBeDefined();
    });

    it('hauria de gestionar errors de creació', async () => {
      (ExperienceService.createExperience as jest.Mock).mockRejectedValue(
        new Error('No tens permisos')
      );

      const { result } = renderHook(() => useCreateExperience(), {
        wrapper: createWrapper(),
      });

      let thrownError: Error | null = null;
      await act(async () => {
        try {
          await result.current.mutateAsync({
            refuge_id: 'refuge-1',
            title: 'Nova experiència',
            description: 'Descripció',
            rating: 4,
          });
        } catch (error) {
          thrownError = error as Error;
        }
      });

      expect(thrownError).not.toBeNull();
      expect(thrownError?.message).toBe('No tens permisos');
    });

    it('hauria de gestionar experiències amb fitxers', async () => {
      (ExperienceService.createExperience as jest.Mock).mockResolvedValue({
        experience: mockExperienceDTO,
        uploaded_files: ['file1.jpg', 'file2.jpg'],
        failed_files: [],
        message: 'Success',
      });

      const { result } = renderHook(() => useCreateExperience(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({
          refuge_id: 'refuge-1',
          title: 'Experiència amb fotos',
          description: 'Descripció',
          rating: 5,
          files: [{ uri: 'file://photo1.jpg', name: 'photo1.jpg', type: 'image/jpeg' }],
        });
      });

      expect(ExperienceService.createExperience).toHaveBeenCalled();
    });
  });

  describe('useUpdateExperience', () => {
    it('hauria d\'actualitzar una experiència', async () => {
      const updatedExperience = { ...mockExperienceDTO, title: 'Títol actualitzat' };
      (ExperienceService.updateExperience as jest.Mock).mockResolvedValue({
        experience: updatedExperience,
        uploaded_files: [],
        failed_files: [],
        message: 'Success',
      });

      const { result } = renderHook(() => useUpdateExperience(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({
          experienceId: 'experience-1',
          refugeId: 'refuge-1',
          request: { title: 'Títol actualitzat' },
        });
      });

      expect(ExperienceService.updateExperience).toHaveBeenCalledWith('experience-1', {
        title: 'Títol actualitzat',
      });
    });

    it('hauria de gestionar errors d\'actualització', async () => {
      (ExperienceService.updateExperience as jest.Mock).mockRejectedValue(
        new Error('Només el creador pot actualitzar')
      );

      const { result } = renderHook(() => useUpdateExperience(), {
        wrapper: createWrapper(),
      });

      let thrownError: Error | null = null;
      await act(async () => {
        try {
          await result.current.mutateAsync({
            experienceId: 'experience-1',
            refugeId: 'refuge-1',
            request: { title: 'Títol actualitzat' },
          });
        } catch (error) {
          thrownError = error as Error;
        }
      });

      expect(thrownError).not.toBeNull();
      expect(thrownError?.message).toBe('Només el creador pot actualitzar');
    });
  });

  describe('useDeleteExperience', () => {
    it('hauria d\'eliminar una experiència', async () => {
      (ExperienceService.deleteExperience as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteExperience(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({
          experienceId: 'experience-1',
          refugeId: 'refuge-1',
        });
      });

      expect(ExperienceService.deleteExperience).toHaveBeenCalledWith('experience-1');
    });

    it('hauria d\'eliminar l\'experiència de la cache', async () => {
      // Primer carreguem experiències existents
      (ExperienceService.getExperiencesByRefuge as jest.Mock).mockResolvedValue([mockExperienceDTO]);
      
      const { result: expResult } = renderHook(() => useExperiences('refuge-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(expResult.current.isSuccess).toBe(true);
      });

      // Ara eliminem l'experiència
      (ExperienceService.deleteExperience as jest.Mock).mockResolvedValue(undefined);

      const { result: deleteResult } = renderHook(() => useDeleteExperience(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await deleteResult.current.mutateAsync({
          experienceId: 'experience-1',
          refugeId: 'refuge-1',
        });
      });

      // Verifiquem que l'experiència s'ha eliminat de la cache
      const cachedData = queryClient.getQueryData<any[]>(['experiences', 'refuge', 'refuge-1']);
      expect(cachedData?.find(e => e.id === 'experience-1')).toBeUndefined();
    });

    it('hauria de gestionar errors d\'eliminació', async () => {
      (ExperienceService.deleteExperience as jest.Mock).mockRejectedValue(
        new Error('Només el creador pot eliminar')
      );

      const { result } = renderHook(() => useDeleteExperience(), {
        wrapper: createWrapper(),
      });

      let thrownError: Error | null = null;
      await act(async () => {
        try {
          await result.current.mutateAsync({
            experienceId: 'experience-1',
            refugeId: 'refuge-1',
          });
        } catch (error) {
          thrownError = error as Error;
        }
      });

      expect(thrownError).not.toBeNull();
      expect(thrownError?.message).toBe('Només el creador pot eliminar');
    });
  });
});
