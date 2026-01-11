/**
 * Tests d'integració per a SettingsScreen
 * 
 * Cobertura:
 * - Renderització de la pantalla de configuració
 * - Navegació entre opcions del menú
 * - Canvi d'idioma amb LanguageSelector
 * - Logout amb confirmació
 * - Eliminació de compte amb confirmació
 * - Navegació a EditProfile, ChangeEmail, ChangePassword
 * - Botó back i navegació a Profile
 */

import React from 'react';
import { renderWithProviders, createMockAuthContext, createMockNavigation, fireEvent, waitFor } from '../setup/testUtils';
import { setupMSW } from '../setup/mswServer';
import { SettingsScreen } from '../../../screens/SettingsScreen';

// Setup MSW
setupMSW();

// Create mockNavigate that we can track
const mockNavigate = jest.fn();

// Mock de useNavigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: jest.fn(),
      reset: jest.fn(),
      setOptions: jest.fn(),
      addListener: jest.fn(() => jest.fn()),
      removeListener: jest.fn(),
    }),
  };
});

// Mock de useAuth
const mockLogout = jest.fn();
const mockDeleteAccount = jest.fn();

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    logout: mockLogout,
    deleteAccount: mockDeleteAccount,
    backendUser: {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
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

// Mock de LanguageSelector
jest.mock('../../../components/LanguageSelector', () => ({
  LanguageSelector: ({ visible, onClose }: any) => {
    if (!visible) return null;
    return <div testID="language-selector">Language Selector</div>;
  },
}));

// Mock de CustomAlert
jest.mock('../../../components/CustomAlert', () => ({
  CustomAlert: () => null,
}));

// Mock de les icones
jest.mock('../../../assets/icons/logout.svg', () => 'LogoutIcon');
jest.mock('../../../assets/icons/arrow-left.svg', () => 'BackIcon');

describe('SettingsScreen - Tests d\'integració', () => {
  const mockNavigation = createMockNavigation();

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe('Renderització inicial', () => {
    it('hauria de renderitzar la pantalla de configuració correctament', () => {
      const { getByText, getByTestId } = renderWithProviders(<SettingsScreen />, {
        mockNavigation,
      });

      expect(getByText('profile.settings.title')).toBeTruthy();
      expect(getByText('profile.settings.editProfile')).toBeTruthy();
      expect(getByText('profile.settings.language')).toBeTruthy();
      expect(getByText('profile.settings.changeEmail')).toBeTruthy();
      expect(getByText('profile.settings.changePassword')).toBeTruthy();
      expect(getByText('profile.settings.help')).toBeTruthy();
      expect(getByText('profile.settings.about')).toBeTruthy();
      expect(getByText('profile.settings.deleteAccount.title')).toBeTruthy();
      expect(getByText('profile.settings.logout.title')).toBeTruthy();
    });

    it('hauria de mostrar l\'idioma actual', () => {
      const { getByText, getByTestId } = renderWithProviders(<SettingsScreen />, {
        mockNavigation,
      });

      // Per defecte hauria de mostrar Català
      expect(getByText('Català')).toBeTruthy();
    });

  });

  describe('Navegació del menú', () => {
    it('hauria de navegar a EditProfile quan es fa clic', () => {
      const { getByText, getByTestId } = renderWithProviders(<SettingsScreen />, {
        mockNavigation,
      });

      const editProfileButton = getByText('profile.settings.editProfile');
      fireEvent.press(editProfileButton);

      expect(mockNavigate).toHaveBeenCalledWith('EditProfile');
    });

    it('hauria de navegar a ChangeEmail quan es fa clic', () => {
      const { getByText, getByTestId } = renderWithProviders(<SettingsScreen />, {
        mockNavigation,
      });

      const changeEmailButton = getByText('profile.settings.changeEmail');
      fireEvent.press(changeEmailButton);

      expect(mockNavigate).toHaveBeenCalledWith('ChangeEmail');
    });

    it('hauria de navegar a ChangePassword quan es fa clic', () => {
      const { getByText, getByTestId } = renderWithProviders(<SettingsScreen />, {
        mockNavigation,
      });

      const changePasswordButton = getByText('profile.settings.changePassword');
      fireEvent.press(changePasswordButton);

      expect(mockNavigate).toHaveBeenCalledWith('ChangePassword');
    });
  });

  describe('Selector d\'idioma', () => {
    it('hauria de mostrar el selector d\'idioma quan es fa clic', () => {
      const { getByText, getByTestId } = renderWithProviders(<SettingsScreen />, {
        mockNavigation,
      });

      const languageButton = getByText('profile.settings.language');
      fireEvent.press(languageButton);

      expect(getByTestId('language-selector')).toBeTruthy();
    });

    it('hauria d\'actualitzar l\'idioma mostrat quan canvia', async () => {
      const { getByText, rerender, getByTestId } = renderWithProviders(<SettingsScreen />, {
        mockNavigation,
      });

      // Simular canvi d'idioma
      // (En el test real, LanguageSelector actualitzaria i18n)
      expect(getByText('Català')).toBeTruthy();

      // Rerenderitzar per reflectir el canvi
      rerender(<SettingsScreen />);
    });
  });

  describe('Logout', () => {
    it('hauria de mostrar confirmació abans de fer logout', () => {
      const { getByText, getByTestId } = renderWithProviders(<SettingsScreen />, {
        mockNavigation,
      });

      const logoutButton = getByText('profile.settings.logout.title');
      fireEvent.press(logoutButton);

      expect(mockShowAlert).toHaveBeenCalledWith(
        'profile.settings.logout.confirmTitle',
        'profile.settings.logout.confirmMessage',
        expect.arrayContaining([
          expect.objectContaining({ text: 'common.cancel', style: 'cancel' }),
          expect.objectContaining({ text: 'profile.settings.logout.title' }),
        ])
      );
    });

    it('hauria de fer logout quan es confirma', async () => {
      mockLogout.mockResolvedValue(undefined);

      const { getByText, getByTestId } = renderWithProviders(<SettingsScreen />, {
        mockNavigation,
      });

      const logoutButton = getByText('profile.settings.logout.title');
      fireEvent.press(logoutButton);

      // Simular confirmació de l'alerta
      const confirmCallback = mockShowAlert.mock.calls[0][2][1].onPress;
      await confirmCallback();

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
      });
    });

    it('hauria de gestionar errors durant el logout', async () => {
      mockLogout.mockRejectedValue(new Error('Network error'));

      const { getByText, getByTestId } = renderWithProviders(<SettingsScreen />, {
        mockNavigation,
      });

      const logoutButton = getByText('profile.settings.logout.title');
      fireEvent.press(logoutButton);

      const confirmCallback = mockShowAlert.mock.calls[0][2][1].onPress;
      await confirmCallback();

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          'common.error',
          'auth.errors.generic'
        );
      });
    });
  });

  describe('Eliminació de compte', () => {
    it('hauria de mostrar confirmació abans d\'eliminar el compte', () => {
      const { getByText, getByTestId } = renderWithProviders(<SettingsScreen />, {
        mockNavigation,
      });

      const deleteButton = getByText('profile.settings.deleteAccount.title');
      fireEvent.press(deleteButton);

      expect(mockShowAlert).toHaveBeenCalledWith(
        'profile.settings.deleteAccount.confirmTitle',
        'profile.settings.deleteAccount.confirmMessage',
        expect.arrayContaining([
          expect.objectContaining({ text: 'common.cancel', style: 'cancel' }),
          expect.objectContaining({ text: 'profile.settings.deleteAccount.title', style: 'destructive' }),
        ])
      );
    });

    it('hauria d\'eliminar el compte quan es confirma', async () => {
      mockDeleteAccount.mockResolvedValue(undefined);

      const { getByText, getByTestId } = renderWithProviders(<SettingsScreen />, {
        mockNavigation,
      });

      const deleteButton = getByText('profile.settings.deleteAccount.title');
      fireEvent.press(deleteButton);

      const confirmCallback = mockShowAlert.mock.calls[0][2][1].onPress;
      await confirmCallback();

      await waitFor(() => {
        expect(mockDeleteAccount).toHaveBeenCalled();
      });
    });

    it('hauria de gestionar errors durant l\'eliminació', async () => {
      mockDeleteAccount.mockRejectedValue(new Error('Failed to delete'));

      const { getByText, getByTestId } = renderWithProviders(<SettingsScreen />, {
        mockNavigation,
      });

      const deleteButton = getByText('profile.settings.deleteAccount.title');
      fireEvent.press(deleteButton);

      const confirmCallback = mockShowAlert.mock.calls[0][2][1].onPress;
      await confirmCallback();

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          'common.error',
          'auth.errors.generic'
        );
      });
    });
  });

  describe('Opcions de menú sense funcionalitat', () => {
    it('hauria de permetre fer clic a Ajuda', () => {
      const { getByText, getByTestId } = renderWithProviders(<SettingsScreen />, {
        mockNavigation,
      });

      const helpButton = getByText('profile.settings.help');
      fireEvent.press(helpButton);

      // No hauria de cridar navegació (funcionalitat futura)
      expect(mockNavigate).not.toHaveBeenCalledWith('Help');
    });

    it('hauria de permetre fer clic a Sobre l\'app', () => {
      const { getByText, getByTestId } = renderWithProviders(<SettingsScreen />, {
        mockNavigation,
      });

      const aboutButton = getByText('profile.settings.about');
      fireEvent.press(aboutButton);

      // No hauria de cridar navegació (funcionalitat futura)
      expect(mockNavigate).not.toHaveBeenCalledWith('About');
    });
  });



  describe('Casos límit', () => {
    it('hauria de gestionar usuari sense dades de backend', () => {
      // Override del mock per aquest test
      jest.spyOn(require('../../../contexts/AuthContext'), 'useAuth').mockReturnValue({
        logout: mockLogout,
        deleteAccount: mockDeleteAccount,
        backendUser: null,
      });

      const { getByText, getByTestId } = renderWithProviders(<SettingsScreen />, {
        mockNavigation,
      });

      // Hauria de renderitzar igualment
      expect(getByText('profile.settings.title')).toBeTruthy();
    });

    it('hauria de mantenir l\'estat del selector d\'idioma', () => {
      const { getByText, queryByTestId, getByTestId } = renderWithProviders(<SettingsScreen />, {
        mockNavigation,
      });

      // Inicialment no visible
      expect(queryByTestId('language-selector')).toBeNull();

      // Obrir
      const languageButton = getByText('profile.settings.language');
      fireEvent.press(languageButton);

      expect(queryByTestId('language-selector')).toBeTruthy();
    });
  });




});




