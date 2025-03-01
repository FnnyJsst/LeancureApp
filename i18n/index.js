import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import * as SecureStore from 'expo-secure-store';
import en from './translations/en';
import fr from './translations/fr';

const LANG_STORAGE_KEY = 'user_language';

// Langues disponibles
const resources = {
  en: { translation: en },
  fr: { translation: fr }
};

const setLanguage = async (language) => {
  try {
    await SecureStore.setItemAsync(LANG_STORAGE_KEY, language);
  } catch (error) {
    console.error('Error saving language:', error);
  }
};

const getStoredLanguage = async () => {
  try {
    return await SecureStore.getItemAsync(LANG_STORAGE_KEY);
  } catch (error) {
    console.error('Error reading language:', error);
    return null;
  }
};

export const initI18n = async () => {
  try {
    console.log('Initializing i18n...');

    // Initialisation synchrone de i18next
    i18n
      .use(initReactI18next)
      .init({
        resources,
        lng: Localization.locale.split('-')[0] || 'en',
        fallbackLng: 'en',
        interpolation: {
          escapeValue: false
        },
        react: {
          useSuspense: false
        }
      });

    console.log('i18n initialized successfully');
    return i18n;
  } catch (error) {
    console.error('Error initializing i18n:', error);
    // En cas d'erreur, on initialise quand même avec les paramètres de base
    i18n
      .use(initReactI18next)
      .init({
        resources: { en: { translation: en } },
        lng: 'en',
        fallbackLng: 'en'
      });
    return i18n;
  }
};

export default i18n;
