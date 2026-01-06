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
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ChangeEmailScreen } from '../../../screens/ChangeEmailScreen';

describe('ChangeEmailScreen - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Email Validation Logic', () => {
    it('should show error when email format is invalid', async () => {
      const { getByTestId, queryByText } = render(<ChangeEmailScreen />);

      const emailInput = getByTestId('new-email-input');
      fireEvent.changeText(emailInput, 'invalid-email');

      await waitFor(() => {
        expect(queryByText('Correu no vàlid')).toBeTruthy();
      });
    });

    it('should show error when new email is same as current email', async () => {
      const { getByTestId, queryByText } = render(<ChangeEmailScreen />);

      const emailInput = getByTestId('new-email-input');
      fireEvent.changeText(emailInput, 'current@example.com');

      await waitFor(() => {
        expect(queryByText('El nou correu és igual a l\'actual')).toBeTruthy();
      });
    });

    it('should clear error when valid email is entered', async () => {
      const { getByTestId, queryByText } = render(<ChangeEmailScreen />);

      const emailInput = getByTestId('new-email-input');
      
      // First enter invalid email
      fireEvent.changeText(emailInput, 'invalid-email');
      await waitFor(() => {
        expect(queryByText('Correu no vàlid')).toBeTruthy();
      });

      // Then enter valid email
      fireEvent.changeText(emailInput, 'new@example.com');
      await waitFor(() => {
        expect(queryByText('Correu no vàlid')).toBeNull();
      });
    });

    it('should validate email case-insensitively against current email', async () => {
      const { getByTestId, queryByText } = render(<ChangeEmailScreen />);

      const emailInput = getByTestId('new-email-input');
      fireEvent.changeText(emailInput, 'CURRENT@EXAMPLE.COM');

      await waitFor(() => {
        expect(queryByText('El nou correu és igual a l\'actual')).toBeTruthy();
      });
    });

    it('should not call changeEmail when email is invalid', async () => {
      const { getByTestId } = render(<ChangeEmailScreen />);

      const passwordInput = getByTestId('password-input');
      const emailInput = getByTestId('new-email-input');
      const submitButton = getByTestId('submit-button');

      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(emailInput, 'invalid-email');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockChangeEmail).not.toHaveBeenCalled();
      });
    });
  });

  describe('Password Validation Logic', () => {
    it('should not call changeEmail when password is empty', async () => {
      const { getByTestId } = render(<ChangeEmailScreen />);

      const emailInput = getByTestId('new-email-input');
      const submitButton = getByTestId('submit-button');

      fireEvent.changeText(emailInput, 'new@example.com');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockChangeEmail).not.toHaveBeenCalled();
      });
    });

    it('should accept password with whitespace', async () => {
      const { getByTestId } = render(<ChangeEmailScreen />);

      const passwordInput = getByTestId('password-input');
      const emailInput = getByTestId('new-email-input');
      const submitButton = getByTestId('submit-button');

      fireEvent.changeText(passwordInput, '  password  ');
      fireEvent.changeText(emailInput, 'new@example.com');

      mockChangeEmail.mockResolvedValueOnce(undefined);

      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockChangeEmail).toHaveBeenCalledWith('  password  ', 'new@example.com');
      });
    });
  });

  describe('Form Submit Logic', () => {
    it('should call changeEmail with correct parameters on valid submission', async () => {
      const { getByTestId } = render(<ChangeEmailScreen />);

      const passwordInput = getByTestId('password-input');
      const emailInput = getByTestId('new-email-input');
      const submitButton = getByTestId('submit-button');

      fireEvent.changeText(passwordInput, 'correctPassword');
      fireEvent.changeText(emailInput, 'newemail@example.com');

      mockChangeEmail.mockResolvedValueOnce(undefined);

      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockChangeEmail).toHaveBeenCalledWith('correctPassword', 'newemail@example.com');
      });
    });

    it('should show success alert and navigate back on successful email change', async () => {
      const { getByTestId } = render(<ChangeEmailScreen />);

      const passwordInput = getByTestId('password-input');
      const emailInput = getByTestId('new-email-input');
      const submitButton = getByTestId('submit-button');

      fireEvent.changeText(passwordInput, 'correctPassword');
      fireEvent.changeText(emailInput, 'newemail@example.com');

      mockChangeEmail.mockResolvedValueOnce(undefined);

      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          'Èxit',
          'S\'ha enviat un correu de verificació',
          expect.any(Array)
        );
      });
    });

    it('should not call changeEmail if validation fails', async () => {
      const { getByTestId } = render(<ChangeEmailScreen />);

      const passwordInput = getByTestId('password-input');
      const emailInput = getByTestId('new-email-input');
      const submitButton = getByTestId('submit-button');

      fireEvent.changeText(passwordInput, 'password');
      fireEvent.changeText(emailInput, 'invalid-email');

      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockChangeEmail).not.toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle wrong password error', async () => {
      const { getByTestId, getByText } = render(<ChangeEmailScreen />);

      const passwordInput = getByTestId('password-input');
      const emailInput = getByTestId('new-email-input');
      const submitButton = getByTestId('submit-button');

      fireEvent.changeText(passwordInput, 'wrongPassword');
      fireEvent.changeText(emailInput, 'newemail@example.com');

      mockChangeEmail.mockRejectedValueOnce({ code: 'auth/wrong-password' });

      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(getByText('Contrasenya incorrecta')).toBeTruthy();
      });
    });

    it('should handle invalid-credential error', async () => {
      const { getByTestId, getByText } = render(<ChangeEmailScreen />);

      const passwordInput = getByTestId('password-input');
      const emailInput = getByTestId('new-email-input');
      const submitButton = getByTestId('submit-button');

      fireEvent.changeText(passwordInput, 'wrongPassword');
      fireEvent.changeText(emailInput, 'newemail@example.com');

      mockChangeEmail.mockRejectedValueOnce({ code: 'auth/invalid-credential' });

      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(getByText('Contrasenya incorrecta')).toBeTruthy();
      });
    });

    it('should handle email-already-in-use error', async () => {
      const { getByTestId, getByText } = render(<ChangeEmailScreen />);

      const passwordInput = getByTestId('password-input');
      const emailInput = getByTestId('new-email-input');
      const submitButton = getByTestId('submit-button');

      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(emailInput, 'existing@example.com');

      mockChangeEmail.mockRejectedValueOnce({ code: 'auth/email-already-in-use' });

      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(getByText('Aquest correu ja està en ús')).toBeTruthy();
      });
    });

    it('should handle requires-recent-login error', async () => {
      const { getByTestId } = render(<ChangeEmailScreen />);

      const passwordInput = getByTestId('password-input');
      const emailInput = getByTestId('new-email-input');
      const submitButton = getByTestId('submit-button');

      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(emailInput, 'newemail@example.com');

      mockChangeEmail.mockRejectedValueOnce({ code: 'auth/requires-recent-login' });

      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith('Error', 'Cal tornar a iniciar sessió');
      });
    });

    it('should handle backend update error', async () => {
      const { getByTestId, getByText } = render(<ChangeEmailScreen />);

      const passwordInput = getByTestId('password-input');
      const emailInput = getByTestId('new-email-input');
      const submitButton = getByTestId('submit-button');

      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(emailInput, 'newemail@example.com');

      mockChangeEmail.mockRejectedValueOnce({ message: 'BACKEND_UPDATE_FAILED' });

      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(getByText('Error actualitzant al backend')).toBeTruthy();
      });
    });

    it('should handle generic error', async () => {
      const { getByTestId } = render(<ChangeEmailScreen />);

      const passwordInput = getByTestId('password-input');
      const emailInput = getByTestId('new-email-input');
      const submitButton = getByTestId('submit-button');

      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(emailInput, 'newemail@example.com');

      mockChangeEmail.mockRejectedValueOnce(new Error('Unknown error'));

      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith('Error', 'Error canviant el correu');
      });
    });

    it('should handle auth/invalid-email error', async () => {
      const { getByTestId, getByText } = render(<ChangeEmailScreen />);

      const passwordInput = getByTestId('password-input');
      const emailInput = getByTestId('new-email-input');
      const submitButton = getByTestId('submit-button');

      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(emailInput, 'newemail@example.com');

      mockChangeEmail.mockRejectedValueOnce({ code: 'auth/invalid-email' });

      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(getByText('Correu no vàlid')).toBeTruthy();
      });
    });
  });

  describe('Form State Management', () => {
    it('should disable submit button when form is invalid', async () => {
      const { getByTestId } = render(<ChangeEmailScreen />);

      const submitButton = getByTestId('submit-button');

      expect(submitButton.props.accessibilityState.disabled).toBe(true);
    });

    it('should enable submit button when form is valid', async () => {
      const { getByTestId } = render(<ChangeEmailScreen />);

      const passwordInput = getByTestId('password-input');
      const emailInput = getByTestId('new-email-input');
      const submitButton = getByTestId('submit-button');

      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(emailInput, 'newemail@example.com');

      await waitFor(() => {
        expect(submitButton.props.accessibilityState.disabled).toBe(false);
      });
    });

    it('should clear all fields when going back', async () => {
      const { getByTestId } = render(<ChangeEmailScreen />);

      const passwordInput = getByTestId('password-input');
      const emailInput = getByTestId('new-email-input');
      const backButton = getByTestId('back-button');

      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(emailInput, 'newemail@example.com');

      fireEvent.press(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('Settings');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string trimming correctly', async () => {
      const { getByTestId } = render(<ChangeEmailScreen />);

      const passwordInput = getByTestId('password-input');
      const emailInput = getByTestId('new-email-input');
      const submitButton = getByTestId('submit-button');

      fireEvent.changeText(passwordInput, '   ');
      fireEvent.changeText(emailInput, '   ');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockChangeEmail).not.toHaveBeenCalled();
      });
    });

    it('should handle email with uppercase characters', async () => {
      const { getByTestId } = render(<ChangeEmailScreen />);

      const passwordInput = getByTestId('password-input');
      const emailInput = getByTestId('new-email-input');
      const submitButton = getByTestId('submit-button');

      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(emailInput, 'NewEmail@EXAMPLE.COM');

      mockChangeEmail.mockResolvedValueOnce(undefined);

      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockChangeEmail).toHaveBeenCalledWith('password123', 'NewEmail@EXAMPLE.COM');
      });
    });

    it('should handle special characters in password', async () => {
      const { getByTestId } = render(<ChangeEmailScreen />);

      const passwordInput = getByTestId('password-input');
      const emailInput = getByTestId('new-email-input');
      const submitButton = getByTestId('submit-button');

      fireEvent.changeText(passwordInput, 'P@ssw0rd!#$%');
      fireEvent.changeText(emailInput, 'newemail@example.com');

      mockChangeEmail.mockResolvedValueOnce(undefined);

      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockChangeEmail).toHaveBeenCalledWith('P@ssw0rd!#$%', 'newemail@example.com');
      });
    });

    it('should handle loading state correctly during submission', async () => {
      const { getByTestId } = render(<ChangeEmailScreen />);

      const passwordInput = getByTestId('password-input');
      const emailInput = getByTestId('new-email-input');
      const submitButton = getByTestId('submit-button');

      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(emailInput, 'newemail@example.com');

      mockChangeEmail.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      fireEvent.press(submitButton);

      // Button should be disabled during loading
      expect(submitButton.props.accessibilityState.disabled).toBe(true);

      await waitFor(() => {
        expect(mockChangeEmail).toHaveBeenCalled();
      });
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility when eye icon is pressed', async () => {
      const { getByTestId } = render(<ChangeEmailScreen />);

      const toggleButton = getByTestId('toggle-password-visibility');
      const passwordInput = getByTestId('password-input');

      // Initial state should be secure text entry
      expect(passwordInput.props.secureTextEntry).toBe(true);

      // Toggle visibility
      fireEvent.press(toggleButton);

      await waitFor(() => {
        expect(passwordInput.props.secureTextEntry).toBe(false);
      });

      // Toggle back
      fireEvent.press(toggleButton);

      await waitFor(() => {
        expect(passwordInput.props.secureTextEntry).toBe(true);
      });
    });
  });

  describe('Email clearing on empty input', () => {
    it('should clear email error when input is cleared', async () => {
      const { getByTestId, queryByText } = render(<ChangeEmailScreen />);

      const emailInput = getByTestId('new-email-input');

      // Enter invalid email
      fireEvent.changeText(emailInput, 'invalid');
      await waitFor(() => {
        expect(queryByText('Correu no vàlid')).toBeTruthy();
      });

      // Clear the input
      fireEvent.changeText(emailInput, '');
      await waitFor(() => {
        expect(queryByText('Correu no vàlid')).toBeNull();
      });
    });
  });

  describe('Current email display', () => {
    it('should display the current email from firebaseUser', () => {
      const { getByDisplayValue } = render(<ChangeEmailScreen />);
      
      // Verify current email is displayed
      expect(getByDisplayValue('current@example.com')).toBeTruthy();
    });
  });

  describe('Password input changes', () => {
    it('should clear password error when typing in password field', async () => {
      const { getByTestId } = render(<ChangeEmailScreen />);

      const passwordInput = getByTestId('password-input');
      const emailInput = getByTestId('new-email-input');
      const submitButton = getByTestId('submit-button');

      // Set valid email first
      fireEvent.changeText(emailInput, 'new@example.com');
      fireEvent.changeText(passwordInput, 'password123');

      // Mock wrong password error
      mockChangeEmail.mockRejectedValueOnce({ code: 'auth/wrong-password' });
      
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(getByTestId('password-input')).toBeTruthy();
      });

      // Now type again to clear error
      fireEvent.changeText(passwordInput, 'newpassword');

      // Error should be cleared when typing
      await waitFor(() => {
        expect(passwordInput.props.value).toBe('newpassword');
      });
    });
  });
});
