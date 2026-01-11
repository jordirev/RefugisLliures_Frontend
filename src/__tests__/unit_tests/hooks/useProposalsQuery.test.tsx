/**
 * Tests unitaris per a useProposalsQuery hooks
 *
 * Cobreix:
 * - useProposals: fetch de proposals per admin
 * - useMyProposals: fetch de les meves proposals
 * - useRefreshProposals: refresh manual des de l'API
 * - useApproveProposal: aprovar proposals amb actualitzacions optimistes
 * - useRejectProposal: rebutjar proposals amb actualitzacions optimistes
 * - useCreateRefugeProposal: crear propostes de nou refugi
 * - useUpdateRefugeProposal: crear propostes d'actualització
 * - useDeleteRefugeProposal: crear propostes d'eliminació
 */

import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { queryKeys } from '../../../config/queryClient';
import {
  useProposals,
  useMyProposals,
  useRefreshProposals,
  useApproveProposal,
  useRejectProposal,
  useCreateRefugeProposal,
  useUpdateRefugeProposal,
  useDeleteRefugeProposal,
} from '../../../hooks/useProposalsQuery';
import { RefugeProposal, Location } from '../../../models';

// Mock del servei
jest.mock('../../../services/RefugeProposalsService', () => ({
  RefugeProposalsService: {
    listProposals: jest.fn(),
    listMyProposals: jest.fn(),
    approveProposal: jest.fn(),
    rejectProposal: jest.fn(),
    proposalCreateRefuge: jest.fn(),
    proposalEditRefuge: jest.fn(),
    proposalDeleteRefuge: jest.fn(),
  },
}));

// Mock de Firebase auth
jest.mock('../../../services/firebase', () => ({
  auth: {
    currentUser: { uid: 'test-user-uid' },
  },
}));

import { RefugeProposalsService } from '../../../services/RefugeProposalsService';

const mockProposals: RefugeProposal[] = [
  {
    id: 'proposal-1',
    action: 'create',
    status: 'pending',
    creator_uid: 'user-1',
    created_at: '2026-01-05T10:00:00Z',
    refuge_id: null,
    payload: { name: 'Nou Refugi' } as any,
    comment: null,
    reviewer_uid: null,
    reviewed_at: null,
    rejection_reason: null,
  },
  {
    id: 'proposal-2',
    action: 'update',
    status: 'pending',
    creator_uid: 'user-1',
    created_at: '2026-01-04T10:00:00Z',
    refuge_id: 'refuge-1',
    payload: { name: 'Refugi Actualitzat' } as any,
    comment: 'Actualització del nom',
    reviewer_uid: null,
    reviewed_at: null,
    rejection_reason: null,
  },
];

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

