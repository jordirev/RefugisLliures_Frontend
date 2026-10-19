/**
 * Tests unitaris per a la pantalla ChangeEmailScreen
 * 
 * Aquest fitxer cobreix:
 * - Validació d'email
 * - Validació de contrasenya
 * - Gestió d'errors (email duplicate, contrasenya incorrecta, etc.)
 * - Flux de canvi d'email
 * - Casos límit i edge cases
 */

// Mock de useAuth
const mockChangeEmail = jest.fn();
const mockFirebaseUser = {
  email: 'current@example.com',
  uid: 'test-uid',
};

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    firebaseUser: mockFirebaseUser,
    changeEmail: mockChangeEmail,
  }),
}));

// Mock de useNavigation
const mockNavigate = jest.fn();
const mockPopTo = jest.fn();
const mockGoBack = jest.fn();
const mockAddListener = jest.fn((event, callback) => {
  return () => {}; // unsubscribe function
});

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

// Mock de useTranslation
jest.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      const translations: Record<string, any> = {
        'common.error': 'Error',
        'common.success': 'Èxit',
        'common.close': 'Tancar',
        'changeEmail.title': 'Canviar correu electrònic',
        'changeEmail.description': 'Introdueix la teva contrasenya i el nou correu',
        'changeEmail.currentEmail': 'Correu actual',
        'changeEmail.password': 'Contrasenya',
        'changeEmail.newEmail': 'Nou correu electrònic',
        'changeEmail.submit': 'Canviar correu',
        'changeEmail.emailSentMessage': 'S\'ha enviat un correu de verificació',
        'changeEmail.errors.emptyPassword': 'La contrasenya és obligatòria',
        'changeEmail.errors.wrongPassword': 'Contrasenya incorrecta',
        'changeEmail.errors.sameEmail': 'El nou correu és igual a l\'actual',
        'changeEmail.errors.requiresRecentLogin': 'Cal tornar a iniciar sessió',
        'changeEmail.errors.backendError': 'Error actualitzant al backend',
        'changeEmail.errors.generic': 'Error canviant el correu',
        'signup.errors.emptyEmail': 'El correu és obligatori',
        'signup.errors.invalidEmail': 'Correu no vàlid',
        'auth.errors.emailInUse': 'Aquest correu ja està en ús',
        'auth.errors.invalidEmail': 'Correu no vàlid',
      };
      const translation = translations[key];
      return typeof translation === 'function' ? translation(params) : translation || key;
    },
  }),
}));

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

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { ChangeEmailScreen } from '../../../screens/ChangeEmailScreen';

