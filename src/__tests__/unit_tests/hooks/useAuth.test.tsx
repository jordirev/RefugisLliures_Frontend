/**
 * Tests unitaris per al hook useAuth (del AuthContext)
 * 
 * Aquest fitxer cobreix:
 * - Accés al context d'autenticació
 * - Estats de l'usuari (firebaseUser, backendUser, isLoading, isAuthenticated)
 * - Funcions d'autenticació (login, signup, logout, etc.)
 * - Gestió de tokens
 * - Errors quan s'usa fora del provider
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useAuth, AuthProvider } from '../../../contexts/AuthContext';
import { AuthService } from '../../../services/AuthService';
import { UsersService } from '../../../services/UsersService';
import { changeLanguage } from '../../../i18n';

// Mocks
jest.mock('../../../services/AuthService');
jest.mock('../../../services/UsersService');
jest.mock('../../../i18n', () => ({
  changeLanguage: jest.fn(),
  LANGUAGES: {
    ca: { name: 'Català', nativeName: 'Català' },
    es: { name: 'Español', nativeName: 'Español' },
    en: { name: 'English', nativeName: 'English' },
    fr: { name: 'Français', nativeName: 'Français' },
  },
}));

const mockFirebaseUser = {
  uid: 'test-uid-123',
  email: 'test@example.com',
  emailVerified: true,
  getIdToken: jest.fn().mockResolvedValue('mock-token-123'),
};

const mockBackendUser = {
  uid: 'test-uid-123',
  username: 'testuser',
  email: 'test@example.com',
  language: 'ca',
  favourite_refuges: [1, 2, 3],
  visited_refuges: [1],
  renovations: [],
  num_uploaded_photos: 5,
  num_shared_experiences: 2,
  num_renovated_refuges: 1,
  created_at: '2023-01-01T00:00:00Z',
};

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Note: Testing error when used outside provider is difficult with renderHook
  // as it wraps in a test component. This is better tested in integration tests.

  describe('Estat inicial', () => {
    it('hauria de tenir l\'estat inicial correcte', async () => {
      (AuthService.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        callback(null);
        return jest.fn(); // unsubscribe function
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.firebaseUser).toBeNull();
      expect(result.current.backendUser).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.authToken).toBeNull();
    });

    it('hauria de proporcionar totes les funcions d\'autenticació', async () => {
      (AuthService.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        callback(null);
        return jest.fn();
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.login).toBe('function');
      expect(typeof result.current.loginWithGoogle).toBe('function');
      expect(typeof result.current.signup).toBe('function');
      expect(typeof result.current.logout).toBe('function');
      expect(typeof result.current.deleteAccount).toBe('function');
      expect(typeof result.current.refreshToken).toBe('function');
      expect(typeof result.current.reloadUser).toBe('function');
      expect(typeof result.current.changePassword).toBe('function');
      expect(typeof result.current.changeEmail).toBe('function');
      expect(typeof result.current.updateUsername).toBe('function');
    });
  });

  describe('Autenticació amb usuari', () => {
    it('hauria de carregar l\'usuari quan està autenticat', async () => {
      (UsersService.getUserByUid as jest.Mock).mockResolvedValue(mockBackendUser);

      (AuthService.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        setTimeout(() => callback(mockFirebaseUser), 0);
        return jest.fn();
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.firebaseUser).toEqual(mockFirebaseUser);
        expect(result.current.backendUser).toEqual(mockBackendUser);
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.authToken).toBe('mock-token-123');
      });
    });

    it('hauria de canviar l\'idioma segons l\'usuari del backend', async () => {
      (UsersService.getUserByUid as jest.Mock).mockResolvedValue(mockBackendUser);

      (AuthService.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        setTimeout(() => callback(mockFirebaseUser), 0);
        return jest.fn();
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(changeLanguage).toHaveBeenCalledWith('ca');
      });
    });

    it('hauria de marcar isAuthenticated com true només si emailVerified és true', async () => {
      const unverifiedUser = {
        ...mockFirebaseUser,
        emailVerified: false,
      };

      (UsersService.getUserByUid as jest.Mock).mockResolvedValue(mockBackendUser);

      (AuthService.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        setTimeout(() => callback(unverifiedUser), 0);
        return jest.fn();
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.firebaseUser).toBeTruthy();
        expect(result.current.isAuthenticated).toBe(false);
      });
    });
  });

  describe('Funció login', () => {
    it('hauria de cridar AuthService.login amb les credencials correctes', async () => {
      (AuthService.login as jest.Mock).mockResolvedValue(mockFirebaseUser);
      (AuthService.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        callback(null);
        return jest.fn();
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(AuthService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('hauria de gestionar errors de login', async () => {
      const loginError = new Error('Invalid credentials');
      (AuthService.login as jest.Mock).mockRejectedValue(loginError);
      (AuthService.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        callback(null);
        return jest.fn();
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.login('test@example.com', 'wrongpassword');
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('Funció loginWithGoogle', () => {
    it('hauria de cridar AuthService.loginWithGoogle', async () => {
      (AuthService.loginWithGoogle as jest.Mock).mockResolvedValue(mockFirebaseUser);
      (AuthService.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        callback(null);
        return jest.fn();
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.loginWithGoogle();
      });

      expect(AuthService.loginWithGoogle).toHaveBeenCalled();
    });

    it('hauria de gestionar errors de loginWithGoogle', async () => {
      const googleError = new Error('Google login failed');
      (AuthService.loginWithGoogle as jest.Mock).mockRejectedValue(googleError);
      (AuthService.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        callback(null);
        return jest.fn();
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.loginWithGoogle();
        })
      ).rejects.toThrow('Google login failed');
    });
  });

  describe('Funció signup', () => {
    it('hauria de cridar AuthService.signUp amb les dades correctes', async () => {
      (AuthService.signUp as jest.Mock).mockResolvedValue(undefined);
      (AuthService.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        callback(null);
        return jest.fn();
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.signup('newuser@example.com', 'password123', 'newuser', 'ca');
      });

      expect(AuthService.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
        username: 'newuser',
        language: 'ca',
      });
    });

    it('hauria de gestionar errors de signup', async () => {
      const signupError = new Error('Email already in use');
      (AuthService.signUp as jest.Mock).mockRejectedValue(signupError);
      (AuthService.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        callback(null);
        return jest.fn();
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.signup('existing@example.com', 'password', 'user', 'ca');
        })
      ).rejects.toThrow('Email already in use');
    });
  });

  describe('Funció logout', () => {
    it('hauria de cridar AuthService.logout', async () => {
      (AuthService.logout as jest.Mock).mockResolvedValue(undefined);
      (AuthService.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        callback(null);
        return jest.fn();
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(AuthService.logout).toHaveBeenCalled();
    });
  });

  describe('Funció deleteAccount', () => {
    it('hauria de cridar AuthService.deleteAccount', async () => {
      (AuthService.deleteAccount as jest.Mock).mockResolvedValue(undefined);
      (AuthService.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        callback(null);
        return jest.fn();
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteAccount();
      });

      expect(AuthService.deleteAccount).toHaveBeenCalled();
    });
  });

  describe('Funció refreshToken', () => {
    it('hauria de cridar AuthService.getAuthToken amb force=true', async () => {
      (AuthService.getAuthToken as jest.Mock).mockResolvedValue('new-token-456');
      (AuthService.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        callback(null);
        return jest.fn();
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let newToken: string | null = null;
      await act(async () => {
        newToken = await result.current.refreshToken();
      });

      expect(AuthService.getAuthToken).toHaveBeenCalledWith(true);
      expect(newToken).toBe('new-token-456');
    });

    it('hauria d\'actualitzar authToken en l\'estat', async () => {
      (AuthService.getAuthToken as jest.Mock).mockResolvedValue('refreshed-token');
      (AuthService.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        callback(null);
        return jest.fn();
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.refreshToken();
      });

      await waitFor(() => {
        expect(result.current.authToken).toBe('refreshed-token');
      });
    });
  });

  describe('Funció reloadUser', () => {
    it('hauria de recarregar les dades de l\'usuari', async () => {
      const updatedBackendUser = {
        ...mockBackendUser,
        username: 'updateduser',
        num_uploaded_photos: 10,
      };

      (AuthService.reloadUser as jest.Mock).mockResolvedValue(undefined);
      (AuthService.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        callback(mockFirebaseUser);
        return jest.fn();
      });
      (UsersService.getUserByUid as jest.Mock)
        .mockResolvedValueOnce(mockBackendUser)
        .mockResolvedValueOnce(updatedBackendUser);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.backendUser?.username).toBe('testuser');
      });

      await act(async () => {
        await result.current.reloadUser();
      });

      await waitFor(() => {
        expect(result.current.backendUser?.username).toBe('updateduser');
        expect(result.current.backendUser?.num_uploaded_photos).toBe(10);
      });
    });
  });

  describe('Funció changePassword', () => {
    it('hauria de cridar AuthService.changePassword', async () => {
      (AuthService.changePassword as jest.Mock).mockResolvedValue(undefined);
      (AuthService.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        callback(null);
        return jest.fn();
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.changePassword('oldpassword', 'newpassword');
      });

      expect(AuthService.changePassword).toHaveBeenCalledWith('oldpassword', 'newpassword');
    });
  });

  describe('Funció changeEmail', () => {
    it('hauria de cridar AuthService.changeEmail', async () => {
      (AuthService.changeEmail as jest.Mock).mockResolvedValue(undefined);
      (AuthService.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        callback(null);
        return jest.fn();
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.changeEmail('password123', 'newemail@example.com');
      });

      expect(AuthService.changeEmail).toHaveBeenCalledWith('password123', 'newemail@example.com');
    });
  });

  describe('Funció updateUsername', () => {
    it('hauria d\'actualitzar el nom d\'usuari al backend', async () => {
      const updatedUser = { ...mockBackendUser, username: 'newusername' };

      (UsersService.updateUser as jest.Mock).mockResolvedValue(updatedUser);
      (AuthService.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        callback(mockFirebaseUser);
        return jest.fn();
      });
      (UsersService.getUserByUid as jest.Mock).mockResolvedValue(mockBackendUser);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.backendUser).toBeTruthy();
      });

      await act(async () => {
        await result.current.updateUsername('newusername');
      });

      expect(UsersService.updateUser).toHaveBeenCalledWith(
        'test-uid-123',
        { username: 'newusername' },
        'mock-token-123'
      );

      await waitFor(() => {
        expect(result.current.backendUser?.username).toBe('newusername');
      });
    });

    it('hauria de llançar error si no hi ha usuari autenticat', async () => {
      (AuthService.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        callback(null);
        return jest.fn();
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.updateUsername('newusername');
        })
      ).rejects.toThrow('No user is logged in');
    });

    it('hauria de llançar error si l\'actualització falla', async () => {
      (UsersService.updateUser as jest.Mock).mockResolvedValue(null);
      (AuthService.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        callback(mockFirebaseUser);
        return jest.fn();
      });
      (UsersService.getUserByUid as jest.Mock).mockResolvedValue(mockBackendUser);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.backendUser).toBeTruthy();
      });

      await expect(
        act(async () => {
          await result.current.updateUsername('newusername');
        })
      ).rejects.toThrow('Failed to update username');
    });
  });

  describe('Gestió d\'errors de càrrega d\'usuari', () => {
    it('hauria de gestionar errors quan no es pot carregar l\'usuari del backend', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      (UsersService.getUserByUid as jest.Mock).mockRejectedValue(
        new Error('Backend error')
      );

      (AuthService.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        setTimeout(() => callback(mockFirebaseUser), 0);
        return jest.fn();
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.firebaseUser).toEqual(mockFirebaseUser);
        expect(result.current.backendUser).toBeNull();
      });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Retry logic per usuari nou', () => {
    it('hauria de fer retry quan l\'usuari encara no està al backend', async () => {
      jest.useFakeTimers();

      (UsersService.getUserByUid as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockBackendUser);

      (AuthService.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        setTimeout(() => callback(mockFirebaseUser), 0);
        return jest.fn();
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Esperar a que es processi el primer intent
      await act(async () => {
        jest.runOnlyPendingTimers();
      });

      // Avançar els timers per simular el retry
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(result.current.backendUser).toEqual(mockBackendUser);
      });

      expect(UsersService.getUserByUid).toHaveBeenCalledTimes(3);

      jest.useRealTimers();
    });
  });

  describe('Gestió de refugis favorits', () => {
    it('hauria de carregar refugis favorits quan l\'usuari fa login', async () => {
      const mockFavorites = [
        { id: 1, name: 'Refugi 1', coord: { long: 1, lat: 42 } },
        { id: 2, name: 'Refugi 2', coord: { long: 1.5, lat: 42.5 } },
      ];

      (UsersService.getFavouriteRefuges as jest.Mock).mockResolvedValue(mockFavorites);
      (UsersService.getVisitedRefuges as jest.Mock).mockResolvedValue([]);
      (UsersService.getUserByUid as jest.Mock).mockResolvedValue(mockBackendUser);
      (AuthService.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        callback(mockFirebaseUser);
        return jest.fn();
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.favouriteRefuges).toEqual(mockFavorites);
      });
    });

    it('hauria de retornar refugis favorits amb getFavouriteRefuges', async () => {
      const mockFavorites = [
        { id: 1, name: 'Refugi 1', coord: { long: 1, lat: 42 } },
      ];

      (UsersService.getFavouriteRefuges as jest.Mock).mockResolvedValue(mockFavorites);
      (UsersService.getVisitedRefuges as jest.Mock).mockResolvedValue([]);
      (UsersService.getUserByUid as jest.Mock).mockResolvedValue(mockBackendUser);
      (AuthService.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        callback(mockFirebaseUser);
        return jest.fn();
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.backendUser).toBeTruthy();
      });

      let favorites;
      await act(async () => {
        favorites = await result.current.getFavouriteRefuges();
      });

      expect(favorites).toEqual(mockFavorites);
      expect(UsersService.getFavouriteRefuges).toHaveBeenCalledWith(
        mockFirebaseUser.uid,
        'mock-token-123'
      );
    });

    it('hauria d\'afegir un refugi als favorits', async () => {
      const mockUpdatedFavorites = [
        { id: 1, name: 'Refugi 1', coord: { long: 1, lat: 42 } },
        { id: 2, name: 'Refugi 2', coord: { long: 1.5, lat: 42.5 } },
      ];

      (UsersService.addFavouriteRefuge as jest.Mock).mockResolvedValue(mockUpdatedFavorites);
      (UsersService.getFavouriteRefuges as jest.Mock).mockResolvedValue([]);
      (UsersService.getVisitedRefuges as jest.Mock).mockResolvedValue([]);
      (UsersService.getUserByUid as jest.Mock).mockResolvedValue(mockBackendUser);
      (AuthService.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        callback(mockFirebaseUser);
        return jest.fn();
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.backendUser).toBeTruthy();
      });

      let updatedFavorites;
      await act(async () => {
        updatedFavorites = await result.current.addFavouriteRefuge(2);
      });

      expect(updatedFavorites).toEqual(mockUpdatedFavorites);
      expect(result.current.favouriteRefuges).toEqual(mockUpdatedFavorites);
      expect(result.current.backendUser?.favourite_refuges).toEqual(['1', '2']);
    });

    it('hauria d\'eliminar un refugi dels favorits', async () => {
      const mockUpdatedFavorites = [
        { id: 1, name: 'Refugi 1', coord: { long: 1, lat: 42 } },
      ];

      (UsersService.removeFavouriteRefuge as jest.Mock).mockResolvedValue(mockUpdatedFavorites);
      (UsersService.getFavouriteRefuges as jest.Mock).mockResolvedValue(mockUpdatedFavorites);
      (UsersService.getVisitedRefuges as jest.Mock).mockResolvedValue([]);
      (UsersService.getUserByUid as jest.Mock).mockResolvedValue(mockBackendUser);
      (AuthService.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        callback(mockFirebaseUser);
        return jest.fn();
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.backendUser).toBeTruthy();
      });

      let updatedFavorites;
      await act(async () => {
        updatedFavorites = await result.current.removeFavouriteRefuge(2);
      });

      expect(updatedFavorites).toEqual(mockUpdatedFavorites);
      expect(result.current.favouriteRefuges).toEqual(mockUpdatedFavorites);
      expect(result.current.backendUser?.favourite_refuges).toEqual(['1']);
    });

    it('hauria de llançar error si no hi ha usuari logat', async () => {
      (AuthService.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        callback(null);
        return jest.fn();
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.getFavouriteRefuges();
        })
      ).rejects.toThrow('No user is logged in');

      await expect(
        act(async () => {
          await result.current.addFavouriteRefuge(1);
        })
      ).rejects.toThrow('No user is logged in');

      await expect(
        act(async () => {
          await result.current.removeFavouriteRefuge(1);
        })
      ).rejects.toThrow('No user is logged in');
    });
  });

  describe('Gestió de refugis visitats', () => {
    it('hauria de carregar refugis visitats quan l\'usuari fa login', async () => {
      const mockVisited = [
        { id: 1, name: 'Refugi 1', coord: { long: 1, lat: 42 } },
      ];

      (UsersService.getFavouriteRefuges as jest.Mock).mockResolvedValue([]);
      (UsersService.getVisitedRefuges as jest.Mock).mockResolvedValue(mockVisited);
      (UsersService.getUserByUid as jest.Mock).mockResolvedValue(mockBackendUser);
      (AuthService.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        callback(mockFirebaseUser);
        return jest.fn();
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.visitedRefuges).toEqual(mockVisited);
      });
    });

    it('hauria de retornar refugis visitats amb getVisitedRefuges', async () => {
      const mockVisited = [
        { id: 1, name: 'Refugi 1', coord: { long: 1, lat: 42 } },
      ];

      (UsersService.getVisitedRefuges as jest.Mock).mockResolvedValue(mockVisited);
      (UsersService.getFavouriteRefuges as jest.Mock).mockResolvedValue([]);
      (UsersService.getUserByUid as jest.Mock).mockResolvedValue(mockBackendUser);
      (AuthService.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        callback(mockFirebaseUser);
        return jest.fn();
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.backendUser).toBeTruthy();
      });

      let visited;
      await act(async () => {
        visited = await result.current.getVisitedRefuges();
      });

      expect(visited).toEqual(mockVisited);
    });

    it('hauria d\'afegir un refugi als visitats', async () => {
      const mockUpdatedVisited = [
        { id: 1, name: 'Refugi 1', coord: { long: 1, lat: 42 } },
        { id: 2, name: 'Refugi 2', coord: { long: 1.5, lat: 42.5 } },
      ];

      (UsersService.addVisitedRefuge as jest.Mock).mockResolvedValue(mockUpdatedVisited);
      (UsersService.getFavouriteRefuges as jest.Mock).mockResolvedValue([]);
      (UsersService.getVisitedRefuges as jest.Mock).mockResolvedValue([]);
      (UsersService.getUserByUid as jest.Mock).mockResolvedValue(mockBackendUser);
      (AuthService.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        callback(mockFirebaseUser);
        return jest.fn();
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.backendUser).toBeTruthy();
      });

      let updatedVisited;
      await act(async () => {
        updatedVisited = await result.current.addVisitedRefuge(2);
      });

      expect(updatedVisited).toEqual(mockUpdatedVisited);
      expect(result.current.visitedRefuges).toEqual(mockUpdatedVisited);
      expect(result.current.backendUser?.visited_refuges).toEqual(['1', '2']);
    });

    it('hauria d\'eliminar un refugi dels visitats', async () => {
      const mockUpdatedVisited = [
        { id: 1, name: 'Refugi 1', coord: { long: 1, lat: 42 } },
      ];

      (UsersService.removeVisitedRefuge as jest.Mock).mockResolvedValue(mockUpdatedVisited);
      (UsersService.getFavouriteRefuges as jest.Mock).mockResolvedValue([]);
      (UsersService.getVisitedRefuges as jest.Mock).mockResolvedValue(mockUpdatedVisited);
      (UsersService.getUserByUid as jest.Mock).mockResolvedValue(mockBackendUser);
      (AuthService.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        callback(mockFirebaseUser);
        return jest.fn();
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.backendUser).toBeTruthy();
      });

      let updatedVisited;
      await act(async () => {
        updatedVisited = await result.current.removeVisitedRefuge(2);
      });

      expect(updatedVisited).toEqual(mockUpdatedVisited);
      expect(result.current.visitedRefuges).toEqual(mockUpdatedVisited);
      expect(result.current.backendUser?.visited_refuges).toEqual(['1']);
    });

    it('hauria de llançar error si no hi ha usuari logat', async () => {
      (AuthService.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        callback(null);
        return jest.fn();
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.getVisitedRefuges();
        })
      ).rejects.toThrow('No user is logged in');

      await expect(
        act(async () => {
          await result.current.addVisitedRefuge(1);
        })
      ).rejects.toThrow('No user is logged in');

      await expect(
        act(async () => {
          await result.current.removeVisitedRefuge(1);
        })
      ).rejects.toThrow('No user is logged in');
    });
  });
});
