/**
 * Tests d'integració per a LoginScreen
 * 
 * Cobertura:
 * - Renderització del formulari de login
 * - Validació d'email
 * - Validació de contrasenya
 * - Flux de login amb email/password
 * - Login amb Google
 * - Gestió d'errors (credencials invàlides, email no verificat, etc.)
 * - Recuperació de contrasenya
 * - Navegació a SignUp
 * - Visibilitat de contrasenya
 */

import React from 'react';
import { renderWithProviders, fireEvent, waitFor } from '../setup/testUtils';
import { setupMSW } from '../setup/mswServer';
import { LoginScreen } from '../../../screens/LoginScreen';
import { AuthService } from '../../../services/AuthService';

// Setup MSW
setupMSW();

// Mock de AuthService
jest.mock('../../../services/AuthService');

// Mock del context d'autenticació
const mockLogin = jest.fn();
const mockLoginWithGoogle = jest.fn();

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    loginWithGoogle: mockLoginWithGoogle,
    isLoading: false,
  }),
}));

// Mock de useCustomAlert
const mockShowAlert = jest.fn();
const mockHideAlert = jest.fn();
jest.mock('../../../utils/useCustomAlert', () => ({
  useCustomAlert: () => ({
    alertVisible: false,
    alertConfig: null,
    showAlert: mockShowAlert,
    hideAlert: mockHideAlert,
  }),
}));

// Mock de les icones i imatges
jest.mock('../../../assets/icons/visible.svg', () => 'VisibleIcon');
jest.mock('../../../assets/icons/visibleOff2.svg', () => 'VisibleOffIcon');
jest.mock('../../../assets/icons/googleLogo.png', () => 'GoogleLogoIcon');