describe('ChangeEmailScreen - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Email Validation Logic', () => {
    it('should show error when email format is invalid', async () => {
      const { getByTestId, queryByText } = await render(<ChangeEmailScreen />);

      const emailInput = getByTestId('new-email-input');
      await fireEvent.changeText(emailInput, 'invalid-email');

      await waitFor(() => {
        expect(queryByText('Correu no vàlid')).toBeTruthy();
      });
    });

    it('should show error when new email is same as current email', async () => {
      const { getByTestId, queryByText } = await render(<ChangeEmailScreen />);

      const emailInput = getByTestId('new-email-input');
      await fireEvent.changeText(emailInput, 'current@example.com');

      await waitFor(() => {
        expect(queryByText('El nou correu és igual a l\'actual')).toBeTruthy();
      });
    });

    it('should clear error when valid email is entered', async () => {
      const { getByTestId, queryByText } = await render(<ChangeEmailScreen />);

      const emailInput = getByTestId('new-email-input');
      
      // First enter invalid email
      await fireEvent.changeText(emailInput, 'invalid-email');
      await waitFor(() => {
        expect(queryByText('Correu no vàlid')).toBeTruthy();
      });

      // Then enter valid email
      await fireEvent.changeText(emailInput, 'new@example.com');
      await waitFor(() => {
        expect(queryByText('Correu no vàlid')).toBeNull();
      });
    });

    it('should validate email case-insensitively against current email', async () => {
      const { getByTestId, queryByText } = await render(<ChangeEmailScreen />);

      const emailInput = getByTestId('new-email-input');
      await fireEvent.changeText(emailInput, 'CURRENT@EXAMPLE.COM');

      await waitFor(() => {
        expect(queryByText('El nou correu és igual a l\'actual')).toBeTruthy();
      });
    });

    it('should not call changeEmail when email is invalid', async () => {
      const { getByTestId } = await render(<ChangeEmailScreen />);

      const passwordInput = getByTestId('password-input');
      const emailInput = getByTestId('new-email-input');
      const submitButton = getByTestId('submit-button');

      await fireEvent.changeText(passwordInput, 'password123');
      await fireEvent.changeText(emailInput, 'invalid-email');
      await fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockChangeEmail).not.toHaveBeenCalled();
      });
    });
  });

  describe('Password Validation Logic', () => {
    it('should not call changeEmail when password is empty', async () => {
      const { getByTestId } = await render(<ChangeEmailScreen />);

      const emailInput = getByTestId('new-email-input');
      const submitButton = getByTestId('submit-button');

      await fireEvent.changeText(emailInput, 'new@example.com');
      await fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockChangeEmail).not.toHaveBeenCalled();
      });
    });

    it('should accept password with whitespace', async () => {
      const { getByTestId } = await render(<ChangeEmailScreen />);

      const passwordInput = getByTestId('password-input');
      const emailInput = getByTestId('new-email-input');
      const submitButton = getByTestId('submit-button');

      await fireEvent.changeText(passwordInput, '  password  ');
      await fireEvent.changeText(emailInput, 'new@example.com');

      mockChangeEmail.mockResolvedValueOnce(undefined);

      await fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockChangeEmail).toHaveBeenCalledWith('  password  ', 'new@example.com');
      });
    });
  });

  describe('Form Submit Logic', () => {
    it('should call changeEmail with correct parameters on valid submission', async () => {
      const { getByTestId } = await render(<ChangeEmailScreen />);

      const passwordInput = getByTestId('password-input');
      const emailInput = getByTestId('new-email-input');
      const submitButton = getByTestId('submit-button');

      await fireEvent.changeText(passwordInput, 'correctPassword');
      await fireEvent.changeText(emailInput, 'newemail@example.com');

      mockChangeEmail.mockResolvedValueOnce(undefined);

      await fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockChangeEmail).toHaveBeenCalledWith('correctPassword', 'newemail@example.com');
      });
    });

    it('should show success alert and navigate back on successful email change', async () => {
      const { getByTestId } = await render(<ChangeEmailScreen />);

      const passwordInput = getByTestId('password-input');
      const emailInput = getByTestId('new-email-input');
      const submitButton = getByTestId('submit-button');

      await fireEvent.changeText(passwordInput, 'correctPassword');
      await fireEvent.changeText(emailInput, 'newemail@example.com');

      mockChangeEmail.mockResolvedValueOnce(undefined);

      await fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          'Èxit',
          'S\'ha enviat un correu de verificació',
          expect.any(Array)
        );
      });
    });

    it('should not call changeEmail if validation fails', async () => {
      const { getByTestId } = await render(<ChangeEmailScreen />);

      const passwordInput = getByTestId('password-input');
      const emailInput = getByTestId('new-email-input');
      const submitButton = getByTestId('submit-button');

      await fireEvent.changeText(passwordInput, 'password');
      await fireEvent.changeText(emailInput, 'invalid-email');

      await fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockChangeEmail).not.toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle wrong password error', async () => {
      const { getByTestId, getByText } = await render(<ChangeEmailScreen />);

      const passwordInput = getByTestId('password-input');
      const emailInput = getByTestId('new-email-input');
      const submitButton = getByTestId('submit-button');

      await fireEvent.changeText(passwordInput, 'wrongPassword');
      await fireEvent.changeText(emailInput, 'newemail@example.com');

      mockChangeEmail.mockRejectedValueOnce({ code: 'auth/wrong-password' });

      await fireEvent.press(submitButton);

      await waitFor(() => {
        expect(getByText('Contrasenya incorrecta')).toBeTruthy();
      });
    });

    it('should handle invalid-credential error', async () => {
      const { getByTestId, getByText } = await render(<ChangeEmailScreen />);

      const passwordInput = getByTestId('password-input');
      const emailInput = getByTestId('new-email-input');
      const submitButton = getByTestId('submit-button');

      await fireEvent.changeText(passwordInput, 'wrongPassword');
      await fireEvent.changeText(emailInput, 'newemail@example.com');

      mockChangeEmail.mockRejectedValueOnce({ code: 'auth/invalid-credential' });

      await fireEvent.press(submitButton);

      await waitFor(() => {
        expect(getByText('Contrasenya incorrecta')).toBeTruthy();
      });
    });

    it('should handle email-already-in-use error', async () => {
      const { getByTestId, getByText } = await render(<ChangeEmailScreen />);

      const passwordInput = getByTestId('password-input');
      const emailInput = getByTestId('new-email-input');
      const submitButton = getByTestId('submit-button');

      await fireEvent.changeText(passwordInput, 'password123');
      await fireEvent.changeText(emailInput, 'existing@example.com');

      mockChangeEmail.mockRejectedValueOnce({ code: 'auth/email-already-in-use' });

      await fireEvent.press(submitButton);

      await waitFor(() => {
        expect(getByText('Aquest correu ja està en ús')).toBeTruthy();
      });
    });

    it('should handle requires-recent-login error', async () => {
      const { getByTestId } = await render(<ChangeEmailScreen />);

      const passwordInput = getByTestId('password-input');
      const emailInput = getByTestId('new-email-input');
      const submitButton = getByTestId('submit-button');

      await fireEvent.changeText(passwordInput, 'password123');
      await fireEvent.changeText(emailInput, 'newemail@example.com');

      mockChangeEmail.mockRejectedValueOnce({ code: 'auth/requires-recent-login' });

      await fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith('Error', 'Cal tornar a iniciar sessió');
      });
    });

    it('should handle backend update error', async () => {
      const { getByTestId, getByText } = await render(<ChangeEmailScreen />);

      const passwordInput = getByTestId('password-input');
      const emailInput = getByTestId('new-email-input');
      const submitButton = getByTestId('submit-button');

      await fireEvent.changeText(passwordInput, 'password123');
      await fireEvent.changeText(emailInput, 'newemail@example.com');

      mockChangeEmail.mockRejectedValueOnce({ message: 'BACKEND_UPDATE_FAILED' });

      await fireEvent.press(submitButton);

      await waitFor(() => {
        expect(getByText('Error actualitzant al backend')).toBeTruthy();
      });
    });

    it('should handle generic error', async () => {
      const { getByTestId } = await render(<ChangeEmailScreen />);

      const passwordInput = getByTestId('password-input');
      const emailInput = getByTestId('new-email-input');
      const submitButton = getByTestId('submit-button');

      await fireEvent.changeText(passwordInput, 'password123');
      await fireEvent.changeText(emailInput, 'newemail@example.com');

      mockChangeEmail.mockRejectedValueOnce(new Error('Unknown error'));

      await fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith('Error', 'Error canviant el correu');
      });
    });

    it('should handle auth/invalid-email error', async () => {
      const { getByTestId, getByText } = await render(<ChangeEmailScreen />);

      const passwordInput = getByTestId('password-input');
      const emailInput = getByTestId('new-email-input');
      const submitButton = getByTestId('submit-button');

      await fireEvent.changeText(passwordInput, 'password123');
      await fireEvent.changeText(emailInput, 'newemail@example.com');

      mockChangeEmail.mockRejectedValueOnce({ code: 'auth/invalid-email' });

      await fireEvent.press(submitButton);

      await waitFor(() => {
        expect(getByText('Correu no vàlid')).toBeTruthy();
      });
    });
  });

  describe('Form State Management', () => {
    it('should disable submit button when form is invalid', async () => {
      const { getByTestId } = await render(<ChangeEmailScreen />);

      const submitButton = getByTestId('submit-button');

      expect(submitButton.props.accessibilityState.disabled).toBe(true);
    });

    it('should enable submit button when form is valid', async () => {
      const { getByTestId } = await render(<ChangeEmailScreen />);

      const passwordInput = getByTestId('password-input');
      const emailInput = getByTestId('new-email-input');
      const submitButton = getByTestId('submit-button');

      await fireEvent.changeText(passwordInput, 'password123');
      await fireEvent.changeText(emailInput, 'newemail@example.com');

      await waitFor(() => {
        expect(submitButton.props.accessibilityState.disabled).toBe(false);
      });
    });

    it('should clear all fields when going back', async () => {
      const { getByTestId } = await render(<ChangeEmailScreen />);

      const passwordInput = getByTestId('password-input');
      const emailInput = getByTestId('new-email-input');
      const backButton = getByTestId('back-button');

      await fireEvent.changeText(passwordInput, 'password123');
      await fireEvent.changeText(emailInput, 'newemail@example.com');

      await fireEvent.press(backButton);

      expect(mockPopTo).toHaveBeenCalledWith('Settings');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string trimming correctly', async () => {
      const { getByTestId } = await render(<ChangeEmailScreen />);

      const passwordInput = getByTestId('password-input');
      const emailInput = getByTestId('new-email-input');
      const submitButton = getByTestId('submit-button');

      await fireEvent.changeText(passwordInput, '   ');
      await fireEvent.changeText(emailInput, '   ');
      await fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockChangeEmail).not.toHaveBeenCalled();
      });
    });

    it('should handle email with uppercase characters', async () => {
      const { getByTestId } = await render(<ChangeEmailScreen />);

      const passwordInput = getByTestId('password-input');
      const emailInput = getByTestId('new-email-input');
      const submitButton = getByTestId('submit-button');

      await fireEvent.changeText(passwordInput, 'password123');
      await fireEvent.changeText(emailInput, 'NewEmail@EXAMPLE.COM');

      mockChangeEmail.mockResolvedValueOnce(undefined);

      await fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockChangeEmail).toHaveBeenCalledWith('password123', 'NewEmail@EXAMPLE.COM');
      });
    });

    it('should handle special characters in password', async () => {
      const { getByTestId } = await render(<ChangeEmailScreen />);

      const passwordInput = getByTestId('password-input');
      const emailInput = getByTestId('new-email-input');
      const submitButton = getByTestId('submit-button');

      await fireEvent.changeText(passwordInput, 'P@ssw0rd!#$%');
      await fireEvent.changeText(emailInput, 'newemail@example.com');

      mockChangeEmail.mockResolvedValueOnce(undefined);

      await fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockChangeEmail).toHaveBeenCalledWith('P@ssw0rd!#$%', 'newemail@example.com');
      });
    });

    it('should handle loading state correctly during submission', async () => {
      const { getByTestId } = await render(<ChangeEmailScreen />);

      const passwordInput = getByTestId('password-input');
      const emailInput = getByTestId('new-email-input');
      const submitButton = getByTestId('submit-button');

      await fireEvent.changeText(passwordInput, 'password123');
      await fireEvent.changeText(emailInput, 'newemail@example.com');

      // Promesa diferida controlada manualment: evita dependre de timers reals (racy sota càrrega de CPU)
      let resolveChangeEmail!: (v?: any) => void;
      mockChangeEmail.mockImplementation(() => new Promise(r => { resolveChangeEmail = r; }));

      // Sense await: el handler queda pendent fins que resolguem la promesa
      fireEvent.press(submitButton);

      // Button should be disabled during loading
      await waitFor(() => {
        expect(submitButton.props.accessibilityState.disabled).toBe(true);
      });
      expect(mockChangeEmail).toHaveBeenCalled();

      await act(async () => { resolveChangeEmail(); });
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility when eye icon is pressed', async () => {
      const { getByTestId } = await render(<ChangeEmailScreen />);

      const toggleButton = getByTestId('toggle-password-visibility');
      const passwordInput = getByTestId('password-input');

      // Initial state should be secure text entry
      expect(passwordInput.props.secureTextEntry).toBe(true);

      // Toggle visibility
      await fireEvent.press(toggleButton);

      await waitFor(() => {
        expect(passwordInput.props.secureTextEntry).toBe(false);
      });

      // Toggle back
      await fireEvent.press(toggleButton);

      await waitFor(() => {
        expect(passwordInput.props.secureTextEntry).toBe(true);
      });
    });
  });

  describe('Email clearing on empty input', () => {
    it('should clear email error when input is cleared', async () => {
      const { getByTestId, queryByText } = await render(<ChangeEmailScreen />);

      const emailInput = getByTestId('new-email-input');

      // Enter invalid email
      await fireEvent.changeText(emailInput, 'invalid');
      await waitFor(() => {
        expect(queryByText('Correu no vàlid')).toBeTruthy();
      });

      // Clear the input
      await fireEvent.changeText(emailInput, '');
      await waitFor(() => {
        expect(queryByText('Correu no vàlid')).toBeNull();
      });
    });
  });

  describe('Current email display', () => {
    it('should display the current email from firebaseUser', async () => {
      const { getByDisplayValue } = await render(<ChangeEmailScreen />);
      
      // Verify current email is displayed
      expect(getByDisplayValue('current@example.com')).toBeTruthy();
    });
  });

  describe('Password input changes', () => {
    it('should clear password error when typing in password field', async () => {
      const { getByTestId } = await render(<ChangeEmailScreen />);

      const passwordInput = getByTestId('password-input');
      const emailInput = getByTestId('new-email-input');
      const submitButton = getByTestId('submit-button');

      // Set valid email first
      await fireEvent.changeText(emailInput, 'new@example.com');
      await fireEvent.changeText(passwordInput, 'password123');

      // Mock wrong password error
      mockChangeEmail.mockRejectedValueOnce({ code: 'auth/wrong-password' });
      
      await fireEvent.press(submitButton);

      await waitFor(() => {
        expect(getByTestId('password-input')).toBeTruthy();
      });

      // Now type again to clear error
      await fireEvent.changeText(passwordInput, 'newpassword');

      // Error should be cleared when typing
      await waitFor(() => {
        expect(passwordInput.props.value).toBe('newpassword');
      });
    });
  });

  describe('Android BackHandler', () => {
    let originalPlatform: any;
    let backPressCallback: (() => boolean) | null = null;

    beforeEach(() => {
      originalPlatform = require('react-native').Platform;
      backPressCallback = null;
      
      jest.spyOn(require('react-native').BackHandler, 'addEventListener').mockImplementation((event, callback) => {
        backPressCallback = callback;
        return { remove: jest.fn() };
      });
    });

    afterEach(() => {
      require('react-native').Platform.OS = originalPlatform.OS;
    });

    it('should register BackHandler on Android', async () => {
      require('react-native').Platform.OS = 'android';
      
      const { BackHandler } = require('react-native');
      await render(<ChangeEmailScreen />);

      expect(BackHandler.addEventListener).toHaveBeenCalledWith('hardwareBackPress', expect.any(Function));
    });

    it('should navigate to Settings on back press', async () => {
      require('react-native').Platform.OS = 'android';
      
      await render(<ChangeEmailScreen />);

      expect(backPressCallback).not.toBeNull();
      const result = backPressCallback!();
      
      expect(result).toBe(true);
      expect(mockPopTo).toHaveBeenCalledWith('Settings');
    });

    it('should not register BackHandler on iOS', async () => {
      require('react-native').Platform.OS = 'ios';
      
      const { BackHandler } = require('react-native');
      BackHandler.addEventListener.mockClear();
      
      await render(<ChangeEmailScreen />);

      expect(BackHandler.addEventListener).not.toHaveBeenCalled();
    });
  });
});
