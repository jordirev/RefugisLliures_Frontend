/**
 * Tests unitaris per als hooks useRenovationsQuery
 * 
 * Aquest fitxer cobreix:
 * - useRenovations: fetch totes les renovacions
 * - useRenovation: fetch una renovació per ID
 * - useRefugeRenovations: fetch renovacions d'un refugi
 * - useCreateRenovation: crear una nova renovació
 * - useUpdateRenovation: actualitzar una renovació
 * - useDeleteRenovation: eliminar una renovació
 * - useJoinRenovation: unir-se a una renovació
 * - useLeaveRenovation: sortir d'una renovació
 */

import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useRenovations,
  useRenovation,
  useRefugeRenovations,
  useCreateRenovation,
  useUpdateRenovation,
  useDeleteRenovation,
  useJoinRenovation,
  useLeaveRenovation,
} from '../../../hooks/useRenovationsQuery';
import { RenovationService } from '../../../services/RenovationService';

// Mock RenovationService
jest.mock('../../../services/RenovationService', () => ({
  RenovationService: {
    getAllRenovations: jest.fn(),
    getRenovationById: jest.fn(),
    getRenovationsByRefugeId: jest.fn(),
    createRenovation: jest.fn(),
    updateRenovation: jest.fn(),
    deleteRenovation: jest.fn(),
    joinRenovation: jest.fn(),
    removeParticipant: jest.fn(),
  },
}));

// Mock del mapper
jest.mock('../../../services/mappers/RenovationMapper', () => ({
  mapRenovationFromDTO: jest.fn((dto) => ({
    id: dto.id,
    refuge_id: dto.refuge_id,
    ini_date: dto.ini_date,
    fin_date: dto.fin_date,
    description: dto.description,
    creator_uid: dto.creator_uid,
    participants_uids: dto.participants_uids,
  })),
}));

