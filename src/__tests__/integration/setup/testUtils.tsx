/**
 * Utilitats compartides per als tests d'integració
 */
import React, { ReactElement } from 'react';
import { render, RenderOptions, cleanup } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from '../../../contexts/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock de l'Auth Context per tests
interface MockAuthContextValue {
  firebaseUser?: any;
  backendUser?: any;
  isLoading?: boolean;
  isAuthenticated?: boolean;
  authToken?: string | null;
  login?: jest.Mock;
  loginWithGoogle?: jest.Mock;
  signup?: jest.Mock;
  logout?: jest.Mock;
  deleteAccount?: jest.Mock;
  refreshToken?: jest.Mock;
  reloadUser?: jest.Mock;
  changePassword?: jest.Mock;
  changeEmail?: jest.Mock;
  updateUsername?: jest.Mock;
  refreshUserData?: jest.Mock;
  favouriteRefuges?: any[];
  visitedRefuges?: any[];
  getFavouriteRefuges?: jest.Mock;
  addFavouriteRefuge?: jest.Mock;
  removeFavouriteRefuge?: jest.Mock;
  getVisitedRefuges?: jest.Mock;
  addVisitedRefuge?: jest.Mock;
  removeVisitedRefuge?: jest.Mock;
}

export const createMockAuthContext = (overrides: MockAuthContextValue = {}) => ({
  firebaseUser: null,
  backendUser: null,
  isLoading: false,
  isAuthenticated: false,
  authToken: null,
  login: jest.fn().mockResolvedValue(undefined),
  loginWithGoogle: jest.fn().mockResolvedValue(undefined),
  signup: jest.fn().mockResolvedValue(undefined),
  logout: jest.fn().mockResolvedValue(undefined),
  deleteAccount: jest.fn().mockResolvedValue(undefined),
  refreshToken: jest.fn().mockResolvedValue('mock-token'),
  reloadUser: jest.fn().mockResolvedValue(undefined),
  changePassword: jest.fn().mockResolvedValue(undefined),
  changeEmail: jest.fn().mockResolvedValue(undefined),
  updateUsername: jest.fn().mockResolvedValue(undefined),
  refreshUserData: jest.fn().mockResolvedValue(undefined),
  favouriteRefuges: [],
  visitedRefuges: [],
  getFavouriteRefuges: jest.fn().mockResolvedValue([]),
  addFavouriteRefuge: jest.fn().mockResolvedValue(undefined),
  removeFavouriteRefuge: jest.fn().mockResolvedValue(undefined),
  getVisitedRefuges: jest.fn().mockResolvedValue([]),
  addVisitedRefuge: jest.fn().mockResolvedValue(undefined),
  removeVisitedRefuge: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

// Wrapper personalitzat per a tests amb tots els providers necessaris
interface AllTheProvidersProps {
  children: React.ReactNode;
  mockAuthValue?: MockAuthContextValue;
}

const AllTheProviders = ({ children, mockAuthValue }: AllTheProvidersProps) => {
  // Si es proporciona mockAuthValue, mockegem el AuthContext
  if (mockAuthValue) {
    // Mock del useAuth hook
    jest.spyOn(require('../../../contexts/AuthContext'), 'useAuth').mockReturnValue(
      createMockAuthContext(mockAuthValue)
    );
  }

  // Crear un nou QueryClient per a cada test
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 0, height: 0 },
          insets: { top: 0, left: 0, right: 0, bottom: 0 },
        }}
      >
        <NavigationContainer>
          {children}
        </NavigationContainer>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
};

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  mockAuthValue?: MockAuthContextValue;
  withNavigation?: boolean;
}

/**
 * Renderitza un component amb tots els providers necessaris
 */
export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { mockAuthValue, withNavigation = true, ...renderOptions } = options;

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    // Crear un nou QueryClient per a cada test
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
          staleTime: 0,
        },
        mutations: {
          retry: false,
          gcTime: 0,
        },
      },
    });

    if (!withNavigation && mockAuthValue) {
      jest.spyOn(require('../../../contexts/AuthContext'), 'useAuth').mockReturnValue(
        createMockAuthContext(mockAuthValue)
      );
      return (
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider
            initialMetrics={{
              frame: { x: 0, y: 0, width: 0, height: 0 },
              insets: { top: 0, left: 0, right: 0, bottom: 0 },
            }}
          >
            {children}
          </SafeAreaProvider>
        </QueryClientProvider>
      );
    }

    if (!withNavigation) {
      return (
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider
            initialMetrics={{
              frame: { x: 0, y: 0, width: 0, height: 0 },
              insets: { top: 0, left: 0, right: 0, bottom: 0 },
            }}
          >
            {children}
          </SafeAreaProvider>
        </QueryClientProvider>
      );
    }

    return <AllTheProviders mockAuthValue={mockAuthValue}>{children}</AllTheProviders>;
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Espera que una promesa es resolgui en el pròxim tick
 */
export const waitForNextUpdate = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Crea un mock de navegació per a tests
 */
export const createMockNavigation = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
  setOptions: jest.fn(),
  setParams: jest.fn(),
  dispatch: jest.fn(),
  isFocused: jest.fn(() => true),
  canGoBack: jest.fn(() => false),
  getId: jest.fn(() => 'mock-id'),
  getState: jest.fn(),
  getParent: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
  removeListener: jest.fn(),
});

/**
 * Crea un mock de route per a tests
 */
export const createMockRoute = (params = {}) => ({
  key: 'mock-key',
  name: 'MockScreen',
  params,
  path: undefined,
});

// Re-exportar funcions de testing library
export * from '@testing-library/react-native';
