/**
 * Tests unitaris per AuthService
 * 
 * Aquest fitxer cobreix:
 * - Registre d'usuaris (signUp)
 * - Login amb email/password (login)
 * - Login amb Google (loginWithGoogle)
 * - Tancament de sessió (logout)
 * - Recuperació de contrasenya (resetPassword)
 * - Reenviar email de verificació (resendVerificationEmail)
 * - Obtenir token d'autenticació (getAuthToken)
 * - Obtenir usuari actual (getCurrentUser)
 * - Observador d'estat (onAuthStateChange)
 * - Recarregar usuari (reloadUser)
 * - Eliminar compte (deleteAccount)
 * - Canviar contrasenya (changePassword)
 * - Canviar email (changeEmail)
 * - Utilitats (getErrorMessageKey, isGoogleSignInAvailable)
 * 
 * Escenaris d'èxit i límit per màxim coverage
 */

import type { SignUpData, LoginData } from '../../../services/AuthService';
import { UsersService } from '../../../services/UsersService';
import * as firebase from '../../../services/firebase';

// Mock de Google Sign In - definit abans del mock del mòdul
const mockGoogleSignin = {
  configure: jest.fn(),
  hasPlayServices: jest.fn(),
  signIn: jest.fn(),
};

// Mock del credential de GoogleAuthProvider
const mockGoogleCredential = jest.fn().mockReturnValue('google-credential');

// Mock de les dependències
jest.mock('../../../services/firebase');
jest.mock('../../../services/UsersService');
jest.mock('@env', () => ({
  FIREBASE_WEB_CLIENT_ID: 'test-web-client-id',
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: mockGoogleSignin,
}));

// Necessitem fer que AuthService carregui el mock de GoogleSignin
let AuthService: typeof import('../../../services/AuthService').AuthService;

