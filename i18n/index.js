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

// Initialisation synchrone immédiate
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

const setLanguage = async (language) => {
  try {
    await SecureStore.setItemAsync(LANG_STORAGE_KEY, language);
    await i18n.changeLanguage(language);
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

// Cette fonction ne fait plus l'initialisation mais charge juste la langue stockée
export const initI18n = async () => {
  try {
    console.log('Loading stored language...');
    const storedLang = await getStoredLanguage();
    if (storedLang) {
      await i18n.changeLanguage(storedLang);
    }
    console.log('Language loaded successfully');
  } catch (error) {
    console.error('Error loading language:', error);
  }
  return i18n;
};

export default i18n;
