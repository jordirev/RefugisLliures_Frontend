// Mock de @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Firebase Auth
jest.mock('firebase/auth', () => {
  const mockUser = {
    uid: 'mock-uid',
    email: 'test@example.com',
    emailVerified: true,
    displayName: 'Test User',
    photoURL: null,
    getIdToken: jest.fn().mockResolvedValue('mock-token'),
  };

  return {
    getAuth: jest.fn(() => ({})),
    GoogleAuthProvider: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    signInWithCredential: jest.fn(),
    signOut: jest.fn(),
    sendEmailVerification: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    updateProfile: jest.fn(),
    onAuthStateChanged: jest.fn((auth, callback) => {
      // Return unsubscribe function
      return jest.fn();
    }),
    OAuthProvider: jest.fn(),
    updatePassword: jest.fn(),
    updateEmail: jest.fn(),
    reauthenticateWithCredential: jest.fn(),
    EmailAuthProvider: {
      credential: jest.fn(),
    },
    verifyBeforeUpdateEmail: jest.fn(),
  };
});

// Mock Firebase App
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
}));

// Silenciar advertències de console.warn i console.error en tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
