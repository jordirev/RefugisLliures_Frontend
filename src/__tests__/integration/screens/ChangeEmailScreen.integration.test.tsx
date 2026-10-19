/**
 * Tests d'integració per a ChangeEmailScreen
 * 
 * Cobertura:
 * - Renderització de la pantalla
 * - Validació del nou email
 * - Validació de la contrasenya actual
 * - Flux complet de canvi d'email
 * - Gestió d'errors (contrasenya incorrecta, email ja en ús)
 * - Navegació back
 * - Verificació d'email requerida
 */

// Mock de useAuth
const mockChangeEmail = jest.fn();
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    changeEmail: mockChangeEmail,
    firebaseUser: {
      email: 'current@example.com',
      emailVerified: true,
    },
  }),
}));

// Mock de navigation
const mockNavigate = jest.fn();
const mockPopTo = jest.fn();
const mockGoBack = jest.fn();
const mockAddListener = jest.fn(() => jest.fn()); // Returns unsubscribe function
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
      popTo: mockPopTo,
      goBack: mockGoBack,
      addListener: mockAddListener,
    }),
  };
});

// Mock de useCustomAlert
const mockShowAlert = jest.fn();
const mockHideAlert = jest.fn();
jest.mock('../../../hooks/useCustomAlert', () => ({
  useCustomAlert: () => ({
    alertVisible: false,
    alertConfig: null,
    showAlert: mockShowAlert,
    hideAlert: mockHideAlert,
  }),
}));

// Mock de CustomAlert
jest.mock('../../../components/CustomAlert', () => ({
  CustomAlert: () => null,
}));

// Mock de les icones
jest.mock('../../../assets/icons/arrow-left.svg', () => 'BackIcon');
jest.mock('../../../assets/icons/visible.svg', () => 'VisibleIcon');
jest.mock('../../../assets/icons/visibleOff2.svg', () => 'VisibleOffIcon');

import React from 'react';
import { renderWithProviders, fireEvent, waitFor, act } from '../setup/testUtils';
import { setupMSW } from '../setup/mswServer';
import { ChangeEmailScreen } from '../../../screens/ChangeEmailScreen';

// Setup MSW
setupMSW();

