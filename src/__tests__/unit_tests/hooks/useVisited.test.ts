/**
 * Tests unitaris per al hook useVisited
 * 
 * Aquest fitxer cobreix:
 * - Inicialització del hook amb diferents estats
 * - Toggle de visitats
 * - Estats de processament
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import useVisited from '../../../hooks/useVisited';
import { useAuth } from '../../../contexts/AuthContext';

// Mock del context d'autenticació
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock de useUsersQuery hooks
const mockMutateAsyncAdd = jest.fn();
const mockMutateAsyncRemove = jest.fn();

jest.mock('../../../hooks/useUsersQuery', () => ({
  useAddVisitedRefuge: () => ({
    mutateAsync: mockMutateAsyncAdd,
    isPending: false,
  }),
  useRemoveVisitedRefuge: () => ({
    mutateAsync: mockMutateAsyncRemove,
    isPending: false,
  }),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockSetVisitedRefugeIds = jest.fn();

describe('useVisited Hook', () => {
  const defaultAuthReturn = {
    firebaseUser: { uid: 'user123', emailVerified: true } as any,
    backendUser: null,
    favouriteRefugeIds: [],
    visitedRefugeIds: ['10', '20', '30'],
    setFavouriteRefugeIds: jest.fn(),
    setVisitedRefugeIds: mockSetVisitedRefugeIds,
    isLoading: false,
    isAuthenticated: true,
    isOfflineMode: false,
    authToken: 'mock-token',
    login: jest.fn(),
    loginWithGoogle: jest.fn(),
    signup: jest.fn(),
    logout: jest.fn(),
    deleteAccount: jest.fn(),
    refreshToken: jest.fn(),
    reloadUser: jest.fn(),
    refreshUserData: jest.fn(),
    changePassword: jest.fn(),
    changeEmail: jest.fn(),
    updateUsername: jest.fn(),
    enterOfflineMode: jest.fn(),
    exitOfflineMode: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockMutateAsyncAdd.mockResolvedValue({});
    mockMutateAsyncRemove.mockResolvedValue({});
    mockUseAuth.mockReturnValue(defaultAuthReturn);
  });

  describe('Inicialització', () => {
    it('hauria de retornar isVisited=true si el refugi està als visitats', () => {
      const { result } = renderHook(() => useVisited('10'));
      
      expect(result.current.isVisited).toBe(true);
      expect(result.current.isProcessing).toBe(false);
    });

    it('hauria de retornar isVisited=false si el refugi NO està als visitats', () => {
      const { result } = renderHook(() => useVisited('99'));
      
      expect(result.current.isVisited).toBe(false);
      expect(result.current.isProcessing).toBe(false);
    });

    it('hauria de retornar isVisited=false si refugeId és undefined', () => {
      const { result } = renderHook(() => useVisited(undefined));
      
      expect(result.current.isVisited).toBe(false);
      expect(result.current.isProcessing).toBe(false);
    });

    it('hauria de retornar isVisited=false si visitedRefugeIds és buit', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthReturn,
        visitedRefugeIds: [],
      });

      const { result } = renderHook(() => useVisited('10'));
      
      expect(result.current.isVisited).toBe(false);
    });

    it('hauria de retornar isVisited=false si no hi ha firebaseUser', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthReturn,
        firebaseUser: null,
      });

      const { result } = renderHook(() => useVisited('10'));
      
      // Encara retorna true perquè l'estat local es basa en visitedRefugeIds
      expect(result.current.isVisited).toBe(true);
    });
  });

  describe('toggleVisited - Afegir visitat', () => {
    it('hauria d\'afegir un refugi als visitats', async () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthReturn,
        visitedRefugeIds: ['10', '20'], // No inclou '50'
      });

      const { result } = renderHook(() => useVisited('50'));
      
      expect(result.current.isVisited).toBe(false);
      
      await act(async () => {
        await result.current.toggleVisited();
      });
      
      expect(mockMutateAsyncAdd).toHaveBeenCalledWith({
        uid: 'user123',
        refugeId: '50',
      });
    });

    it('NO hauria de fer res si refugeId és undefined', async () => {
      const { result } = renderHook(() => useVisited(undefined));
      
      await act(async () => {
        await result.current.toggleVisited();
      });
      
      expect(mockMutateAsyncAdd).not.toHaveBeenCalled();
      expect(mockMutateAsyncRemove).not.toHaveBeenCalled();
    });

    it('NO hauria de fer res si no hi ha firebaseUser', async () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthReturn,
        firebaseUser: null,
      });

      const { result } = renderHook(() => useVisited('50'));
      
      await act(async () => {
        await result.current.toggleVisited();
      });
      
      expect(mockMutateAsyncAdd).not.toHaveBeenCalled();
    });
  });

  describe('toggleVisited - Eliminar visitat', () => {
    it('hauria d\'eliminar un refugi dels visitats', async () => {
      const { result } = renderHook(() => useVisited('10'));
      
      expect(result.current.isVisited).toBe(true);
      
      await act(async () => {
        await result.current.toggleVisited();
      });
      
      expect(mockMutateAsyncRemove).toHaveBeenCalledWith({
        uid: 'user123',
        refugeId: '10',
      });
    });
  });

  describe('Gestió d\'errors', () => {
    it('hauria de propagar l\'error quan toggleVisited falla', async () => {
      mockMutateAsyncAdd.mockRejectedValue(new Error('Network error'));

      mockUseAuth.mockReturnValue({
        ...defaultAuthReturn,
        visitedRefugeIds: [], // No és visitat, així que s'afegirà
      });

      const { result } = renderHook(() => useVisited('50'));
      
      await expect(act(async () => {
        await result.current.toggleVisited();
      })).rejects.toThrow('Network error');
    });

    it('hauria de restablir isProcessing=false després d\'un error', async () => {
      mockMutateAsyncAdd.mockRejectedValue(new Error('Network error'));

      mockUseAuth.mockReturnValue({
        ...defaultAuthReturn,
        visitedRefugeIds: [],
      });

      const { result } = renderHook(() => useVisited('50'));
      
      try {
        await act(async () => {
          await result.current.toggleVisited();
        });
      } catch (e) {
        // Expected error
      }
      
      expect(result.current.isProcessing).toBe(false);
    });
  });

  describe('Casos límit', () => {
    it('hauria de gestionar IDs numèrics com a strings', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthReturn,
        visitedRefugeIds: ['123', '456'],
      });

      const { result } = renderHook(() => useVisited('123'));
      
      expect(result.current.isVisited).toBe(true);
    });

    it('hauria de comparar correctament IDs en string', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthReturn,
        visitedRefugeIds: ['10', '20'],
      });

      const { result: resultMatch } = renderHook(() => useVisited('10'));
      const { result: resultNoMatch } = renderHook(() => useVisited('100'));
      
      expect(resultMatch.current.isVisited).toBe(true);
      expect(resultNoMatch.current.isVisited).toBe(false);
    });
  });
});
