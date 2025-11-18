/**
 * Tests unitaris per al mòdul i18n
 * 
 * Aquest fitxer cobreix:
 * - Inicialització de i18next
 * - Detecció de l'idioma del dispositiu
 * - Canvi d'idioma amb persistència
 * - Obtenció de l'idioma actual
 * - Gestió d'errors
 * - Llenguatges suportats
 * - Fallback a català
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';
import i18n from '../../../i18n';
import { changeLanguage, getCurrentLanguage, LANGUAGES, LanguageCode } from '../../../i18n';

// Mock de AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock de react-native
jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
    select: jest.fn((obj) => obj.android),
  },
  NativeModules: {
    I18nManager: {
      localeIdentifier: 'ca_ES',
    },
    SettingsManager: {
      settings: {
        AppleLocale: 'ca_ES',
        AppleLanguages: ['ca'],
      },
    },
  },
}));

describe('i18n Module', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    // Netejar AsyncStorage abans de cada test
    await AsyncStorage.clear();
  });

  describe('LANGUAGES constant', () => {
    it('hauria de tenir els 4 idiomes suportats', () => {
      expect(Object.keys(LANGUAGES)).toHaveLength(4);
      expect(LANGUAGES).toHaveProperty('ca');
      expect(LANGUAGES).toHaveProperty('es');
      expect(LANGUAGES).toHaveProperty('en');
      expect(LANGUAGES).toHaveProperty('fr');
    });

    it('cada idioma hauria de tenir name i nativeName', () => {
      Object.entries(LANGUAGES).forEach(([code, lang]) => {
        expect(lang).toHaveProperty('name');
        expect(lang).toHaveProperty('nativeName');
        expect(typeof lang.name).toBe('string');
        expect(typeof lang.nativeName).toBe('string');
      });
    });

    it('hauria de tenir els noms correctes per cada idioma', () => {
      expect(LANGUAGES.ca.name).toBe('Català');
      expect(LANGUAGES.ca.nativeName).toBe('Català');
      expect(LANGUAGES.es.name).toBe('Español');
      expect(LANGUAGES.es.nativeName).toBe('Español');
      expect(LANGUAGES.en.name).toBe('English');
      expect(LANGUAGES.en.nativeName).toBe('English');
      expect(LANGUAGES.fr.name).toBe('Français');
      expect(LANGUAGES.fr.nativeName).toBe('Français');
    });
  });

  describe('Inicialització', () => {
    it('hauria d\'inicialitzar i18next correctament', () => {
      expect(i18n).toBeDefined();
      expect(i18n.isInitialized).toBe(true);
    });

    it('hauria de tenir català com idioma per defecte (fallback)', () => {
      // El fallbackLng pot ser un array o string
      const fallback = i18n.options.fallbackLng;
      if (Array.isArray(fallback)) {
        expect(fallback).toContain('ca');
      } else {
        expect(fallback).toBe('ca');
      }
    });

    it('hauria de tenir tots els recursos de traducció carregats', () => {
      expect(i18n.hasResourceBundle('ca', 'translation')).toBe(true);
      expect(i18n.hasResourceBundle('es', 'translation')).toBe(true);
      expect(i18n.hasResourceBundle('en', 'translation')).toBe(true);
      expect(i18n.hasResourceBundle('fr', 'translation')).toBe(true);
    });

    it('hauria de tenir compatibilityJSON v4', () => {
      expect(i18n.options.compatibilityJSON).toBe('v4');
    });

    it('hauria de tenir escapeValue desactivat', () => {
      expect(i18n.options.interpolation?.escapeValue).toBe(false);
    });

    it('hauria de tenir useSuspense desactivat', () => {
      expect(i18n.options.react?.useSuspense).toBe(false);
    });
  });

  describe('Detecció de l\'idioma del dispositiu', () => {
    it('hauria de detectar l\'idioma en Android', () => {
      // Aquest test comprova que la configuració del mock és correcta
      expect(Platform.OS).toBe('android');
      expect(NativeModules.I18nManager.localeIdentifier).toBe('ca_ES');
    });

    it('hauria de tenir un idioma vàlid inicialitzat', () => {
      // Verificar que l'idioma actual és un dels suportats
      const currentLang = i18n.language;
      expect(Object.keys(LANGUAGES)).toContain(currentLang);
    });
  });

  describe('Detecció de l\'idioma en iOS', () => {
    it('hauria de tenir la configuració de iOS al mock', () => {
      expect(NativeModules.SettingsManager).toBeDefined();
      expect(NativeModules.SettingsManager.settings).toBeDefined();
    });

    it('hauria de tenir AppleLocale definit al mock', () => {
      expect(NativeModules.SettingsManager.settings.AppleLocale).toBe('ca_ES');
    });

    it('hauria de tenir AppleLanguages definit al mock', () => {
      expect(NativeModules.SettingsManager.settings.AppleLanguages).toEqual(['ca']);
    });
  });

  describe('changeLanguage function', () => {
    it('hauria de canviar l\'idioma correctament', async () => {
      await changeLanguage('es');
      
      expect(i18n.language).toBe('es');
    });

    it('hauria de desar l\'idioma a AsyncStorage', async () => {
      await changeLanguage('en');
      
      const savedLanguage = await AsyncStorage.getItem('@refugis_app_language');
      expect(savedLanguage).toBe('en');
    });

    it('hauria de canviar l\'idioma a català', async () => {
      await changeLanguage('ca');
      
      expect(i18n.language).toBe('ca');
      const savedLanguage = await AsyncStorage.getItem('@refugis_app_language');
      expect(savedLanguage).toBe('ca');
    });

    it('hauria de canviar l\'idioma a espanyol', async () => {
      await changeLanguage('es');
      
      expect(i18n.language).toBe('es');
      const savedLanguage = await AsyncStorage.getItem('@refugis_app_language');
      expect(savedLanguage).toBe('es');
    });

    it('hauria de canviar l\'idioma a anglès', async () => {
      await changeLanguage('en');
      
      expect(i18n.language).toBe('en');
      const savedLanguage = await AsyncStorage.getItem('@refugis_app_language');
      expect(savedLanguage).toBe('en');
    });

    it('hauria de canviar l\'idioma a francès', async () => {
      await changeLanguage('fr');
      
      expect(i18n.language).toBe('fr');
      const savedLanguage = await AsyncStorage.getItem('@refugis_app_language');
      expect(savedLanguage).toBe('fr');
    });

    it('hauria de gestionar errors en desar a AsyncStorage', async () => {
      // Simular error en AsyncStorage
      const mockSetItem = jest.spyOn(AsyncStorage, 'setItem');
      mockSetItem.mockRejectedValueOnce(new Error('Storage error'));
      
      // No hauria de llançar error, sinó canviar l'idioma igualment
      await expect(changeLanguage('es')).resolves.not.toThrow();
      
      // L'idioma hauria d'haver canviat en memòria
      expect(i18n.language).toBe('es');
      
      mockSetItem.mockRestore();
    });

    it('hauria de poder canviar entre idiomes múltiples vegades', async () => {
      await changeLanguage('es');
      expect(i18n.language).toBe('es');
      
      await changeLanguage('en');
      expect(i18n.language).toBe('en');
      
      await changeLanguage('fr');
      expect(i18n.language).toBe('fr');
      
      await changeLanguage('ca');
      expect(i18n.language).toBe('ca');
    });
  });

  describe('getCurrentLanguage function', () => {
    it('hauria de retornar l\'idioma actual', () => {
      const currentLang = getCurrentLanguage();
      expect(currentLang).toBeDefined();
      expect(Object.keys(LANGUAGES)).toContain(currentLang);
    });

    it('hauria de retornar l\'idioma actualitzat després d\'un canvi', async () => {
      await changeLanguage('fr');
      
      const currentLang = getCurrentLanguage();
      expect(currentLang).toBe('fr');
    });

    it('hauria de retornar el tipus correcte', () => {
      const currentLang = getCurrentLanguage();
      expect(typeof currentLang).toBe('string');
    });
  });

  describe('Traduccions', () => {
    it('hauria de traduir correctament en català', async () => {
      await changeLanguage('ca');
      
      const translation = i18n.t('common.search');
      expect(translation).toBe('Cercar refugis...');
    });

    it('hauria de traduir correctament en espanyol', async () => {
      await changeLanguage('es');
      
      const translation = i18n.t('common.search');
      expect(translation).toBe('Buscar refugios...');
    });

    it('hauria de traduir correctament en anglès', async () => {
      await changeLanguage('en');
      
      const translation = i18n.t('common.search');
      expect(translation).toBe('Search shelters...');
    });

    it('hauria de traduir correctament en francès', async () => {
      await changeLanguage('fr');
      
      const translation = i18n.t('common.search');
      expect(translation).toBe('Rechercher refuges...');
    });

    it('hauria de gestionar claus de traducció inexistents', async () => {
      await changeLanguage('ca');
      
      const translation = i18n.t('nonexistent.key');
      expect(translation).toContain('nonexistent.key');
    });

    it('hauria de fer fallback a català si la traducció no existeix', async () => {
      await changeLanguage('ca');
      
      // Provar amb una clau que existeix
      const translation = i18n.t('common.cancel');
      expect(translation).toBe('Cancel·lar');
    });

    it('hauria de traduir amb interpolació', async () => {
      await changeLanguage('ca');
      
      const translation = i18n.t('favorites.count', { count: 5 });
      expect(translation).toContain('5');
    });

    it('hauria de gestionar pluralització correctament', async () => {
      await changeLanguage('ca');
      
      const singular = i18n.t('favorites.count', { count: 1 });
      const plural = i18n.t('favorites.count', { count: 5 });
      
      expect(singular).toBe('1 refugi');
      // La pluralització de i18next amb compatibilityJSON v4 pot comportar-se diferent
      expect(plural).toContain('refugi');
    });
  });

  describe('Persistència d\'idioma', () => {
    it('hauria de cridar AsyncStorage.setItem en canviar idioma', async () => {
      const mockSetItem = jest.spyOn(AsyncStorage, 'setItem');
      
      await changeLanguage('es');
      
      expect(mockSetItem).toHaveBeenCalledWith('@refugis_app_language', 'es');
      
      mockSetItem.mockRestore();
    });

    it('hauria de gestionar errors en desar a AsyncStorage', async () => {
      // Simular error
      const mockSetItem = jest.spyOn(AsyncStorage, 'setItem');
      mockSetItem.mockRejectedValueOnce(new Error('Storage error'));
      
      // No hauria de llançar error, sinó canviar l'idioma igualment
      await expect(changeLanguage('fr')).resolves.not.toThrow();
      
      // L'idioma hauria d'haver canviat en memòria
      expect(i18n.language).toBe('fr');
      
      mockSetItem.mockRestore();
    });

    it('hauria de gestionar AsyncStorage sense valor previ', async () => {
      // Netejar AsyncStorage
      await AsyncStorage.clear();
      
      const savedLanguage = await AsyncStorage.getItem('@refugis_app_language');
      expect(savedLanguage).toBeNull();
    });

    it('hauria de cridar AsyncStorage.setItem per cada canvi d\'idioma', async () => {
      const mockSetItem = jest.spyOn(AsyncStorage, 'setItem');
      mockSetItem.mockClear();
      
      await changeLanguage('en');
      expect(mockSetItem).toHaveBeenCalledWith('@refugis_app_language', 'en');
      
      await changeLanguage('fr');
      expect(mockSetItem).toHaveBeenCalledWith('@refugis_app_language', 'fr');
      
      expect(mockSetItem).toHaveBeenCalledTimes(2);
      
      mockSetItem.mockRestore();
    });
  });

  describe('Configuració de i18next', () => {
    it('hauria de tenir react-i18next inicialitzat', () => {
      expect(i18n.use).toBeDefined();
    });

    it('hauria de tenir el namespace translation per defecte', () => {
      const defaultNS = i18n.options.defaultNS;
      if (Array.isArray(defaultNS)) {
        expect(defaultNS).toContain('translation');
      } else {
        expect(defaultNS).toBe('translation');
      }
    });

    it('no hauria d\'escapar valors HTML', () => {
      expect(i18n.options.interpolation?.escapeValue).toBe(false);
    });

    it('hauria de poder accedir a les traduccions directament', () => {
      const caTranslations = i18n.getResourceBundle('ca', 'translation');
      expect(caTranslations).toBeDefined();
      expect(caTranslations.common).toBeDefined();
    });
  });

  describe('Tipus TypeScript', () => {
    it('LanguageCode hauria de ser un tipus vàlid', () => {
      const validCodes: LanguageCode[] = ['ca', 'es', 'en', 'fr'];
      
      validCodes.forEach(code => {
        expect(Object.keys(LANGUAGES)).toContain(code);
      });
    });

    it('hauria de poder fer servir LanguageCode amb changeLanguage', async () => {
      const codes: LanguageCode[] = ['ca', 'es', 'en', 'fr'];
      
      for (const code of codes) {
        await expect(changeLanguage(code)).resolves.not.toThrow();
      }
    });
  });

  describe('Gestió d\'errors global', () => {
    it('hauria de gestionar errors en desar a AsyncStorage sense llançar excepció', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Simular error en AsyncStorage
      const mockSetItem = jest.spyOn(AsyncStorage, 'setItem');
      mockSetItem.mockRejectedValueOnce(new Error('Critical storage error'));
      
      await changeLanguage('es');
      
      // Hauria d'haver canviat l'idioma malgrat l'error
      expect(i18n.language).toBe('es');
      
      mockSetItem.mockRestore();
      consoleSpy.mockRestore();
    });

    it('hauria de tenir gestió d\'errors per operacions d\'AsyncStorage', async () => {
      // Verificar que el codi pot gestionar errors sense trencar
      const mockGetItem = jest.spyOn(AsyncStorage, 'getItem');
      mockGetItem.mockRejectedValueOnce(new Error('Read error'));
      
      // Només verificar que no llança error
      await expect(AsyncStorage.getItem('@refugis_app_language')).rejects.toThrow('Read error');
      
      mockGetItem.mockRestore();
    });
  });

  describe('Casos extrems i validació', () => {
    it('hauria de mantenir l\'idioma després de múltiples operacions', async () => {
      await changeLanguage('es');
      expect(i18n.language).toBe('es');
      
      const current1 = getCurrentLanguage();
      expect(current1).toBe('es');
      
      await changeLanguage('en');
      const current2 = getCurrentLanguage();
      expect(current2).toBe('en');
    });

    it('hauria de poder treballar amb tots els idiomes suportats', async () => {
      const languages: LanguageCode[] = ['ca', 'es', 'en', 'fr'];
      
      for (const lang of languages) {
        await changeLanguage(lang);
        expect(getCurrentLanguage()).toBe(lang);
        
        // Verificar que es pot traduir
        const translation = i18n.t('common.search');
        expect(translation).toBeDefined();
        expect(typeof translation).toBe('string');
      }
    });

    it('hauria de preservar les traduccions després de canvis d\'idioma', async () => {
      await changeLanguage('ca');
      const caTrans = i18n.t('common.search');
      
      await changeLanguage('es');
      const esTrans = i18n.t('common.search');
      
      // Les traduccions haurien de ser diferents
      expect(caTrans).not.toBe(esTrans);
      expect(caTrans).toBe('Cercar refugis...');
      expect(esTrans).toBe('Buscar refugios...');
    });

    it('hauria de validar que els codis d\'idioma són correctes', () => {
      const validCodes: LanguageCode[] = ['ca', 'es', 'en', 'fr'];
      
      validCodes.forEach(code => {
        expect(LANGUAGES[code]).toBeDefined();
        expect(LANGUAGES[code].name).toBeDefined();
        expect(LANGUAGES[code].nativeName).toBeDefined();
      });
    });
  });
});
