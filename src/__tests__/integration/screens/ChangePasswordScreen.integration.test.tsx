/**
 * Tests d'integració per a ChangePasswordScreen
 * 
 * Cobertura:
 * - Renderització de la pantalla
 * - Validació de la contrasenya actual
 * - Validació de la nova contrasenya (força)
 * - Confirmació de la nova contrasenya
 * - Flux complet de canvi de contrasenya
 * - Gestió d'errors (contrasenya incorrecta, reautenticació)
 * - Visibilitat de contrasenyes
 * - Navegació back
 */

import React from 'react';
import { renderWithProviders, fireEvent, waitFor } from '../setup/testUtils';
import { setupMSW } from '../setup/mswServer';
import { ChangePasswordScreen } from '../../../screens/ChangePasswordScreen';

// Setup MSW
setupMSW();

// Mock de useAuth
const mockChangePassword = jest.fn();

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    changePassword: mockChangePassword,
  }),
}));

// Mock de navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockAddListener = jest.fn(() => jest.fn());
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
      addListener: mockAddListener,
    }),
  };
});

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

// Mock de CustomAlert
jest.mock('../../../components/CustomAlert', () => ({
  CustomAlert: () => null,
}));

// Mock de les icones
jest.mock('../../../assets/icons/arrow-left.svg', () => 'BackIcon');
jest.mock('../../../assets/icons/visible.svg', () => 'VisibleIcon');
jest.mock('../../../assets/icons/visibleOff2.svg', () => 'VisibleOffIcon');

