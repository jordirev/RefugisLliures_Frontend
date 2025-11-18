/**
 * Utilitats per crear mocks de Firebase per als tests d'integració
 */

export const createMockFirebaseUser = (overrides = {}) => {
  const defaultUser = {
    uid: 'test-uid-123',
    email: 'test@example.com',
    emailVerified: true,
    displayName: 'Test User',
    photoURL: null,
    phoneNumber: null,
    isAnonymous: false,
    metadata: {
      creationTime: '2024-01-01T00:00:00Z',
      lastSignInTime: new Date().toISOString(),
    },
    providerData: [],
    refreshToken: 'mock-refresh-token',
    tenantId: null,
    delete: jest.fn().mockResolvedValue(undefined),
    getIdToken: jest.fn().mockResolvedValue('mock-token-123'),
    getIdTokenResult: jest.fn().mockResolvedValue({
      token: 'mock-token-123',
      claims: {},
      authTime: new Date().toISOString(),
      issuedAtTime: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 3600000).toISOString(),
      signInProvider: 'password',
    }),
    reload: jest.fn().mockResolvedValue(undefined),
    toJSON: jest.fn().mockReturnValue({ uid: 'test-uid-123' }),
  };

  return { ...defaultUser, ...overrides };
};

export const createMockFirebaseAuth = (user = null) => {
  let currentUser = user;
  let authStateCallbacks: ((user: any) => void)[] = [];

  const mockAuth = {
    currentUser,
    onAuthStateChanged: jest.fn((callback) => {
      authStateCallbacks.push(callback);
      // Crida immediatament amb l'usuari actual
      callback(currentUser);
      // Retorna funció per dessubscriure's
      return jest.fn(() => {
        authStateCallbacks = authStateCallbacks.filter(cb => cb !== callback);
      });
    }),
    signInWithEmailAndPassword: jest.fn().mockImplementation(async (auth, email, password) => {
      if (email === 'error@test.com') {
        throw new Error('auth/invalid-credential');
      }
      const user = createMockFirebaseUser({ email });
      currentUser = user;
      authStateCallbacks.forEach(cb => cb(user));
      return { user };
    }),
    createUserWithEmailAndPassword: jest.fn().mockImplementation(async (auth, email, password) => {
      if (email === 'existing@test.com') {
        throw new Error('auth/email-already-in-use');
      }
      const user = createMockFirebaseUser({ email, emailVerified: false });
      currentUser = user;
      authStateCallbacks.forEach(cb => cb(user));
      return { user };
    }),
    signOut: jest.fn().mockImplementation(async () => {
      currentUser = null;
      authStateCallbacks.forEach(cb => cb(null));
    }),
    sendEmailVerification: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    updateProfile: jest.fn().mockResolvedValue(undefined),
    updatePassword: jest.fn().mockResolvedValue(undefined),
    updateEmail: jest.fn().mockResolvedValue(undefined),
    verifyBeforeUpdateEmail: jest.fn().mockResolvedValue(undefined),
    reauthenticateWithCredential: jest.fn().mockResolvedValue(undefined),
    signInWithCredential: jest.fn().mockImplementation(async (auth, credential) => {
      const user = createMockFirebaseUser({ email: 'google@test.com', displayName: 'Google User' });
      currentUser = user;
      authStateCallbacks.forEach(cb => cb(user));
      return { user };
    }),
  };

  return mockAuth;
};

export const mockFirebaseAuthModule = () => {
  const mockAuth = createMockFirebaseAuth();
  
  return {
    getAuth: jest.fn(() => mockAuth),
    signInWithEmailAndPassword: mockAuth.signInWithEmailAndPassword,
    createUserWithEmailAndPassword: mockAuth.createUserWithEmailAndPassword,
    signOut: mockAuth.signOut,
    sendEmailVerification: mockAuth.sendEmailVerification,
    sendPasswordResetEmail: mockAuth.sendPasswordResetEmail,
    updateProfile: mockAuth.updateProfile,
    updatePassword: mockAuth.updatePassword,
    updateEmail: mockAuth.updateEmail,
    verifyBeforeUpdateEmail: mockAuth.verifyBeforeUpdateEmail,
    reauthenticateWithCredential: mockAuth.reauthenticateWithCredential,
    signInWithCredential: mockAuth.signInWithCredential,
    onAuthStateChanged: mockAuth.onAuthStateChanged,
    GoogleAuthProvider: jest.fn().mockImplementation(() => ({
      credential: jest.fn().mockReturnValue({ providerId: 'google.com' }),
    })),
    EmailAuthProvider: {
      credential: jest.fn().mockReturnValue({ providerId: 'password' }),
    },
  };
};
