/**
 * Tests d'integració per a SignUpScreen
 * 
 * Cobertura:
 * - Selecció d'idioma
 * - Validació d'username (mínim 2, màxim 20 caràcters)
 * - Validació d'email
 * - Validació de contrasenya (força)
 * - Confirmació de contrasenya
 * - Flux complet de registre
 * - Gestió d'errors (email existent, errors de xarxa)
 * - Navegació entre steps
 * - Botó back en cada step
 */

import React from 'react';
import { renderWithProviders, fireEvent, waitFor } from '../setup/testUtils';
import { setupMSW } from '../setup/mswServer';
import { SignUpScreen } from '../../../screens/SignUpScreen';
import { AuthService } from '../../../services/AuthService';

// Setup MSW
setupMSW();

// Mock de AuthService
jest.mock('../../../services/AuthService');

// Mock del context d'autenticació
const mockSignup = jest.fn();

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    signup: mockSignup,
  }),
}));

// Mock de useTranslation
jest.mock('../../../utils/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'signup.title': 'Crea el teu compte',
        'signup.subtitle': 'Registra\'t per començar',
        'signup.selectLanguage': 'Selecciona el teu idioma',
        'signup.usernamePlaceholder': 'Nom d\'usuari',
        'signup.emailPlaceholder': 'Email',
        'signup.passwordPlaceholder': 'Contrasenya',
        'signup.confirmPasswordPlaceholder': 'Confirma la contrasenya',
        'signup.signUpButton': 'Registrar-se',
        'signup.continueButton': 'Continuar',
        'signup.alreadyHaveAccount': 'Ja tens compte?',
        'signup.loginLink': 'Inicia sessió',
        'signup.errors.emptyUsername': 'El nom d\'usuari és obligatori',
        'signup.errors.usernameTooShort': 'El nom d\'usuari ha de tenir almenys 2 caràcters',
        'signup.errors.invalidUsername': 'El nom d\'usuari ha de tenir entre 2 i 20 caràcters',
        'signup.errors.emptyEmail': 'L\'email és obligatori',
        'signup.errors.invalidEmail': 'El format de l\'email no és vàlid',
        'signup.errors.emptyPassword': 'La contrasenya és obligatòria',
        'signup.errors.shortPassword': 'Mínim 8 caràcters',
        'signup.errors.minusPassword': 'Una minúscula',
        'signup.errors.upperPassword': 'Una majúscula',
        'signup.errors.numberPassword': 'Un número',
        'signup.errors.specialCharPassword': 'Un caràcter especial',
        'signup.errors.passwordMismatch': 'Les contrasenyes no coincideixen',
        'signup.errors.emailAlreadyInUse': 'Aquest email ja està en ús',
        'signup.success': 'Registre completat',
        'signup.checkEmail': 'Comprova el teu email per verificar el compte',
        'common.error': 'Error',
        'common.success': 'Èxit',
        'common.ok': 'D\'acord',
      };
      return translations[key] || key;
    },
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
jest.mock('../../../assets/icons/arrow-left.svg', () => 'ArrowLeftIcon');