describe('useRenovationsQuery Hooks', () => {
  let queryClient: QueryClient;

  const mockRenovationDTO = {
    id: 'renovation-1',
    refuge_id: 'refuge-1',
    ini_date: '2025-07-01',
    fin_date: '2025-07-05',
    description: 'Renovació de prova',
    creator_uid: 'user-123',
    participants_uids: ['user-123'],
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

  describe('useRenovations', () => {
    it('hauria de fer fetch de totes les renovacions', async () => {
      (RenovationService.getAllRenovations as jest.Mock).mockResolvedValue([mockRenovationDTO]);

      const { result } = renderHook(() => useRenovations(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(RenovationService.getAllRenovations).toHaveBeenCalled();
      expect(result.current.data).toHaveLength(1);
      expect(result.current.data?.[0].id).toBe('renovation-1');
    });

    it('hauria de retornar llista buida si no hi ha renovacions', async () => {
      (RenovationService.getAllRenovations as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => useRenovations(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(0);
    });

    it('hauria de gestionar errors', async () => {
      (RenovationService.getAllRenovations as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => useRenovations(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Network error');
    });
  });

  describe('useRenovation', () => {
    it('hauria de fer fetch d\'una renovació per ID', async () => {
      (RenovationService.getRenovationById as jest.Mock).mockResolvedValue(mockRenovationDTO);

      const { result } = renderHook(() => useRenovation('renovation-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(RenovationService.getRenovationById).toHaveBeenCalledWith('renovation-1');
      expect(result.current.data?.id).toBe('renovation-1');
    });

    it('no hauria de fer fetch si no hi ha ID', async () => {
      const { result } = renderHook(() => useRenovation(undefined), {
        wrapper: createWrapper(),
      });

      // La query hauria d'estar deshabilitada
      expect(result.current.fetchStatus).toBe('idle');
      expect(RenovationService.getRenovationById).not.toHaveBeenCalled();
    });

    it('hauria de gestionar error quan no es troba la renovació', async () => {
      (RenovationService.getRenovationById as jest.Mock).mockResolvedValue(null);

      const { result } = renderHook(() => useRenovation('nonexistent'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Renovation not found');
    });
  });

  describe('useRefugeRenovations', () => {
    it('hauria de fer fetch de renovacions per refugi', async () => {
      (RenovationService.getRenovationsByRefugeId as jest.Mock).mockResolvedValue([mockRenovationDTO]);

      const { result } = renderHook(() => useRefugeRenovations('refuge-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(RenovationService.getRenovationsByRefugeId).toHaveBeenCalledWith('refuge-1');
      expect(result.current.data).toHaveLength(1);
    });

    it('no hauria de fer fetch si no hi ha refugeId', async () => {
      const { result } = renderHook(() => useRefugeRenovations(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(RenovationService.getRenovationsByRefugeId).not.toHaveBeenCalled();
    });
  });

  describe('useCreateRenovation', () => {
    it('hauria de crear una renovació', async () => {
      (RenovationService.createRenovation as jest.Mock).mockResolvedValue(mockRenovationDTO);

      const { result } = renderHook(() => useCreateRenovation(), {
        wrapper: createWrapper(),
      });

      let mutationResult: any;
      await act(async () => {
        mutationResult = await result.current.mutateAsync({
          refuge_id: 'refuge-1',
          ini_date: '2025-07-01',
          fin_date: '2025-07-05',
          description: 'Nova renovació',
        });
      });

      expect(RenovationService.createRenovation).toHaveBeenCalled();
      expect(mutationResult?.id).toBe('renovation-1');
    });

    it('hauria de gestionar errors de creació', async () => {
      (RenovationService.createRenovation as jest.Mock).mockRejectedValue(
        new Error('Validation error')
      );

      const { result } = renderHook(() => useCreateRenovation(), {
        wrapper: createWrapper(),
      });

      let thrownError: Error | null = null;
      await act(async () => {
        try {
          await result.current.mutateAsync({
            refuge_id: 'refuge-1',
            ini_date: '2025-07-01',
            fin_date: '2025-07-05',
          });
        } catch (error) {
          thrownError = error as Error;
        }
      });

      expect(thrownError).not.toBeNull();
      expect(thrownError?.message).toBe('Validation error');
    });
  });

  describe('useUpdateRenovation', () => {
    it('hauria d\'actualitzar una renovació', async () => {
      const updatedRenovation = { ...mockRenovationDTO, description: 'Actualitzada' };
      (RenovationService.updateRenovation as jest.Mock).mockResolvedValue(updatedRenovation);

      const { result } = renderHook(() => useUpdateRenovation(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({
          id: 'renovation-1',
          updates: { description: 'Actualitzada' },
        });
      });

      expect(RenovationService.updateRenovation).toHaveBeenCalledWith('renovation-1', {
        description: 'Actualitzada',
      });
    });
  });

  describe('useDeleteRenovation', () => {
    it('hauria d\'eliminar una renovació', async () => {
      (RenovationService.deleteRenovation as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteRenovation(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({
          id: 'renovation-1',
          refugeId: 'refuge-1',
        });
      });

      expect(RenovationService.deleteRenovation).toHaveBeenCalledWith('renovation-1');
    });
  });

  describe('useJoinRenovation', () => {
    it('hauria de permetre unir-se a una renovació', async () => {
      const joinedRenovation = {
        ...mockRenovationDTO,
        participants_uids: ['user-123', 'user-new'],
      };
      (RenovationService.joinRenovation as jest.Mock).mockResolvedValue(joinedRenovation);

      const { result } = renderHook(() => useJoinRenovation(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync('renovation-1');
      });

      expect(RenovationService.joinRenovation).toHaveBeenCalledWith('renovation-1');
    });

    it('hauria de gestionar error si ja és participant', async () => {
      (RenovationService.joinRenovation as jest.Mock).mockRejectedValue(
        new Error("L'usuari ja és participant")
      );

      const { result } = renderHook(() => useJoinRenovation(), {
        wrapper: createWrapper(),
      });

      let thrownError: Error | null = null;
      await act(async () => {
        try {
          await result.current.mutateAsync('renovation-1');
        } catch (error) {
          thrownError = error as Error;
        }
      });

      expect(thrownError).not.toBeNull();
      expect(thrownError?.message).toBe("L'usuari ja és participant");
    });
  });

  describe('useLeaveRenovation', () => {
    it('hauria de permetre sortir d\'una renovació', async () => {
      const leftRenovation = {
        ...mockRenovationDTO,
        participants_uids: ['user-123'],
      };
      (RenovationService.removeParticipant as jest.Mock).mockResolvedValue(leftRenovation);

      const { result } = renderHook(() => useLeaveRenovation(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({
          renovationId: 'renovation-1',
          participantUid: 'user-other',
        });
      });

      expect(RenovationService.removeParticipant).toHaveBeenCalledWith(
        'renovation-1',
        'user-other'
      );
    });
  });
});
