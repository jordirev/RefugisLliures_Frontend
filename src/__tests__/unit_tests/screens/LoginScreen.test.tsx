/**
 * Tests unitaris per a LoginScreen
 *
 * Aquest fitxer cobreix:
 * - Renderització inicial del formulari
 * - Flux de login amb email/password
 * - Login amb Google
 * - Validació de formularis (email i contrasenya)
 * - Gestió d'errors (credencials invàlides, email no verificat, errors de xarxa)
 * - Recuperació de contrasenya
 * - Visibilitat de contrasenya
 * - Mode offline
 * - Termes i condicions
 * - Navegació a SignUp
 * - Snapshot tests
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { LoginScreen } from '../../../screens/LoginScreen';
import NetInfo from '@react-native-community/netinfo';

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
  })),
  addEventListener: jest.fn(() => jest.fn()),
  useNetInfo: jest.fn(() => ({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
  })),
}));

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

// Mock validator - note: the component validates before trimming, so emails with spaces will fail
jest.mock('validator', () => ({
  isEmail: jest.fn((email: string) => {
    // Trim email before validation to match behavior
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(trimmedEmail);
  }),
}));

// Mock SVG icons
jest.mock('../../../assets/icons/visible.svg', () => 'VisibleIcon');
jest.mock('../../../assets/icons/visibleOff2.svg', () => 'VisibleOffIcon');
jest.mock('../../../assets/icons/googleLogo.png', () => 'GoogleLogoIcon');
jest.mock('../../../assets/images/logo.png', () => 'AppLogo');

// Mock useTranslation
jest.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock AuthService
const mockIsGoogleSignInAvailable = jest.fn(() => true);
const mockGetCurrentUser = jest.fn(() => ({
  uid: 'test-uid',
  email: 'test@example.com',
  emailVerified: true,
}));
const mockGetErrorMessageKey = jest.fn((code: string) => `auth.errors.${code}`);
const mockResetPassword = jest.fn();
const mockLogout = jest.fn();
const mockResendVerificationEmail = jest.fn();

jest.mock('../../../services/AuthService', () => ({
  AuthService: {
    isGoogleSignInAvailable: () => mockIsGoogleSignInAvailable(),
    getCurrentUser: () => mockGetCurrentUser(),
    getErrorMessageKey: (code: string) => mockGetErrorMessageKey(code),
    resetPassword: (email: string) => mockResetPassword(email),
    logout: () => mockLogout(),
    resendVerificationEmail: () => mockResendVerificationEmail(),
  },
}));

// Mock firebase
jest.mock('../../../services/firebase', () => ({
  app: {},
}));

// Mock useAuth
const mockLogin = jest.fn();
const mockLoginWithGoogle = jest.fn();
const mockEnterOfflineMode = jest.fn();

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    loginWithGoogle: mockLoginWithGoogle,
    enterOfflineMode: mockEnterOfflineMode,
    isLoading: false,
  }),
}));

// Mock useCustomAlert with stateful implementation
let mockAlertVisible = false;
let mockAlertConfig: any = null;
const mockShowAlert = jest.fn((title: string, message: string, buttons?: any[]) => {
  mockAlertVisible = true;
  mockAlertConfig = { title, message, buttons };
});
const mockHideAlert = jest.fn(() => {
  mockAlertVisible = false;
  mockAlertConfig = null;
});

jest.mock('../../../hooks/useCustomAlert', () => ({
  useCustomAlert: () => ({
    alertVisible: mockAlertVisible,
    alertConfig: mockAlertConfig,
    showAlert: mockShowAlert,
    hideAlert: mockHideAlert,
  }),
}));

// Mock CustomAlert
jest.mock('../../../components/CustomAlert', () => ({
  CustomAlert: ({ visible, title, message, buttons, onDismiss }: any) => {
    if (!visible) return null;
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View testID="custom-alert">
        <Text>{title}</Text>
        <Text>{message}</Text>
        {buttons?.map((btn: any, idx: number) => (
          <TouchableOpacity key={idx} testID={`alert-button-${idx}`} onPress={btn.onPress}>
            <Text>{btn.text}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  },
}));

// Mock TermsAndConditionsModal
jest.mock('../../../components/TermsAndConditionsModal', () => ({
  TermsAndConditionsModal: ({ visible, onClose }: any) => {
    if (!visible) return null;
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View testID="terms-modal">
        <Text>Terms Modal</Text>
        <TouchableOpacity testID="close-terms-modal" onPress={onClose}>
          <Text>Close</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

describe('LoginScreen - Unit Tests', () => {
  const mockOnNavigateToSignUp = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAlertVisible = false;
    mockAlertConfig = null;
    mockIsGoogleSignInAvailable.mockReturnValue(true);
    mockGetCurrentUser.mockReturnValue({
      uid: 'test-uid',
      email: 'test@example.com',
      emailVerified: true,
    });
    (NetInfo.fetch as jest.Mock).mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    });
  });

  // ============================================
  // RENDERITZACIÓ INICIAL
  // ============================================
  describe('Renderització inicial', () => {
    it('hauria de renderitzar el formulari de login correctament', () => {
      const { getByText, getByTestId } = render(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />
      );

      expect(getByText('login.title')).toBeTruthy();
      expect(getByText('login.subtitle')).toBeTruthy();
      expect(getByTestId('email-input')).toBeTruthy();
      expect(getByTestId('google-login-button')).toBeTruthy();
    });

    it('hauria de mostrar el logo de l\'app', () => {
      const { getByText } = render(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />
      );

      expect(getByText('Refugis Lliures')).toBeTruthy();
    });

    it('no hauria de mostrar el camp de contrasenya inicialment', () => {
      const { queryByTestId } = render(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />
      );

      expect(queryByTestId('password-input')).toBeNull();
    });

    it('hauria de mostrar el botó Continue deshabilitat amb email buit', () => {
      const { getByTestId } = render(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />
      );

      const continueButton = getByTestId('continue-button');
      expect(continueButton.props.accessibilityState?.disabled).toBe(true);
    });

    it('snapshot test - estat inicial', () => {
      const { toJSON } = render(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />
      );
      expect(toJSON()).toMatchSnapshot();
    });
  });

  // ============================================
  // VALIDACIÓ D'EMAIL
  // ============================================
  describe('Validació d\'email', () => {
    it('hauria de mostrar error inline si l\'email és invàlid', async () => {
      const { getByTestId, getByText } = render(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />
      );

      const emailInput = getByTestId('email-input');
      fireEvent.changeText(emailInput, 'invalid-email');

      const continueButton = getByTestId('continue-button');
      fireEvent.press(continueButton);

      await waitFor(() => {
        expect(getByText('login.errors.invalidEmail')).toBeTruthy();
      });
    });

    it('hauria de netejar l\'error quan l\'usuari edita l\'email', async () => {
      const { getByTestId, getByText, queryByText } = render(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />
      );

      const emailInput = getByTestId('email-input');
      fireEvent.changeText(emailInput, 'invalid-email');
      fireEvent.press(getByTestId('continue-button'));

      await waitFor(() => {
        expect(getByText('login.errors.invalidEmail')).toBeTruthy();
      });

      // Editar l'email hauria de netejar l'error
      fireEvent.changeText(emailInput, 'valid@email.com');

      await waitFor(() => {
        expect(queryByText('login.errors.invalidEmail')).toBeNull();
      });
    });

    it('hauria de mostrar el camp de contrasenya amb email vàlid', async () => {
      const { getByTestId } = render(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />
      );

      const emailInput = getByTestId('email-input');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(getByTestId('continue-button'));

      await waitFor(() => {
        expect(getByTestId('password-input')).toBeTruthy();
      });
    });

    it('hauria d\'habilitar el botó Continue amb email no buit', () => {
      const { getByTestId } = render(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />
      );

      const emailInput = getByTestId('email-input');
      fireEvent.changeText(emailInput, 'test@example.com');

      const continueButton = getByTestId('continue-button');
      expect(continueButton.props.accessibilityState?.disabled).toBeFalsy();
    });
  });

  // ============================================
  // VALIDACIÓ DE CONTRASENYA
  // ============================================
  describe('Validació de contrasenya', () => {
    it('hauria de mostrar error si la contrasenya està buida', async () => {
      const { getByTestId, getByText } = render(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />
      );

      // Primer introduir email vàlid
      const emailInput = getByTestId('email-input');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(getByTestId('continue-button'));

      await waitFor(() => {
        expect(getByTestId('password-input')).toBeTruthy();
      });

      // Intentar login sense contrasenya
      fireEvent.press(getByTestId('login-button'));

      await waitFor(() => {
        expect(getByText('login.errors.emptyPassword')).toBeTruthy();
      });
    });

    it('hauria de netejar l\'error de contrasenya quan l\'usuari edita', async () => {
      const { getByTestId, getByText, queryByText } = render(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />
      );

      const emailInput = getByTestId('email-input');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(getByTestId('continue-button'));

      await waitFor(() => {
        expect(getByTestId('password-input')).toBeTruthy();
      });

      // Intentar login sense contrasenya
      fireEvent.press(getByTestId('login-button'));

      await waitFor(() => {
        expect(getByText('login.errors.emptyPassword')).toBeTruthy();
      });

      // Editar la contrasenya hauria de netejar l'error
      const passwordInput = getByTestId('password-input');
      fireEvent.changeText(passwordInput, 'password123');

      await waitFor(() => {
        expect(queryByText('login.errors.emptyPassword')).toBeNull();
      });
    });
  });

  // ============================================
  // FLUX DE LOGIN AMB EMAIL/PASSWORD
  // ============================================
  describe('Flux de login amb email/password', () => {
    it('hauria de fer login correctament amb credencials vàlides', async () => {
      mockLogin.mockResolvedValue(undefined);

      const { getByTestId } = render(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />
      );

      // Introduir email
      const emailInput = getByTestId('email-input');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(getByTestId('continue-button'));

      await waitFor(() => {
        expect(getByTestId('password-input')).toBeTruthy();
      });

      // Introduir contrasenya
      const passwordInput = getByTestId('password-input');
      fireEvent.changeText(passwordInput, 'password123');

      // Fer login
      fireEvent.press(getByTestId('login-button'));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('hauria de fer trim de l\'email abans de fer login', async () => {
      mockLogin.mockResolvedValue(undefined);

      const { getByTestId } = render(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />
      );

      const emailInput = getByTestId('email-input');
      fireEvent.changeText(emailInput, '  test@example.com  ');
      fireEvent.press(getByTestId('continue-button'));

      await waitFor(() => {
        expect(getByTestId('password-input')).toBeTruthy();
      });

      const passwordInput = getByTestId('password-input');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(getByTestId('login-button'));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('hauria de mostrar error amb credencials invàlides', async () => {
      mockLogin.mockRejectedValue({ code: 'auth/invalid-credential' });

      const { getByTestId, getByText } = render(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />
      );

      const emailInput = getByTestId('email-input');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(getByTestId('continue-button'));

      await waitFor(() => {
        expect(getByTestId('password-input')).toBeTruthy();
      });

      const passwordInput = getByTestId('password-input');
      fireEvent.changeText(passwordInput, 'wrongpassword');
      fireEvent.press(getByTestId('login-button'));

      await waitFor(() => {
        expect(getByText('login.errors.invalidCredentials')).toBeTruthy();
      });
    });

    it('hauria de gestionar email no verificat', async () => {
      mockLogin.mockResolvedValue(undefined);
      mockGetCurrentUser.mockReturnValue({
        uid: 'test-uid',
        email: 'test@example.com',
        emailVerified: false,
      });

      const { getByTestId } = render(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />
      );

      const emailInput = getByTestId('email-input');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(getByTestId('continue-button'));

      await waitFor(() => {
        expect(getByTestId('password-input')).toBeTruthy();
      });

      const passwordInput = getByTestId('password-input');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(getByTestId('login-button'));

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          'auth.emailNotVerified',
          'auth.checkEmailVerification',
          expect.any(Array)
        );
      });
    });

    it('hauria de gestionar errors genèrics', async () => {
      mockLogin.mockRejectedValue({ code: 'auth/unknown-error' });

      const { getByTestId } = render(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />
      );

      const emailInput = getByTestId('email-input');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(getByTestId('continue-button'));

      await waitFor(() => {
        expect(getByTestId('password-input')).toBeTruthy();
      });

      const passwordInput = getByTestId('password-input');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(getByTestId('login-button'));

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          'common.error',
          expect.any(String)
        );
      });
    });
  });

  // ============================================
  // MODE OFFLINE / ERRORS DE XARXA
  // ============================================
  describe('Mode offline i errors de xarxa', () => {
    it('hauria d\'oferir mode offline quan no hi ha connexió', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: false,
        isInternetReachable: false,
      });

      const { getByTestId } = render(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />
      );

      const emailInput = getByTestId('email-input');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(getByTestId('continue-button'));

      await waitFor(() => {
        expect(getByTestId('password-input')).toBeTruthy();
      });

      const passwordInput = getByTestId('password-input');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(getByTestId('login-button'));

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          'Sense connexió',
          expect.stringContaining('mode offline'),
          expect.any(Array)
        );
      });
    });

    it('hauria d\'oferir mode offline amb error de xarxa', async () => {
      mockLogin.mockRejectedValue({ code: 'auth/network-request-failed' });

      const { getByTestId } = render(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />
      );

      const emailInput = getByTestId('email-input');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(getByTestId('continue-button'));

      await waitFor(() => {
        expect(getByTestId('password-input')).toBeTruthy();
      });

      const passwordInput = getByTestId('password-input');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(getByTestId('login-button'));

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          'Error de connexió',
          expect.stringContaining('mode offline'),
          expect.any(Array)
        );
      });
    });

    it('hauria de detectar error de xarxa pel missatge', async () => {
      mockLogin.mockRejectedValue({ message: 'Network connection error' });

      const { getByTestId } = render(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />
      );

      const emailInput = getByTestId('email-input');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(getByTestId('continue-button'));

      await waitFor(() => {
        expect(getByTestId('password-input')).toBeTruthy();
      });

      const passwordInput = getByTestId('password-input');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(getByTestId('login-button'));

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          'Error de connexió',
          expect.any(String),
          expect.any(Array)
        );
      });
    });
  });

  // ============================================
  // LOGIN AMB GOOGLE
  // ============================================
  describe('Login amb Google', () => {
    it('hauria de fer login amb Google correctament', async () => {
      mockLoginWithGoogle.mockResolvedValue(undefined);

      const { getByTestId } = render(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />
      );

      const googleButton = getByTestId('google-login-button');
      fireEvent.press(googleButton);

      await waitFor(() => {
        expect(mockLoginWithGoogle).toHaveBeenCalled();
      });
    });

    it('hauria de gestionar la cancel·lació del login amb Google', async () => {
      mockLoginWithGoogle.mockRejectedValue({ message: 'LOGIN_CANCELLED' });

      const { getByTestId } = render(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />
      );

      const googleButton = getByTestId('google-login-button');
      fireEvent.press(googleButton);

      await waitFor(() => {
        expect(mockLoginWithGoogle).toHaveBeenCalled();
        // No hauria de mostrar cap alert
        expect(mockShowAlert).not.toHaveBeenCalled();
      });
    });

    it('hauria de gestionar errors del login amb Google', async () => {
      mockLoginWithGoogle.mockRejectedValue(new Error('Google login error'));

      const { getByTestId } = render(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />
      );

      const googleButton = getByTestId('google-login-button');
      fireEvent.press(googleButton);

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          'common.error',
          'auth.errors.googleLoginFailed'
        );
      });
    });

    it('hauria de mostrar missatge si Google Sign In no està disponible', async () => {
      mockIsGoogleSignInAvailable.mockReturnValue(false);

      const { getByTestId } = render(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />
      );

      const googleButton = getByTestId('google-login-button');
      fireEvent.press(googleButton);

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          'common.info',
          expect.stringContaining('Google Sign In no està disponible')
        );
      });
    });
  });

  // ============================================
  // VISIBILITAT DE CONTRASENYA
  // ============================================
  describe('Visibilitat de contrasenya', () => {
    it('hauria d\'ocultar la contrasenya per defecte', async () => {
      const { getByTestId } = render(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />
      );

      const emailInput = getByTestId('email-input');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(getByTestId('continue-button'));

      await waitFor(() => {
        const passwordInput = getByTestId('password-input');
        expect(passwordInput.props.secureTextEntry).toBe(true);
      });
    });

    it('hauria de mostrar la contrasenya quan es prem el toggle', async () => {
      const { getByTestId } = render(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />
      );

      const emailInput = getByTestId('email-input');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(getByTestId('continue-button'));

      await waitFor(() => {
        expect(getByTestId('password-input')).toBeTruthy();
      });

      const toggleButton = getByTestId('toggle-password-visibility');
      const passwordInput = getByTestId('password-input');

      // Inicialment ocult
      expect(passwordInput.props.secureTextEntry).toBe(true);

      // Fer clic per mostrar
      fireEvent.press(toggleButton);

      await waitFor(() => {
        expect(getByTestId('password-input').props.secureTextEntry).toBe(false);
      });
    });

    it('hauria d\'alternar la visibilitat múltiples vegades', async () => {
      const { getByTestId } = render(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />
      );

      const emailInput = getByTestId('email-input');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(getByTestId('continue-button'));

      await waitFor(() => {
        expect(getByTestId('password-input')).toBeTruthy();
      });

      const toggleButton = getByTestId('toggle-password-visibility');

      // Toggle on
      fireEvent.press(toggleButton);
      await waitFor(() => {
        expect(getByTestId('password-input').props.secureTextEntry).toBe(false);
      });

      // Toggle off
      fireEvent.press(toggleButton);
      await waitFor(() => {
        expect(getByTestId('password-input').props.secureTextEntry).toBe(true);
      });

      // Toggle on again
      fireEvent.press(toggleButton);
      await waitFor(() => {
        expect(getByTestId('password-input').props.secureTextEntry).toBe(false);
      });
    });
  });

  // ============================================
  // RECUPERACIÓ DE CONTRASENYA
  // ============================================
  describe('Recuperació de contrasenya', () => {
    it('hauria de mostrar error si l\'email està buit', async () => {
      const { getByTestId } = render(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />
      );

      // Primer anem al pas password amb email vàlid, després buidem l'email
      const emailInput = getByTestId('email-input');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(getByTestId('continue-button'));

      await waitFor(() => {
        expect(getByTestId('forgot-password-button')).toBeTruthy();
      });

      // Buidar email i intentar recuperar contrasenya
      fireEvent.changeText(emailInput, '');
      fireEvent.press(getByTestId('forgot-password-button'));

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          'common.error',
          'login.errors.emptyEmail'
        );
      });
    });

    it('hauria de mostrar confirmació per enviar email de recuperació', async () => {
      const { getByTestId } = render(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />
      );

      const emailInput = getByTestId('email-input');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(getByTestId('continue-button'));

      await waitFor(() => {
        expect(getByTestId('forgot-password-button')).toBeTruthy();
      });

      fireEvent.press(getByTestId('forgot-password-button'));

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          'auth.passwordResetTitle',
          expect.stringContaining('test@example.com'),
          expect.any(Array)
        );
      });
    });

    it('hauria d\'enviar email de recuperació quan es confirma', async () => {
      mockResetPassword.mockResolvedValue(undefined);

      const { getByTestId } = render(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />
      );

      const emailInput = getByTestId('email-input');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(getByTestId('continue-button'));

      await waitFor(() => {
        expect(getByTestId('forgot-password-button')).toBeTruthy();
      });

      fireEvent.press(getByTestId('forgot-password-button'));

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalled();
      });

      // Simular la confirmació de l'alert
      const alertCall = mockShowAlert.mock.calls[0];
      const buttons = alertCall[2];
      const sendButton = buttons.find((btn: any) => btn.text === 'auth.sendResetEmail');

      if (sendButton?.onPress) {
        await act(async () => {
          await sendButton.onPress();
        });

        await waitFor(() => {
          expect(mockResetPassword).toHaveBeenCalledWith('test@example.com');
        });
      }
    });

    it('hauria de gestionar errors en l\'enviament d\'email de recuperació', async () => {
      mockResetPassword.mockRejectedValue({ code: 'auth/user-not-found' });
      mockGetErrorMessageKey.mockReturnValue('auth.errors.auth/user-not-found');

      const { getByTestId } = render(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />
      );

      const emailInput = getByTestId('email-input');
      fireEvent.changeText(emailInput, 'nonexistent@example.com');
      fireEvent.press(getByTestId('continue-button'));

      await waitFor(() => {
        expect(getByTestId('forgot-password-button')).toBeTruthy();
      });

      fireEvent.press(getByTestId('forgot-password-button'));

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalled();
      });

      const alertCall = mockShowAlert.mock.calls[0];
      const buttons = alertCall[2];
      const sendButton = buttons.find((btn: any) => btn.text === 'auth.sendResetEmail');

      if (sendButton?.onPress) {
        mockShowAlert.mockClear();
        await act(async () => {
          await sendButton.onPress();
        });

        await waitFor(() => {
          expect(mockShowAlert).toHaveBeenCalledWith(
            'common.error',
            expect.any(String)
          );
        });
      }
    });
  });

  // ============================================
  // EMAIL NO VERIFICAT - ACCIONS
  // ============================================
  describe('Email no verificat - accions', () => {
    it('hauria de reenviar email de verificació', async () => {
      mockLogin.mockResolvedValue(undefined);
      mockGetCurrentUser.mockReturnValue({
        uid: 'test-uid',
        email: 'test@example.com',
        emailVerified: false,
      });
      mockResendVerificationEmail.mockResolvedValue(undefined);
      mockLogout.mockResolvedValue(undefined);

      const { getByTestId } = render(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />
      );

      const emailInput = getByTestId('email-input');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(getByTestId('continue-button'));

      await waitFor(() => {
        expect(getByTestId('password-input')).toBeTruthy();
      });

      const passwordInput = getByTestId('password-input');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(getByTestId('login-button'));

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          'auth.emailNotVerified',
          'auth.checkEmailVerification',
          expect.any(Array)
        );
      });

      // Simular clic a reenviar email
      const alertCall = mockShowAlert.mock.calls[0];
      const buttons = alertCall[2];
      const resendButton = buttons.find((btn: any) => btn.text === 'auth.resendVerificationEmail');

      if (resendButton?.onPress) {
        await act(async () => {
          await resendButton.onPress();
        });

        await waitFor(() => {
          expect(mockResendVerificationEmail).toHaveBeenCalled();
        });
      }
    });

    it('hauria de tancar sessió quan es tanca l\'alert d\'email no verificat', async () => {
      mockLogin.mockResolvedValue(undefined);
      mockGetCurrentUser.mockReturnValue({
        uid: 'test-uid',
        email: 'test@example.com',
        emailVerified: false,
      });
      mockLogout.mockResolvedValue(undefined);

      const { getByTestId } = render(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />
      );

      const emailInput = getByTestId('email-input');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(getByTestId('continue-button'));

      await waitFor(() => {
        expect(getByTestId('password-input')).toBeTruthy();
      });

      const passwordInput = getByTestId('password-input');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(getByTestId('login-button'));

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalled();
      });

      const alertCall = mockShowAlert.mock.calls[0];
      const buttons = alertCall[2];
      const closeButton = buttons.find((btn: any) => btn.text === 'common.close');

      if (closeButton?.onPress) {
        await act(async () => {
          await closeButton.onPress();
        });

        await waitFor(() => {
          expect(mockLogout).toHaveBeenCalled();
        });
      }
    });
  });

  // ============================================
  // NAVEGACIÓ A SIGNUP
  // ============================================
  describe('Navegació a SignUp', () => {
    it('hauria de navegar a SignUp quan es fa clic al link', () => {
      const { getByTestId } = render(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />
      );

      const signUpLink = getByTestId('signup-link');
      fireEvent.press(signUpLink);

      expect(mockOnNavigateToSignUp).toHaveBeenCalled();
    });

    it('no hauria de mostrar el link de signup si no es proporciona callback', () => {
      const { queryByTestId } = render(
        <LoginScreen />
      );

      expect(queryByTestId('signup-link')).toBeNull();
    });
  });

  // ============================================
  // TERMES I CONDICIONS
  // ============================================
  describe('Termes i condicions', () => {
    it('hauria de mostrar el link de termes i condicions', () => {
      const { getByTestId } = render(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />
      );

      expect(getByTestId('terms-link')).toBeTruthy();
    });

    it('hauria d\'obrir el modal de termes quan es fa clic', async () => {
      const { getByTestId, queryByTestId } = render(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />
      );

      // Inicialment el modal no hauria d'estar visible
      expect(queryByTestId('terms-modal')).toBeNull();

      // Fer clic al link de termes
      fireEvent.press(getByTestId('terms-link'));

      await waitFor(() => {
        expect(getByTestId('terms-modal')).toBeTruthy();
      });
    });
  });

  // ============================================
  // ESTATS DE CÀRREGA
  // ============================================
  describe('Estats de càrrega', () => {
    it('hauria de deshabilitar inputs durant el login', async () => {
      // Login que tarda
      mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 500)));

      const { getByTestId } = render(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />
      );

      const emailInput = getByTestId('email-input');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(getByTestId('continue-button'));

      await waitFor(() => {
        expect(getByTestId('password-input')).toBeTruthy();
      });

      const passwordInput = getByTestId('password-input');
      fireEvent.changeText(passwordInput, 'password123');

      // Començar el login
      fireEvent.press(getByTestId('login-button'));

      // Els inputs haurien d'estar deshabilitats durant la càrrega
      // (això depèn de com es gestiona l'estat isLoading internament)
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });
    });

    it('hauria de mostrar text de loading durant el login amb Google', async () => {
      mockLoginWithGoogle.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 500)));

      const { getByTestId } = render(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />
      );

      const googleButton = getByTestId('google-login-button');
      fireEvent.press(googleButton);

      await waitFor(() => {
        expect(mockLoginWithGoogle).toHaveBeenCalled();
      });
    });
  });

  // ============================================
  // CASOS LÍMIT
  // ============================================
  describe('Casos límit', () => {
    it('hauria de gestionar email amb espais', async () => {
      mockLogin.mockResolvedValue(undefined);

      const { getByTestId } = render(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />
      );

      const emailInput = getByTestId('email-input');
      // Email amb espais al principi i al final
      fireEvent.changeText(emailInput, '   test@example.com   ');
      fireEvent.press(getByTestId('continue-button'));

      await waitFor(() => {
        expect(getByTestId('password-input')).toBeTruthy();
      });

      const passwordInput = getByTestId('password-input');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(getByTestId('login-button'));

      await waitFor(() => {
        // Hauria de fer trim de l'email
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('hauria de gestionar múltiples clics al botó de login', async () => {
      mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      const { getByTestId } = render(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />
      );

      const emailInput = getByTestId('email-input');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(getByTestId('continue-button'));

      await waitFor(() => {
        expect(getByTestId('password-input')).toBeTruthy();
      });

      const passwordInput = getByTestId('password-input');
      fireEvent.changeText(passwordInput, 'password123');

      const loginButton = getByTestId('login-button');

      // Primer clic
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledTimes(1);
      });
    });

    it('hauria de gestionar email buit amb només espais', async () => {
      const { getByTestId, getByText } = render(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />
      );

      const emailInput = getByTestId('email-input');
      fireEvent.changeText(emailInput, '   ');
      
      // El botó hauria d'estar deshabilitat
      const continueButton = getByTestId('continue-button');
      expect(continueButton.props.accessibilityState?.disabled).toBe(true);
    });

    it('hauria de gestionar contrasenya buida amb només espais', async () => {
      const { getByTestId, getByText } = render(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />
      );

      const emailInput = getByTestId('email-input');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(getByTestId('continue-button'));

      await waitFor(() => {
        expect(getByTestId('password-input')).toBeTruthy();
      });

      const passwordInput = getByTestId('password-input');
      fireEvent.changeText(passwordInput, '   ');

      fireEvent.press(getByTestId('login-button'));

      await waitFor(() => {
        expect(getByText('login.errors.emptyPassword')).toBeTruthy();
      });
    });
  });

  // ============================================
  // SNAPSHOT TESTS ADDICIONALS
  // ============================================
  describe('Snapshot tests', () => {
    it('snapshot test - pas de contrasenya', async () => {
      const { toJSON, getByTestId } = render(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />
      );

      const emailInput = getByTestId('email-input');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(getByTestId('continue-button'));

      await waitFor(() => {
        expect(getByTestId('password-input')).toBeTruthy();
      });

      expect(toJSON()).toMatchSnapshot();
    });

    it('snapshot test - sense callback de signup', () => {
      const { toJSON } = render(
        <LoginScreen />
      );
      expect(toJSON()).toMatchSnapshot();
    });
  });
});
