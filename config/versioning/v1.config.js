import { SCREENS } from '../../constants/screens';

export const V1_CONFIG = {
  FEATURES: {
    MESSAGES_HIDDEN: true,
    CHAT_ENABLED: false,
    SETTINGS_ENABLED: true,
  },
  INITIALIZATION: {
    LOADING_TIME: 3000,
    DEFAULT_MESSAGES_HIDDEN: true,
  },
  NAVIGATION: {
    DEFAULT_ROUTE: SCREENS.WEBVIEW,
    FALLBACK_ROUTE: SCREENS.NO_URL,
  }
};