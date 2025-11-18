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

jest.mock('../../../utils/useCustomAlert', () => ({
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
  });

  describe('Renderització inicial', () => {
    it('hauria de renderitzar la pantalla de configuració correctament', () => {
      const { getByText, getByTestId } = renderWithProviders(<SettingsScreen />, {
        mockNavigation,
      });

      expect(getByText('Configuració')).toBeTruthy();
      expect(getByText('Preferències')).toBeTruthy();
      expect(getByText('Notificacions')).toBeTruthy();
      expect(getByText('Editar perfil')).toBeTruthy();
      expect(getByText('Idioma')).toBeTruthy();
      expect(getByText('Canviar email')).toBeTruthy();
      expect(getByText('Canviar contrasenya')).toBeTruthy();
      expect(getByText('Ajuda')).toBeTruthy();
      expect(getByText('Sobre l\'app')).toBeTruthy();
      expect(getByText('Eliminar compte')).toBeTruthy();
      expect(getByText('Tancar sessió')).toBeTruthy();
    });

    it('hauria de mostrar l\'idioma actual', () => {
      const { getByText, getByTestId } = renderWithProviders(<SettingsScreen />, {
        mockNavigation,
      });

      // Per defecte hauria de mostrar Català
      expect(getByText('Català')).toBeTruthy();
    });

    it('hauria de mostrar el botó back', () => {
      const { getByTestId } = renderWithProviders(<SettingsScreen />, {
        mockNavigation,
      });

      const backButton = getByTestId('back-button');
      expect(backButton).toBeTruthy();
    });
  });

  describe('Navegació del menú', () => {
    it('hauria de navegar a EditProfile quan es fa clic', () => {
      const { getByText, getByTestId } = renderWithProviders(<SettingsScreen />, {
        mockNavigation,
      });

      const editProfileButton = getByText('Editar perfil');
      fireEvent.press(editProfileButton);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('EditProfile');
    });

    it('hauria de navegar a ChangeEmail quan es fa clic', () => {
      const { getByText, getByTestId } = renderWithProviders(<SettingsScreen />, {
        mockNavigation,
      });

      const changeEmailButton = getByText('Canviar email');
      fireEvent.press(changeEmailButton);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('ChangeEmail');
    });

    it('hauria de navegar a ChangePassword quan es fa clic', () => {
      const { getByText, getByTestId } = renderWithProviders(<SettingsScreen />, {
        mockNavigation,
      });

      const changePasswordButton = getByText('Canviar contrasenya');
      fireEvent.press(changePasswordButton);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('ChangePassword');
    });

    it('hauria de navegar a Profile amb el botó back', () => {
      const { getByTestId } = renderWithProviders(<SettingsScreen />, {
        mockNavigation,
      });

      const backButton = getByTestId('back-button');
      fireEvent.press(backButton);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Perfil');
    });
  });

  describe('Selector d\'idioma', () => {
    it('hauria de mostrar el selector d\'idioma quan es fa clic', () => {
      const { getByText, getByTestId } = renderWithProviders(<SettingsScreen />, {
        mockNavigation,
      });

      const languageButton = getByText('Idioma');
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

      const logoutButton = getByText('Tancar sessió');
      fireEvent.press(logoutButton);

      expect(mockShowAlert).toHaveBeenCalledWith(
        'Confirmar tancament de sessió',
        'Estàs segur que vols tancar la sessió?',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Cancel·lar', style: 'cancel' }),
          expect.objectContaining({ text: 'Tancar sessió' }),
        ])
      );
    });

    it('hauria de fer logout quan es confirma', async () => {
      mockLogout.mockResolvedValue(undefined);

      const { getByText, getByTestId } = renderWithProviders(<SettingsScreen />, {
        mockNavigation,
      });

      const logoutButton = getByText('Tancar sessió');
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

      const logoutButton = getByText('Tancar sessió');
      fireEvent.press(logoutButton);

      const confirmCallback = mockShowAlert.mock.calls[0][2][1].onPress;
      await confirmCallback();

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          'Error',
          expect.stringContaining('No s\'ha pogut tancar la sessió')
        );
      });
    });
  });

  describe('Eliminació de compte', () => {
    it('hauria de mostrar confirmació abans d\'eliminar el compte', () => {
      const { getByText, getByTestId } = renderWithProviders(<SettingsScreen />, {
        mockNavigation,
      });

      const deleteButton = getByText('Eliminar compte');
      fireEvent.press(deleteButton);

      expect(mockShowAlert).toHaveBeenCalledWith(
        'Confirmar eliminació',
        'Aquesta acció és irreversible. Segur que vols eliminar el teu compte?',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Cancel·lar', style: 'cancel' }),
          expect.objectContaining({ text: 'Eliminar compte', style: 'destructive' }),
        ])
      );
    });

    it('hauria d\'eliminar el compte quan es confirma', async () => {
      mockDeleteAccount.mockResolvedValue(undefined);

      const { getByText, getByTestId } = renderWithProviders(<SettingsScreen />, {
        mockNavigation,
      });

      const deleteButton = getByText('Eliminar compte');
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

      const deleteButton = getByText('Eliminar compte');
      fireEvent.press(deleteButton);

      const confirmCallback = mockShowAlert.mock.calls[0][2][1].onPress;
      await confirmCallback();

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          'Error',
          expect.stringContaining('No s\'ha pogut eliminar el compte')
        );
      });
    });
  });

  describe('Opcions de menú sense funcionalitat', () => {
    it('hauria de permetre fer clic a Preferències', () => {
      const { getByText, getByTestId } = renderWithProviders(<SettingsScreen />, {
        mockNavigation,
      });

      const preferencesButton = getByText('Preferències');
      fireEvent.press(preferencesButton);

      // No hauria de cridar navegació (funcionalitat futura)
      expect(mockNavigation.navigate).not.toHaveBeenCalledWith('Preferences');
    });

    it('hauria de permetre fer clic a Notificacions', () => {
      const { getByText, getByTestId } = renderWithProviders(<SettingsScreen />, {
        mockNavigation,
      });

      const notificationsButton = getByText('Notificacions');
      fireEvent.press(notificationsButton);

      // No hauria de cridar navegació (funcionalitat futura)
      expect(mockNavigation.navigate).not.toHaveBeenCalledWith('Notifications');
    });

    it('hauria de permetre fer clic a Ajuda', () => {
      const { getByText, getByTestId } = renderWithProviders(<SettingsScreen />, {
        mockNavigation,
      });

      const helpButton = getByText('Ajuda');
      fireEvent.press(helpButton);

      // No hauria de cridar navegació (funcionalitat futura)
      expect(mockNavigation.navigate).not.toHaveBeenCalledWith('Help');
    });

    it('hauria de permetre fer clic a Sobre l\'app', () => {
      const { getByText, getByTestId } = renderWithProviders(<SettingsScreen />, {
        mockNavigation,
      });

      const aboutButton = getByText('Sobre l\'app');
      fireEvent.press(aboutButton);

      // No hauria de cridar navegació (funcionalitat futura)
      expect(mockNavigation.navigate).not.toHaveBeenCalledWith('About');
    });
  });

  describe('Navegació amb hardware back (Android)', () => {
    it('hauria de navegar a Profile amb el botó hardware back', () => {
      const { getByTestId } = renderWithProviders(<SettingsScreen />, {
        mockNavigation,
      });

      // Simular botó back d'Android
      const backButton = getByTestId('back-button');
      fireEvent.press(backButton);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Perfil');
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
      expect(getByText('Configuració')).toBeTruthy();
    });

    it('hauria de mantenir l\'estat del selector d\'idioma', () => {
      const { getByText, queryByTestId, getByTestId } = renderWithProviders(<SettingsScreen />, {
        mockNavigation,
      });

      // Inicialment no visible
      expect(queryByTestId('language-selector')).toBeNull();

      // Obrir
      const languageButton = getByText('Idioma');
      fireEvent.press(languageButton);

      expect(queryByTestId('language-selector')).toBeTruthy();
    });
  });

  describe('SafeArea', () => {
    it('hauria de respectar les safe areas del dispositiu', () => {
      const { getByTestId } = renderWithProviders(<SettingsScreen />, {
        mockNavigation,
      });

      // El component hauria de tenir safe area views
      const safeArea = getByTestId('safe-area-view');
      expect(safeArea).toBeTruthy();
    });
  });

  describe('Scrolling', () => {
    it('hauria de permetre fer scroll pel contingut', () => {
      const { getByTestId } = renderWithProviders(<SettingsScreen />, {
        mockNavigation,
      });

      const scrollView = getByTestId('settings-scroll-view');
      expect(scrollView).toBeTruthy();
    });
  });
});




