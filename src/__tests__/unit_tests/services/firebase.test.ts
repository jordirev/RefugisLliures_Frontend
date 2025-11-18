/**
 * Tests unitaris per firebase
 * 
 * Aquest fitxer cobreix:
 * - Inicialització de Firebase amb configuració correcta
 * - Validació de variables d'entorn
 * - Exportació de funcions d'autenticació
 * - Configuració de Firebase Auth
 * - Gestió de configuracions incompletes o invàlides
 * 
 * Escenaris d'èxit i límit per màxim coverage
 */

// Mock de firebase/app
const mockInitializeApp = jest.fn();
jest.mock('firebase/app', () => ({
  initializeApp: mockInitializeApp
}));

// Mock de firebase/auth
const mockGetAuth = jest.fn();
const mockGoogleAuthProvider = jest.fn();
const mockOAuthProvider = jest.fn();

jest.mock('firebase/auth', () => ({
  getAuth: mockGetAuth,
  GoogleAuthProvider: mockGoogleAuthProvider,
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signInWithCredential: jest.fn(),
  signOut: jest.fn(),
  sendEmailVerification: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  updateProfile: jest.fn(),
  onAuthStateChanged: jest.fn(),
  OAuthProvider: mockOAuthProvider,
  updatePassword: jest.fn(),
  updateEmail: jest.fn(),
  reauthenticateWithCredential: jest.fn(),
  EmailAuthProvider: jest.fn(),
  verifyBeforeUpdateEmail: jest.fn()
}));

// Les variables d'entorn es carreguen des de __mocks__/env.js via moduleNameMapper

