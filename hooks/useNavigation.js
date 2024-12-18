import { useCallback } from 'react';
import { SCREENS } from '../constants/screens';

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
    };
    
    return (currentScreen) => {
      setCurrentScreen(screenHierarchy[currentScreen] || defaultScreen);
    };
  }, [setCurrentScreen]);

  return { navigate, goBack };
};