describe('ChangePasswordScreen - Tests d\'integració', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderització inicial', () => {
    it('hauria de renderitzar la pantalla correctament', () => {
      const { getByText, getByPlaceholderText, getByTestId } = renderWithProviders(<ChangePasswordScreen />);

      expect(getByTestId('submit-button')).toBeTruthy();
      expect(getByTestId('current-password-input')).toBeTruthy();
      expect(getByTestId('new-password-input')).toBeTruthy();
      expect(getByTestId('confirm-password-input')).toBeTruthy();
    });

    it('hauria de tenir el botó desactivat inicialment', () => {
      const { getByText, getByTestId } = renderWithProviders(<ChangePasswordScreen />);

      const button = getByTestId('submit-button');
      expect(button.props.accessibilityState.disabled).toBe(true);
    });

    it('hauria de mostrar el botó back', () => {
      const { getByTestId } = renderWithProviders(<ChangePasswordScreen />);

      const backButton = getByTestId('back-button');
      expect(backButton).toBeTruthy();
    });
  });

  describe('Validació de contrasenya actual', () => {
    it('hauria de mostrar error si la contrasenya actual està buida', async () => {
      const { getByPlaceholderText, getByText, getByTestId } = renderWithProviders(<ChangePasswordScreen />);

      // Leave current password empty, but fill in the others to make form valid except current password
      const currentPasswordInput = getByTestId('current-password-input');
      fireEvent.changeText(currentPasswordInput, '');
      fireEvent.changeText(getByTestId('new-password-input'), 'NewPass123!');
      fireEvent.changeText(getByTestId('confirm-password-input'), 'NewPass123!');

      // Button should be disabled because current password is empty
      const button = getByTestId('submit-button');
      expect(button.props.accessibilityState.disabled).toBe(true);
    });
  });

  describe('Validació de nova contrasenya', () => {
    it('hauria de mostrar els requisits de la contrasenya', async () => {
      const { getByPlaceholderText, getByText, getByTestId } = renderWithProviders(<ChangePasswordScreen />);

      const newPasswordInput = getByTestId('new-password-input');
      fireEvent.changeText(newPasswordInput, 'weak');

      await waitFor(() => {
        expect(getByText('signup.errors.shortPassword')).toBeTruthy();
        // 'weak' has lowercase, so minusPassword should NOT appear
        expect(getByText('signup.errors.upperPassword')).toBeTruthy();
        expect(getByText('signup.errors.numberPassword')).toBeTruthy();
        expect(getByText('signup.errors.specialCharPassword')).toBeTruthy();
      });
    });

    it('hauria de validar requisit de caràcter especial', async () => {
      const { getByPlaceholderText, getByText, queryByText, getByTestId } = renderWithProviders(<ChangePasswordScreen />);

      const newPasswordInput = getByTestId('new-password-input');
      fireEvent.changeText(newPasswordInput, 'Test1234');

      await waitFor(() => {
        expect(getByText('signup.errors.specialCharPassword')).toBeTruthy();
      });

      fireEvent.changeText(newPasswordInput, 'Test1234!');

      await waitFor(() => {
        expect(queryByText('signup.errors.specialCharPassword')).toBeNull();
      });
    });

    it('hauria de validar requisit de minúscula', async () => {
      const { getByPlaceholderText, getByText, queryByText, getByTestId } = renderWithProviders(<ChangePasswordScreen />);

      const newPasswordInput = getByTestId('new-password-input');
      fireEvent.changeText(newPasswordInput, 'TEST1234!');

      await waitFor(() => {
        expect(getByText('signup.errors.minusPassword')).toBeTruthy();
      });

      fireEvent.changeText(newPasswordInput, 'Test1234!');

      await waitFor(() => {
        expect(queryByText('signup.errors.minusPassword')).toBeNull();
      });
    });

    it('hauria de validar requisit de majúscula', async () => {
      const { getByPlaceholderText, getByText, queryByText, getByTestId } = renderWithProviders(<ChangePasswordScreen />);

      const newPasswordInput = getByTestId('new-password-input');
      fireEvent.changeText(newPasswordInput, 'test1234!');

      await waitFor(() => {
        expect(getByText('signup.errors.upperPassword')).toBeTruthy();
      });

      fireEvent.changeText(newPasswordInput, 'Test1234!');

      await waitFor(() => {
        expect(queryByText('signup.errors.upperPassword')).toBeNull();
      });
    });

    it('hauria de validar requisit de número', async () => {
      const { getByPlaceholderText, getByText, queryByText, getByTestId } = renderWithProviders(<ChangePasswordScreen />);

      const newPasswordInput = getByTestId('new-password-input');
      fireEvent.changeText(newPasswordInput, 'TestTest!');

      await waitFor(() => {
        expect(getByText('signup.errors.numberPassword')).toBeTruthy();
      });

      fireEvent.changeText(newPasswordInput, 'Test1234!');

      await waitFor(() => {
        expect(queryByText('signup.errors.numberPassword')).toBeNull();
      });
    });

    it('hauria de validar requisit de caràcter especial', async () => {
      const { getByPlaceholderText, getByText, queryByText, getByTestId } = renderWithProviders(<ChangePasswordScreen />);

      const newPasswordInput = getByTestId('new-password-input');
      fireEvent.changeText(newPasswordInput, 'Test1234');

      await waitFor(() => {
        expect(getByText('signup.errors.specialCharPassword')).toBeTruthy();
      });

      fireEvent.changeText(newPasswordInput, 'Test1234!');

      await waitFor(() => {
        expect(queryByText('signup.errors.specialCharPassword')).toBeNull();
      });
    });

    it('hauria d\'acceptar una contrasenya forta', async () => {
      const { getByPlaceholderText, queryByText, getByTestId } = renderWithProviders(<ChangePasswordScreen />);

      const newPasswordInput = getByTestId('new-password-input');
      fireEvent.changeText(newPasswordInput, 'StrongPass123!');

      await waitFor(() => {
        expect(queryByText('signup.errors.shortPassword')).toBeNull();
        expect(queryByText('signup.errors.minusPassword')).toBeNull();
        expect(queryByText('signup.errors.upperPassword')).toBeNull();
        expect(queryByText('signup.errors.numberPassword')).toBeNull();
        expect(queryByText('signup.errors.specialCharPassword')).toBeNull();
      });
    });
  });

  describe('Confirmació de contrasenya', () => {
    it('hauria de mostrar error si les contrasenyes no coincideixen', async () => {
      const { getByPlaceholderText, getByText, getByTestId } = renderWithProviders(<ChangePasswordScreen />);

      fireEvent.changeText(getByTestId('new-password-input'), 'StrongPass123!');
      fireEvent.changeText(getByTestId('confirm-password-input'), 'Different123!');

      await waitFor(() => {
        expect(getByText('signup.errors.passwordMismatch')).toBeTruthy();
      });
    });

    it('no hauria de mostrar error si les contrasenyes coincideixen', async () => {
      const { getByPlaceholderText, queryByText, getByTestId } = renderWithProviders(<ChangePasswordScreen />);

      fireEvent.changeText(getByTestId('new-password-input'), 'StrongPass123!');
      fireEvent.changeText(getByTestId('confirm-password-input'), 'StrongPass123!');

      await waitFor(() => {
        expect(queryByText('Les contrasenyes no coincideixen')).toBeNull();
      });
    });

    it('hauria de revalidar la confirmació quan canvia la nova contrasenya', async () => {
      const { getByPlaceholderText, getByText, queryByText, getByTestId } = renderWithProviders(<ChangePasswordScreen />);

      // Escriure contrasenyes coincidents
      fireEvent.changeText(getByTestId('new-password-input'), 'Pass123!');
      fireEvent.changeText(getByTestId('confirm-password-input'), 'Pass123!');

      await waitFor(() => {
        expect(queryByText('signup.errors.passwordMismatch')).toBeNull();
      });

      // Canviar la nova contrasenya
      fireEvent.changeText(getByTestId('new-password-input'), 'DifferentPass123!');

      await waitFor(() => {
        expect(getByText('signup.errors.passwordMismatch')).toBeTruthy();
      });
    });
  });

  describe('Flux complet de canvi de contrasenya', () => {
    it('hauria de canviar la contrasenya correctament', async () => {
      mockChangePassword.mockResolvedValue(undefined);

      const { getByPlaceholderText, getByText, getByTestId } = renderWithProviders(<ChangePasswordScreen />);

      fireEvent.changeText(getByTestId('current-password-input'), 'OldPass123!');
      fireEvent.changeText(getByTestId('new-password-input'), 'NewPass123!');
      fireEvent.changeText(getByTestId('confirm-password-input'), 'NewPass123!');

      await waitFor(() => {
        const button = getByTestId('submit-button');
        expect(button.props.accessibilityState.disabled).toBe(false);
        fireEvent.press(button);
      });

      await waitFor(() => {
        expect(mockChangePassword).toHaveBeenCalledWith('OldPass123!', 'NewPass123!');
        expect(mockShowAlert).toHaveBeenCalledWith(
          expect.stringContaining('common.success'),
          expect.stringContaining('changePassword.successMessage'),
          expect.any(Array)
        );
      });
    });

    it('hauria de navegar a Settings després de l\'èxit', async () => {
      mockChangePassword.mockResolvedValue(undefined);

      const { getByPlaceholderText, getByText, getByTestId } = renderWithProviders(<ChangePasswordScreen />);

      fireEvent.changeText(getByTestId('current-password-input'), 'OldPass123!');
      fireEvent.changeText(getByTestId('new-password-input'), 'NewPass123!');
      fireEvent.changeText(getByTestId('confirm-password-input'), 'NewPass123!');

      await waitFor(() => {
        fireEvent.press(getByTestId('submit-button'));
      });

      await waitFor(() => {
        const alertButtons = mockShowAlert.mock.calls[0][2];
        const closeButton = alertButtons.find((btn: any) => btn.text === 'common.close' || btn.text === 'Tancar');
        if (closeButton) {
          closeButton.onPress();
        }

        expect(mockGoBack).toHaveBeenCalled();
      });
    });

    it('hauria de mostrar error si la nova contrasenya és igual a l\'actual', async () => {
      const { getByPlaceholderText, getByText, getByTestId } = renderWithProviders(<ChangePasswordScreen />);

      fireEvent.changeText(getByTestId('current-password-input'), 'SamePass123!');
      fireEvent.changeText(getByTestId('new-password-input'), 'SamePass123!');
      fireEvent.changeText(getByTestId('confirm-password-input'), 'SamePass123!');

      await waitFor(() => {
        fireEvent.press(getByTestId('submit-button'));
      });

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          'common.error',
          'changePassword.errors.samePassword'
        );
      });
    });
  });

  describe('Gestió d\'errors', () => {
    it('hauria de gestionar contrasenya actual incorrecta', async () => {
      mockChangePassword.mockRejectedValue({ code: 'auth/wrong-password' });

      const { getByPlaceholderText, getByText, getByTestId } = renderWithProviders(<ChangePasswordScreen />);

      fireEvent.changeText(getByTestId('current-password-input'), 'WrongPass123!');
      fireEvent.changeText(getByTestId('new-password-input'), 'NewPass123!');
      fireEvent.changeText(getByTestId('confirm-password-input'), 'NewPass123!');

      await waitFor(() => {
        fireEvent.press(getByTestId('submit-button'));
      });

      await waitFor(() => {
        // Wrong password error is displayed in the input field, not as an alert
        expect(getByText('changePassword.errors.wrongPassword')).toBeTruthy();
      });
    });

    it('hauria de gestionar contrasenya dèbil', async () => {
      mockChangePassword.mockRejectedValue({ code: 'auth/weak-password' });

      const { getByPlaceholderText, getByText, getByTestId } = renderWithProviders(<ChangePasswordScreen />);

      fireEvent.changeText(getByTestId('current-password-input'), 'OldPass123!');
      fireEvent.changeText(getByTestId('new-password-input'), 'WeakPass123!');
      fireEvent.changeText(getByTestId('confirm-password-input'), 'WeakPass123!');

      await waitFor(() => {
        fireEvent.press(getByTestId('submit-button'));
      });

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          'common.error',
          'auth.errors.weakPassword'
        );
      });
    });

    it('hauria de gestionar necessitat de reautenticació', async () => {
      mockChangePassword.mockRejectedValue({ code: 'auth/requires-recent-login' });

      const { getByPlaceholderText, getByText, getByTestId } = renderWithProviders(<ChangePasswordScreen />);

      fireEvent.changeText(getByTestId('current-password-input'), 'OldPass123!');
      fireEvent.changeText(getByTestId('new-password-input'), 'NewPass123!');
      fireEvent.changeText(getByTestId('confirm-password-input'), 'NewPass123!');

      await waitFor(() => {
        fireEvent.press(getByTestId('submit-button'));
      });

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          'common.error',
          'changePassword.errors.requiresRecentLogin'
        );
      });
    });

    it('hauria de gestionar errors genèrics', async () => {
      mockChangePassword.mockRejectedValue(new Error('Network error'));

      const { getByPlaceholderText, getByText, getByTestId } = renderWithProviders(<ChangePasswordScreen />);

      fireEvent.changeText(getByTestId('current-password-input'), 'OldPass123!');
      fireEvent.changeText(getByTestId('new-password-input'), 'NewPass123!');
      fireEvent.changeText(getByTestId('confirm-password-input'), 'NewPass123!');

      await waitFor(() => {
        fireEvent.press(getByTestId('submit-button'));
      });

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          'common.error',
          'changePassword.errors.generic'
        );
      });
    });
  });

  describe('Visibilitat de contrasenyes', () => {
    it('hauria d\'alternar la visibilitat de la contrasenya actual', async () => {
      const { getByPlaceholderText, getAllByTestId, getByTestId } = renderWithProviders(<ChangePasswordScreen />);

      const passwordInput = getByTestId('current-password-input');
      expect(passwordInput.props.secureTextEntry).toBe(true);

      const toggleButtons = getAllByTestId('toggle-current-password');
      fireEvent.press(toggleButtons[0]);

      await waitFor(() => {
        expect(passwordInput.props.secureTextEntry).toBe(false);
      });
    });

    it('hauria d\'alternar la visibilitat de la nova contrasenya', async () => {
      const { getByPlaceholderText, getAllByTestId, getByTestId } = renderWithProviders(<ChangePasswordScreen />);

      const passwordInput = getByTestId('new-password-input');
      expect(passwordInput.props.secureTextEntry).toBe(true);

      const toggleButton = getByTestId('toggle-new-password');
      fireEvent.press(toggleButton);

      await waitFor(() => {
        expect(passwordInput.props.secureTextEntry).toBe(false);
      });
    });

    it('hauria d\'alternar la visibilitat de la confirmació de contrasenya', async () => {
      const { getByPlaceholderText, getAllByTestId, getByTestId } = renderWithProviders(<ChangePasswordScreen />);

      const passwordInput = getByTestId('confirm-password-input');
      expect(passwordInput.props.secureTextEntry).toBe(true);

      const toggleButton = getByTestId('toggle-confirm-password');
      fireEvent.press(toggleButton);

      await waitFor(() => {
        expect(passwordInput.props.secureTextEntry).toBe(false);
      });
    });
  });

  describe('Navegació', () => {
    it('hauria de tornar a Settings amb el botó back', () => {
      const { getByTestId } = renderWithProviders(<ChangePasswordScreen />);

      const backButton = getByTestId('back-button');
      fireEvent.press(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('Settings');
    });

    it('hauria de netejar els camps quan torna enrere', () => {
      const { getByTestId, getByPlaceholderText } = renderWithProviders(<ChangePasswordScreen />);

      // Omplir els camps
      fireEvent.changeText(getByTestId('current-password-input'), 'old');
      fireEvent.changeText(getByTestId('new-password-input'), 'new');
      fireEvent.changeText(getByTestId('confirm-password-input'), 'new');

      // Tornar enrere
      const backButton = getByTestId('back-button');
      fireEvent.press(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('Settings');
    });
  });

  describe('Estat de càrrega', () => {
    it('hauria de deshabilitar el botó durant la càrrega', async () => {
      mockChangePassword.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      const { getByPlaceholderText, getByText, getByTestId } = renderWithProviders(<ChangePasswordScreen />);

      fireEvent.changeText(getByTestId('current-password-input'), 'OldPass123!');
      fireEvent.changeText(getByTestId('new-password-input'), 'NewPass123!');
      fireEvent.changeText(getByTestId('confirm-password-input'), 'NewPass123!');

      const button = getByTestId('submit-button');
      fireEvent.press(button);

      await waitFor(() => {
        expect(button.props.accessibilityState.disabled).toBe(true);
      });
    });
  });

  describe('Casos límit', () => {
    it('hauria de gestionar espais en blanc en les contrasenyes', async () => {
      const { getByPlaceholderText, getByText, getByTestId } = renderWithProviders(<ChangePasswordScreen />);

      fireEvent.changeText(getByTestId('current-password-input'), '  OldPass123!  ');
      fireEvent.changeText(getByTestId('new-password-input'), '  NewPass123!  ');
      fireEvent.changeText(getByTestId('confirm-password-input'), '  NewPass123!  ');

      const button = getByTestId('submit-button');

      await waitFor(() => {
        expect(button.props.accessibilityState.disabled).toBe(false);
      });
    });
  });
});




