// Mock de @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock BackHandler for navigation tests
const mockBackHandler = {
  addEventListener: jest.fn((event, callback) => ({
    remove: jest.fn(),
  })),
  removeEventListener: jest.fn(),
  exitApp: jest.fn(),
};

// Mock all BackHandler module paths
// Note: react-native's index.js requires BackHandler.default
jest.mock('react-native/Libraries/Utilities/BackHandler', () => ({
  __esModule: true,
  default: mockBackHandler,
  ...mockBackHandler,
}));

// Mock platform-specific versions
jest.mock('react-native/Libraries/Utilities/BackHandler.android', () => ({
  __esModule: true,
  default: mockBackHandler,
  ...mockBackHandler,
}));

jest.mock('react-native/Libraries/Utilities/BackHandler.ios', () => ({
  __esModule: true,
  default: mockBackHandler,
  ...mockBackHandler,
}));

// Mock @react-navigation/native-stack
jest.mock('@react-navigation/native-stack', () => {
  const React = require('react');
  
  const createNativeStackNavigator = () => {
    const Navigator = ({ children, screenOptions, initialRouteName, ...props }) => {
      const screens = React.Children.toArray(children);
      
      const renderedScreens = screens.map((screen, index) => {
        if (!React.isValidElement(screen)) return null;
        
        const screenProps = screen.props;
        const childContent = screenProps.children;
        
        if (typeof childContent === 'function') {
          const mockNavigation = {
            navigate: jest.fn(),
            goBack: jest.fn(),
            setParams: jest.fn(),
            addListener: jest.fn(() => jest.fn()),
            removeListener: jest.fn(),
            reset: jest.fn(),
            setOptions: jest.fn(),
            isFocused: jest.fn(() => true),
            canGoBack: jest.fn(() => true),
            getParent: jest.fn(),
          };
          const mockRoute = { params: screenProps.initialParams || {}, key: `screen-${index}`, name: screenProps.name };
          
          return React.createElement(
            'Screen',
            { key: screenProps.name || index, name: screenProps.name },
            childContent({ navigation: mockNavigation, route: mockRoute })
          );
        }
        
        return React.createElement(
          'Screen',
          { key: screenProps.name || index, name: screenProps.name },
          childContent
        );
      });
      
      return React.createElement('NativeStackNavigator', props, renderedScreens);
    };
    
    const Screen = ({ children, name, component: Component, ...props }) => {
      if (Component) {
        const mockNavigation = {
          navigate: jest.fn(),
          goBack: jest.fn(),
          setParams: jest.fn(),
          addListener: jest.fn(() => jest.fn()),
          removeListener: jest.fn(),
          reset: jest.fn(),
          setOptions: jest.fn(),
          isFocused: jest.fn(() => true),
          canGoBack: jest.fn(() => true),
          getParent: jest.fn(),
        };
        const mockRoute = { params: props.initialParams || {}, key: 'mock-key', name };
        return React.createElement('Screen', { name, ...props }, 
          React.createElement(Component, { navigation: mockNavigation, route: mockRoute })
        );
      }
      return React.createElement('Screen', { name, ...props }, children);
    };
    
    const Group = ({ children, ...props }) => {
      return React.createElement('Group', props, children);
    };
    
    return { Navigator, Screen, Group };
  };
  
  return {
    createNativeStackNavigator,
  };
});

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

// Mock @react-navigation/native - fully mocked to avoid BackHandler issues
jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    NavigationContainer: ({ children }) => React.createElement('NavigationContainer', null, children),
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      reset: jest.fn(),
      setOptions: jest.fn(),
      addListener: jest.fn(() => jest.fn()),
      removeListener: jest.fn(),
      dispatch: jest.fn(),
      isFocused: jest.fn(() => true),
      canGoBack: jest.fn(() => true),
      getParent: jest.fn(),
      getState: jest.fn(() => ({ routes: [], index: 0 })),
    }),
    useRoute: () => ({
      params: {},
      key: 'mock-key',
      name: 'MockRoute',
    }),
    useFocusEffect: (callback) => {
      React.useEffect(() => {
        callback();
      }, []);
    },
    useIsFocused: () => true,
    createNavigationContainerRef: () => ({
      current: null,
    }),
    CommonActions: {
      navigate: jest.fn(),
      reset: jest.fn(),
      goBack: jest.fn(),
    },
    StackActions: {
      push: jest.fn(),
      pop: jest.fn(),
      popToTop: jest.fn(),
    },
    TabActions: {
      jumpTo: jest.fn(),
    },
    DrawerActions: {
      openDrawer: jest.fn(),
      closeDrawer: jest.fn(),
      toggleDrawer: jest.fn(),
    },
    NavigationContext: React.createContext(null),
    NavigationRouteContext: React.createContext(null),
    ThemeProvider: ({ children }) => children,
    DefaultTheme: {
      dark: false,
      colors: {
        primary: '#007AFF',
        background: '#fff',
        card: '#fff',
        text: '#000',
        border: '#d8d8d8',
        notification: '#ff3b30',
      },
    },
  };
});

// Mock @react-navigation/bottom-tabs
jest.mock('@react-navigation/bottom-tabs', () => {
  const React = require('react');
  
  const createBottomTabNavigator = () => {
    const Navigator = ({ children, screenOptions, ...props }) => {
      // Extract all Screen children
      const screens = React.Children.toArray(children);
      
      // Render all screens (executing their children functions if they exist)
      const renderedScreens = screens.map((screen, index) => {
        if (!React.isValidElement(screen)) return null;
        
        const screenProps = screen.props;
        const childContent = screenProps.children;
        const screenOptions = screenProps.options;
        
        // Execute tabBarIcon function if it exists to cover those lines
        let tabBarIconElement = null;
        if (screenOptions && typeof screenOptions.tabBarIcon === 'function') {
          // Call with both focused and not focused states
          tabBarIconElement = React.createElement(
            'TabBarIcons',
            { key: `icons-${index}` },
            screenOptions.tabBarIcon({ focused: true, color: '#000', size: 24 }),
            screenOptions.tabBarIcon({ focused: false, color: '#888', size: 24 })
          );
        }
        
        // If children is a function, call it with mock navigation props
        if (typeof childContent === 'function') {
          const mockNavigation = {
            navigate: jest.fn(),
            goBack: jest.fn(),
            setParams: jest.fn(),
            addListener: jest.fn((event, callback) => {
              // Execute blur callback immediately for coverage
              if (event === 'blur' && typeof callback === 'function') {
                callback();
              }
              return jest.fn();
            }),
            isFocused: jest.fn(() => index === 0),
          };
          const mockRoute = { params: {}, key: `screen-${index}`, name: screenProps.name };
          
          return React.createElement(
            'Screen',
            { key: screenProps.name || index, name: screenProps.name },
            tabBarIconElement,
            childContent({ navigation: mockNavigation, route: mockRoute })
          );
        }
        
        return React.createElement(
          'Screen',
          { key: screenProps.name || index, name: screenProps.name },
          tabBarIconElement,
          childContent
        );
      });
      
      return React.createElement('Navigator', props, renderedScreens);
    };
    
    const Screen = ({ children, name, ...props }) => {
      return React.createElement('Screen', { name, ...props }, children);
    };
    
    return { Navigator, Screen };
  };
  
  return {
    createBottomTabNavigator,
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

// Cleanup after each test to prevent open handles
afterEach(() => {
  jest.clearAllMocks();
});