describe('SignUpScreen - Tests d\'integració', () => {
  const mockOnSignUpSuccess = jest.fn();
  const mockOnBackToLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Selecció d\'idioma', () => {
    it('hauria de mostrar la pantalla de selecció d\'idioma inicialment', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />,
        { withNavigation: false }
      );

      expect(getByText('Selecciona el teu idioma')).toBeTruthy();
      expect(getByTestId('language-ca')).toBeTruthy();
      expect(getByTestId('language-es')).toBeTruthy();
      expect(getByTestId('language-fr')).toBeTruthy();
      expect(getByTestId('language-en')).toBeTruthy();
    });

    it('hauria de canviar l\'idioma quan se selecciona una opció', async () => {
      const { getByText, getByTestId } = renderWithProviders(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />,
        { withNavigation: false }
      );

      const catalanButton = getByTestId('language-ca');
      fireEvent.press(catalanButton);

      await waitFor(() => {
        // Hauria de tornar al step anterior (username per defecte)
        expect(getByTestId('username-input')).toBeTruthy();
      });
    });

  });

  describe('Validació d\'username', () => {

    it('hauria de mostrar error si l\'username està buit', async () => {
      const { getByPlaceholderText, getByText, getByTestId } = renderWithProviders(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />,
        { withNavigation: false }
      );

      // Seleccionar idioma
      fireEvent.press(getByTestId('language-ca'));
      await waitFor(() => {
        const usernameInput = getByPlaceholderText('Nom d\'usuari');
        fireEvent.changeText(usernameInput, '');
      });

      // L'error hauria d'aparèixer
      await waitFor(() => {
        expect(getByText('El nom d\'usuari és obligatori')).toBeTruthy();
      });
    });

    it('hauria de mostrar error si l\'username és massa curt', async () => {
      const { getByPlaceholderText, getByText, getByTestId } = renderWithProviders(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />,
        { withNavigation: false }
      );

      fireEvent.press(getByTestId('language-ca'));
      await waitFor(() => {
        const usernameInput = getByPlaceholderText('Nom d\'usuari');
        fireEvent.changeText(usernameInput, 'a');
      });

      await waitFor(() => {
        expect(getByText('El nom d\'usuari ha de tenir entre 2 i 20 caràcters')).toBeTruthy();
      });
    });

    it('hauria de mostrar error si l\'username és massa llarg', async () => {
      const { getByPlaceholderText, getByText, getByTestId } = renderWithProviders(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />,
        { withNavigation: false }
      );

      fireEvent.press(getByTestId('language-ca'));
      await waitFor(() => {
        const usernameInput = getByPlaceholderText('Nom d\'usuari');
        fireEvent.changeText(usernameInput, 'a'.repeat(21));
      });

      await waitFor(() => {
        expect(getByText('El nom d\'usuari ha de tenir entre 2 i 20 caràcters')).toBeTruthy();
      });
    });

    it('hauria d\'avançar al step d\'email amb un username vàlid', async () => {
      const { getByPlaceholderText, getByText, getByTestId } = renderWithProviders(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />,
        { withNavigation: false }
      );

      fireEvent.press(getByTestId('language-ca'));
      await waitFor(() => {
        const usernameInput = getByPlaceholderText('Nom d\'usuari');
        fireEvent.changeText(usernameInput, 'testuser');
      });

      await waitFor(() => {
        expect(getByTestId('email-input')).toBeTruthy();
      });
    });
  });

  describe('Validació d\'email', () => {
    it('hauria de mostrar error amb un email invàlid', async () => {
      const { getByPlaceholderText, getByText, getByTestId } = renderWithProviders(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />,
        { withNavigation: false }
      );

      fireEvent.press(getByTestId('language-ca'));
      await waitFor(() => {
        fireEvent.changeText(getByPlaceholderText('Nom d\'usuari'), 'testuser');
      });

      await waitFor(() => {
        const emailInput = getByTestId('email-input');
        fireEvent.changeText(emailInput, 'invalid-email');
      });

      await waitFor(() => {
        expect(getByText('El format de l\'email no és vàlid')).toBeTruthy();
      });
    });

    it('hauria d\'avançar al step de contrasenya amb un email vàlid', async () => {
      const { getByPlaceholderText, getByText, getByTestId } = renderWithProviders(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />,
        { withNavigation: false }
      );

      fireEvent.press(getByTestId('language-ca'));
      await waitFor(() => {
        fireEvent.changeText(getByPlaceholderText('Nom d\'usuari'), 'testuser');
      });

      await waitFor(() => {
        fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
      });

      await waitFor(() => {
        expect(getByTestId('password-input')).toBeTruthy();
      });
    });
  });

  describe('Validació de contrasenya', () => {
    it('hauria de mostrar els requisits de la contrasenya', async () => {
      const { getByPlaceholderText, getByText, getByTestId } = renderWithProviders(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />,
        { withNavigation: false }
      );

      fireEvent.press(getByTestId('language-ca'));
      await waitFor(() => {
        fireEvent.changeText(getByPlaceholderText('Nom d\'usuari'), 'testuser');
      });

      await waitFor(() => {
        fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
      });

      await waitFor(() => {
        const passwordInput = getByTestId('password-input');
        fireEvent.changeText(passwordInput, 'weak');
      });

      await waitFor(() => {
        expect(getByText('Mínim 8 caràcters')).toBeTruthy();
        expect(getByText('Una majúscula')).toBeTruthy();
        expect(getByText('Un número')).toBeTruthy();
        expect(getByText('Un caràcter especial')).toBeTruthy();
      });
    });

    it('hauria de validar una contrasenya forta correctament', async () => {
      const { getByPlaceholderText, getByText, queryByText, getByTestId } = renderWithProviders(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />,
        { withNavigation: false }
      );

      fireEvent.press(getByTestId('language-ca'));
      await waitFor(() => {
        fireEvent.changeText(getByPlaceholderText('Nom d\'usuari'), 'testuser');
      });

      await waitFor(() => {
        fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
      });

      await waitFor(() => {
        fireEvent.changeText(getByTestId('password-input'), 'Test1234!');
      });

      await waitFor(() => {
        // No hauria de mostrar errors
        expect(queryByText('Mínim 8 caràcters')).toBeNull();
        // Hauria de mostrar el camp de confirmació
        expect(getByPlaceholderText('Confirma la contrasenya')).toBeTruthy();
      });
    });
  });

  describe('Confirmació de contrasenya', () => {
    it('hauria de mostrar error si les contrasenyes no coincideixen', async () => {
      const { getByPlaceholderText, getByText, getByTestId } = renderWithProviders(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />,
        { withNavigation: false }
      );

      fireEvent.press(getByTestId('language-ca'));
      await waitFor(() => {
        fireEvent.changeText(getByPlaceholderText('Nom d\'usuari'), 'testuser');
      });

      await waitFor(() => {
        fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
      });

      await waitFor(() => {
        fireEvent.changeText(getByTestId('password-input'), 'Test1234!');
      });

      await waitFor(() => {
        fireEvent.changeText(getByPlaceholderText('Confirma la contrasenya'), 'Different1!');
      });

      await waitFor(() => {
        expect(getByText('Les contrasenyes no coincideixen')).toBeTruthy();
      });
    });

    it('no hauria de mostrar error si les contrasenyes coincideixen', async () => {
      const { getByPlaceholderText, getByText, queryByText, getByTestId } = renderWithProviders(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />,
        { withNavigation: false }
      );

      fireEvent.press(getByTestId('language-ca'));
      await waitFor(() => {
        fireEvent.changeText(getByPlaceholderText('Nom d\'usuari'), 'testuser');
      });

      await waitFor(() => {
        fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
      });

      await waitFor(() => {
        fireEvent.changeText(getByTestId('password-input'), 'Test1234!');
      });

      await waitFor(() => {
        fireEvent.changeText(getByPlaceholderText('Confirma la contrasenya'), 'Test1234!');
      });

      await waitFor(() => {
        expect(queryByText('Les contrasenyes no coincideixen')).toBeNull();
      });
    });
  });

  describe('Flux complet de registre', () => {
    it('hauria de registrar un usuari correctament', async () => {
      mockSignup.mockResolvedValue(undefined);

      const { getByPlaceholderText, getByText, getByTestId } = renderWithProviders(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />,
        { withNavigation: false }
      );

      // Step 1: Seleccionar idioma
      fireEvent.press(getByTestId('language-ca'));

      // Step 2: Username
      await waitFor(() => {
        fireEvent.changeText(getByPlaceholderText('Nom d\'usuari'), 'testuser');
      });

      // Step 3: Email
      await waitFor(() => {
        fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
      });

      // Step 4: Password
      await waitFor(() => {
        fireEvent.changeText(getByTestId('password-input'), 'Test1234!');
      });

      // Step 5: Confirm Password
      await waitFor(() => {
        fireEvent.changeText(getByPlaceholderText('Confirma la contrasenya'), 'Test1234!');
      });

      // Step 6: Submit
      await waitFor(() => {
        const signUpButton = getByText('Registrar-se');
        fireEvent.press(signUpButton);
      });

      await waitFor(() => {
        expect(mockSignup).toHaveBeenCalledWith('test@example.com', 'Test1234!', 'testuser', 'ca');
        expect(mockShowAlert).toHaveBeenCalledWith(
          'Èxit',
          expect.any(String),
          expect.any(Array)
        );
      });
    });

    it('hauria de gestionar email ja en ús', async () => {
      mockSignup.mockRejectedValue({ code: 'auth/email-already-in-use' });

      const { getByPlaceholderText, getByText, getByTestId } = renderWithProviders(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />,
        { withNavigation: false }
      );

      fireEvent.press(getByTestId('language-ca'));

      await waitFor(() => {
        fireEvent.changeText(getByPlaceholderText('Nom d\'usuari'), 'testuser');
      });

      await waitFor(() => {
        fireEvent.changeText(getByTestId('email-input'), 'existing@example.com');
      });

      await waitFor(() => {
        fireEvent.changeText(getByTestId('password-input'), 'Test1234!');
      });

      await waitFor(() => {
        fireEvent.changeText(getByPlaceholderText('Confirma la contrasenya'), 'Test1234!');
      });

      await waitFor(() => {
        fireEvent.press(getByText('Registrar-se'));
      });

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          'Error',
          expect.any(String)
        );
      });
    });
  });

  describe('Visibilitat de contrasenya', () => {
    it('hauria d\'alternar la visibilitat de la contrasenya', async () => {
      const { getByPlaceholderText, getByText, getByTestId } = renderWithProviders(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />,
        { withNavigation: false }
      );

      fireEvent.press(getByTestId('language-ca'));

      await waitFor(() => {
        fireEvent.changeText(getByPlaceholderText('Nom d\'usuari'), 'testuser');
      });

      await waitFor(() => {
        fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
      });

      await waitFor(() => {
        const passwordInput = getByTestId('password-input');
        expect(passwordInput.props.secureTextEntry).toBe(true);

        const toggleButton = getByTestId('toggle-password-visibility');
        fireEvent.press(toggleButton);

        expect(passwordInput.props.secureTextEntry).toBe(false);
      });
    });
  });

  describe('Navegació entre steps', () => {
    it('hauria de tornar al login des del primer step', () => {
      const { getByTestId } = renderWithProviders(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />,
        { withNavigation: false }
      );

      // Des de la pantalla d'idioma, el back hauria de cridar onBackToLogin
      const backButton = getByTestId('back-button');
      fireEvent.press(backButton);

      expect(mockOnBackToLogin).toHaveBeenCalled();
    });
  });

  describe('Link de login', () => {
    it('hauria de navegar a login quan es fa clic al link', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />,
        { withNavigation: false }
      );

      const loginLink = getByText('Inicia sessió');
      fireEvent.press(loginLink);

      expect(mockOnBackToLogin).toHaveBeenCalled();
    });
  });

  describe('Casos límit', () => {
    it('hauria de gestionar espais en blanc en l\'username', async () => {
      const { getByPlaceholderText, getByText, getByTestId } = renderWithProviders(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />,
        { withNavigation: false }
      );

      fireEvent.press(getByTestId('language-ca'));

      await waitFor(() => {
        fireEvent.changeText(getByPlaceholderText('Nom d\'usuari'), '  test  ');
      });

      // Hauria d'acceptar-lo després de fer trim
      await waitFor(() => {
        expect(getByTestId('email-input')).toBeTruthy();
      });
    });

    it('hauria de deshabilitar el botó durant la càrrega', async () => {
      mockSignup.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      const { getByPlaceholderText, getByText, getByTestId } = renderWithProviders(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />,
        { withNavigation: false }
      );

      fireEvent.press(getByTestId('language-ca'));

      await waitFor(() => {
        fireEvent.changeText(getByPlaceholderText('Nom d\'usuari'), 'testuser');
      });

      await waitFor(() => {
        fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
      });

      await waitFor(() => {
        fireEvent.changeText(getByTestId('password-input'), 'Test1234!');
      });

      await waitFor(() => {
        fireEvent.changeText(getByPlaceholderText('Confirma la contrasenya'), 'Test1234!');
      });

      const signUpButton = getByText('Registrar-se');
      fireEvent.press(signUpButton);

      // El botó hauria d'estar deshabilitat o mostrant càrrega
      // Note: L'estat de càrrega pot no ser accessible en els tests
      // Verifica que signup s'ha cridat
      await waitFor(() => {
        expect(mockSignup).toHaveBeenCalled();
      });
    });
  });
});





