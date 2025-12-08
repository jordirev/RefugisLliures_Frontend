/**
 * Tests unitaris per al hook useVisited
 * 
 * Aquest fitxer cobreix:
 * - Inicialització del hook amb diferents estats
 * - Optimistic updates quan es fa toggle
 * - Gestió d'errors i revert d'optimistic updates
 * - Sincronització amb backendUser
 * - Estados de processament
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import useVisited from '../../../hooks/useVisited';
import { useAuth } from '../../../contexts/AuthContext';
import { User } from '../../../models';

// Mock del context d'autenticació
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('useVisited Hook', () => {
  const mockBackendUser: User = {
    uid: 'test-uid',
    username: 'testuser',
    email: 'test@example.com',
    avatar: undefined,
    language: 'ca',
    favourite_refuges: [],
    visited_refuges: ['10', '20', '30'],
    num_uploaded_photos: 0,
    num_shared_experiences: 0,
    num_renovated_refuges: 0,
    created_at: '2024-01-01T00:00:00Z',
  };

  const mockAddVisitedRefuge = jest.fn();
  const mockRemoveVisitedRefuge = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      backendUser: mockBackendUser,
      addVisitedRefuge: mockAddVisitedRefuge,
      removeVisitedRefuge: mockRemoveVisitedRefuge,
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
      addFavouriteRefuge: jest.fn(),
      removeFavouriteRefuge: jest.fn(),
      refreshUserData: jest.fn(),
    });
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

    it('hauria de retornar isVisited=false si no hi ha backendUser', () => {
      mockUseAuth.mockReturnValue({
        ...mockUseAuth(),
        backendUser: null,
      });

      const { result } = renderHook(() => useVisited('10'));
      
      expect(result.current.isVisited).toBe(false);
    });

    it('hauria de retornar isVisited=false si visited_refuges és buit', () => {
      mockUseAuth.mockReturnValue({
        ...mockUseAuth(),
        backendUser: { ...mockBackendUser, visited_refuges: [] },
      });

      const { result } = renderHook(() => useVisited('10'));
      
      expect(result.current.isVisited).toBe(false);
    });
  });

  describe('Sincronització amb backendUser', () => {
    it('hauria de sincronitzar optimistic state quan backendUser canvia', async () => {
      const { result, rerender } = renderHook(() => useVisited('10'));
      
      expect(result.current.isVisited).toBe(true);
      
      // Actualitzar backendUser per eliminar el refugi dels visitats
      mockUseAuth.mockReturnValue({
        ...mockUseAuth(),
        backendUser: { ...mockBackendUser, visited_refuges: ['20', '30'] },
      });
      
      rerender({});
      
      await waitFor(() => {
        expect(result.current.isVisited).toBe(false);
      });
    });

    it('hauria de sincronitzar quan s\'afegeix un nou visitat externament', async () => {
      const { result, rerender } = renderHook(() => useVisited('99'));
      
      expect(result.current.isVisited).toBe(false);
      
      // Afegir el refugi als visitats externament
      mockUseAuth.mockReturnValue({
        ...mockUseAuth(),
        backendUser: { ...mockBackendUser, visited_refuges: ['10', '20', '30', '99'] },
      });
      
      rerender({});
      
      await waitFor(() => {
        expect(result.current.isVisited).toBe(true);
      });
    });
  });

  describe('toggleVisited - Afegir visitat', () => {
    it('hauria d\'afegir un refugi als visitats amb optimistic update', async () => {
      mockAddVisitedRefuge.mockResolvedValue([]);
      
      const { result } = renderHook(() => useVisited('99'));
      
      expect(result.current.isVisited).toBe(false);
      
      await act(async () => {
        await result.current.toggleVisited();
      });
      
      expect(mockAddVisitedRefuge).toHaveBeenCalledWith('99');
      expect(result.current.isVisited).toBe(true);
      expect(result.current.isProcessing).toBe(false);
    });

    it('hauria de mantenir isProcessing=true durant la petició', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockAddVisitedRefuge.mockReturnValue(promise);
      
      const { result } = renderHook(() => useVisited('99'));
      
      act(() => {
        result.current.toggleVisited();
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

  describe('toggleVisited - Eliminar visitat', () => {
    it('hauria d\'eliminar un refugi dels visitats amb optimistic update', async () => {
      mockRemoveVisitedRefuge.mockResolvedValue([]);
      
      const { result } = renderHook(() => useVisited('10'));
      
      expect(result.current.isVisited).toBe(true);
      
      await act(async () => {
        await result.current.toggleVisited();
      });
      
      expect(mockRemoveVisitedRefuge).toHaveBeenCalledWith('10');
      expect(result.current.isVisited).toBe(false);
      expect(result.current.isProcessing).toBe(false);
    });

    it('hauria de mantenir isProcessing=true durant l\'eliminació', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockRemoveVisitedRefuge.mockReturnValue(promise);
      
      const { result } = renderHook(() => useVisited('10'));
      
      act(() => {
        result.current.toggleVisited();
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
    it('hauria de revertir l\'optimistic update si addVisitedRefuge falla', async () => {
      const error = new Error('Network error');
      mockAddVisitedRefuge.mockRejectedValue(error);
      
      const { result } = renderHook(() => useVisited('99'));
      
      expect(result.current.isVisited).toBe(false);
      
      await act(async () => {
        try {
          await result.current.toggleVisited();
        } catch (err) {
          // Expected to throw
        }
      });
      
      await waitFor(() => {
        expect(result.current.isVisited).toBe(false);
        expect(result.current.isProcessing).toBe(false);
      });
    });

    it('hauria de revertir l\'optimistic update si removeVisitedRefuge falla', async () => {
      const error = new Error('Network error');
      mockRemoveVisitedRefuge.mockRejectedValue(error);
      
      const { result } = renderHook(() => useVisited('10'));
      
      expect(result.current.isVisited).toBe(true);
      
      await act(async () => {
        try {
          await result.current.toggleVisited();
        } catch (err) {
          // Expected to throw
        }
      });
      
      await waitFor(() => {
        expect(result.current.isVisited).toBe(true);
        expect(result.current.isProcessing).toBe(false);
      });
    });

    it('hauria de propagar l\'error quan toggleVisited falla', async () => {
      const error = new Error('API error');
      mockAddVisitedRefuge.mockRejectedValue(error);
      
      const { result } = renderHook(() => useVisited('99'));
      
      await expect(
        act(async () => {
          await result.current.toggleVisited();
        })
      ).rejects.toThrow('API error');
    });
  });

  describe('Casos límit', () => {
    it('no hauria de fer res si refugeId és undefined', async () => {
      const { result } = renderHook(() => useVisited(undefined));
      
      await act(async () => {
        await result.current.toggleVisited();
      });
      
      expect(mockAddVisitedRefuge).not.toHaveBeenCalled();
      expect(mockRemoveVisitedRefuge).not.toHaveBeenCalled();
    });

    it('no hauria de permetre múltiples toggles simultanis', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockAddVisitedRefuge.mockReturnValue(promise);
      
      const { result } = renderHook(() => useVisited('99'));
      
      // Primer toggle
      act(() => {
        result.current.toggleVisited();
      });
      
      await waitFor(() => {
        expect(result.current.isProcessing).toBe(true);
      });
      
      // Intentar segon toggle mentre el primer encara està en curs
      await act(async () => {
        await result.current.toggleVisited();
      });
      
      // Només s'hauria de cridar una vegada
      expect(mockAddVisitedRefuge).toHaveBeenCalledTimes(1);
      
      // Resoldre la promesa
      await act(async () => {
        resolvePromise!([]);
      });
    });

    it('hauria de gestionar refugeId amb valor string correctament', async () => {
      mockRemoveVisitedRefuge.mockResolvedValue([]);
      
      const { result } = renderHook(() => useVisited('10'));
      
      expect(result.current.isVisited).toBe(true);
      
      await act(async () => {
        await result.current.toggleVisited();
      });
      
      expect(mockRemoveVisitedRefuge).toHaveBeenCalledWith('10');
      expect(result.current.isVisited).toBe(false);
    });

    it('hauria de gestionar refugeId numeric string correctament', async () => {
      mockUseAuth.mockReturnValue({
        ...mockUseAuth(),
        backendUser: { ...mockBackendUser, visited_refuges: ['1', '2', '3'] },
      });
      
      const { result } = renderHook(() => useVisited('2'));
      
      expect(result.current.isVisited).toBe(true);
    });

    it('hauria de mostrar advertència en consola quan no hi ha refugeId', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const { result } = renderHook(() => useVisited(undefined));
      
      await act(async () => {
        await result.current.toggleVisited();
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('[useVisited] Cannot toggle visited - no refuge ID provided');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Integració amb diferents tipus de refugeId', () => {
    it('hauria de comparar correctament refugeId string amb IDs en array', () => {
      mockUseAuth.mockReturnValue({
        ...mockUseAuth(),
        backendUser: { ...mockBackendUser, visited_refuges: ['10', '20', '30'] },
      });
      
      const { result } = renderHook(() => useVisited('20'));
      
      expect(result.current.isVisited).toBe(true);
    });

    it('hauria de gestionar IDs grans correctament', () => {
      const largeId = '999999';
      mockUseAuth.mockReturnValue({
        ...mockUseAuth(),
        backendUser: { ...mockBackendUser, visited_refuges: ['999999'] },
      });
      
      const { result } = renderHook(() => useVisited(largeId));
      
      expect(result.current.isVisited).toBe(true);
    });

    it('hauria de gestionar array buit de visited_refuges', () => {
      mockUseAuth.mockReturnValue({
        ...mockUseAuth(),
        backendUser: { ...mockBackendUser, visited_refuges: [] },
      });
      
      const { result } = renderHook(() => useVisited('10'));
      
      expect(result.current.isVisited).toBe(false);
    });

    it('hauria de gestionar visited_refuges undefined', () => {
      mockUseAuth.mockReturnValue({
        ...mockUseAuth(),
        backendUser: { ...mockBackendUser, visited_refuges: undefined as any },
      });
      
      const { result } = renderHook(() => useVisited('10'));
      
      expect(result.current.isVisited).toBe(false);
    });
  });

  describe('Logs de consola', () => {
    it('hauria de registrar toggle de visitat en consola', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockAddVisitedRefuge.mockResolvedValue([]);
      
      const { result } = renderHook(() => useVisited('99'));
      
      await act(async () => {
        await result.current.toggleVisited();
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('[useVisited] Toggling visited for refuge:', '99');
      expect(consoleSpy).toHaveBeenCalledWith('[useVisited] Adding refuge to visited:', '99');
      
      consoleSpy.mockRestore();
    });

    it('hauria de registrar eliminació de visitat en consola', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockRemoveVisitedRefuge.mockResolvedValue([]);
      
      const { result } = renderHook(() => useVisited('10'));
      
      await act(async () => {
        await result.current.toggleVisited();
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('[useVisited] Toggling visited for refuge:', '10');
      expect(consoleSpy).toHaveBeenCalledWith('[useVisited] Removing refuge from visited:', '10');
      
      consoleSpy.mockRestore();
    });

    it('hauria de registrar errors en consola', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('API error');
      mockAddVisitedRefuge.mockRejectedValue(error);
      
      const { result } = renderHook(() => useVisited('99'));
      
      await act(async () => {
        try {
          await result.current.toggleVisited();
        } catch (err) {
          // Expected to throw
        }
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('Error toggling visited via hook:', error);
      
      consoleSpy.mockRestore();
    });
  });
});