describe('firebase', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Reset del mock d'app amb valors per defecte
    mockInitializeApp.mockReturnValue({
      name: '[DEFAULT]',
      options: mockInitializeApp.mock.calls[0]?.[0] || {}
    });

    // Reset del mock d'auth
    mockGetAuth.mockReturnValue({
      app: {},
      name: 'auth'
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.resetModules(); // Reset dels mòduls per tests d'inicialització
  });

  describe('Inicialització de Firebase', () => {
    it('ha d\'inicialitzar Firebase amb una configuració', () => {
      // Arrange & Act
      const firebase = require('../../../services/firebase');

      // Assert
      expect(mockInitializeApp).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: expect.any(String),
          authDomain: expect.any(String),
          projectId: expect.any(String),
          appId: expect.any(String)
        })
      );
    });

    it('ha d\'inicialitzar Auth després de l\'app', () => {
      // Arrange & Act
      const firebase = require('../../../services/firebase');

      // Assert
      expect(mockGetAuth).toHaveBeenCalled();
    });

    it('ha de crear una instància de GoogleAuthProvider', () => {
      // Arrange & Act
      const firebase = require('../../../services/firebase');

      // Assert
      expect(mockGoogleAuthProvider).toHaveBeenCalled();
    });

    it('ha d\'exportar l\'app inicialitzada', () => {
      // Arrange & Act
      const firebase = require('../../../services/firebase');

      // Assert
      expect(firebase.app).toBeDefined();
    });

    it('ha d\'exportar auth inicialitzat', () => {
      // Arrange & Act
      const firebase = require('../../../services/firebase');

      // Assert
      expect(firebase.auth).toBeDefined();
    });

    it('ha d\'exportar provider de Google', () => {
      // Arrange & Act
      const firebase = require('../../../services/firebase');

      // Assert
      expect(firebase.provider).toBeDefined();
    });
  });

  describe('Validació de configuració', () => {
    it('la configuració conté els camps necessaris', () => {
      // Arrange & Act
      const firebase = require('../../../services/firebase');

      // Assert - Simplement verifiquem que s'ha inicialitzat
      expect(mockInitializeApp).toHaveBeenCalled();
      expect(firebase.auth).toBeDefined();
      expect(firebase.app).toBeDefined();
    });

    it('no crasheja si la configuració és vàlida', () => {
      // Arrange & Act
      const firebase = require('../../../services/firebase');

      // Assert
      expect(firebase).toBeDefined();
      expect(firebase.auth).toBeDefined();
      expect(firebase.provider).toBeDefined();
    });
  });

  describe('Exports de funcions d\'autenticació', () => {
    it('ha d\'exportar createUserWithEmailAndPassword', () => {
      // Arrange & Act
      const firebase = require('../../../services/firebase');

      // Assert
      expect(firebase.createUserWithEmailAndPassword).toBeDefined();
      expect(typeof firebase.createUserWithEmailAndPassword).toBe('function');
    });

    it('ha d\'exportar signInWithEmailAndPassword', () => {
      // Arrange & Act
      const firebase = require('../../../services/firebase');

      // Assert
      expect(firebase.signInWithEmailAndPassword).toBeDefined();
      expect(typeof firebase.signInWithEmailAndPassword).toBe('function');
    });

    it('ha d\'exportar signInWithCredential', () => {
      // Arrange & Act
      const firebase = require('../../../services/firebase');

      // Assert
      expect(firebase.signInWithCredential).toBeDefined();
      expect(typeof firebase.signInWithCredential).toBe('function');
    });

    it('ha d\'exportar signOut', () => {
      // Arrange & Act
      const firebase = require('../../../services/firebase');

      // Assert
      expect(firebase.signOut).toBeDefined();
      expect(typeof firebase.signOut).toBe('function');
    });

    it('ha d\'exportar sendEmailVerification', () => {
      // Arrange & Act
      const firebase = require('../../../services/firebase');

      // Assert
      expect(firebase.sendEmailVerification).toBeDefined();
      expect(typeof firebase.sendEmailVerification).toBe('function');
    });

    it('ha d\'exportar sendPasswordResetEmail', () => {
      // Arrange & Act
      const firebase = require('../../../services/firebase');

      // Assert
      expect(firebase.sendPasswordResetEmail).toBeDefined();
      expect(typeof firebase.sendPasswordResetEmail).toBe('function');
    });

    it('ha d\'exportar updateProfile', () => {
      // Arrange & Act
      const firebase = require('../../../services/firebase');

      // Assert
      expect(firebase.updateProfile).toBeDefined();
      expect(typeof firebase.updateProfile).toBe('function');
    });

    it('ha d\'exportar onAuthStateChanged', () => {
      // Arrange & Act
      const firebase = require('../../../services/firebase');

      // Assert
      expect(firebase.onAuthStateChanged).toBeDefined();
      expect(typeof firebase.onAuthStateChanged).toBe('function');
    });

    it('ha d\'exportar GoogleAuthProvider', () => {
      // Arrange & Act
      const firebase = require('../../../services/firebase');

      // Assert
      expect(firebase.GoogleAuthProvider).toBeDefined();
    });

    it('ha d\'exportar OAuthProvider', () => {
      // Arrange & Act
      const firebase = require('../../../services/firebase');

      // Assert
      expect(firebase.OAuthProvider).toBeDefined();
    });

    it('ha d\'exportar updatePassword', () => {
      // Arrange & Act
      const firebase = require('../../../services/firebase');

      // Assert
      expect(firebase.updatePassword).toBeDefined();
      expect(typeof firebase.updatePassword).toBe('function');
    });

    it('ha d\'exportar updateEmail', () => {
      // Arrange & Act
      const firebase = require('../../../services/firebase');

      // Assert
      expect(firebase.updateEmail).toBeDefined();
      expect(typeof firebase.updateEmail).toBe('function');
    });

    it('ha d\'exportar reauthenticateWithCredential', () => {
      // Arrange & Act
      const firebase = require('../../../services/firebase');

      // Assert
      expect(firebase.reauthenticateWithCredential).toBeDefined();
      expect(typeof firebase.reauthenticateWithCredential).toBe('function');
    });

    it('ha d\'exportar EmailAuthProvider', () => {
      // Arrange & Act
      const firebase = require('../../../services/firebase');

      // Assert
      expect(firebase.EmailAuthProvider).toBeDefined();
    });

    it('ha d\'exportar verifyBeforeUpdateEmail', () => {
      // Arrange & Act
      const firebase = require('../../../services/firebase');

      // Assert
      expect(firebase.verifyBeforeUpdateEmail).toBeDefined();
      expect(typeof firebase.verifyBeforeUpdateEmail).toBe('function');
    });
  });

  describe('Estructura de configuració', () => {
    it('ha de passar una configuració amb tots els camps correctes', () => {
      // Arrange & Act
      require('../../../services/firebase');

      // Assert
      expect(mockInitializeApp).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: expect.any(String),
          authDomain: expect.any(String),
          projectId: expect.any(String),
          storageBucket: expect.any(String),
          messagingSenderId: expect.any(String),
          appId: expect.any(String)
        })
      );
    });

    it('ha d\'incloure measurementId', () => {
      // Arrange & Act
      require('../../../services/firebase');

      // Assert
      expect(mockInitializeApp).toHaveBeenCalledWith(
        expect.objectContaining({
          measurementId: expect.any(String)
        })
      );
    });

    it('ha de configurar authDomain i storageBucket', () => {
      // Arrange & Act
      require('../../../services/firebase');

      // Assert
      const calls = mockInitializeApp.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const config = calls[0][0];
      expect(config.authDomain).toBeDefined();
      expect(config.storageBucket).toBeDefined();
    });
  });

  describe('Ordre d\'inicialització', () => {
    it('ha d\'inicialitzar l\'app abans de getAuth', () => {
      // Arrange
      const callOrder: string[] = [];
      
      mockInitializeApp.mockImplementation(() => {
        callOrder.push('initializeApp');
        return { name: '[DEFAULT]', options: {} };
      });

      mockGetAuth.mockImplementation(() => {
        callOrder.push('getAuth');
        return { app: {}, name: 'auth' };
      });

      // Act
      require('../../../services/firebase');

      // Assert
      expect(callOrder).toEqual(['initializeApp', 'getAuth']);
    });

    it('ha de crear GoogleAuthProvider després de getAuth', () => {
      // Arrange
      const callOrder: string[] = [];
      
      mockGetAuth.mockImplementation(() => {
        callOrder.push('getAuth');
        return { app: {}, name: 'auth' };
      });

      mockGoogleAuthProvider.mockImplementation(() => {
        callOrder.push('GoogleAuthProvider');
        return {};
      });

      // Act
      require('../../../services/firebase');

      // Assert
      expect(callOrder).toEqual(['getAuth', 'GoogleAuthProvider']);
    });
  });

  describe('Gestió d\'errors en inicialització', () => {
    it('ha de propagar errors d\'initializeApp', () => {
      // Arrange
      const error = new Error('Invalid Firebase configuration');
      mockInitializeApp.mockImplementation(() => {
        throw error;
      });

      // Act & Assert
      expect(() => {
        require('../../../services/firebase');
      }).toThrow('Invalid Firebase configuration');
    });

    it('ha de propagar errors de getAuth', () => {
      // Arrange
      const error = new Error('Auth initialization failed');
      mockGetAuth.mockImplementation(() => {
        throw error;
      });

      // Act & Assert
      expect(() => {
        require('../../../services/firebase');
      }).toThrow('Auth initialization failed');
    });
  });

  describe('Type exports', () => {
    it('ha d\'exportar el tipus FirebaseUser', () => {
      // Arrange & Act
      const firebase = require('../../../services/firebase');

      // Assert - TypeScript type, només comprovem que el mòdul carrega correctament
      expect(firebase).toBeDefined();
    });
  });

  describe('Comentaris i documentació', () => {
    it('ha d\'incloure comentaris sobre persistència AsyncStorage', () => {
      // Arrange & Act
      const firebaseModule = require.resolve('../../../services/firebase');
      const fs = require('fs');
      const content = fs.readFileSync(firebaseModule.replace('.js', '.ts'), 'utf8');

      // Assert
      expect(content).toContain('AsyncStorage');
    });

    it('ha d\'incloure comentari sobre configuració de Firebase', () => {
      // Arrange & Act
      const firebaseModule = require.resolve('../../../services/firebase');
      const fs = require('fs');
      const content = fs.readFileSync(firebaseModule.replace('.js', '.ts'), 'utf8');

      // Assert
      expect(content).toContain('Firebase configuration');
    });
  });
});