describe('AuthService - Tests Unitaris', () => {
  beforeAll(() => {
    // Carregar AuthService després que els mocks estiguin configurats
    AuthService = require('../../../services/AuthService').AuthService;
  });
  // Mocks de Firebase
  const mockAuth = {
    currentUser: null,
  } as any;

  const mockUser = {
    uid: 'test-uid-123',
    email: 'test@example.com',
    displayName: 'Test User',
    emailVerified: false,
    photoURL: null,
    getIdToken: jest.fn().mockResolvedValue('mock-token-123'),
    reload: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
  } as any;

  const mockUserCredential = {
    user: mockUser,
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    (firebase.auth as any) = mockAuth;
    (firebase.GoogleAuthProvider as any).credential = mockGoogleCredential;
  });

  describe('signUp', () => {
    const signUpData: SignUpData = {
      email: 'newuser@example.com',
      password: 'Test123456!',
      username: 'newuser',
      language: 'ca',
    };

    it('hauria de registrar un usuari amb èxit', async () => {
      // Arrange
      (firebase.createUserWithEmailAndPassword as jest.Mock).mockResolvedValue(mockUserCredential);
      (firebase.updateProfile as jest.Mock).mockResolvedValue(undefined);
      (firebase.sendEmailVerification as jest.Mock).mockResolvedValue(undefined);
      (mockUser.getIdToken as jest.Mock).mockResolvedValue('mock-token');
      (UsersService.createUser as jest.Mock).mockResolvedValue({
        id: 1,
        uid: mockUser.uid,
        username: signUpData.username,
        email: signUpData.email,
      });
      (firebase.signOut as jest.Mock).mockResolvedValue(undefined);

      // Act
      const result = await AuthService.signUp(signUpData);

      // Assert
      expect(firebase.createUserWithEmailAndPassword).toHaveBeenCalledWith(
        mockAuth,
        signUpData.email,
        signUpData.password
      );
      expect(firebase.updateProfile).toHaveBeenCalledWith(mockUser, {
        displayName: signUpData.username,
      });
      expect(firebase.sendEmailVerification).toHaveBeenCalledWith(mockUser);
      expect(UsersService.createUser).toHaveBeenCalledWith(
        {
          username: signUpData.username,
          email: signUpData.email,
          idioma: signUpData.language,
        },
        'mock-token'
      );
      expect(firebase.signOut).toHaveBeenCalledWith(mockAuth);
      expect(result).toBe(mockUser);
    });

    it('hauria d\'eliminar l\'usuari de Firebase si falla la creació al backend', async () => {
      // Arrange
      (firebase.createUserWithEmailAndPassword as jest.Mock).mockResolvedValue(mockUserCredential);
      (firebase.updateProfile as jest.Mock).mockResolvedValue(undefined);
      (firebase.sendEmailVerification as jest.Mock).mockResolvedValue(undefined);
      (mockUser.getIdToken as jest.Mock).mockResolvedValue('mock-token');
      (UsersService.createUser as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(AuthService.signUp(signUpData)).rejects.toThrow(
        'Error creant l\'usuari al backend'
      );
      expect(mockUser.delete).toHaveBeenCalled();
    });

    it('hauria de propagar errors de Firebase', async () => {
      // Arrange
      const firebaseError = new Error('auth/email-already-in-use');
      (firebase.createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(firebaseError);

      // Act & Assert
      await expect(AuthService.signUp(signUpData)).rejects.toThrow(firebaseError);
    });

    it('hauria de gestionar errors en l\'enviament d\'email de verificació', async () => {
      // Arrange
      (firebase.createUserWithEmailAndPassword as jest.Mock).mockResolvedValue(mockUserCredential);
      (firebase.updateProfile as jest.Mock).mockResolvedValue(undefined);
      (firebase.sendEmailVerification as jest.Mock).mockRejectedValue(
        new Error('Failed to send verification email')
      );

      // Act & Assert
      await expect(AuthService.signUp(signUpData)).rejects.toThrow();
    });
  });

  describe('login', () => {
    const loginData: LoginData = {
      email: 'test@example.com',
      password: 'Test123456!',
    };

    it('hauria de fer login amb credencials correctes', async () => {
      // Arrange
      (firebase.signInWithEmailAndPassword as jest.Mock).mockResolvedValue(mockUserCredential);

      // Act
      const result = await AuthService.login(loginData);

      // Assert
      expect(firebase.signInWithEmailAndPassword).toHaveBeenCalledWith(
        mockAuth,
        loginData.email,
        loginData.password
      );
      expect(result).toBe(mockUser);
    });

    it('hauria de retornar l\'usuari amb totes les propietats', async () => {
      // Arrange
      const verifiedUser = { ...mockUser, emailVerified: true };
      (firebase.signInWithEmailAndPassword as jest.Mock).mockResolvedValue({
        user: verifiedUser,
      });

      // Act
      const result = await AuthService.login(loginData);

      // Assert
      expect(result.emailVerified).toBe(true);
    });

    it('hauria de fallar amb credencials incorrectes', async () => {
      // Arrange
      const authError = new Error('auth/wrong-password');
      (firebase.signInWithEmailAndPassword as jest.Mock).mockRejectedValue(authError);

      // Act & Assert
      await expect(AuthService.login(loginData)).rejects.toThrow(authError);
    });

    it('hauria de fallar amb usuari no existent', async () => {
      // Arrange
      const authError = new Error('auth/user-not-found');
      (firebase.signInWithEmailAndPassword as jest.Mock).mockRejectedValue(authError);

      // Act & Assert
      await expect(AuthService.login(loginData)).rejects.toThrow(authError);
    });
  });

  describe('loginWithGoogle', () => {
    const mockGoogleUser = {
      uid: 'google-uid-123',
      email: 'google@example.com',
      displayName: 'Google User',
      emailVerified: true,
      photoURL: 'https://example.com/photo.jpg',
      getIdToken: jest.fn().mockResolvedValue('google-token'),
    };

    beforeEach(() => {
      mockGoogleSignin.configure.mockClear();
      mockGoogleSignin.hasPlayServices.mockClear();
      mockGoogleSignin.signIn.mockClear();
      mockGoogleCredential.mockClear();
      mockGoogleCredential.mockReturnValue('google-credential');
    });

    it('hauria de fer login amb Google per usuari existent', async () => {
      // Arrange
      mockGoogleSignin.hasPlayServices.mockResolvedValue(true);
      mockGoogleSignin.signIn.mockResolvedValue({
        data: { idToken: 'google-id-token' },
      });
      (firebase.signInWithCredential as jest.Mock).mockResolvedValue({
        user: mockGoogleUser,
      });
      (UsersService.getUserByUid as jest.Mock).mockResolvedValue({
        id: 1,
        uid: mockGoogleUser.uid,
        username: mockGoogleUser.displayName,
        email: mockGoogleUser.email,
      });

      // Act
      const result = await AuthService.loginWithGoogle();

      // Assert
      expect(mockGoogleSignin.configure).toHaveBeenCalled();
      expect(mockGoogleSignin.hasPlayServices).toHaveBeenCalled();
      expect(mockGoogleSignin.signIn).toHaveBeenCalled();
      expect(firebase.signInWithCredential).toHaveBeenCalledWith(mockAuth, 'google-credential');
      expect(result).toBe(mockGoogleUser);
    });

    it('hauria de crear usuari al backend per usuari nou de Google', async () => {
      // Arrange
      mockGoogleSignin.hasPlayServices.mockResolvedValue(true);
      mockGoogleSignin.signIn.mockResolvedValue({
        data: { idToken: 'google-id-token' },
      });
      (firebase.signInWithCredential as jest.Mock).mockResolvedValue({
        user: mockGoogleUser,
      });
      (UsersService.getUserByUid as jest.Mock).mockResolvedValue(null);
      (UsersService.createUser as jest.Mock).mockResolvedValue({
        id: 1,
        uid: mockGoogleUser.uid,
        username: mockGoogleUser.displayName,
        email: mockGoogleUser.email,
      });

      // Act
      const result = await AuthService.loginWithGoogle();

      // Assert
      expect(UsersService.createUser).toHaveBeenCalledWith(
        {
          username: mockGoogleUser.displayName,
          email: mockGoogleUser.email,
          idioma: 'ca',
        },
        'google-token'
      );
      expect(result).toBe(mockGoogleUser);
    });

    it('hauria de gestionar error si no hi ha ID token', async () => {
      // Arrange
      mockGoogleSignin.hasPlayServices.mockResolvedValue(true);
      mockGoogleSignin.signIn.mockResolvedValue({
        data: { idToken: null },
      });

      // Act & Assert
      await expect(AuthService.loginWithGoogle()).rejects.toThrow(
        'No s\'ha pogut obtenir l\'ID token de Google'
      );
    }, 10000);

    it('hauria de gestionar cancel·lació del login', async () => {
      // Arrange
      mockGoogleSignin.hasPlayServices.mockResolvedValue(true);
      const cancelError: any = new Error('User cancelled');
      cancelError.code = 'SIGN_IN_CANCELLED';
      mockGoogleSignin.signIn.mockRejectedValue(cancelError);

      // Act & Assert
      await expect(AuthService.loginWithGoogle()).rejects.toThrow('LOGIN_CANCELLED');
    }, 10000);

    it('hauria de continuar encara que falli la creació al backend', async () => {
      // Arrange
      mockGoogleSignin.hasPlayServices.mockResolvedValue(true);
      mockGoogleSignin.signIn.mockResolvedValue({
        data: { idToken: 'google-id-token' },
      });
      (firebase.signInWithCredential as jest.Mock).mockResolvedValue({
        user: mockGoogleUser,
      });
      (UsersService.getUserByUid as jest.Mock).mockResolvedValue(null);
      (UsersService.createUser as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await AuthService.loginWithGoogle();

      // Assert
      expect(result).toBe(mockGoogleUser);
    });

    it('hauria de gestionar nom d\'usuari alternatiu quan displayName és null', async () => {
      // Arrange
      const userWithoutName = { ...mockGoogleUser, displayName: null };
      mockGoogleSignin.hasPlayServices.mockResolvedValue(true);
      mockGoogleSignin.signIn.mockResolvedValue({
        data: { idToken: 'google-id-token' },
      });
      (firebase.signInWithCredential as jest.Mock).mockResolvedValue({
        user: userWithoutName,
      });
      (UsersService.getUserByUid as jest.Mock).mockResolvedValue(null);
      (UsersService.createUser as jest.Mock).mockResolvedValue({
        id: 1,
        uid: userWithoutName.uid,
      });

      // Act
      await AuthService.loginWithGoogle();

      // Assert
      expect(UsersService.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'google',
        }),
        expect.any(String)
      );
    });
  });

  describe('logout', () => {
    it('hauria de tancar sessió correctament', async () => {
      // Arrange
      (firebase.signOut as jest.Mock).mockResolvedValue(undefined);

      // Act
      await AuthService.logout();

      // Assert
      expect(firebase.signOut).toHaveBeenCalledWith(mockAuth);
    });

    it('hauria de propagar errors de Firebase', async () => {
      // Arrange
      const error = new Error('Sign out failed');
      (firebase.signOut as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(AuthService.logout()).rejects.toThrow(error);
    });
  });

  describe('resetPassword', () => {
    const email = 'reset@example.com';

    it('hauria d\'enviar email de recuperació', async () => {
      // Arrange
      (firebase.sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);

      // Act
      await AuthService.resetPassword(email);

      // Assert
      expect(firebase.sendPasswordResetEmail).toHaveBeenCalledWith(mockAuth, email);
    });

    it('hauria de propagar errors de Firebase', async () => {
      // Arrange
      const error = new Error('auth/user-not-found');
      (firebase.sendPasswordResetEmail as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(AuthService.resetPassword(email)).rejects.toThrow(error);
    });
  });

  describe('resendVerificationEmail', () => {
    it('hauria d\'enviar email de verificació amb usuari proporcionat', async () => {
      // Arrange
      (firebase.sendEmailVerification as jest.Mock).mockResolvedValue(undefined);

      // Act
      await AuthService.resendVerificationEmail(mockUser);

      // Assert
      expect(firebase.sendEmailVerification).toHaveBeenCalledWith(mockUser);
    });

    it('hauria d\'utilitzar currentUser si no es proporciona usuari', async () => {
      // Arrange
      mockAuth.currentUser = mockUser;
      (firebase.sendEmailVerification as jest.Mock).mockResolvedValue(undefined);

      // Act
      await AuthService.resendVerificationEmail();

      // Assert
      expect(firebase.sendEmailVerification).toHaveBeenCalledWith(mockUser);
    });

    it('hauria de fallar si no hi ha usuari autenticat', async () => {
      // Arrange
      mockAuth.currentUser = null;

      // Act & Assert
      await expect(AuthService.resendVerificationEmail()).rejects.toThrow(
        'No hi ha cap usuari autenticat'
      );
    });

    it('hauria de fallar si l\'email ja està verificat', async () => {
      // Arrange
      const verifiedUser = { ...mockUser, emailVerified: true };

      // Act & Assert
      await expect(AuthService.resendVerificationEmail(verifiedUser)).rejects.toThrow(
        'L\'email ja està verificat'
      );
    });
  });

  describe('getAuthToken', () => {
    it('hauria de retornar el token d\'un usuari autenticat', async () => {
      // Arrange
      mockAuth.currentUser = mockUser;
      (mockUser.getIdToken as jest.Mock).mockResolvedValue('test-token');

      // Act
      const token = await AuthService.getAuthToken();

      // Assert
      expect(token).toBe('test-token');
      expect(mockUser.getIdToken).toHaveBeenCalledWith(false);
    });

    it('hauria de forçar refresh si es sol·licita', async () => {
      // Arrange
      mockAuth.currentUser = mockUser;
      (mockUser.getIdToken as jest.Mock).mockResolvedValue('refreshed-token');

      // Act
      const token = await AuthService.getAuthToken(true);

      // Assert
      expect(token).toBe('refreshed-token');
      expect(mockUser.getIdToken).toHaveBeenCalledWith(true);
    });

    it('hauria de retornar null si no hi ha usuari', async () => {
      // Arrange
      mockAuth.currentUser = null;

      // Act
      const token = await AuthService.getAuthToken();

      // Assert
      expect(token).toBeNull();
    });

    it('hauria de retornar null en cas d\'error', async () => {
      // Arrange
      mockAuth.currentUser = mockUser;
      (mockUser.getIdToken as jest.Mock).mockRejectedValue(new Error('Token error'));

      // Act
      const token = await AuthService.getAuthToken();

      // Assert
      expect(token).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('hauria de retornar l\'usuari actual', () => {
      // Arrange
      mockAuth.currentUser = mockUser;

      // Act
      const user = AuthService.getCurrentUser();

      // Assert
      expect(user).toBe(mockUser);
    });

    it('hauria de retornar null si no hi ha usuari', () => {
      // Arrange
      mockAuth.currentUser = null;

      // Act
      const user = AuthService.getCurrentUser();

      // Assert
      expect(user).toBeNull();
    });
  });

  describe('onAuthStateChange', () => {
    it('hauria de subscriure a canvis d\'estat', () => {
      // Arrange
      const callback = jest.fn();
      const unsubscribe = jest.fn();
      (firebase.onAuthStateChanged as jest.Mock).mockReturnValue(unsubscribe);

      // Act
      const result = AuthService.onAuthStateChange(callback);

      // Assert
      expect(firebase.onAuthStateChanged).toHaveBeenCalledWith(mockAuth, callback);
      expect(result).toBe(unsubscribe);
    });
  });

  describe('reloadUser', () => {
    it('hauria de recarregar informació de l\'usuari', async () => {
      // Arrange
      mockAuth.currentUser = mockUser;
      (mockUser.reload as jest.Mock).mockResolvedValue(undefined);

      // Act
      await AuthService.reloadUser();

      // Assert
      expect(mockUser.reload).toHaveBeenCalled();
    });

    it('hauria de fallar si no hi ha usuari', async () => {
      // Arrange
      mockAuth.currentUser = null;

      // Act & Assert
      await expect(AuthService.reloadUser()).rejects.toThrow(
        'No hi ha cap usuari autenticat'
      );
    });

    it('hauria de propagar errors de reload', async () => {
      // Arrange
      mockAuth.currentUser = mockUser;
      const error = new Error('Reload failed');
      (mockUser.reload as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(AuthService.reloadUser()).rejects.toThrow(error);
    });
  });

  describe('deleteAccount', () => {
    it('hauria d\'eliminar el compte correctament', async () => {
      // Arrange
      mockAuth.currentUser = mockUser;
      (mockUser.getIdToken as jest.Mock).mockResolvedValue('delete-token');
      (UsersService.deleteUser as jest.Mock).mockResolvedValue(true);
      (mockUser.delete as jest.Mock).mockResolvedValue(undefined);

      // Act
      await AuthService.deleteAccount();

      // Assert
      expect(UsersService.deleteUser).toHaveBeenCalledWith(mockUser.uid, 'delete-token');
      expect(mockUser.delete).toHaveBeenCalled();
    });

    it('hauria de continuar encara que falli l\'eliminació al backend', async () => {
      // Arrange
      mockAuth.currentUser = mockUser;
      (mockUser.getIdToken as jest.Mock).mockResolvedValue('delete-token');
      (UsersService.deleteUser as jest.Mock).mockResolvedValue(false);
      (mockUser.delete as jest.Mock).mockResolvedValue(undefined);

      // Act
      await AuthService.deleteAccount();

      // Assert
      expect(mockUser.delete).toHaveBeenCalled();
    });

    it('hauria de fallar si no hi ha usuari', async () => {
      // Arrange
      mockAuth.currentUser = null;

      // Act & Assert
      await expect(AuthService.deleteAccount()).rejects.toThrow(
        'No hi ha cap usuari autenticat'
      );
    });

    it('hauria de propagar errors de Firebase', async () => {
      // Arrange
      mockAuth.currentUser = mockUser;
      (mockUser.getIdToken as jest.Mock).mockResolvedValue('delete-token');
      (UsersService.deleteUser as jest.Mock).mockResolvedValue(true);
      const error = new Error('Delete failed');
      (mockUser.delete as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(AuthService.deleteAccount()).rejects.toThrow(error);
    });
  });

  describe('changePassword', () => {
    const currentPassword = 'OldPass123!';
    const newPassword = 'NewPass123!';

    it('hauria de canviar la contrasenya correctament', async () => {
      // Arrange
      mockAuth.currentUser = mockUser;
      const mockCredential = { providerId: 'password' };
      (firebase.EmailAuthProvider.credential as jest.Mock).mockReturnValue(mockCredential);
      (firebase.reauthenticateWithCredential as jest.Mock).mockResolvedValue(undefined);
      (firebase.updatePassword as jest.Mock).mockResolvedValue(undefined);

      // Act
      await AuthService.changePassword(currentPassword, newPassword);

      // Assert
      expect(firebase.EmailAuthProvider.credential).toHaveBeenCalledWith(
        mockUser.email,
        currentPassword
      );
      expect(firebase.reauthenticateWithCredential).toHaveBeenCalledWith(
        mockUser,
        mockCredential
      );
      expect(firebase.updatePassword).toHaveBeenCalledWith(mockUser, newPassword);
    });

    it('hauria de fallar si no hi ha usuari', async () => {
      // Arrange
      mockAuth.currentUser = null;

      // Act & Assert
      await expect(AuthService.changePassword(currentPassword, newPassword)).rejects.toThrow(
        'No hi ha cap usuari autenticat'
      );
    });

    it('hauria de fallar si l\'usuari no té email', async () => {
      // Arrange
      mockAuth.currentUser = { ...mockUser, email: null };

      // Act & Assert
      await expect(AuthService.changePassword(currentPassword, newPassword)).rejects.toThrow(
        'No hi ha cap usuari autenticat'
      );
    });

    it('hauria de propagar errors de reautenticació', async () => {
      // Arrange
      mockAuth.currentUser = mockUser;
      const error = new Error('auth/wrong-password');
      (firebase.EmailAuthProvider.credential as jest.Mock).mockReturnValue({});
      (firebase.reauthenticateWithCredential as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(AuthService.changePassword(currentPassword, newPassword)).rejects.toThrow(
        error
      );
    });
  });

  describe('changeEmail', () => {
    const password = 'Test123!';
    const newEmail = 'newemail@example.com';

    it('hauria de canviar l\'email correctament', async () => {
      // Arrange
      mockAuth.currentUser = mockUser;
      const mockCredential = { providerId: 'password' };
      (firebase.EmailAuthProvider.credential as jest.Mock).mockReturnValue(mockCredential);
      (firebase.reauthenticateWithCredential as jest.Mock).mockResolvedValue(undefined);
      (firebase.verifyBeforeUpdateEmail as jest.Mock).mockResolvedValue(undefined);

      // Act
      await AuthService.changeEmail(password, newEmail);

      // Assert
      expect(firebase.EmailAuthProvider.credential).toHaveBeenCalledWith(
        mockUser.email,
        password
      );
      expect(firebase.reauthenticateWithCredential).toHaveBeenCalledWith(
        mockUser,
        mockCredential
      );
      expect(firebase.verifyBeforeUpdateEmail).toHaveBeenCalledWith(mockUser, newEmail);
    });

    it('hauria de fallar si no hi ha usuari', async () => {
      // Arrange
      mockAuth.currentUser = null;

      // Act & Assert
      await expect(AuthService.changeEmail(password, newEmail)).rejects.toThrow(
        'No hi ha cap usuari autenticat'
      );
    });

    it('hauria de propagar errors de verifyBeforeUpdateEmail', async () => {
      // Arrange
      mockAuth.currentUser = mockUser;
      const mockCredential = { providerId: 'password' };
      (firebase.EmailAuthProvider.credential as jest.Mock).mockReturnValue(mockCredential);
      (firebase.reauthenticateWithCredential as jest.Mock).mockResolvedValue(undefined);
      const error = new Error('auth/email-already-in-use');
      (firebase.verifyBeforeUpdateEmail as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(AuthService.changeEmail(password, newEmail)).rejects.toThrow(error);
    });
  });

  describe('getErrorMessageKey', () => {
    it('hauria de retornar claus de traducció correctes per errors coneguts', () => {
      expect(AuthService.getErrorMessageKey('auth/email-already-in-use')).toBe(
        'auth.errors.emailInUse'
      );
      expect(AuthService.getErrorMessageKey('auth/invalid-email')).toBe(
        'auth.errors.invalidEmail'
      );
      expect(AuthService.getErrorMessageKey('auth/weak-password')).toBe(
        'auth.errors.weakPassword'
      );
      expect(AuthService.getErrorMessageKey('auth/user-disabled')).toBe(
        'auth.errors.userDisabled'
      );
      expect(AuthService.getErrorMessageKey('auth/user-not-found')).toBe(
        'auth.errors.invalidCredentials'
      );
      expect(AuthService.getErrorMessageKey('auth/wrong-password')).toBe(
        'auth.errors.invalidCredentials'
      );
      expect(AuthService.getErrorMessageKey('auth/too-many-requests')).toBe(
        'auth.errors.tooManyRequests'
      );
      expect(AuthService.getErrorMessageKey('auth/network-request-failed')).toBe(
        'auth.errors.networkError'
      );
      expect(AuthService.getErrorMessageKey('GOOGLE_SIGNIN_NOT_AVAILABLE')).toBe(
        'auth.errors.googleSigninNotAvailable'
      );
    });

    it('hauria de retornar clau genèrica per errors desconeguts', () => {
      expect(AuthService.getErrorMessageKey('unknown-error')).toBe('auth.errors.generic');
      expect(AuthService.getErrorMessageKey('custom/error')).toBe('auth.errors.generic');
      expect(AuthService.getErrorMessageKey('')).toBe('auth.errors.generic');
    });
  });

  describe('isGoogleSignInAvailable', () => {
    it('hauria de retornar true si Google Sign In està disponible', () => {
      // L'import del mock ja fa que estigui disponible
      expect(AuthService.isGoogleSignInAvailable()).toBe(true);
    });
  });
});