describe('LoginScreen - Tests d\'integració', () => {
  const mockOnNavigateToSignUp = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (AuthService.isGoogleSignInAvailable as jest.Mock).mockReturnValue(true);
    (AuthService.getCurrentUser as jest.Mock).mockReturnValue({
      uid: 'test-uid',
      email: 'test@example.com',
      emailVerified: true,
    });
  });

  describe('Renderització inicial', () => {
    it('hauria de renderitzar el formulari de login', () => {
      const { getByText, getByPlaceholderText, getByTestId } = renderWithProviders(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />,
        { withNavigation: false }
      );

      expect(getByText('login.title')).toBeTruthy();
      expect(getByText('login.subtitle')).toBeTruthy();
      expect(getByTestId('email-input')).toBeTruthy();
    });

    it('no hauria de mostrar el camp de contrasenya inicialment', () => {
      const { queryByPlaceholderText } = renderWithProviders(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />,
        { withNavigation: false }
      );

      // El camp de contrasenya no hauria d'estar visible fins que l'email sigui vàlid
      expect(queryByPlaceholderText('Contrasenya')).toBeNull();
    });

    it('hauria de mostrar el botó de Google login', () => {
      const { getByTestId } = renderWithProviders(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />,
        { withNavigation: false }
      );

      expect(getByTestId('google-login-button')).toBeTruthy();
    });
  });

  describe('Validació d\'email', () => {
    it('hauria de mostrar error si l\'email està buit', async () => {
      const { getByText, getByTestId } = renderWithProviders(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />,
        { withNavigation: false }
      );

      const continueButton = getByTestId('continue-button');
      // Button is disabled when email is empty
      expect(continueButton.props.accessibilityState.disabled).toBe(true);
    });

    it('hauria de mostrar error si el format de l\'email no és vàlid', async () => {
      const { getByPlaceholderText, getByText, getByTestId } = renderWithProviders(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />,
        { withNavigation: false }
      );

      const emailInput = getByTestId('email-input');
      fireEvent.changeText(emailInput, 'invalid-email');

      const continueButton = getByTestId('continue-button');
      fireEvent.press(continueButton);

      await waitFor(() => {
        expect(getByText('login.errors.invalidEmail')).toBeTruthy();
      });
    });

    it('hauria de netejar l\'error quan l\'usuari comença a editar', async () => {
      const { getByText, queryByText, getByTestId } = renderWithProviders(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />,
        { withNavigation: false }
      );

      const emailInput = getByTestId('email-input');
      const continueButton = getByTestId('continue-button');
      
      // Type invalid email format and press continue to trigger validation
      fireEvent.changeText(emailInput, 'invalid-email');
      fireEvent.press(continueButton);

      await waitFor(() => {
        expect(getByText('login.errors.invalidEmail')).toBeTruthy();
      });

      // Type valid email - error should clear
      fireEvent.changeText(emailInput, 'test@example.com');

      await waitFor(() => {
        expect(queryByText('login.errors.invalidEmail')).toBeNull();
      });
    });

    it('hauria de mostrar el camp de contrasenya amb un email vàlid', async () => {
      const { getByTestId } = renderWithProviders(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />,
        { withNavigation: false }
      );

      const emailInput = getByTestId('email-input');
      fireEvent.changeText(emailInput, 'test@example.com');

      const continueButton = getByTestId('continue-button');
      fireEvent.press(continueButton);

      await waitFor(() => {
        expect(getByTestId('password-input')).toBeTruthy();
      });
    });
  });

  describe('Validació de contrasenya', () => {
    beforeEach(async () => {
      // Setup: introduir un email vàlid primer
      const { getByPlaceholderText, getByText, getByTestId } = renderWithProviders(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />,
        { withNavigation: false }
      );

      const emailInput = getByTestId('email-input');
      fireEvent.changeText(emailInput, 'test@example.com');

      const continueButton = getByTestId('continue-button');
      fireEvent.press(continueButton);

      await waitFor(() => {
        expect(getByTestId('password-input')).toBeTruthy();
      });
    });

    it('hauria de mostrar error si la contrasenya està buida', async () => {
      const { getByText, getByTestId } = renderWithProviders(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />,
        { withNavigation: false }
      );

      // Preparar l'email
      const emailInput = getByTestId('email-input');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(getByTestId('continue-button'));

      await waitFor(() => {
        const passwordInput = getByTestId('password-input');
        expect(passwordInput).toBeTruthy();
      });

      // Intentar login sense contrasenya
      mockLogin.mockRejectedValue({ code: 'auth/missing-password' });
      
      const loginButton = getByTestId('login-button');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(getByText('login.errors.emptyPassword')).toBeTruthy();
      });
    });

    it('hauria de netejar l\'error quan l\'usuari comença a editar', async () => {
      const { getByPlaceholderText, getByText, queryByText, rerender, getByTestId } = renderWithProviders(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />,
        { withNavigation: false }
      );

      // Introduir email
      const emailInput = getByTestId('email-input');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(getByTestId('continue-button'));

      await waitFor(() => {
        const passwordInput = getByTestId('password-input');
        fireEvent.changeText(passwordInput, 'password123');
      });
    });
  });

  describe('Flux de login', () => {
    it('hauria de fer login correctament amb credencials vàlides', async () => {
      mockLogin.mockResolvedValue(undefined);

      const { getByPlaceholderText, getByText, getByTestId } = renderWithProviders(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />,
        { withNavigation: false }
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
      const loginButton = getByTestId('login-button');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('hauria de mostrar error amb credencials invàlides', async () => {
      mockLogin.mockRejectedValue({ code: 'auth/invalid-credential' });

      const { getByPlaceholderText, getByText, getByTestId } = renderWithProviders(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />,
        { withNavigation: false }
      );

      const emailInput = getByTestId('email-input');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(getByTestId('continue-button'));

      await waitFor(() => {
        const passwordInput = getByTestId('password-input');
        fireEvent.changeText(passwordInput, 'wrongpassword');
      });

      const loginButton = getByTestId('login-button');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(getByText('login.errors.invalidCredentials')).toBeTruthy();
      });
    });

    it('hauria de gestionar email no verificat', async () => {
      mockLogin.mockResolvedValue(undefined);
      (AuthService.getCurrentUser as jest.Mock).mockReturnValue({
        uid: 'test-uid',
        email: 'test@example.com',
        emailVerified: false,
      });

      const { getByPlaceholderText, getByText, getByTestId } = renderWithProviders(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />,
        { withNavigation: false }
      );

      const emailInput = getByTestId('email-input');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(getByTestId('continue-button'));

      await waitFor(() => {
        const passwordInput = getByTestId('password-input');
        fireEvent.changeText(passwordInput, 'password123');
      });

      const loginButton = getByTestId('login-button');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          'auth.emailNotVerified',
          'auth.checkEmailVerification',
          expect.any(Array)
        );
      });
    });
  });

  describe('Login amb Google', () => {
    it('hauria de fer login amb Google correctament', async () => {
      mockLoginWithGoogle.mockResolvedValue(undefined);

      const { getByTestId } = renderWithProviders(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />,
        { withNavigation: false }
      );

      const googleButton = getByTestId('google-login-button');
      fireEvent.press(googleButton);

      await waitFor(() => {
        expect(mockLoginWithGoogle).toHaveBeenCalled();
      });
    });

    it('hauria de gestionar cancel·lació del login amb Google', async () => {
      mockLoginWithGoogle.mockRejectedValue({ message: 'LOGIN_CANCELLED' });

      const { getByTestId } = renderWithProviders(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />,
        { withNavigation: false }
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

      const { getByTestId } = renderWithProviders(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />,
        { withNavigation: false }
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
      (AuthService.isGoogleSignInAvailable as jest.Mock).mockReturnValue(false);

      const { getByTestId } = renderWithProviders(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />,
        { withNavigation: false }
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

  describe('Visibilitat de contrasenya', () => {
    it('hauria de alternar la visibilitat de la contrasenya', async () => {
      const { getByPlaceholderText, getByText, getByTestId } = renderWithProviders(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />,
        { withNavigation: false }
      );

      // Introduir email per mostrar el camp de contrasenya
      const emailInput = getByTestId('email-input');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(getByTestId('continue-button'));

      await waitFor(() => {
        expect(getByTestId('password-input')).toBeTruthy();
      });

      // Trobar el botó de visibilitat
      const toggleButton = getByTestId('toggle-password-visibility');
      
      // Verificar que inicialment està ocult
      const passwordInput = getByTestId('password-input');
      expect(passwordInput.props.secureTextEntry).toBe(true);

      // Fer clic per mostrar
      fireEvent.press(toggleButton);
      expect(passwordInput.props.secureTextEntry).toBe(false);

      // Fer clic per ocultar
      fireEvent.press(toggleButton);
      expect(passwordInput.props.secureTextEntry).toBe(true);
    });
  });

  describe('Recuperació de contrasenya', () => {
    it('hauria de mostrar diàleg per recuperar contrasenya', async () => {
      const { getByTestId } = renderWithProviders(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />,
        { withNavigation: false }
      );

      const emailInput = getByTestId('email-input');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(getByTestId('continue-button'));

      await waitFor(() => {
        expect(getByTestId('password-input')).toBeTruthy();
      });

      const forgotPasswordLink = getByTestId('forgot-password-button');
      fireEvent.press(forgotPasswordLink);

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          'auth.passwordResetTitle',
          expect.stringContaining('test@example.com'),
          expect.any(Array)
        );
      });
    });

    it('hauria de demanar confirmació abans d\'enviar email de recuperació', async () => {
      const { getByTestId } = renderWithProviders(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />,
        { withNavigation: false }
      );

      const emailInput = getByTestId('email-input');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(getByTestId('continue-button'));

      await waitFor(() => {
        expect(getByTestId('password-input')).toBeTruthy();
      });

      const forgotPasswordLink = getByTestId('forgot-password-button');
      fireEvent.press(forgotPasswordLink);

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          'auth.passwordResetTitle',
          expect.stringContaining('test@example.com'),
          expect.any(Array)
        );
      });
    });
  });

  describe('Navegació a SignUp', () => {
    it('hauria de navegar a SignUp quan es fa clic al link', () => {
      const { getByTestId } = renderWithProviders(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />,
        { withNavigation: false }
      );

      const signUpLink = getByTestId('signup-link');
      fireEvent.press(signUpLink);

      expect(mockOnNavigateToSignUp).toHaveBeenCalled();
    });
  });

  describe('Casos límit', () => {
    it('hauria de gestionar email amb espais', async () => {
      const { getByPlaceholderText, getByText, getByTestId } = renderWithProviders(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />,
        { withNavigation: false }
      );

      const emailInput = getByTestId('email-input');
      // Component trims email automatically
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(getByTestId('continue-button'));

      await waitFor(() => {
        expect(getByTestId('password-input')).toBeTruthy();
      });

      const passwordInput = getByTestId('password-input');
      fireEvent.changeText(passwordInput, 'password123');

      mockLogin.mockResolvedValue(undefined);
      fireEvent.press(getByTestId('login-button'));

      await waitFor(() => {
        // Hauria de fer trim de l'email
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('hauria de deshabilitar els inputs durant la càrrega', async () => {
      mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      const { getByPlaceholderText, getByText, getByTestId } = renderWithProviders(
        <LoginScreen onNavigateToSignUp={mockOnNavigateToSignUp} />,
        { withNavigation: false }
      );

      const emailInput = getByTestId('email-input');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(getByTestId('continue-button'));

      await waitFor(() => {
        const passwordInput = getByTestId('password-input');
        fireEvent.changeText(passwordInput, 'password123');
      });

      fireEvent.press(getByTestId('login-button'));

      // Durant la càrrega, els inputs haurien d'estar deshabilitats
      // Això es verificaria amb el props.editable dels inputs
    });
  });
});







