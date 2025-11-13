/**
 * Tests unitaris per al hook useTranslation
 * 
 * Aquest fitxer cobreix:
 * - Wrapper del hook react-i18next
 * - Retorn de la funció de traducció
 * - Integració amb i18next
 */

import { renderHook } from '@testing-library/react-hooks';
import { useTranslation } from '../../../utils/useTranslation';
import { useTranslation as useTranslationOriginal } from 'react-i18next';

// Mock de react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(),
}));

describe('useTranslation Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Funcionalitat bàsica', () => {
    it('hauria de cridar el hook original de react-i18next', () => {
      const mockReturnValue = {
        t: jest.fn(),
        i18n: {
          language: 'ca',
          changeLanguage: jest.fn(),
        },
        ready: true,
      };

      (useTranslationOriginal as jest.Mock).mockReturnValue(mockReturnValue);

      const { result } = renderHook(() => useTranslation());

      expect(useTranslationOriginal).toHaveBeenCalled();
      expect(result.current).toBe(mockReturnValue);
    });

    it('hauria de retornar la funció t', () => {
      const mockT = jest.fn();
      (useTranslationOriginal as jest.Mock).mockReturnValue({
        t: mockT,
        i18n: {},
        ready: true,
      });

      const { result } = renderHook(() => useTranslation());

      expect(result.current.t).toBe(mockT);
      expect(typeof result.current.t).toBe('function');
    });

    it('hauria de retornar l\'objecte i18n', () => {
      const mockI18n = {
        language: 'ca',
        changeLanguage: jest.fn(),
      };

      (useTranslationOriginal as jest.Mock).mockReturnValue({
        t: jest.fn(),
        i18n: mockI18n,
        ready: true,
      });

      const { result } = renderHook(() => useTranslation());

      expect(result.current.i18n).toBe(mockI18n);
    });

    it('hauria de retornar la propietat ready', () => {
      (useTranslationOriginal as jest.Mock).mockReturnValue({
        t: jest.fn(),
        i18n: {},
        ready: true,
      });

      const { result } = renderHook(() => useTranslation());

      expect(result.current.ready).toBe(true);
    });
  });

  describe('Funció de traducció t', () => {
    it('hauria de permetre traduir claus simples', () => {
      const mockT = jest.fn((key: string) => `translated_${key}`);
      (useTranslationOriginal as jest.Mock).mockReturnValue({
        t: mockT,
        i18n: {},
        ready: true,
      });

      const { result } = renderHook(() => useTranslation());

      const translation = result.current.t('common.search');

      expect(mockT).toHaveBeenCalledWith('common.search');
      expect(translation).toBe('translated_common.search');
    });

    it('hauria de permetre traduir amb interpolació', () => {
      const mockT = jest.fn((key: string, options?: any) => {
        if (key === 'favorites.count' && options?.count) {
          return `${options.count} favorits`;
        }
        return key;
      });

      (useTranslationOriginal as jest.Mock).mockReturnValue({
        t: mockT,
        i18n: {},
        ready: true,
      });

      const { result } = renderHook(() => useTranslation());

      const translation = result.current.t('favorites.count', { count: 5 });

      expect(mockT).toHaveBeenCalledWith('favorites.count', { count: 5 });
      expect(translation).toBe('5 favorits');
    });

    it('hauria de gestionar traduccions amb múltiples paràmetres', () => {
      const mockT = jest.fn((key: string, options?: any) => {
        if (key === 'greeting' && options) {
          return `Hola ${options.name}, tens ${options.count} missatges`;
        }
        return key;
      });

      (useTranslationOriginal as jest.Mock).mockReturnValue({
        t: mockT,
        i18n: {},
        ready: true,
      });

      const { result } = renderHook(() => useTranslation());

      const translation = result.current.t('greeting', { name: 'Joan', count: 3 });

      expect(mockT).toHaveBeenCalledWith('greeting', { name: 'Joan', count: 3 });
      expect(translation).toBe('Hola Joan, tens 3 missatges');
    });

    it('hauria de gestionar claus inexistents', () => {
      const mockT = jest.fn((key: string) => key);
      (useTranslationOriginal as jest.Mock).mockReturnValue({
        t: mockT,
        i18n: {},
        ready: true,
      });

      const { result } = renderHook(() => useTranslation());

      const translation = result.current.t('nonexistent.key');

      expect(mockT).toHaveBeenCalledWith('nonexistent.key');
      expect(translation).toBe('nonexistent.key');
    });
  });

  describe('Objecte i18n', () => {
    it('hauria de proporcionar l\'idioma actual', () => {
      (useTranslationOriginal as jest.Mock).mockReturnValue({
        t: jest.fn(),
        i18n: {
          language: 'ca',
          changeLanguage: jest.fn(),
        },
        ready: true,
      });

      const { result } = renderHook(() => useTranslation());

      expect(result.current.i18n.language).toBe('ca');
    });

    it('hauria de proporcionar diferents idiomes', () => {
      const languages = ['ca', 'es', 'en', 'fr'];

      languages.forEach(lang => {
        (useTranslationOriginal as jest.Mock).mockReturnValue({
          t: jest.fn(),
          i18n: {
            language: lang,
            changeLanguage: jest.fn(),
          },
          ready: true,
        });

        const { result } = renderHook(() => useTranslation());
        expect(result.current.i18n.language).toBe(lang);
      });
    });

    it('hauria de proporcionar la funció changeLanguage', () => {
      const mockChangeLanguage = jest.fn();
      (useTranslationOriginal as jest.Mock).mockReturnValue({
        t: jest.fn(),
        i18n: {
          language: 'ca',
          changeLanguage: mockChangeLanguage,
        },
        ready: true,
      });

      const { result } = renderHook(() => useTranslation());

      expect(result.current.i18n.changeLanguage).toBe(mockChangeLanguage);
      expect(typeof result.current.i18n.changeLanguage).toBe('function');
    });
  });

  describe('Estat ready', () => {
    it('hauria de reflectir quan les traduccions estan llestes', () => {
      (useTranslationOriginal as jest.Mock).mockReturnValue({
        t: jest.fn(),
        i18n: {},
        ready: true,
      });

      const { result } = renderHook(() => useTranslation());

      expect(result.current.ready).toBe(true);
    });

    it('hauria de reflectir quan les traduccions no estan llestes', () => {
      (useTranslationOriginal as jest.Mock).mockReturnValue({
        t: jest.fn(),
        i18n: {},
        ready: false,
      });

      const { result } = renderHook(() => useTranslation());

      expect(result.current.ready).toBe(false);
    });
  });

  describe('Múltiples crides', () => {
    it('hauria de cridar el hook original cada vegada', () => {
      const mockReturnValue = {
        t: jest.fn(),
        i18n: { language: 'ca' },
        ready: true,
      };

      (useTranslationOriginal as jest.Mock).mockReturnValue(mockReturnValue);

      renderHook(() => useTranslation());
      renderHook(() => useTranslation());
      renderHook(() => useTranslation());

      expect(useTranslationOriginal).toHaveBeenCalledTimes(3);
    });

    it('hauria de retornar valors consistents', () => {
      const mockReturnValue = {
        t: jest.fn((key: string) => `translated_${key}`),
        i18n: { language: 'ca' },
        ready: true,
      };

      (useTranslationOriginal as jest.Mock).mockReturnValue(mockReturnValue);

      const { result: result1 } = renderHook(() => useTranslation());
      const { result: result2 } = renderHook(() => useTranslation());

      expect(result1.current.t('test')).toBe(result2.current.t('test'));
    });
  });

  describe('Re-renders', () => {
    it('hauria de mantenir la mateixa funció t entre re-renders', () => {
      const mockT = jest.fn();
      (useTranslationOriginal as jest.Mock).mockReturnValue({
        t: mockT,
        i18n: {},
        ready: true,
      });

      const { result, rerender } = renderHook(() => useTranslation());

      const initialT = result.current.t;

      rerender();

      expect(result.current.t).toBe(initialT);
    });

    it('hauria de mantenir el mateix objecte i18n entre re-renders', () => {
      const mockI18n = { language: 'ca' };
      (useTranslationOriginal as jest.Mock).mockReturnValue({
        t: jest.fn(),
        i18n: mockI18n,
        ready: true,
      });

      const { result, rerender } = renderHook(() => useTranslation());

      const initialI18n = result.current.i18n;

      rerender();

      expect(result.current.i18n).toBe(initialI18n);
    });
  });

  describe('Casos especials', () => {
    it('hauria de gestionar claus amb caràcters especials', () => {
      const mockT = jest.fn((key: string) => `translated_${key}`);
      (useTranslationOriginal as jest.Mock).mockReturnValue({
        t: mockT,
        i18n: {},
        ready: true,
      });

      const { result } = renderHook(() => useTranslation());

      result.current.t('common.special-key_with.dots');

      expect(mockT).toHaveBeenCalledWith('common.special-key_with.dots');
    });

    it('hauria de gestionar claus buides', () => {
      const mockT = jest.fn((key: string) => key || 'empty');
      (useTranslationOriginal as jest.Mock).mockReturnValue({
        t: mockT,
        i18n: {},
        ready: true,
      });

      const { result } = renderHook(() => useTranslation());

      const translation = result.current.t('');

      expect(mockT).toHaveBeenCalledWith('');
    });

    it('hauria de gestionar opcions de traducció buides', () => {
      const mockT = jest.fn((key: string, options?: any) => key);
      (useTranslationOriginal as jest.Mock).mockReturnValue({
        t: mockT,
        i18n: {},
        ready: true,
      });

      const { result } = renderHook(() => useTranslation());

      result.current.t('test.key', {});

      expect(mockT).toHaveBeenCalledWith('test.key', {});
    });

    it('hauria de gestionar valors null i undefined en opcions', () => {
      const mockT = jest.fn((key: string, options?: any) => key);
      (useTranslationOriginal as jest.Mock).mockReturnValue({
        t: mockT,
        i18n: {},
        ready: true,
      });

      const { result } = renderHook(() => useTranslation());

      result.current.t('test.key', { value: null, other: undefined });

      expect(mockT).toHaveBeenCalledWith('test.key', { value: null, other: undefined });
    });
  });

  describe('Integració amb propietats addicionals', () => {
    it('hauria de proporcionar propietats addicionals de react-i18next', () => {
      const additionalProps = {
        t: jest.fn(),
        i18n: { language: 'ca' },
        ready: true,
        // Propietats addicionals que react-i18next pot proporcionar
        defaultNS: 'common',
        reportNS: {},
      };

      (useTranslationOriginal as jest.Mock).mockReturnValue(additionalProps);

      const { result } = renderHook(() => useTranslation());

      expect(result.current).toEqual(additionalProps);
    });
  });

  describe('Exportació per defecte', () => {
    it('hauria d\'estar disponible com a exportació per defecte', () => {
      // useTranslation també està exportat com a default
      // ja que el codi fa: export default useTranslation;
      expect(useTranslation).toBeDefined();
      expect(typeof useTranslation).toBe('function');
    });
  });
});
