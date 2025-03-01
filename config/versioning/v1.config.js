import { SCREENS } from '../../constants/screens';
import { COLORS } from '../../constants/style';

export const V1_CONFIG = {
  INITIAL_SCREEN: SCREENS.SCREENSAVER,
  FEATURES: {
    MESSAGES_HIDDEN: true,
    CHAT_ENABLED: false,
    SETTINGS_ENABLED: true,
  },
  NAVIGATION: {
    DEFAULT_ROUTE: SCREENS.WEBVIEW,
    FALLBACK_ROUTE: SCREENS.NO_URL,
  }
};