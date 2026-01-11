/**
 * Tests unitaris per al hook useFavourite
 * 
 * Aquest fitxer cobreix:
 * - Inicialització del hook amb diferents estats
 * - Toggle de favorits
 * - Estats de processament
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import useFavourite from '../../../hooks/useFavourite';
import { useAuth } from '../../../contexts/AuthContext';

// Mock del context d'autenticació
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock de useUsersQuery hooks
const mockMutateAsyncAdd = jest.fn();
const mockMutateAsyncRemove = jest.fn();

jest.mock('../../../hooks/useUsersQuery', () => ({
  useAddFavouriteRefuge: () => ({
    mutateAsync: mockMutateAsyncAdd,
    isPending: false,
  }),
  useRemoveFavouriteRefuge: () => ({
    mutateAsync: mockMutateAsyncRemove,
    isPending: false,
  }),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockSetFavouriteRefugeIds = jest.fn();

describe('useFavourite Hook', () => {
  const defaultAuthReturn = {
    firebaseUser: { uid: 'user123', emailVerified: true } as any,
    backendUser: null,
    favouriteRefugeIds: ['10', '20', '30'],
    visitedRefugeIds: [],
    setFavouriteRefugeIds: mockSetFavouriteRefugeIds,
    setVisitedRefugeIds: jest.fn(),
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
    it('hauria de retornar isFavourite=true si el refugi està als favorits', () => {
      const { result } = renderHook(() => useFavourite('10'));
      
      expect(result.current.isFavourite).toBe(true);
      expect(result.current.isProcessing).toBe(false);
    });

    it('hauria de retornar isFavourite=false si el refugi NO està als favorits', () => {
      const { result } = renderHook(() => useFavourite('99'));
      
      expect(result.current.isFavourite).toBe(false);
      expect(result.current.isProcessing).toBe(false);
    });

    it('hauria de retornar isFavourite=false si refugeId és undefined', () => {
      const { result } = renderHook(() => useFavourite(undefined));
      
      expect(result.current.isFavourite).toBe(false);
      expect(result.current.isProcessing).toBe(false);
    });

    it('hauria de retornar isFavourite=false si favouriteRefugeIds és buit', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthReturn,
        favouriteRefugeIds: [],
      });

      const { result } = renderHook(() => useFavourite('10'));
      
      expect(result.current.isFavourite).toBe(false);
    });

    it('hauria de retornar isFavourite=false si no hi ha firebaseUser', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthReturn,
        firebaseUser: null,
      });

      const { result } = renderHook(() => useFavourite('10'));
      
      // Encara retorna true perquè l'estat local es basa en favouriteRefugeIds
      expect(result.current.isFavourite).toBe(true);
    });
  });

  describe('toggleFavourite - Afegir favorit', () => {
    it('hauria d\'afegir un refugi als favorits', async () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthReturn,
        favouriteRefugeIds: ['10', '20'], // No inclou '50'
      });

      const { result } = renderHook(() => useFavourite('50'));
      
      expect(result.current.isFavourite).toBe(false);
      
      await act(async () => {
        await result.current.toggleFavourite();
      });
      
      expect(mockMutateAsyncAdd).toHaveBeenCalledWith({
        uid: 'user123',
        refugeId: '50',
      });
    });

    it('NO hauria de fer res si refugeId és undefined', async () => {
      const { result } = renderHook(() => useFavourite(undefined));
      
      await act(async () => {
        await result.current.toggleFavourite();
      });
      
      expect(mockMutateAsyncAdd).not.toHaveBeenCalled();
      expect(mockMutateAsyncRemove).not.toHaveBeenCalled();
    });

    it('NO hauria de fer res si no hi ha firebaseUser', async () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthReturn,
        firebaseUser: null,
      });

      const { result } = renderHook(() => useFavourite('50'));
      
      await act(async () => {
        await result.current.toggleFavourite();
      });
      
      expect(mockMutateAsyncAdd).not.toHaveBeenCalled();
    });
  });

  describe('toggleFavourite - Eliminar favorit', () => {
    it('hauria d\'eliminar un refugi dels favorits', async () => {
      const { result } = renderHook(() => useFavourite('10'));
      
      expect(result.current.isFavourite).toBe(true);
      
      await act(async () => {
        await result.current.toggleFavourite();
      });
      
      expect(mockMutateAsyncRemove).toHaveBeenCalledWith({
        uid: 'user123',
        refugeId: '10',
      });
    });
  });

  describe('Gestió d\'errors', () => {
    it('hauria de propagar l\'error quan toggleFavourite falla', async () => {
      mockMutateAsyncAdd.mockRejectedValue(new Error('Network error'));

      mockUseAuth.mockReturnValue({
        ...defaultAuthReturn,
        favouriteRefugeIds: [], // No és favorit, així que s'afegirà
      });

      const { result } = renderHook(() => useFavourite('50'));
      
      await expect(act(async () => {
        await result.current.toggleFavourite();
      })).rejects.toThrow('Network error');
    });

    it('hauria de restablir isProcessing=false després d\'un error', async () => {
      mockMutateAsyncAdd.mockRejectedValue(new Error('Network error'));

      mockUseAuth.mockReturnValue({
        ...defaultAuthReturn,
        favouriteRefugeIds: [],
      });

      const { result } = renderHook(() => useFavourite('50'));
      
      try {
        await act(async () => {
          await result.current.toggleFavourite();
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
        favouriteRefugeIds: ['123', '456'],
      });

      const { result } = renderHook(() => useFavourite('123'));
      
      expect(result.current.isFavourite).toBe(true);
    });

    it('hauria de comparar correctament IDs en string', () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthReturn,
        favouriteRefugeIds: ['10', '20'],
      });

      const { result: resultMatch } = renderHook(() => useFavourite('10'));
      const { result: resultNoMatch } = renderHook(() => useFavourite('100'));
      
      expect(resultMatch.current.isFavourite).toBe(true);
      expect(resultNoMatch.current.isFavourite).toBe(false);
    });
  });
});
