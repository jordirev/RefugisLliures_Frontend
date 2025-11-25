/**
 * Tests unitaris per al hook useFavourite
 * 
 * Aquest fitxer cobreix:
 * - Inicialització del hook amb diferents estats
 * - Optimistic updates quan es fa toggle
 * - Gestió d'errors i revert d'optimistic updates
 * - Sincronització amb backendUser
 * - Estados de processament
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import useFavourite from '../../../hooks/useFavourite';
import { useAuth } from '../../../contexts/AuthContext';
import { User } from '../../../models';

// Mock del context d'autenticació
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('useFavourite Hook', () => {
  const mockBackendUser: User = {
    id: 1,
    uid: 'test-uid',
    username: 'testuser',
    email: 'test@example.com',
    avatar: null,
    language: 'ca',
    favourite_refuges: ['10', '20', '30'],
    visited_refuges: [],
    renovations: [],
  };

  const mockAddFavouriteRefuge = jest.fn();
  const mockRemoveFavouriteRefuge = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      backendUser: mockBackendUser,
      addFavouriteRefuge: mockAddFavouriteRefuge,
      removeFavouriteRefuge: mockRemoveFavouriteRefuge,
      firebaseUser: null,
      favouriteRefuges: [],
      visitedRefuges: [],
      isLoading: false,
      isAuthenticated: true,
      authToken: 'mock-token',
      login: jest.fn(),
      loginWithGoogle: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      deleteAccount: jest.fn(),
      refreshToken: jest.fn(),
      reloadUser: jest.fn(),
      changePassword: jest.fn(),
      changeEmail: jest.fn(),
      updateUsername: jest.fn(),
      getFavouriteRefuges: jest.fn(),
      getVisitedRefuges: jest.fn(),
      addVisitedRefuge: jest.fn(),
      removeVisitedRefuge: jest.fn(),
    });
  });

  describe('Inicialització', () => {
    it('hauria de retornar isFavourite=true si el refugi està als favorits', () => {
      const { result } = renderHook(() => useFavourite(10));
      
      expect(result.current.isFavourite).toBe(true);
      expect(result.current.isProcessing).toBe(false);
    });

    it('hauria de retornar isFavourite=false si el refugi NO està als favorits', () => {
      const { result } = renderHook(() => useFavourite(99));
      
      expect(result.current.isFavourite).toBe(false);
      expect(result.current.isProcessing).toBe(false);
    });

    it('hauria de retornar isFavourite=false si refugeId és undefined', () => {
      const { result } = renderHook(() => useFavourite(undefined));
      
      expect(result.current.isFavourite).toBe(false);
      expect(result.current.isProcessing).toBe(false);
    });

    it('hauria de retornar isFavourite=false si no hi ha backendUser', () => {
      mockUseAuth.mockReturnValue({
        ...mockUseAuth(),
        backendUser: null,
      });

      const { result } = renderHook(() => useFavourite(10));
      
      expect(result.current.isFavourite).toBe(false);
    });

    it('hauria de retornar isFavourite=false si favourite_refuges és buit', () => {
      mockUseAuth.mockReturnValue({
        ...mockUseAuth(),
        backendUser: { ...mockBackendUser, favourite_refuges: [] },
      });

      const { result } = renderHook(() => useFavourite(10));
      
      expect(result.current.isFavourite).toBe(false);
    });
  });

  describe('Sincronització amb backendUser', () => {
    it('hauria de sincronitzar optimistic state quan backendUser canvia', async () => {
      const { result, rerender } = renderHook(() => useFavourite(10));
      
      expect(result.current.isFavourite).toBe(true);
      
      // Actualitzar backendUser per eliminar el refugi dels favorits
      mockUseAuth.mockReturnValue({
        ...mockUseAuth(),
        backendUser: { ...mockBackendUser, favourite_refuges: ['20', '30'] },
      });
      
      rerender({});
      
      await waitFor(() => {
        expect(result.current.isFavourite).toBe(false);
      });
    });

    it('hauria de sincronitzar quan s\'afegeix un nou favorit externament', async () => {
      const { result, rerender } = renderHook(() => useFavourite(99));
      
      expect(result.current.isFavourite).toBe(false);
      
      // Afegir el refugi als favorits externament
      mockUseAuth.mockReturnValue({
        ...mockUseAuth(),
        backendUser: { ...mockBackendUser, favourite_refuges: ['10', '20', '30', '99'] },
      });
      
      rerender({});
      
      await waitFor(() => {
        expect(result.current.isFavourite).toBe(true);
      });
    });
  });

  describe('toggleFavourite - Afegir favorit', () => {
    it('hauria d\'afegir un refugi als favorits amb optimistic update', async () => {
      mockAddFavouriteRefuge.mockResolvedValue([]);
      
      const { result } = renderHook(() => useFavourite(99));
      
      expect(result.current.isFavourite).toBe(false);
      
      await act(async () => {
        await result.current.toggleFavourite();
      });
      
      expect(mockAddFavouriteRefuge).toHaveBeenCalledWith(99);
      expect(result.current.isFavourite).toBe(true);
      expect(result.current.isProcessing).toBe(false);
    });

    it('hauria de mantenir isProcessing=true durant la petició', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockAddFavouriteRefuge.mockReturnValue(promise);
      
      const { result } = renderHook(() => useFavourite(99));
      
      act(() => {
        result.current.toggleFavourite();
      });
      
      await waitFor(() => {
        expect(result.current.isProcessing).toBe(true);
      });
      
      await act(async () => {
        resolvePromise!([]);
      });
      
      await waitFor(() => {
        expect(result.current.isProcessing).toBe(false);
      });
    });
  });

  describe('toggleFavourite - Eliminar favorit', () => {
    it('hauria d\'eliminar un refugi dels favorits amb optimistic update', async () => {
      mockRemoveFavouriteRefuge.mockResolvedValue([]);
      
      const { result } = renderHook(() => useFavourite(10));
      
      expect(result.current.isFavourite).toBe(true);
      
      await act(async () => {
        await result.current.toggleFavourite();
      });
      
      expect(mockRemoveFavouriteRefuge).toHaveBeenCalledWith(10);
      expect(result.current.isFavourite).toBe(false);
      expect(result.current.isProcessing).toBe(false);
    });

    it('hauria de mantenir isProcessing=true durant l\'eliminació', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockRemoveFavouriteRefuge.mockReturnValue(promise);
      
      const { result } = renderHook(() => useFavourite(10));
      
      act(() => {
        result.current.toggleFavourite();
      });
      
      await waitFor(() => {
        expect(result.current.isProcessing).toBe(true);
      });
      
      await act(async () => {
        resolvePromise!([]);
      });
      
      await waitFor(() => {
        expect(result.current.isProcessing).toBe(false);
      });
    });
  });

  describe('Gestió d\'errors', () => {
    it('hauria de revertir l\'optimistic update si addFavouriteRefuge falla', async () => {
      const error = new Error('Network error');
      mockAddFavouriteRefuge.mockRejectedValue(error);
      
      const { result } = renderHook(() => useFavourite(99));
      
      expect(result.current.isFavourite).toBe(false);
      
      await act(async () => {
        try {
          await result.current.toggleFavourite();
        } catch (err) {
          // Expected to throw
        }
      });
      
      await waitFor(() => {
        expect(result.current.isFavourite).toBe(false);
        expect(result.current.isProcessing).toBe(false);
      });
    });

    it('hauria de revertir l\'optimistic update si removeFavouriteRefuge falla', async () => {
      const error = new Error('Network error');
      mockRemoveFavouriteRefuge.mockRejectedValue(error);
      
      const { result } = renderHook(() => useFavourite(10));
      
      expect(result.current.isFavourite).toBe(true);
      
      await act(async () => {
        try {
          await result.current.toggleFavourite();
        } catch (err) {
          // Expected to throw
        }
      });
      
      await waitFor(() => {
        expect(result.current.isFavourite).toBe(true);
        expect(result.current.isProcessing).toBe(false);
      });
    });

    it('hauria de propagar l\'error quan toggleFavourite falla', async () => {
      const error = new Error('API error');
      mockAddFavouriteRefuge.mockRejectedValue(error);
      
      const { result } = renderHook(() => useFavourite(99));
      
      await expect(
        act(async () => {
          await result.current.toggleFavourite();
        })
      ).rejects.toThrow('API error');
    });
  });

  describe('Casos límit', () => {
    it('NO hauria de fer res si refugeId és undefined', async () => {
      const { result } = renderHook(() => useFavourite(undefined));
      
      await act(async () => {
        await result.current.toggleFavourite();
      });
      
      expect(mockAddFavouriteRefuge).not.toHaveBeenCalled();
      expect(mockRemoveFavouriteRefuge).not.toHaveBeenCalled();
      expect(result.current.isProcessing).toBe(false);
    });

    it('NO hauria de permetre múltiples toggles simultanis', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockAddFavouriteRefuge.mockReturnValue(promise);
      
      const { result } = renderHook(() => useFavourite(99));
      
      // Primer toggle
      act(() => {
        result.current.toggleFavourite();
      });
      
      await waitFor(() => {
        expect(result.current.isProcessing).toBe(true);
      });
      
      // Intentar segon toggle mentre el primer encara està en curs
      await act(async () => {
        await result.current.toggleFavourite();
      });
      
      // Només s'hauria de cridar una vegada
      expect(mockAddFavouriteRefuge).toHaveBeenCalledTimes(1);
      
      // Resoldre la promesa
      await act(async () => {
        resolvePromise!([]);
      });
    });

    it('hauria de gestionar refugeId=0 correctament', async () => {
      mockUseAuth.mockReturnValue({
        ...mockUseAuth(),
        backendUser: { ...mockBackendUser, favourite_refuges: ['0'] },
      });
      
      mockRemoveFavouriteRefuge.mockResolvedValue([]);
      
      const { result } = renderHook(() => useFavourite(0));
      
      expect(result.current.isFavourite).toBe(true);
      
      await act(async () => {
        await result.current.toggleFavourite();
      });
      
      expect(mockRemoveFavouriteRefuge).toHaveBeenCalledWith(0);
      expect(result.current.isFavourite).toBe(false);
    });
  });

  describe('Integració amb strings/numbers', () => {
    it('hauria de comparar correctament refugeId numèric amb IDs en string', () => {
      mockUseAuth.mockReturnValue({
        ...mockUseAuth(),
        backendUser: { ...mockBackendUser, favourite_refuges: ['10', '20', '30'] },
      });
      
      const { result } = renderHook(() => useFavourite(20));
      
      expect(result.current.isFavourite).toBe(true);
    });

    it('hauria de gestionar IDs grans correctament', () => {
      const largeId = 999999;
      mockUseAuth.mockReturnValue({
        ...mockUseAuth(),
        backendUser: { ...mockBackendUser, favourite_refuges: ['999999'] },
      });
      
      const { result } = renderHook(() => useFavourite(largeId));
      
      expect(result.current.isFavourite).toBe(true);
    });
  });
});
