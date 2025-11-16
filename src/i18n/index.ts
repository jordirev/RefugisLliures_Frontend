import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';

// Import translations
import ca from './locales/ca.json';
import es from './locales/es.json';
import en from './locales/en.json';
import fr from './locales/fr.json';

// Supported languages
export const LANGUAGES = {
  ca: { name: 'Català', nativeName: 'Català' },
  es: { name: 'Español', nativeName: 'Español' },
  en: { name: 'English', nativeName: 'English' },
  fr: { name: 'Français', nativeName: 'Français' },
} as const;

export type LanguageCode = keyof typeof LANGUAGES;

const LANGUAGE_STORAGE_KEY = '@refugis_app_language';

// Get device language
const getDeviceLanguage = (): LanguageCode => {
  let deviceLanguage = 'ca'; // Default to Catalan
  
  try {
    if (Platform.OS === 'ios') {
      deviceLanguage =
        NativeModules.SettingsManager?.settings?.AppleLocale ||
        NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ||
        'ca';
    } else if (Platform.OS === 'android') {
      deviceLanguage = NativeModules.I18nManager?.localeIdentifier || 'ca';
    }
    
    // Extract language code (e.g., 'ca_ES' -> 'ca')
    const languageCode = deviceLanguage.split(/[-_]/)[0].toLowerCase();
    
    // Return if supported, otherwise default to Catalan
    return (Object.keys(LANGUAGES).includes(languageCode) 
      ? languageCode 
      : 'ca') as LanguageCode;
  } catch (error) {
    console.warn('Error getting device language:', error);
    return 'ca';
  }
};

// Initialize i18next
const initI18n = async () => {
  let savedLanguage: string | null = null;
  
  try {
    savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch (error) {
    console.warn('Error loading saved language:', error);
  }

  const initialLanguage = savedLanguage || getDeviceLanguage();

  await i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v4', // Important for React Native
      resources: {
        ca: { translation: ca },
        es: { translation: es },
        en: { translation: en },
        fr: { translation: fr },
      },
      lng: initialLanguage,
      fallbackLng: 'ca',
      interpolation: {
        escapeValue: false, // React already escapes
      },
      react: {
        useSuspense: false, // Important for React Native
      },
    });

  return i18n;
};

// Function to change language
export const changeLanguage = async (language: LanguageCode) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    await i18n.changeLanguage(language);
  } catch (error) {
    console.error('Error changing language:', error);
    // Even if storage fails, change the language in memory
    await i18n.changeLanguage(language);
  }
};

// Function to get current language
export const getCurrentLanguage = (): LanguageCode => {
  return i18n.language as LanguageCode;
};

// Initialize on import
initI18n();

export default i18n;
