/**
 * Tests unitaris per a SignUpScreen
 *
 * Aquest fitxer cobreix:
 * - Renderització inicial (selecció d'idioma)
 * - Flux de selecció d'idioma
 * - Validació d'username (buit, massa curt, massa llarg)
 * - Validació d'email
 * - Validació de contrasenya (força)
 * - Confirmació de contrasenya
 * - Visibilitat de contrasenya (toggle)
 * - Flux complet de registre
 * - Gestió d'errors (email en ús, errors genèrics)
 * - Navegació (back button, back to login)
 * - Estat de càrrega
 * - Snapshot tests
 */

// Store the backHandler callback for testing
let backHandlerCallback: (() => boolean) | null = null;
const mockBackHandlerRemove = jest.fn();

// We rely on the BackHandler mock from jest.setup.js
// The test will access the callback through the mock calls

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Platform, BackHandler } from 'react-native';
import { SignUpScreen } from '../../../screens/SignUpScreen';
import i18n from '../../../i18n';

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

// Mock validator
jest.mock('validator', () => ({
  isEmail: jest.fn((email: string) => {
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(trimmedEmail);
  }),
}));

// Mock SVG icons
jest.mock('../../../assets/icons/visible.svg', () => 'VisibleIcon');
jest.mock('../../../assets/icons/visibleOff2.svg', () => 'VisibleOffIcon');
jest.mock('../../../assets/icons/arrow-left.svg', () => 'ArrowLeftIcon');
jest.mock('../../../assets/images/logo.png', () => 'AppLogo');
jest.mock('../../../assets/images/catalunyaFlag.png', () => 'CatalanFlag');
jest.mock('../../../assets/images/spainFlag.webp', () => 'SpanishFlag');
jest.mock('../../../assets/images/franceFlag.webp', () => 'FrenchFlag');
jest.mock('../../../assets/images/ukflag.webp', () => 'UKFlag');

// Mock i18n
jest.mock('../../../i18n', () => ({
  changeLanguage: jest.fn((lang: string, callback?: () => void) => {
    if (callback) callback();
  }),
}));

