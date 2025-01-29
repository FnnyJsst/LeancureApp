import { useCallback } from 'react';
import { SCREENS } from '../constants/screens';

/**
 * Custom hook to handle navigation between screens
 * @param {Function} setCurrentScreen - A function to set the current screen
 * @returns {Object} - An object containing the navigate and goBack functions
 * 
 * @example
 * const { navigate, goBack } = useNavigation(setCurrentScreen);
 */
export const useNavigation = (setCurrentScreen) => {
  const navigate = useCallback((screen) => {
    if (!SCREENS[screen]) {
      console.warn(`Screen "${screen}" doesn't exist`);
      return;
    }
    setCurrentScreen(SCREENS[screen]);
  }, [setCurrentScreen]);

  const goBack = useCallback((defaultScreen = SCREENS.APP_MENU) => {
    const screenHierarchy = {
      [SCREENS.CHANNELS_MANAGEMENT]: SCREENS.SETTINGS,
      [SCREENS.CHANNELS_LIST]: SCREENS.NO_URL,
      [SCREENS.ACCOUNT]: SCREENS.CHAT,
      [SCREENS.SETTINGS_MESSAGE]: SCREENS.CHAT,
      [SCREENS.CHAT]: SCREENS.APP_MENU,
      [SCREENS.SETTINGS]: SCREENS.APP_MENU,
    };
    
    return (currentScreen) => {
      setCurrentScreen(screenHierarchy[currentScreen] || defaultScreen);
    };
  }, [setCurrentScreen]);

  return { navigate, goBack };
};