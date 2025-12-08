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

// Mock expo-file-system/legacy
jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file://documents/',
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  EncodingType: {
    UTF8: 'utf8',
  },
}));

// Mock expo-sharing
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      language: 'ca',
      changeLanguage: jest.fn(),
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
}));

// Mock @react-navigation/native
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      reset: jest.fn(),
      setOptions: jest.fn(),
      addListener: jest.fn(() => jest.fn()),
      removeListener: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
    useFocusEffect: (callback) => {
      callback();
    },
  };
});

// Mock @react-navigation/bottom-tabs
jest.mock('@react-navigation/bottom-tabs', () => {
  const React = require('react');
  return {
    createBottomTabNavigator: () => ({
      Navigator: ({ children, ...props }) => React.createElement('Navigator', props, children),
      Screen: ({ children, ...props }) => React.createElement('Screen', props, children),
    }),
    BottomTabBarHeightContext: React.createContext(0),
    BottomTabBarHeightCallbackContext: React.createContext(undefined),
  };
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  const initialMetrics = {
    frame: { x: 0, y: 0, width: 390, height: 844 },
    insets: { top: 0, left: 0, right: 0, bottom: 0 },
  };

  const SafeAreaContext = React.createContext(initialMetrics);
  const SafeAreaFrameContext = React.createContext(initialMetrics.frame);
  const SafeAreaInsetsContext = React.createContext(initialMetrics.insets);

  const SafeAreaProvider = ({ children, initialMetrics: customMetrics }) => {
    const metrics = customMetrics || initialMetrics;
    return React.createElement(
      SafeAreaContext.Provider,
      { value: metrics },
      React.createElement(
        SafeAreaFrameContext.Provider,
        { value: metrics.frame },
        React.createElement(
          SafeAreaInsetsContext.Provider,
          { value: metrics.insets },
          children
        )
      )
    );
  };

  return {
    SafeAreaProvider,
    SafeAreaView: ({ children }) => React.createElement(View, {}, children),
    SafeAreaContext,
    SafeAreaFrameContext,
    SafeAreaInsetsContext,
    useSafeAreaInsets: () => initialMetrics.insets,
    useSafeAreaFrame: () => initialMetrics.frame,
  };
});

// Silenciar advertències de console.warn i console.error en tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