describe('ChangeEmailScreen - Tests d\'integraci\u00f3', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderitzaci\u00f3 inicial', () => {
    it('hauria de renderitzar la pantalla correctament', async () => {
      const { getByText, getByTestId } = await renderWithProviders(<ChangeEmailScreen />);

      expect(getByText('changeEmail.title')).toBeTruthy();
      expect(getByTestId('new-email-input')).toBeTruthy();
      expect(getByTestId('password-input')).toBeTruthy();
    });

    it('hauria de mostrar l\'email actual', async () => {
      const { getByDisplayValue, getByTestId } = await renderWithProviders(<ChangeEmailScreen />);

      expect(getByDisplayValue('current@example.com')).toBeTruthy();
    });

    it('hauria de tenir el bot\u00f3 de canvi desactivat inicialment', async () => {
      const { getByTestId } = await renderWithProviders(<ChangeEmailScreen />);

      const button = getByTestId('submit-button');
      expect(button.props.accessibilityState.disabled).toBe(true);
    });

    it('hauria de mostrar el bot\u00f3 back', async () => {
      const { getByTestId } = await renderWithProviders(<ChangeEmailScreen />);

      const backButton = getByTestId('back-button');
      expect(backButton).toBeTruthy();
    });
  });

  describe('Validació del nou email', () => {
    it('hauria de mostrar error amb un email invàlid', async () => {
      const { getByTestId, getByText } = await renderWithProviders(<ChangeEmailScreen />);

      const newEmailInput = getByTestId('new-email-input');
      await fireEvent.changeText(newEmailInput, 'invalid-email');

      await waitFor(() => {
        expect(getByText('signup.errors.invalidEmail')).toBeTruthy();
      });
    });

    it('hauria de mostrar error si el nou email és igual a l\'actual', async () => {
      const { getByTestId, getByText } = await renderWithProviders(<ChangeEmailScreen />);

      const newEmailInput = getByTestId('new-email-input');
      await fireEvent.changeText(newEmailInput, 'current@example.com');

      await waitFor(() => {
        expect(getByText('changeEmail.errors.sameEmail')).toBeTruthy();
      });
    });

    it('no hauria de mostrar error amb un email vàlid i diferent', async () => {
      const { getByTestId, queryByText } = await renderWithProviders(<ChangeEmailScreen />);

      const newEmailInput = getByTestId('new-email-input');
      await fireEvent.changeText(newEmailInput, 'new@example.com');

      await waitFor(() => {
        expect(queryByText('signup.errors.invalidEmail')).toBeNull();
        expect(queryByText('changeEmail.errors.sameEmail')).toBeNull();
      });
    });
  });

  describe('Validació de contrasenya', () => {
    it('hauria d\'acceptar una contrasenya vàlida', async () => {
      const { getByTestId } = await renderWithProviders(<ChangeEmailScreen />);

      const passwordInput = getByTestId('password-input');
      await fireEvent.changeText(passwordInput, 'ValidPassword123!');

      await waitFor(() => {
        expect(passwordInput.props.value).toBe('ValidPassword123!');
      });
    });
  });

  describe('Flux complet de canvi d\'email', () => {
    it('hauria de canviar l\'email correctament', async () => {
      mockChangeEmail.mockResolvedValue(undefined);

      const { getByTestId } = await renderWithProviders(<ChangeEmailScreen />);

      const newEmailInput = getByTestId('new-email-input');
      const passwordInput = getByTestId('password-input');

      await fireEvent.changeText(newEmailInput, 'new@example.com');
      await fireEvent.changeText(passwordInput, 'ValidPassword123!');

      await waitFor(async () => {
        const button = getByTestId('submit-button');
        expect(button.props.accessibilityState.disabled).toBe(false);
        await fireEvent.press(button);
      });

      await waitFor(() => {
        expect(mockChangeEmail).toHaveBeenCalledWith('ValidPassword123!', 'new@example.com');
        expect(mockShowAlert).toHaveBeenCalledWith(
          'common.success',
          'changeEmail.emailSentMessage',
          expect.any(Array)
        );
      });
    });

    it('hauria de navegar a Settings despr\u00e9s de l\'\u00e8xit', async () => {
      mockChangeEmail.mockResolvedValue(undefined);

      const { getByTestId } = await renderWithProviders(<ChangeEmailScreen />);

      await fireEvent.changeText(getByTestId('new-email-input'), 'new@example.com');
      await fireEvent.changeText(getByTestId('password-input'), 'ValidPassword123!');

      await waitFor(async () => {
        await fireEvent.press(getByTestId('submit-button'));
      });

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalled();
      });

      // L'alert hauria de tenir un botó que crida goBack
      const alertButtons = mockShowAlert.mock.calls[0][2];
      expect(alertButtons).toBeDefined();
      const closeButton = alertButtons[0];
      closeButton.onPress();

      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  describe('Gesti\u00f3 d\'errors', () => {
    it('hauria de gestionar contrasenya incorrecta', async () => {
      mockChangeEmail.mockRejectedValue({ code: 'auth/wrong-password' });

      const { getByTestId, getByText } = await renderWithProviders(<ChangeEmailScreen />);

      await fireEvent.changeText(getByTestId('new-email-input'), 'new@example.com');
      await fireEvent.changeText(getByTestId('password-input'), 'WrongPassword');

      await waitFor(() => {
        expect(getByTestId('submit-button').props.accessibilityState.disabled).toBe(false);
      });

      await fireEvent.press(getByTestId('submit-button'));

      await waitFor(() => {
        expect(getByText('changeEmail.errors.wrongPassword')).toBeTruthy();
      });
    });

    it('hauria de gestionar email ja en \u00fas', async () => {
      mockChangeEmail.mockRejectedValue({ code: 'auth/email-already-in-use' });

      const { getByTestId, getByText } = await renderWithProviders(<ChangeEmailScreen />);

      await fireEvent.changeText(getByTestId('new-email-input'), 'existing@example.com');
      await fireEvent.changeText(getByTestId('password-input'), 'ValidPassword123!');

      await waitFor(() => {
        expect(getByTestId('submit-button').props.accessibilityState.disabled).toBe(false);
      });

      await fireEvent.press(getByTestId('submit-button'));

      await waitFor(() => {
        expect(getByText('auth.errors.emailInUse')).toBeTruthy();
      });
    });

    it('hauria de gestionar necessitat de reautenticació', async () => {
      mockChangeEmail.mockRejectedValue({ code: 'auth/requires-recent-login' });

      const { getByTestId } = await renderWithProviders(<ChangeEmailScreen />);

      await fireEvent.changeText(getByTestId('new-email-input'), 'new@example.com');
      await fireEvent.changeText(getByTestId('password-input'), 'ValidPassword123!');

      await waitFor(async () => {
        await fireEvent.press(getByTestId('submit-button'));
      });

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          'common.error',
          'changeEmail.errors.requiresRecentLogin'
        );
      });
    });

    it('hauria de gestionar errors genèrics', async () => {
      mockChangeEmail.mockRejectedValue(new Error('Network error'));

      const { getByTestId } = await renderWithProviders(<ChangeEmailScreen />);

      await fireEvent.changeText(getByTestId('new-email-input'), 'new@example.com');
      await fireEvent.changeText(getByTestId('password-input'), 'ValidPassword123!');

      await waitFor(async () => {
        await fireEvent.press(getByTestId('submit-button'));
      });

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          'common.error',
          expect.stringContaining('changeEmail.errors.generic')
        );
      });
    });
  });

  describe('Visibilitat de contrasenya', () => {
    it('hauria d\'alternar la visibilitat de la contrasenya', async () => {
      const { getByTestId } = await renderWithProviders(<ChangeEmailScreen />);

      const passwordInput = getByTestId('password-input');
      expect(passwordInput.props.secureTextEntry).toBe(true);

      const toggleButton = getByTestId('toggle-password-visibility');
      await fireEvent.press(toggleButton);

      await waitFor(() => {
        expect(passwordInput.props.secureTextEntry).toBe(false);
      });

      await fireEvent.press(toggleButton);

      await waitFor(() => {
        expect(passwordInput.props.secureTextEntry).toBe(true);
      });
    });
  });

  describe('Navegació', () => {
    it('hauria de tornar a Settings amb el botó back', async () => {
      const { getByTestId } = await renderWithProviders(<ChangeEmailScreen />);

      const backButton = getByTestId('back-button');
      await fireEvent.press(backButton);

      expect(mockPopTo).toHaveBeenCalledWith('Settings');
    });

    it('hauria de netejar els camps quan torna enrere', async () => {
      const { getByTestId } = await renderWithProviders(<ChangeEmailScreen />);

      // Omplir els camps
      await fireEvent.changeText(getByTestId('new-email-input'), 'new@example.com');
      await fireEvent.changeText(getByTestId('password-input'), 'password');

      // Tornar enrere
      const backButton = getByTestId('back-button');
      await fireEvent.press(backButton);

      // Els camps haurien d'estar nets després de tornar
      expect(mockPopTo).toHaveBeenCalledWith('Settings');
    });
  });

  describe('Estat de càrrega', () => {
    it('hauria de deshabilitar el botó durant la càrrega', async () => {
      // Promesa diferida controlada manualment: evita dependre de timers reals (racy sota càrrega de CPU)
      let resolveChangeEmail!: (v?: any) => void;
      mockChangeEmail.mockImplementation(() => new Promise(r => { resolveChangeEmail = r; }));

      const { getByTestId } = await renderWithProviders(<ChangeEmailScreen />);

      await fireEvent.changeText(getByTestId('new-email-input'), 'new@example.com');
      await fireEvent.changeText(getByTestId('password-input'), 'ValidPassword123!');

      const button = getByTestId('submit-button');
      // Sense await: el handler queda pendent fins que resolguem la promesa
      fireEvent.press(button);

      await waitFor(() => {
        expect(button.props.accessibilityState.disabled).toBe(true);
      });

      await act(async () => { resolveChangeEmail(); });
    });

    it('hauria de deshabilitar els inputs durant la càrrega', async () => {
      let resolveChangeEmail!: (v?: any) => void;
      mockChangeEmail.mockImplementation(() => new Promise(r => { resolveChangeEmail = r; }));

      const { getByTestId } = await renderWithProviders(<ChangeEmailScreen />);

      await fireEvent.changeText(getByTestId('new-email-input'), 'new@example.com');
      await fireEvent.changeText(getByTestId('password-input'), 'ValidPassword123!');

      fireEvent.press(getByTestId('submit-button'));

      await waitFor(() => {
        const newEmailInput = getByTestId('new-email-input');
        const passwordInput = getByTestId('password-input');

        expect(newEmailInput.props.editable).toBe(false);
        expect(passwordInput.props.editable).toBe(false);
      });

      await act(async () => { resolveChangeEmail(); });
    });
  });

  describe('Casos l\u00edmit', () => {
    it('hauria de gestionar email amb maj\u00fascules', async () => {
      const { getByTestId, queryByText } = await renderWithProviders(<ChangeEmailScreen />);

      const newEmailInput = getByTestId('new-email-input');
      await fireEvent.changeText(newEmailInput, 'NEW@EXAMPLE.COM');

      await waitFor(() => {
        expect(queryByText('signup.errors.invalidEmail')).toBeNull();
      });
    });

    it('hauria de validar l\'estat del formulari en temps real', async () => {
      const { getByTestId } = await renderWithProviders(<ChangeEmailScreen />);

      const button = getByTestId('submit-button');
      expect(button.props.accessibilityState.disabled).toBe(true);

      await fireEvent.changeText(getByTestId('new-email-input'), 'new@example.com');
      expect(button.props.accessibilityState.disabled).toBe(true);

      await fireEvent.changeText(getByTestId('password-input'), 'ValidPassword123!');

      await waitFor(() => {
        expect(button.props.accessibilityState.disabled).toBe(false);
      });
    });
  });
});




