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

const initI18n = async () => {
  // Essaie de récupérer la langue stockée
  const storedLang = await getStoredLanguage();

  // Utilise la langue stockée, sinon utilise la langue du système, sinon utilise l'anglais
  const deviceLang = Localization.locale.split('-')[0];
  const defaultLang = storedLang || deviceLang || 'en';

  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: defaultLang,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false
      },
      react: {
        useSuspense: false // Recommandé pour React Native
      }
    });

  // Écouteur de changement de langue
  i18n.on('languageChanged', (lng) => {
    setLanguage(lng);
  });

  return i18n;
};

export default i18n;
