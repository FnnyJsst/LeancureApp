import { useCallback, useState } from 'react';
import { SCREENS } from '../constants/screens';

/**
 * Custom hook to handle navigation between screens
 * @param {Function} setCurrentScreen - A function to set the current screen
 * @returns {Object} - An object containing the navigate, goBack, and error functions
 */
export const useNavigation = (setCurrentScreen) => {
  const [error, setError] = useState(null);

  const navigate = useCallback((screen) => {
    try {
      if (!SCREENS[screen]) {
        throw new Error(`Screen "${screen}" doesn't exist`);
      }

      // Si on navigue vers un webview, on ne vérifie pas la hiérarchie
      if (screen === SCREENS.WEBVIEWS_MANAGEMENT || screen === SCREENS.WEBVIEWS_LIST) {
        setCurrentScreen(SCREENS[screen]);
        setError(null);
        return;
      }

      // Pour les autres écrans, on utilise la navigation normale
      setCurrentScreen(SCREENS[screen]);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, [setCurrentScreen]);

  const goBack = useCallback((defaultScreen = SCREENS.APP_MENU) => {
    const screenHierarchy = {
      [SCREENS.WEBVIEWS_MANAGEMENT]: SCREENS.SETTINGS,
      [SCREENS.WEBVIEWS_LIST]: SCREENS.NO_URL,
      [SCREENS.ACCOUNT]: SCREENS.CHAT,
      [SCREENS.SETTINGS_MESSAGE]: SCREENS.CHAT,
      [SCREENS.CHAT]: SCREENS.APP_MENU,
      [SCREENS.SETTINGS]: SCREENS.APP_MENU,
    };

    return (currentScreen) => {
      setCurrentScreen(screenHierarchy[currentScreen] || defaultScreen);
    };
  }, [setCurrentScreen]);

  return { navigate, goBack, error };
};