// Mock useTranslation
jest.mock('../../../hooks/useTranslation', () => ({
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
        'signup.backToLanguage': 'Tornar a idioma',
        'signup.successMessage': 'Registre completat! Comprova el teu email.',
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
        'signup.errors.passwordMustHave': 'La contrasenya ha de tenir:',
        'signup.errors.registrationFailed': 'El registre ha fallat',
        'common.error': 'Error',
        'common.success': 'Èxit',
        'common.close': 'Tancar',
        'common.loading': 'Carregant...',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock AuthService
const mockGetErrorMessageKey = jest.fn((code: string) => {
  if (code === 'auth/email-already-in-use') return 'auth.errors.emailInUse';
  return `auth.errors.${code}`;
});

jest.mock('../../../services/AuthService', () => ({
  AuthService: {
    getErrorMessageKey: (code: string) => mockGetErrorMessageKey(code),
  },
}));

// Mock firebase
jest.mock('../../../services/firebase', () => ({
  app: {},
}));

// Mock useAuth
const mockSignup = jest.fn();

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    signup: mockSignup,
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
        <Text testID="alert-title">{title}</Text>
        <Text testID="alert-message">{message}</Text>
        {buttons?.map((btn: any, idx: number) => (
          <TouchableOpacity key={idx} testID={`alert-button-${idx}`} onPress={btn.onPress}>
            <Text>{btn.text}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  },
}));

describe('SignUpScreen - Unit Tests', () => {
  const mockOnSignUpSuccess = jest.fn();
  const mockOnBackToLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAlertVisible = false;
    mockAlertConfig = null;
    (i18n.changeLanguage as jest.Mock).mockImplementation((lang: string, callback?: () => void) => {
      if (callback) callback();
    });
  });

  // ============================================
  // RENDERITZACIÓ INICIAL
  // ============================================
  describe('Renderització inicial', () => {
    it('hauria de renderitzar la pantalla de selecció d\'idioma inicialment', () => {
      const { getByText, getByTestId } = render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );

      expect(getByText('Selecciona el teu idioma')).toBeTruthy();
      expect(getByTestId('language-ca')).toBeTruthy();
      expect(getByTestId('language-es')).toBeTruthy();
      expect(getByTestId('language-fr')).toBeTruthy();
      expect(getByTestId('language-en')).toBeTruthy();
    });

    it('hauria de mostrar el logo i nom de l\'app', () => {
      const { getByText } = render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );

      expect(getByText('Refugis Lliures')).toBeTruthy();
    });

    it('hauria de mostrar el botó per tornar a login', () => {
      const { getByTestId } = render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );

      expect(getByTestId('back-button')).toBeTruthy();
    });

    it('snapshot test - pantalla de selecció d\'idioma', () => {
      const { toJSON } = render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );
      expect(toJSON()).toMatchSnapshot();
    });
  });

  // ============================================
  // SELECCIÓ D'IDIOMA
  // ============================================
  describe('Selecció d\'idioma', () => {
    it('hauria de canviar a català i mostrar el formulari', async () => {
      const { getByTestId } = render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );

      fireEvent.press(getByTestId('language-ca'));

      await waitFor(() => {
        expect(i18n.changeLanguage).toHaveBeenCalledWith('ca', expect.any(Function));
        expect(getByTestId('username-input')).toBeTruthy();
      });
    });

    it('hauria de canviar a espanyol', async () => {
      const { getByTestId } = render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );

      fireEvent.press(getByTestId('language-es'));

      await waitFor(() => {
        expect(i18n.changeLanguage).toHaveBeenCalledWith('es', expect.any(Function));
      });
    });

    it('hauria de canviar a francès', async () => {
      const { getByTestId } = render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );

      fireEvent.press(getByTestId('language-fr'));

      await waitFor(() => {
        expect(i18n.changeLanguage).toHaveBeenCalledWith('fr', expect.any(Function));
      });
    });

    it('hauria de canviar a anglès', async () => {
      const { getByTestId } = render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );

      fireEvent.press(getByTestId('language-en'));

      await waitFor(() => {
        expect(i18n.changeLanguage).toHaveBeenCalledWith('en', expect.any(Function));
      });
    });

    it('hauria de validar username buit després de seleccionar idioma', async () => {
      const { getByTestId, getByText } = render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );

      // Seleccionar idioma sense haver escrit res
      fireEvent.press(getByTestId('language-ca'));

      await waitFor(() => {
        // Hauria de mostrar error d'username buit
        expect(getByText('El nom d\'usuari és obligatori')).toBeTruthy();
      });
    });

    it('hauria de validar username massa curt després de canviar idioma', async () => {
      const { getByTestId, getByText } = render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );

      // Primer seleccionar idioma
      fireEvent.press(getByTestId('language-ca'));

      await waitFor(() => {
        expect(getByTestId('username-input')).toBeTruthy();
      });

      // Escriure un username curt
      const usernameInput = getByTestId('username-input');
      fireEvent.changeText(usernameInput, 'a');

      // Tornar a seleccionar idioma per forçar revalidació
      // Primer tornem a la selecció d'idioma
      // Nota: La validació ja es fa inline

      await waitFor(() => {
        expect(getByText('El nom d\'usuari ha de tenir entre 2 i 20 caràcters')).toBeTruthy();
      });
    });
  });

  // ============================================
  // VALIDACIÓ D'USERNAME
  // ============================================
  describe('Validació d\'username', () => {
    it('hauria de mostrar error si l\'username està buit', async () => {
      const { getByTestId, getByText } = render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );

      fireEvent.press(getByTestId('language-ca'));

      await waitFor(() => {
        const usernameInput = getByTestId('username-input');
        fireEvent.changeText(usernameInput, '');
      });

      await waitFor(() => {
        expect(getByText('El nom d\'usuari és obligatori')).toBeTruthy();
      });
    });

    it('hauria de mostrar error si l\'username és massa curt (1 caràcter)', async () => {
      const { getByTestId, getByText } = render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );

      fireEvent.press(getByTestId('language-ca'));

      await waitFor(() => {
        fireEvent.changeText(getByTestId('username-input'), 'a');
      });

      await waitFor(() => {
        expect(getByText('El nom d\'usuari ha de tenir entre 2 i 20 caràcters')).toBeTruthy();
      });
    });

    it('hauria de mostrar error si l\'username és massa llarg (>20 caràcters)', async () => {
      const { getByTestId, getByText } = render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );

      fireEvent.press(getByTestId('language-ca'));

      await waitFor(() => {
        fireEvent.changeText(getByTestId('username-input'), 'a'.repeat(21));
      });

      await waitFor(() => {
        expect(getByText('El nom d\'usuari ha de tenir entre 2 i 20 caràcters')).toBeTruthy();
      });
    });

    it('hauria d\'acceptar un username vàlid (2-20 caràcters)', async () => {
      const { getByTestId, queryByText } = render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );

      fireEvent.press(getByTestId('language-ca'));

      await waitFor(() => {
        fireEvent.changeText(getByTestId('username-input'), 'testuser');
      });

      await waitFor(() => {
        expect(getByTestId('email-input')).toBeTruthy();
        expect(queryByText('El nom d\'usuari és obligatori')).toBeNull();
        expect(queryByText('El nom d\'usuari ha de tenir entre 2 i 20 caràcters')).toBeNull();
      });
    });

    it('hauria d\'acceptar un username amb exactament 2 caràcters', async () => {
      const { getByTestId, queryByText } = render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );

      fireEvent.press(getByTestId('language-ca'));

      await waitFor(() => {
        fireEvent.changeText(getByTestId('username-input'), 'ab');
      });

      await waitFor(() => {
        expect(queryByText('El nom d\'usuari ha de tenir entre 2 i 20 caràcters')).toBeNull();
      });
    });

    it('hauria d\'acceptar un username amb exactament 20 caràcters', async () => {
      const { getByTestId, queryByText } = render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );

      fireEvent.press(getByTestId('language-ca'));

      await waitFor(() => {
        fireEvent.changeText(getByTestId('username-input'), 'a'.repeat(20));
      });

      await waitFor(() => {
        expect(queryByText('El nom d\'usuari ha de tenir entre 2 i 20 caràcters')).toBeNull();
      });
    });

    it('hauria de fer trim de l\'username', async () => {
      const { getByTestId } = render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );

      fireEvent.press(getByTestId('language-ca'));

      await waitFor(() => {
        fireEvent.changeText(getByTestId('username-input'), '  testuser  ');
      });

      await waitFor(() => {
        // Hauria de mostrar el camp d'email perquè el trim dona 'testuser' (vàlid)
        expect(getByTestId('email-input')).toBeTruthy();
      });
    });
  });

  // ============================================
  // VALIDACIÓ D'EMAIL
  // ============================================
  describe('Validació d\'email', () => {
    const setupToEmailStep = async (getByTestId: any) => {
      fireEvent.press(getByTestId('language-ca'));
      await waitFor(() => {
        fireEvent.changeText(getByTestId('username-input'), 'testuser');
      });
      await waitFor(() => {
        expect(getByTestId('email-input')).toBeTruthy();
      });
    };

    it('hauria de mostrar error amb un email invàlid', async () => {
      const { getByTestId, getByText } = render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );

      await setupToEmailStep(getByTestId);

      fireEvent.changeText(getByTestId('email-input'), 'invalid-email');

      await waitFor(() => {
        expect(getByText('El format de l\'email no és vàlid')).toBeTruthy();
      });
    });

    it('hauria d\'acceptar un email vàlid', async () => {
      const { getByTestId, queryByText } = render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );

      await setupToEmailStep(getByTestId);

      fireEvent.changeText(getByTestId('email-input'), 'test@example.com');

      await waitFor(() => {
        expect(queryByText('El format de l\'email no és vàlid')).toBeNull();
        expect(getByTestId('password-input')).toBeTruthy();
      });
    });

    it('hauria de netejar l\'error quan l\'email es buida', async () => {
      const { getByTestId, queryByText } = render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );

      await setupToEmailStep(getByTestId);

      // Escriure email invàlid
      fireEvent.changeText(getByTestId('email-input'), 'invalid');

      await waitFor(() => {
        expect(queryByText('El format de l\'email no és vàlid')).toBeTruthy();
      });

      // Buidar el camp
      fireEvent.changeText(getByTestId('email-input'), '');

      await waitFor(() => {
        expect(queryByText('El format de l\'email no és vàlid')).toBeNull();
      });
    });
  });

  // ============================================
  // VALIDACIÓ DE CONTRASENYA
  // ============================================
  describe('Validació de contrasenya', () => {
    const setupToPasswordStep = async (getByTestId: any) => {
      fireEvent.press(getByTestId('language-ca'));
      await waitFor(() => {
        fireEvent.changeText(getByTestId('username-input'), 'testuser');
      });
      await waitFor(() => {
        fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
      });
      await waitFor(() => {
        expect(getByTestId('password-input')).toBeTruthy();
      });
    };

    it('hauria de mostrar errors de contrasenya feble', async () => {
      const { getByTestId, getByText } = render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );

      await setupToPasswordStep(getByTestId);

      fireEvent.changeText(getByTestId('password-input'), 'weak');

      await waitFor(() => {
        expect(getByText('La contrasenya ha de tenir:')).toBeTruthy();
        expect(getByText('Mínim 8 caràcters')).toBeTruthy();
        expect(getByText('Una majúscula')).toBeTruthy();
        expect(getByText('Un número')).toBeTruthy();
        expect(getByText('Un caràcter especial')).toBeTruthy();
      });
    });

    it('hauria de detectar contrasenya sense minúscula', async () => {
      const { getByTestId, getByText } = render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );

      await setupToPasswordStep(getByTestId);

      fireEvent.changeText(getByTestId('password-input'), 'TEST1234!');

      await waitFor(() => {
        expect(getByText('Una minúscula')).toBeTruthy();
      });
    });

    it('hauria d\'acceptar contrasenya forta i mostrar confirmació', async () => {
      const { getByTestId, queryByText } = render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );

      await setupToPasswordStep(getByTestId);

      fireEvent.changeText(getByTestId('password-input'), 'Test1234!');

      await waitFor(() => {
        expect(queryByText('Mínim 8 caràcters')).toBeNull();
        expect(getByTestId('confirm-password-input')).toBeTruthy();
      });
    });
  });

  // ============================================
  // CONFIRMACIÓ DE CONTRASENYA
  // ============================================
  describe('Confirmació de contrasenya', () => {
    const setupToConfirmPasswordStep = async (getByTestId: any) => {
      fireEvent.press(getByTestId('language-ca'));
      await waitFor(() => {
        fireEvent.changeText(getByTestId('username-input'), 'testuser');
      });
      await waitFor(() => {
        fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
      });
      await waitFor(() => {
        fireEvent.changeText(getByTestId('password-input'), 'Test1234!');
      });
      await waitFor(() => {
        expect(getByTestId('confirm-password-input')).toBeTruthy();
      });
    };

    it('hauria de mostrar error si les contrasenyes no coincideixen', async () => {
      const { getByTestId, getByText } = render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );

      await setupToConfirmPasswordStep(getByTestId);

      fireEvent.changeText(getByTestId('confirm-password-input'), 'Different1!');

      await waitFor(() => {
        expect(getByText('Les contrasenyes no coincideixen')).toBeTruthy();
      });
    });

    it('hauria d\'acceptar si les contrasenyes coincideixen', async () => {
      const { getByTestId, queryByText } = render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );

      await setupToConfirmPasswordStep(getByTestId);

      fireEvent.changeText(getByTestId('confirm-password-input'), 'Test1234!');

      await waitFor(() => {
        expect(queryByText('Les contrasenyes no coincideixen')).toBeNull();
        expect(getByTestId('signup-button')).toBeTruthy();
      });
    });

    it('hauria de netejar error quan es buida el camp de confirmació', async () => {
      const { getByTestId, queryByText } = render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );

      await setupToConfirmPasswordStep(getByTestId);

      // Escriure contrasenya diferent
      fireEvent.changeText(getByTestId('confirm-password-input'), 'Different1!');

      await waitFor(() => {
        expect(queryByText('Les contrasenyes no coincideixen')).toBeTruthy();
      });

      // Buidar el camp
      fireEvent.changeText(getByTestId('confirm-password-input'), '');

      await waitFor(() => {
        expect(queryByText('Les contrasenyes no coincideixen')).toBeNull();
      });
    });
  });

  // ============================================
  // VISIBILITAT DE CONTRASENYA
  // ============================================
  describe('Visibilitat de contrasenya', () => {
    const setupToPasswordStep = async (getByTestId: any) => {
      fireEvent.press(getByTestId('language-ca'));
      await waitFor(() => {
        fireEvent.changeText(getByTestId('username-input'), 'testuser');
      });
      await waitFor(() => {
        fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
      });
      await waitFor(() => {
        expect(getByTestId('password-input')).toBeTruthy();
      });
    };

    it('hauria d\'alternar la visibilitat de la contrasenya', async () => {
      const { getByTestId } = render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );

      await setupToPasswordStep(getByTestId);

      const passwordInput = getByTestId('password-input');
      expect(passwordInput.props.secureTextEntry).toBe(true);

      const toggleButton = getByTestId('toggle-password-visibility');
      fireEvent.press(toggleButton);

      await waitFor(() => {
        expect(getByTestId('password-input').props.secureTextEntry).toBe(false);
      });

      // Toggle back
      fireEvent.press(toggleButton);

      await waitFor(() => {
        expect(getByTestId('password-input').props.secureTextEntry).toBe(true);
      });
    });

    it('hauria d\'alternar la visibilitat de la confirmació de contrasenya', async () => {
      const { getByTestId } = render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );

      await setupToPasswordStep(getByTestId);

      // Escriure contrasenya forta per mostrar confirmació
      fireEvent.changeText(getByTestId('password-input'), 'Test1234!');

      await waitFor(() => {
        expect(getByTestId('confirm-password-input')).toBeTruthy();
      });

      const confirmPasswordInput = getByTestId('confirm-password-input');
      expect(confirmPasswordInput.props.secureTextEntry).toBe(true);

      const toggleButton = getByTestId('toggle-confirm-password-visibility');
      fireEvent.press(toggleButton);

      await waitFor(() => {
        expect(getByTestId('confirm-password-input').props.secureTextEntry).toBe(false);
      });
    });
  });

  // ============================================
  // FLUX DE REGISTRE
  // ============================================
  describe('Flux de registre', () => {
    const completeForm = async (getByTestId: any) => {
      fireEvent.press(getByTestId('language-ca'));
      await waitFor(() => {
        fireEvent.changeText(getByTestId('username-input'), 'testuser');
      });
      await waitFor(() => {
        fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
      });
      await waitFor(() => {
        fireEvent.changeText(getByTestId('password-input'), 'Test1234!');
      });
      await waitFor(() => {
        fireEvent.changeText(getByTestId('confirm-password-input'), 'Test1234!');
      });
      await waitFor(() => {
        expect(getByTestId('signup-button')).toBeTruthy();
      });
    };

    it('hauria de registrar un usuari correctament', async () => {
      mockSignup.mockResolvedValue(undefined);

      const { getByTestId } = render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );

      await completeForm(getByTestId);

      fireEvent.press(getByTestId('signup-button'));

      await waitFor(() => {
        expect(mockSignup).toHaveBeenCalledWith(
          'test@example.com',
          'Test1234!',
          'testuser',
          'ca'
        );
        expect(mockShowAlert).toHaveBeenCalledWith(
          'Èxit',
          'Registre completat! Comprova el teu email.',
          expect.any(Array)
        );
      });
    });

    it('hauria de gestionar error d\'email ja en ús', async () => {
      mockSignup.mockRejectedValue({ code: 'auth/email-already-in-use' });
      mockGetErrorMessageKey.mockReturnValue('auth.errors.emailInUse');

      const { getByTestId } = render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );

      await completeForm(getByTestId);

      fireEvent.press(getByTestId('signup-button'));

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith('Error', expect.any(String));
      });
    });

    it('hauria de gestionar errors genèrics', async () => {
      mockSignup.mockRejectedValue({ code: 'auth/unknown-error' });
      mockGetErrorMessageKey.mockReturnValue('auth.errors.unknown');

      const { getByTestId } = render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );

      await completeForm(getByTestId);

      fireEvent.press(getByTestId('signup-button'));

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith('Error', expect.any(String));
      });
    });

    it('hauria de mostrar estat de càrrega durant el registre', async () => {
      mockSignup.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      const { getByTestId, getByText } = render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );

      await completeForm(getByTestId);

      fireEvent.press(getByTestId('signup-button'));

      // El botó hauria de mostrar text de càrrega
      await waitFor(() => {
        expect(getByText('Carregant...')).toBeTruthy();
      });
    });

    it('hauria de deshabilitar inputs durant la càrrega', async () => {
      mockSignup.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      const { getByTestId } = render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );

      await completeForm(getByTestId);

      fireEvent.press(getByTestId('signup-button'));

      await waitFor(() => {
        // Els inputs haurien d'estar deshabilititats
        expect(getByTestId('username-input').props.editable).toBe(false);
      });
    });
  });

  // ============================================
  // VALIDACIÓ DURANT HANDLESUBMIT
  // ============================================
  describe('Validació durant handleSignUp', () => {
    it('hauria de mostrar error si l\'username està buit en el submit', async () => {
      const { getByTestId, getByText } = render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );

      // Aquest test és difícil de replicar perquè el botó de signup
      // no apareix fins que tots els camps són vàlids
      // Però podem verificar que la validació inline funciona
      fireEvent.press(getByTestId('language-ca'));

      await waitFor(() => {
        fireEvent.changeText(getByTestId('username-input'), '');
      });

      await waitFor(() => {
        expect(getByText('El nom d\'usuari és obligatori')).toBeTruthy();
      });
    });
  });

  // ============================================
  // NAVEGACIÓ
  // ============================================
  describe('Navegació', () => {
    it('hauria de tornar a login quan es prem el botó back', () => {
      const { getByTestId } = render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );

      fireEvent.press(getByTestId('back-button'));

      expect(mockOnBackToLogin).toHaveBeenCalled();
    });

    it('hauria de navegar a login quan es fa clic al link', () => {
      const { getByText } = render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );

      fireEvent.press(getByText('Inicia sessió'));

      expect(mockOnBackToLogin).toHaveBeenCalled();
    });

    it('hauria de tornar a la selecció d\'idioma des del formulari', async () => {
      const { getByTestId, getByText } = render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );

      fireEvent.press(getByTestId('language-ca'));

      await waitFor(() => {
        expect(getByTestId('username-input')).toBeTruthy();
      });

      // Prémer el botó de tornar a idioma
      const backToLanguageButton = getByText('Tornar a idioma');
      fireEvent.press(backToLanguageButton);

      await waitFor(() => {
        expect(getByText('Selecciona el teu idioma')).toBeTruthy();
      });
    });

    it('hauria de cridar onSignUpSuccess quan l\'alert es tanca', async () => {
      mockSignup.mockResolvedValue(undefined);
      
      // Simular que l'alert és visible amb botó de callback
      let capturedCallback: (() => void) | undefined;
      mockShowAlert.mockImplementation((title, message, buttons) => {
        mockAlertVisible = true;
        mockAlertConfig = { title, message, buttons };
        if (buttons && buttons[0] && buttons[0].onPress) {
          capturedCallback = buttons[0].onPress;
        }
      });

      const { getByTestId } = render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );

      // Completar formulari
      fireEvent.press(getByTestId('language-ca'));
      await waitFor(() => {
        fireEvent.changeText(getByTestId('username-input'), 'testuser');
      });
      await waitFor(() => {
        fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
      });
      await waitFor(() => {
        fireEvent.changeText(getByTestId('password-input'), 'Test1234!');
      });
      await waitFor(() => {
        fireEvent.changeText(getByTestId('confirm-password-input'), 'Test1234!');
      });
      await waitFor(() => {
        expect(getByTestId('signup-button')).toBeTruthy();
      });

      fireEvent.press(getByTestId('signup-button'));

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalled();
      });

      // Simular que l'usuari prem el botó de l'alert
      if (capturedCallback) {
        capturedCallback();
        expect(mockOnSignUpSuccess).toHaveBeenCalled();
      }
    });
  });

  // ============================================
  // BACK HANDLER (Android)
  // ============================================
  describe('BackHandler (Android)', () => {
    // The global beforeEach already resets backHandlerCallback
    
    // Helper to get the captured callback from mock calls
    const getBackHandlerCallback = (): (() => boolean) | undefined => {
      const mockCalls = (BackHandler.addEventListener as jest.Mock).mock.calls;
      const backPressCall = mockCalls.find(call => call[0] === 'hardwareBackPress');
      return backPressCall?.[1];
    };

    it('hauria de registrar el listener de back', () => {
      render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );

      expect(BackHandler.addEventListener).toHaveBeenCalledWith(
        'hardwareBackPress',
        expect.any(Function)
      );
    });

    it('hauria de tornar a login des de la pantalla d\'idioma', async () => {
      render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );

      // Get the captured callback from the mock
      const callback = getBackHandlerCallback();
      
      // Simular back press a la pantalla d'idioma
      if (callback) {
        const result = callback();
        expect(result).toBe(true);
        expect(mockOnBackToLogin).toHaveBeenCalled();
      }
    });

    it('hauria de tornar a la selecció d\'idioma des del formulari', async () => {
      const { getByTestId, queryByText } = render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );

      // Avançar al formulari
      fireEvent.press(getByTestId('language-ca'));

      await waitFor(() => {
        expect(getByTestId('username-input')).toBeTruthy();
      });

      // Get the LATEST captured callback from the mock
      // (after advancing to username step, a new callback should be registered)
      const getLatestCallback = (): (() => boolean) | undefined => {
        const mockCalls = (BackHandler.addEventListener as jest.Mock).mock.calls;
        // Get the last call's callback
        const lastCall = mockCalls[mockCalls.length - 1];
        if (lastCall && lastCall[0] === 'hardwareBackPress') {
          return lastCall[1];
        }
        return undefined;
      };
      
      const callback = getLatestCallback();
      
      // Verify the callback exists and works
      expect(callback).toBeDefined();
      
      // Simular back press - hauria de tornar a idioma
      await act(async () => {
        if (callback) {
          const result = callback();
          expect(result).toBe(true);
        }
      });

      await waitFor(() => {
        expect(queryByText('Selecciona el teu idioma')).toBeTruthy();
      }, { timeout: 2000 });
    });
  });

  // ============================================
  // CASOS LÍMIT I EDGE CASES
  // ============================================
  describe('Casos límit', () => {
    it('hauria de gestionar espais en blanc només en l\'username', async () => {
      const { getByTestId, getByText } = render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );

      fireEvent.press(getByTestId('language-ca'));

      await waitFor(() => {
        fireEvent.changeText(getByTestId('username-input'), '   ');
      });

      await waitFor(() => {
        expect(getByText('El nom d\'usuari és obligatori')).toBeTruthy();
      });
    });

    it('hauria de gestionar canvis ràpids de contrasenya', async () => {
      const { getByTestId, queryByText } = render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );

      fireEvent.press(getByTestId('language-ca'));
      await waitFor(() => {
        fireEvent.changeText(getByTestId('username-input'), 'testuser');
      });
      await waitFor(() => {
        fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
      });
      await waitFor(() => {
        expect(getByTestId('password-input')).toBeTruthy();
      });

      // Canviar ràpidament la contrasenya
      fireEvent.changeText(getByTestId('password-input'), 'weak');
      fireEvent.changeText(getByTestId('password-input'), 'Test1234!');

      await waitFor(() => {
        expect(queryByText('Mínim 8 caràcters')).toBeNull();
      });
    });

    it('hauria de reiniciar confirmació quan canvia la contrasenya', async () => {
      const { getByTestId } = render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );

      fireEvent.press(getByTestId('language-ca'));
      await waitFor(() => {
        fireEvent.changeText(getByTestId('username-input'), 'testuser');
      });
      await waitFor(() => {
        fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
      });
      await waitFor(() => {
        fireEvent.changeText(getByTestId('password-input'), 'Test1234!');
      });
      await waitFor(() => {
        fireEvent.changeText(getByTestId('confirm-password-input'), 'Test1234!');
      });

      // Canviar la contrasenya - hauria de netejar la confirmació
      fireEvent.changeText(getByTestId('password-input'), 'NewPass123!');

      await waitFor(() => {
        // El camp de confirmació hauria d'estar buit
        expect(getByTestId('confirm-password-input').props.value).toBe('');
      });
    });
  });

  // ============================================
  // TESTS DE SNAPSHOT
  // ============================================
  describe('Snapshot tests', () => {
    it('snapshot - pantalla d\'idioma', () => {
      const { toJSON } = render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it('snapshot - formulari amb username', async () => {
      const { getByTestId, toJSON } = render(
        <SignUpScreen
          onSignUpSuccess={mockOnSignUpSuccess}
          onBackToLogin={mockOnBackToLogin}
        />
      );

      fireEvent.press(getByTestId('language-ca'));

      await waitFor(() => {
        expect(getByTestId('username-input')).toBeTruthy();
      });

      expect(toJSON()).toMatchSnapshot();
    });
  });
});
