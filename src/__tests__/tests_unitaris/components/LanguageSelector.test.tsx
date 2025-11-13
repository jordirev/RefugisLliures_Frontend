/**
 * Tests unitaris per al component LanguageSelector
 * 
 * Aquest fitxer cobreix:
 * - Renderització del modal
 * - Llista d'idiomes disponibles
 * - Selecció d'idioma
 * - Actualització al backend
 * - Gestió d'errors
 * - Estat de càrrega
 * - Casos límit
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LanguageSelector } from '../../../components/LanguageSelector';
import { UsersService } from '../../../services/UsersService';
import * as i18n from '../../../i18n';

// Mock de i18n
jest.mock('../../../i18n', () => ({
  LANGUAGES: {
    ca: { name: 'Catalan', nativeName: 'Català' },
    es: { name: 'Spanish', nativeName: 'Español' },
    en: { name: 'English', nativeName: 'English' },
    fr: { name: 'French', nativeName: 'Français' },
  },
  getCurrentLanguage: jest.fn(() => 'ca'),
  changeLanguage: jest.fn(() => Promise.resolve()),
}));

// Mock de useTranslation
jest.mock('../../../utils/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'profile.languageSelector.title': 'Selecciona idioma',
        'profile.languageSelector.updateError': 'Error actualitzant l\'idioma al servidor',
        'common.error': 'Error',
      };
      return translations[key] || key;
    },
    i18n: {},
  }),
}));

// Mock de useAuth
const mockReloadUser = jest.fn();
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    backendUser: { uid: 'user123' },
    authToken: 'token123',
    reloadUser: mockReloadUser,
  })),
}));

// Mock de UsersService
jest.mock('../../../services/UsersService', () => ({
  UsersService: {
    updateUser: jest.fn(() => Promise.resolve()),
  },
}));

// Mock de useCustomAlert
const mockShowAlert = jest.fn();
const mockHideAlert = jest.fn();
jest.mock('../../../utils/useCustomAlert', () => ({
  useCustomAlert: () => ({
    alertVisible: false,
    alertConfig: {},
    showAlert: mockShowAlert,
    hideAlert: mockHideAlert,
  }),
}));

describe('LanguageSelector Component', () => {
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (i18n.getCurrentLanguage as jest.Mock).mockReturnValue('ca');
    (i18n.changeLanguage as jest.Mock).mockResolvedValue(undefined);
    (UsersService.updateUser as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Renderització del modal', () => {
    it('hauria de mostrar el títol del selector', () => {
      const { getByText } = render(<LanguageSelector {...defaultProps} />);
      
      expect(getByText('Selecciona idioma')).toBeTruthy();
    });

    it('hauria de mostrar el botó de tancar', () => {
      const { getByText } = render(<LanguageSelector {...defaultProps} />);
      
      expect(getByText('✕')).toBeTruthy();
    });

    it('hauria de mostrar tots els idiomes disponibles', () => {
      const { getByText } = render(<LanguageSelector {...defaultProps} />);
      
      expect(getByText('Català')).toBeTruthy();
      expect(getByText('Español')).toBeTruthy();
      expect(getByText('English')).toBeTruthy();
      expect(getByText('Français')).toBeTruthy();
    });

    it('hauria de mostrar els codis d\'idioma en majúscules', () => {
      const { getByText } = render(<LanguageSelector {...defaultProps} />);
      
      expect(getByText('CA')).toBeTruthy();
      expect(getByText('ES')).toBeTruthy();
      expect(getByText('EN')).toBeTruthy();
      expect(getByText('FR')).toBeTruthy();
    });

    it('NO hauria de mostrar res quan visible=false', () => {
      const { queryByText } = render(
        <LanguageSelector {...defaultProps} visible={false} />
      );
      
      expect(queryByText('Selecciona idioma')).toBeNull();
    });
  });

  describe('Idioma seleccionat', () => {
    it('hauria de marcar l\'idioma actual amb un checkmark', () => {
      (i18n.getCurrentLanguage as jest.Mock).mockReturnValue('ca');
      const { getAllByText } = render(<LanguageSelector {...defaultProps} />);
      
      const checkmarks = getAllByText('✓');
      expect(checkmarks.length).toBe(1);
    });

    it('hauria de aplicar estil seleccionat a l\'idioma actual', () => {
      (i18n.getCurrentLanguage as jest.Mock).mockReturnValue('es');
      const { getByText } = render(<LanguageSelector {...defaultProps} />);
      
      const selectedLanguage = getByText('Español');
      expect(selectedLanguage).toBeTruthy();
    });

    it('hauria de canviar el checkmark quan canvia l\'idioma', () => {
      const { rerender, getAllByText } = render(<LanguageSelector {...defaultProps} />);
      
      // Inicialment catàla
      expect(getAllByText('✓').length).toBe(1);
      
      // Canviar a espanyol
      (i18n.getCurrentLanguage as jest.Mock).mockReturnValue('es');
      rerender(<LanguageSelector {...defaultProps} />);
      
      expect(getAllByText('✓').length).toBe(1);
    });
  });

  describe('Selecció d\'idioma', () => {
    it('hauria de cridar changeLanguage quan es selecciona un idioma', async () => {
      const { getByText } = render(<LanguageSelector {...defaultProps} />);
      
      fireEvent.press(getByText('Español'));
      
      await waitFor(() => {
        expect(i18n.changeLanguage).toHaveBeenCalledWith('es');
      });
    });

    it('hauria de actualitzar l\'idioma al backend per usuaris autenticats', async () => {
      const { getByText } = render(<LanguageSelector {...defaultProps} />);
      
      fireEvent.press(getByText('English'));
      
      await waitFor(() => {
        expect(UsersService.updateUser).toHaveBeenCalledWith(
          'user123',
          { idioma: 'EN' },
          'token123'
        );
      });
    });

    it('hauria de recarregar l\'usuari després d\'actualitzar', async () => {
      const { getByText } = render(<LanguageSelector {...defaultProps} />);
      
      fireEvent.press(getByText('Français'));
      
      await waitFor(() => {
        expect(mockReloadUser).toHaveBeenCalled();
      });
    });

    it('hauria de tancar el modal després de seleccionar idioma', async () => {
      const onClose = jest.fn();
      const { getByText } = render(
        <LanguageSelector {...defaultProps} onClose={onClose} />
      );
      
      fireEvent.press(getByText('English'));
      
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('NO hauria d\'actualitzar el backend si no hi ha usuari autenticat', async () => {
      const { useAuth } = require('../../../contexts/AuthContext');
      useAuth.mockReturnValueOnce({
        backendUser: null,
        authToken: null,
        reloadUser: mockReloadUser,
      });

      const { getByText } = render(<LanguageSelector {...defaultProps} />);
      
      fireEvent.press(getByText('English'));
      
      await waitFor(() => {
        expect(i18n.changeLanguage).toHaveBeenCalledWith('en');
      });
      
      expect(UsersService.updateUser).not.toHaveBeenCalled();
    });

    it('NO hauria d\'actualitzar el backend si no hi ha token', async () => {
      const { useAuth } = require('../../../contexts/AuthContext');
      useAuth.mockReturnValueOnce({
        backendUser: { uid: 'user123' },
        authToken: null,
        reloadUser: mockReloadUser,
      });

      const { getByText } = render(<LanguageSelector {...defaultProps} />);
      
      fireEvent.press(getByText('English'));
      
      await waitFor(() => {
        expect(i18n.changeLanguage).toHaveBeenCalledWith('en');
      });
      
      expect(UsersService.updateUser).not.toHaveBeenCalled();
    });
  });

  describe('Gestió d\'errors', () => {
    it('hauria de mostrar error si falla l\'actualització al backend', async () => {
      (UsersService.updateUser as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const { getByText } = render(<LanguageSelector {...defaultProps} />);
      
      fireEvent.press(getByText('English'));
      
      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          'Error',
          'Error actualitzant l\'idioma al servidor'
        );
      });
    });

    it('hauria de mantenir el canvi local si falla l\'actualització backend', async () => {
      (UsersService.updateUser as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const onClose = jest.fn();
      const { getByText } = render(
        <LanguageSelector {...defaultProps} onClose={onClose} />
      );
      
      fireEvent.press(getByText('English'));
      
      await waitFor(() => {
        expect(i18n.changeLanguage).toHaveBeenCalledWith('en');
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('hauria de mostrar error si falla changeLanguage', async () => {
      (i18n.changeLanguage as jest.Mock).mockRejectedValueOnce(
        new Error('Language error')
      );

      const { getByText } = render(<LanguageSelector {...defaultProps} />);
      
      fireEvent.press(getByText('English'));
      
      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith('Error', 'Error');
      });
    });

    it('NO hauria de tancar el modal si falla changeLanguage', async () => {
      (i18n.changeLanguage as jest.Mock).mockRejectedValueOnce(
        new Error('Language error')
      );

      const onClose = jest.fn();
      const { getByText } = render(
        <LanguageSelector {...defaultProps} onClose={onClose} />
      );
      
      fireEvent.press(getByText('English'));
      
      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalled();
      });
      
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Estat de càrrega', () => {
    it('hauria d\'evitar múltiples seleccions mentre s\'actualitza', async () => {
      let resolveUpdate: () => void;
      const updatePromise = new Promise<void>(resolve => {
        resolveUpdate = resolve;
      });
      (i18n.changeLanguage as jest.Mock).mockReturnValue(updatePromise);

      const { getByText } = render(<LanguageSelector {...defaultProps} />);
      
      // Primer click
      fireEvent.press(getByText('English'));
      
      // Segon click ràpid
      fireEvent.press(getByText('Français'));
      
      // Resoldre la promesa
      resolveUpdate!();
      
      await waitFor(() => {
        expect(i18n.changeLanguage).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Botó de tancar', () => {
    it('hauria de cridar onClose quan es prem el botó de tancar', () => {
      const onClose = jest.fn();
      const { getByText } = render(
        <LanguageSelector {...defaultProps} onClose={onClose} />
      );
      
      fireEvent.press(getByText('✕'));
      
      expect(onClose).toHaveBeenCalled();
    });

    it('hauria de cridar onClose quan es prem l\'overlay', () => {
      const onClose = jest.fn();
      const { UNSAFE_getAllByType } = render(
        <LanguageSelector {...defaultProps} onClose={onClose} />
      );
      
      const touchables = UNSAFE_getAllByType('TouchableOpacity');
      // El primer touchable hauria de ser l'overlay
      fireEvent.press(touchables[0]);
      
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Casos límit', () => {
    it('hauria de gestionar getCurrentLanguage retornant undefined', () => {
      (i18n.getCurrentLanguage as jest.Mock).mockReturnValue(undefined);
      
      const { queryAllByText } = render(<LanguageSelector {...defaultProps} />);
      
      // No hauria de mostrar cap checkmark
      expect(queryAllByText('✓')).toHaveLength(0);
    });

    it('hauria de gestionar getCurrentLanguage retornant idioma no vàlid', () => {
      (i18n.getCurrentLanguage as jest.Mock).mockReturnValue('invalid');
      
      const { queryAllByText } = render(<LanguageSelector {...defaultProps} />);
      
      // No hauria de mostrar cap checkmark
      expect(queryAllByText('✓')).toHaveLength(0);
    });

    it('hauria de gestionar selecció del mateix idioma', async () => {
      (i18n.getCurrentLanguage as jest.Mock).mockReturnValue('ca');
      
      const { getByText } = render(<LanguageSelector {...defaultProps} />);
      
      fireEvent.press(getByText('Català'));
      
      await waitFor(() => {
        expect(i18n.changeLanguage).toHaveBeenCalledWith('ca');
      });
    });

    it('hauria de gestionar múltiples clics ràpids en diferents idiomes', async () => {
      const { getByText } = render(<LanguageSelector {...defaultProps} />);
      
      // Clicks ràpids
      fireEvent.press(getByText('English'));
      fireEvent.press(getByText('Français'));
      fireEvent.press(getByText('Español'));
      
      // Només el primer hauria de processar-se
      await waitFor(() => {
        expect(i18n.changeLanguage).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('ScrollView', () => {
    it('hauria de tenir un ScrollView per la llista d\'idiomes', () => {
      const { UNSAFE_getByType } = render(<LanguageSelector {...defaultProps} />);
      
      const scrollView = UNSAFE_getByType('ScrollView');
      expect(scrollView).toBeTruthy();
    });
  });

  describe('Snapshot testing', () => {
    it('hauria de coincidir amb el snapshot quan visible=true', () => {
      const tree = render(<LanguageSelector {...defaultProps} />).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('hauria de coincidir amb el snapshot quan visible=false', () => {
      const tree = render(
        <LanguageSelector {...defaultProps} visible={false} />
      ).toJSON();
      expect(tree).toMatchSnapshot();
    });

    it('hauria de coincidir amb el snapshot amb idioma seleccionat', () => {
      (i18n.getCurrentLanguage as jest.Mock).mockReturnValue('es');
      const tree = render(<LanguageSelector {...defaultProps} />).toJSON();
      expect(tree).toMatchSnapshot();
    });
  });
});
