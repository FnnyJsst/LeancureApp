import { useCallback, useState } from 'react';
import { SCREENS } from '../constants/screens';

/**
 * Custom hook to handle navigation between screens
 * @param {Function} setCurrentScreen - A function to set the current screen
 * @returns {Object} - An object containing the navigate, goBack, and error functions
 */
export const useNavigation = (setCurrentScreen) => {
  const [error, setError] = useState(null);

  /**
   * @function navigate
   * @param {string} screen - The screen to navigate to
   */
  const navigate = useCallback((screen) => {
    try {
      if (!SCREENS[screen]) {
        throw new Error(`${t('errors.screenNotFound')} "${screen}"`);
      }
      setCurrentScreen(SCREENS[screen]);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, [setCurrentScreen]);

  /**
   * @function goBack
   * @param {string} defaultScreen - The screen to navigate to if the current screen is not found
   */
  const goBack = useCallback((defaultScreen = SCREENS.APP_MENU) => {
    const screenHierarchy = {
      [SCREENS.WEBVIEWS_MANAGEMENT]: SCREENS.SETTINGS,
      [SCREENS.WEBVIEWS_LIST]: SCREENS.NO_URL,
    };

    return (currentScreen) => {
      setCurrentScreen(screenHierarchy[currentScreen] || defaultScreen);
    };
  }, [setCurrentScreen]);

  return { navigate, goBack, error };
};