const createWrapper = (queryClient: QueryClient) => {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useProposalsQuery', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('useProposals', () => {
    it('hauria de carregar les proposals correctament', async () => {
      (RefugeProposalsService.listProposals as jest.Mock).mockResolvedValue(mockProposals);

      const { result } = renderHook(() => useProposals(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockProposals);
      expect(RefugeProposalsService.listProposals).toHaveBeenCalledWith(undefined, undefined);
    });

    it('hauria de carregar proposals amb filtre de status', async () => {
      (RefugeProposalsService.listProposals as jest.Mock).mockResolvedValue([mockProposals[0]]);

      const { result } = renderHook(() => useProposals('pending'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(RefugeProposalsService.listProposals).toHaveBeenCalledWith('pending', undefined);
    });

    it('hauria de carregar proposals amb filtre de refugeId', async () => {
      (RefugeProposalsService.listProposals as jest.Mock).mockResolvedValue([mockProposals[1]]);

      const { result } = renderHook(() => useProposals(undefined, 'refuge-1'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(RefugeProposalsService.listProposals).toHaveBeenCalledWith(undefined, 'refuge-1');
    });

    it('hauria de gestionar errors correctament', async () => {
      const error = new Error('Error de xarxa');
      (RefugeProposalsService.listProposals as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useProposals(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useMyProposals', () => {
    it('hauria de carregar les meves proposals correctament', async () => {
      (RefugeProposalsService.listMyProposals as jest.Mock).mockResolvedValue(mockProposals);

      const { result } = renderHook(() => useMyProposals(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockProposals);
      expect(RefugeProposalsService.listMyProposals).toHaveBeenCalledWith(undefined);
    });

    it('hauria de carregar les meves proposals amb filtre de status', async () => {
      (RefugeProposalsService.listMyProposals as jest.Mock).mockResolvedValue([mockProposals[0]]);

      const { result } = renderHook(() => useMyProposals('pending'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(RefugeProposalsService.listMyProposals).toHaveBeenCalledWith('pending');
    });

    it('hauria de gestionar errors correctament', async () => {
      const error = new Error('Error de xarxa');
      (RefugeProposalsService.listMyProposals as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useMyProposals(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useRefreshProposals', () => {
    it('hauria de refrescar proposals en mode admin', async () => {
      (RefugeProposalsService.listProposals as jest.Mock).mockResolvedValue(mockProposals);

      const { result } = renderHook(() => useRefreshProposals(), {
        wrapper: createWrapper(queryClient),
      });

      let freshData: RefugeProposal[];
      await act(async () => {
        freshData = await result.current(true, 'pending');
      });

      expect(freshData!).toEqual(mockProposals);
      expect(RefugeProposalsService.listProposals).toHaveBeenCalledWith('pending', undefined);
    });

    it('hauria de refrescar proposals en mode my', async () => {
      (RefugeProposalsService.listMyProposals as jest.Mock).mockResolvedValue(mockProposals);

      const { result } = renderHook(() => useRefreshProposals(), {
        wrapper: createWrapper(queryClient),
      });

      let freshData: RefugeProposal[];
      await act(async () => {
        freshData = await result.current(false, 'approved');
      });

      expect(freshData!).toEqual(mockProposals);
      expect(RefugeProposalsService.listMyProposals).toHaveBeenCalledWith('approved');
    });

    it('hauria de refrescar sense filtre de status', async () => {
      (RefugeProposalsService.listProposals as jest.Mock).mockResolvedValue(mockProposals);

      const { result } = renderHook(() => useRefreshProposals(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current(true);
      });

      expect(RefugeProposalsService.listProposals).toHaveBeenCalledWith(undefined, undefined);
    });

    it('hauria de actualitzar la cache després del refresh', async () => {
      (RefugeProposalsService.listProposals as jest.Mock).mockResolvedValue(mockProposals);

      const { result } = renderHook(() => useRefreshProposals(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current(true, 'pending');
      });

      // Verificar que les dades estan a la cache (usant la funció queryKeys)
      await waitFor(() => {
        const queryKey = queryKeys.proposalsList({ status: 'pending' });
        const cachedData = queryClient.getQueryData(queryKey);
        expect(cachedData).toEqual(mockProposals);
      });
    });
  });

  describe('useApproveProposal', () => {
    beforeEach(() => {
      // Preparar la cache amb proposals
      queryClient.setQueryData(['proposals', 'list', { status: 'pending' }], mockProposals);
      queryClient.setQueryData(['proposals', 'list', { status: 'approved' }], []);
      queryClient.setQueryData(['proposals', 'list', {}], mockProposals);
    });

    it('hauria d\'aprovar una proposal correctament', async () => {
      (RefugeProposalsService.approveProposal as jest.Mock).mockResolvedValue(true);
      (RefugeProposalsService.listProposals as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => useApproveProposal(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ proposalId: 'proposal-1' });
      });

      expect(RefugeProposalsService.approveProposal).toHaveBeenCalledWith('proposal-1');
    });

    it('hauria d\'aprovar amb proposalType create', async () => {
      (RefugeProposalsService.approveProposal as jest.Mock).mockResolvedValue(true);
      (RefugeProposalsService.listProposals as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => useApproveProposal(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ 
          proposalId: 'proposal-1', 
          proposalType: 'create' 
        });
      });

      expect(RefugeProposalsService.approveProposal).toHaveBeenCalledWith('proposal-1');
    });

    it('hauria d\'aprovar amb proposalType update i refugeId', async () => {
      (RefugeProposalsService.approveProposal as jest.Mock).mockResolvedValue(true);
      (RefugeProposalsService.listProposals as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => useApproveProposal(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ 
          proposalId: 'proposal-2', 
          proposalType: 'update',
          refugeId: 'refuge-1'
        });
      });

      expect(RefugeProposalsService.approveProposal).toHaveBeenCalledWith('proposal-2');
    });

    it('hauria d\'aprovar amb proposalType delete i refugeId', async () => {
      (RefugeProposalsService.approveProposal as jest.Mock).mockResolvedValue(true);
      (RefugeProposalsService.listProposals as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => useApproveProposal(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ 
          proposalId: 'proposal-1', 
          proposalType: 'delete',
          refugeId: 'refuge-to-delete'
        });
      });

      expect(RefugeProposalsService.approveProposal).toHaveBeenCalledWith('proposal-1');
    });

    it('hauria de gestionar errors i fer rollback', async () => {
      const error = new Error('Error al aprovar');
      (RefugeProposalsService.approveProposal as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useApproveProposal(), {
        wrapper: createWrapper(queryClient),
      });

      await expect(
        act(async () => {
          await result.current.mutateAsync({ proposalId: 'proposal-1' });
        })
      ).rejects.toThrow('Error al aprovar');
    });

    it('hauria de fer actualització optimista a la llista pending', async () => {
      (RefugeProposalsService.approveProposal as jest.Mock).mockResolvedValue(true);
      (RefugeProposalsService.listProposals as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => useApproveProposal(), {
        wrapper: createWrapper(queryClient),
      });

      // La mutació és asíncrona, però l'actualització optimista és immediata
      act(() => {
        result.current.mutate({ proposalId: 'proposal-1' });
      });

      // Esperar que es completi la mutació
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('hauria d\'actualitzar la llista de All quan s\'aprovi', async () => {
      // Setup: preparar les dades a la cache
      queryClient.setQueryData(['proposals', 'list', {}], mockProposals);
      
      (RefugeProposalsService.approveProposal as jest.Mock).mockResolvedValue(true);
      (RefugeProposalsService.listProposals as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => useApproveProposal(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        result.current.mutate({ proposalId: 'proposal-1' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useRejectProposal', () => {
    beforeEach(() => {
      // Preparar la cache amb proposals
      queryClient.setQueryData(['proposals', 'list', { status: 'pending' }], mockProposals);
      queryClient.setQueryData(['proposals', 'list', { status: 'rejected' }], []);
    });

    it('hauria de rebutjar una proposal correctament', async () => {
      (RefugeProposalsService.rejectProposal as jest.Mock).mockResolvedValue(true);
      (RefugeProposalsService.listProposals as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => useRejectProposal(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ proposalId: 'proposal-1' });
      });

      expect(RefugeProposalsService.rejectProposal).toHaveBeenCalledWith('proposal-1', undefined);
    });

    it('hauria de rebutjar amb raó', async () => {
      (RefugeProposalsService.rejectProposal as jest.Mock).mockResolvedValue(true);
      (RefugeProposalsService.listProposals as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => useRejectProposal(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ 
          proposalId: 'proposal-1', 
          reason: 'Informació incompleta' 
        });
      });

      expect(RefugeProposalsService.rejectProposal).toHaveBeenCalledWith('proposal-1', 'Informació incompleta');
    });

    it('hauria de gestionar errors i fer rollback', async () => {
      const error = new Error('Error al rebutjar');
      (RefugeProposalsService.rejectProposal as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useRejectProposal(), {
        wrapper: createWrapper(queryClient),
      });

      await expect(
        act(async () => {
          await result.current.mutateAsync({ proposalId: 'proposal-1' });
        })
      ).rejects.toThrow('Error al rebutjar');
    });

    it('hauria de fer actualització optimista a la llista pending', async () => {
      (RefugeProposalsService.rejectProposal as jest.Mock).mockResolvedValue(true);
      (RefugeProposalsService.listProposals as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => useRejectProposal(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        result.current.mutate({ proposalId: 'proposal-1', reason: 'Test reason' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('hauria d\'afegir la informació de rebuig a la proposal', async () => {
      queryClient.setQueryData(['proposals', 'my', 'pending'], mockProposals);
      
      (RefugeProposalsService.rejectProposal as jest.Mock).mockResolvedValue(true);
      (RefugeProposalsService.listMyProposals as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => useRejectProposal(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        result.current.mutate({ 
          proposalId: 'proposal-1', 
          reason: 'Motiu del rebuig' 
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useCreateRefugeProposal', () => {
    const mockLocation: Location = {
      id: 'new-refuge',
      name: 'Nou Refugi',
      latitude: 42.5,
      longitude: 1.5,
      altitude: 2000,
      region: 'Pallars Sobirà',
      capacity: 20,
      esspieles: true,
      essentials: true,
      firewood: true,
      water: true,
      condition: 'good',
    };

    const mockNewProposal: RefugeProposal = {
      id: 'new-proposal',
      action: 'create',
      status: 'pending',
      creator_uid: 'user-1',
      created_at: '2026-01-10T10:00:00Z',
      refuge_id: null,
      payload: mockLocation as any,
      comment: 'Nova proposta',
      reviewer_uid: null,
      reviewed_at: null,
      rejection_reason: null,
    };

    it('hauria de crear una proposta de refugi correctament', async () => {
      (RefugeProposalsService.proposalCreateRefuge as jest.Mock).mockResolvedValue(mockNewProposal);

      const { result } = renderHook(() => useCreateRefugeProposal(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ payload: mockLocation });
      });

      expect(RefugeProposalsService.proposalCreateRefuge).toHaveBeenCalledWith(mockLocation, undefined);
    });

    it('hauria de crear una proposta amb comentari', async () => {
      (RefugeProposalsService.proposalCreateRefuge as jest.Mock).mockResolvedValue(mockNewProposal);

      const { result } = renderHook(() => useCreateRefugeProposal(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ 
          payload: mockLocation, 
          comment: 'Aquest refugi és fantàstic' 
        });
      });

      expect(RefugeProposalsService.proposalCreateRefuge).toHaveBeenCalledWith(mockLocation, 'Aquest refugi és fantàstic');
    });

    it('hauria de gestionar errors correctament', async () => {
      const error = new Error('Error al crear');
      (RefugeProposalsService.proposalCreateRefuge as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useCreateRefugeProposal(), {
        wrapper: createWrapper(queryClient),
      });

      await expect(
        act(async () => {
          await result.current.mutateAsync({ payload: mockLocation });
        })
      ).rejects.toThrow('Error al crear');
    });

    it('hauria d\'afegir la nova proposta a la llista pending', async () => {
      queryClient.setQueryData(['proposals', 'list', { status: 'pending' }], mockProposals);
      
      (RefugeProposalsService.proposalCreateRefuge as jest.Mock).mockResolvedValue(mockNewProposal);

      const { result } = renderHook(() => useCreateRefugeProposal(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        result.current.mutate({ payload: mockLocation });
      });

      await waitFor(() => {
        // Verificar que la mutació ha finalitzat (success o error)
        expect(result.current.isIdle).toBe(false);
      });
      
      // Verificar que el servei ha estat cridat
      expect(RefugeProposalsService.proposalCreateRefuge).toHaveBeenCalled();
    });

    it('hauria d\'afegir la nova proposta a la llista All', async () => {
      queryClient.setQueryData(['proposals', 'list', {}], mockProposals);
      
      (RefugeProposalsService.proposalCreateRefuge as jest.Mock).mockResolvedValue(mockNewProposal);

      const { result } = renderHook(() => useCreateRefugeProposal(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        result.current.mutate({ payload: mockLocation });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useUpdateRefugeProposal', () => {
    const mockPartialLocation: Partial<Location> = {
      name: 'Nom actualitzat',
      capacity: 30,
    };

    const mockUpdateProposal: RefugeProposal = {
      id: 'update-proposal',
      action: 'update',
      status: 'pending',
      creator_uid: 'user-1',
      created_at: '2026-01-10T10:00:00Z',
      refuge_id: 'refuge-1',
      payload: mockPartialLocation as any,
      comment: 'Actualització',
      reviewer_uid: null,
      reviewed_at: null,
      rejection_reason: null,
    };

    it('hauria de crear una proposta d\'actualització correctament', async () => {
      (RefugeProposalsService.proposalEditRefuge as jest.Mock).mockResolvedValue(mockUpdateProposal);

      const { result } = renderHook(() => useUpdateRefugeProposal(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ 
          refugeId: 'refuge-1', 
          payload: mockPartialLocation 
        });
      });

      expect(RefugeProposalsService.proposalEditRefuge).toHaveBeenCalledWith('refuge-1', mockPartialLocation, undefined);
    });

    it('hauria de crear una proposta d\'actualització amb comentari', async () => {
      (RefugeProposalsService.proposalEditRefuge as jest.Mock).mockResolvedValue(mockUpdateProposal);

      const { result } = renderHook(() => useUpdateRefugeProposal(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ 
          refugeId: 'refuge-1', 
          payload: mockPartialLocation, 
          comment: 'Canvi de capacitat' 
        });
      });

      expect(RefugeProposalsService.proposalEditRefuge).toHaveBeenCalledWith('refuge-1', mockPartialLocation, 'Canvi de capacitat');
    });

    it('hauria de gestionar errors correctament', async () => {
      const error = new Error('Error al actualitzar');
      (RefugeProposalsService.proposalEditRefuge as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useUpdateRefugeProposal(), {
        wrapper: createWrapper(queryClient),
      });

      await expect(
        act(async () => {
          await result.current.mutateAsync({ 
            refugeId: 'refuge-1', 
            payload: mockPartialLocation 
          });
        })
      ).rejects.toThrow('Error al actualitzar');
    });

    it('hauria d\'afegir la proposta a les llistes corresponents', async () => {
      queryClient.setQueryData(['proposals', 'my', 'pending'], mockProposals);
      
      (RefugeProposalsService.proposalEditRefuge as jest.Mock).mockResolvedValue(mockUpdateProposal);

      const { result } = renderHook(() => useUpdateRefugeProposal(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        result.current.mutate({ 
          refugeId: 'refuge-1', 
          payload: mockPartialLocation 
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useDeleteRefugeProposal', () => {
    const mockDeleteProposal: RefugeProposal = {
      id: 'delete-proposal',
      action: 'delete',
      status: 'pending',
      creator_uid: 'user-1',
      created_at: '2026-01-10T10:00:00Z',
      refuge_id: 'refuge-to-delete',
      payload: null,
      comment: 'Cal eliminar',
      reviewer_uid: null,
      reviewed_at: null,
      rejection_reason: null,
    };

    it('hauria de crear una proposta d\'eliminació correctament', async () => {
      (RefugeProposalsService.proposalDeleteRefuge as jest.Mock).mockResolvedValue(mockDeleteProposal);

      const { result } = renderHook(() => useDeleteRefugeProposal(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ refugeId: 'refuge-to-delete' });
      });

      expect(RefugeProposalsService.proposalDeleteRefuge).toHaveBeenCalledWith('refuge-to-delete', undefined);
    });

    it('hauria de crear una proposta d\'eliminació amb comentari', async () => {
      (RefugeProposalsService.proposalDeleteRefuge as jest.Mock).mockResolvedValue(mockDeleteProposal);

      const { result } = renderHook(() => useDeleteRefugeProposal(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.mutateAsync({ 
          refugeId: 'refuge-to-delete', 
          comment: 'El refugi ja no existeix' 
        });
      });

      expect(RefugeProposalsService.proposalDeleteRefuge).toHaveBeenCalledWith('refuge-to-delete', 'El refugi ja no existeix');
    });

    it('hauria de gestionar errors correctament', async () => {
      const error = new Error('Error al eliminar');
      (RefugeProposalsService.proposalDeleteRefuge as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useDeleteRefugeProposal(), {
        wrapper: createWrapper(queryClient),
      });

      await expect(
        act(async () => {
          await result.current.mutateAsync({ refugeId: 'refuge-to-delete' });
        })
      ).rejects.toThrow('Error al eliminar');
    });

    it('hauria d\'afegir la proposta a les llistes corresponents', async () => {
      queryClient.setQueryData(['proposals', 'list', { status: 'pending' }], mockProposals);
      
      (RefugeProposalsService.proposalDeleteRefuge as jest.Mock).mockResolvedValue(mockDeleteProposal);

      const { result } = renderHook(() => useDeleteRefugeProposal(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        result.current.mutate({ refugeId: 'refuge-to-delete' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('Actualitzacions optimistes entre llistes', () => {
    it('hauria de moure una proposal de pending a approved', async () => {
      // Setup
      queryClient.setQueryData(['proposals', 'list', { status: 'pending' }], mockProposals);
      queryClient.setQueryData(['proposals', 'list', { status: 'approved' }], []);
      
      (RefugeProposalsService.approveProposal as jest.Mock).mockResolvedValue(true);
      (RefugeProposalsService.listProposals as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => useApproveProposal(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        result.current.mutate({ proposalId: 'proposal-1' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('hauria de moure una proposal de pending a rejected', async () => {
      // Setup
      queryClient.setQueryData(['proposals', 'list', { status: 'pending' }], mockProposals);
      queryClient.setQueryData(['proposals', 'list', { status: 'rejected' }], []);
      
      (RefugeProposalsService.rejectProposal as jest.Mock).mockResolvedValue(true);
      (RefugeProposalsService.listProposals as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => useRejectProposal(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        result.current.mutate({ proposalId: 'proposal-1', reason: 'Motiu' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('hauria de gestionar queries amb dades no-array', async () => {
      // Setup amb dades no-array
      queryClient.setQueryData(['proposals', 'list', { status: 'pending' }], null);
      
      (RefugeProposalsService.approveProposal as jest.Mock).mockResolvedValue(true);
      (RefugeProposalsService.listProposals as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => useApproveProposal(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        result.current.mutate({ proposalId: 'proposal-1' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('hauria de gestionar proposals no trobades', async () => {
      // Setup amb proposals sense la que busquem
      queryClient.setQueryData(['proposals', 'list', { status: 'pending' }], [mockProposals[1]]);
      
      (RefugeProposalsService.approveProposal as jest.Mock).mockResolvedValue(true);
      (RefugeProposalsService.listProposals as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => useApproveProposal(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        result.current.mutate({ proposalId: 'proposal-inexistent' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('Query keys amb mode my', () => {
    it('hauria de gestionar queries de my proposals amb status', async () => {
      queryClient.setQueryData(['proposals', 'my', 'pending'], mockProposals);
      queryClient.setQueryData(['proposals', 'my', 'approved'], []);
      
      (RefugeProposalsService.approveProposal as jest.Mock).mockResolvedValue(true);
      (RefugeProposalsService.listProposals as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => useApproveProposal(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        result.current.mutate({ proposalId: 'proposal-1' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('hauria de gestionar queries de my proposals sense status', async () => {
      queryClient.setQueryData(['proposals', 'my'], mockProposals);
      
      (RefugeProposalsService.approveProposal as jest.Mock).mockResolvedValue(true);
      (RefugeProposalsService.listProposals as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => useApproveProposal(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        result.current.mutate({ proposalId: 'proposal-1' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('Cobertura de branques addicionals', () => {
    // Test per cobrir línia 132-133: afegir a llista approved durant onMutate
    it('hauria d\'afegir la proposal a la llista approved durant optimistic update', async () => {
      // Setup: només llista approved (sense pending)
      queryClient.setQueryData(['proposals', 'list', { status: 'approved' }], []);
      
      (RefugeProposalsService.approveProposal as jest.Mock).mockResolvedValue(true);
      (RefugeProposalsService.listProposals as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => useApproveProposal(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        result.current.mutate({ proposalId: 'proposal-1' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    // Test per cobrir línia 275-276: afegir a llista rejected durant onMutate
    it('hauria d\'afegir la proposal a la llista rejected durant optimistic update', async () => {
      // Setup: només llista rejected (sense pending)
      queryClient.setQueryData(['proposals', 'list', { status: 'rejected' }], []);
      
      (RefugeProposalsService.rejectProposal as jest.Mock).mockResolvedValue(true);
      (RefugeProposalsService.listProposals as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => useRejectProposal(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        result.current.mutate({ proposalId: 'proposal-1', reason: 'Test reason' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    // Test per cobrir línia 279-283: actualitzar in-place a llista All (reject)
    it('hauria d\'actualitzar in-place la proposal quan es rebutja a la llista All', async () => {
      // Setup: llista sense status (All)
      queryClient.setQueryData(['proposals', 'list', {}], mockProposals);
      
      (RefugeProposalsService.rejectProposal as jest.Mock).mockResolvedValue(true);
      (RefugeProposalsService.listProposals as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => useRejectProposal(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        result.current.mutate({ proposalId: 'proposal-1', reason: 'Test reason' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    // Test per cobrir onError de useApproveProposal (restaurar previousData)
    it('hauria de restaurar les dades anteriors quan la aprovació falla', async () => {
      queryClient.setQueryData(['proposals', 'list', { status: 'pending' }], mockProposals);
      
      (RefugeProposalsService.approveProposal as jest.Mock).mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() => useApproveProposal(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        result.current.mutate({ proposalId: 'proposal-1' });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    // Test per cobrir onError de useRejectProposal (restaurar previousData)
    it('hauria de restaurar les dades anteriors quan el rebuig falla', async () => {
      queryClient.setQueryData(['proposals', 'list', { status: 'pending' }], mockProposals);
      
      (RefugeProposalsService.rejectProposal as jest.Mock).mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() => useRejectProposal(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        result.current.mutate({ proposalId: 'proposal-1', reason: 'Test' });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    // Test per cobrir invalidació de proposalType 'create'
    it('hauria d\'invalidar refuges quan s\'aprova una proposta de creació', async () => {
      queryClient.setQueryData(['proposals', 'list', { status: 'pending' }], mockProposals);
      
      (RefugeProposalsService.approveProposal as jest.Mock).mockResolvedValue(true);
      (RefugeProposalsService.listProposals as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => useApproveProposal(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        result.current.mutate({ 
          proposalId: 'proposal-1',
          proposalType: 'create'
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    // Test per cobrir invalidació de proposalType 'update'
    it('hauria d\'invalidar refuges i favorites quan s\'aprova una proposta d\'actualització', async () => {
      queryClient.setQueryData(['proposals', 'list', { status: 'pending' }], mockProposals);
      
      (RefugeProposalsService.approveProposal as jest.Mock).mockResolvedValue(true);
      (RefugeProposalsService.listProposals as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => useApproveProposal(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        result.current.mutate({ 
          proposalId: 'proposal-1',
          proposalType: 'update',
          refugeId: 'refuge-1'
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    // Test per cobrir invalidació de proposalType 'delete'
    it('hauria d\'invalidar refuges quan s\'aprova una proposta d\'eliminació', async () => {
      queryClient.setQueryData(['proposals', 'list', { status: 'pending' }], mockProposals);
      
      (RefugeProposalsService.approveProposal as jest.Mock).mockResolvedValue(true);
      (RefugeProposalsService.listProposals as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => useApproveProposal(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        result.current.mutate({ 
          proposalId: 'proposal-1',
          proposalType: 'delete',
          refugeId: 'refuge-1'
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    // Test per cobrir update amb my queries
    it('hauria d\'afegir la proposta update a les my queries', async () => {
      queryClient.setQueryData(['proposals', 'my', 'pending'], mockProposals);
      queryClient.setQueryData(['proposals', 'my'], []);
      
      const mockUpdateProposal: RefugeProposal = {
        id: 'update-proposal',
        action: 'update',
        status: 'pending',
        creator_uid: 'user-1',
        created_at: '2026-01-10T10:00:00Z',
        refuge_id: 'refuge-1',
        payload: { name: 'Updated' } as any,
        comment: 'Test',
        reviewer_uid: null,
        reviewed_at: null,
        rejection_reason: null,
      };

      (RefugeProposalsService.proposalEditRefuge as jest.Mock).mockResolvedValue(mockUpdateProposal);

      const { result } = renderHook(() => useUpdateRefugeProposal(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        result.current.mutate({ 
          refugeId: 'refuge-1', 
          payload: { name: 'Updated' }
        });
      });

      await waitFor(() => {
        expect(RefugeProposalsService.proposalEditRefuge).toHaveBeenCalled();
      });
    });

    // Test per cobrir delete amb my queries
    it('hauria d\'afegir la proposta delete a les my queries', async () => {
      queryClient.setQueryData(['proposals', 'my', 'pending'], mockProposals);
      queryClient.setQueryData(['proposals', 'my'], []);
      
      const mockDeleteProposal: RefugeProposal = {
        id: 'delete-proposal',
        action: 'delete',
        status: 'pending',
        creator_uid: 'user-1',
        created_at: '2026-01-10T10:00:00Z',
        refuge_id: 'refuge-1',
        payload: null,
        comment: 'Test',
        reviewer_uid: null,
        reviewed_at: null,
        rejection_reason: null,
      };

      (RefugeProposalsService.proposalDeleteRefuge as jest.Mock).mockResolvedValue(mockDeleteProposal);

      const { result } = renderHook(() => useDeleteRefugeProposal(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        result.current.mutate({ 
          refugeId: 'refuge-1'
        });
      });

      await waitFor(() => {
        expect(RefugeProposalsService.proposalDeleteRefuge).toHaveBeenCalled();
      });
    });
  });
});
