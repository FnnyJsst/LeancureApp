import '@testing-library/jest-native/extend-expect';
import 'react-native-gesture-handler/jestSetup';

// Mock pour react-native/Libraries/Animated/NativeAnimatedHelper
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock pour expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock pour @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  createIconSet: () => 'Icon',
}));

// Mock pour expo-constants
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        eas: {
          projectId: 'test',
        },
      },
    },
  },
}));

// Mock pour expo-localization
jest.mock('expo-localization', () => ({
  locale: 'fr-FR',
  locales: ['fr-FR', 'en-US'],
  country: 'FR',
  isRTL: false,
  timezone: 'Europe/Paris',
  currency: 'EUR',
  region: 'FR',
}));

// Mock pour expo-screen-orientation
jest.mock('expo-screen-orientation', () => ({
  lockAsync: jest.fn(),
  unlockAsync: jest.fn(),
  addOrientationChangeListener: jest.fn(),
  removeOrientationChangeListener: jest.fn(),
  getOrientationAsync: jest.fn(),
  OrientationLock: {
    PORTRAIT: 1,
    LANDSCAPE: 2,
    ALL: 0,
  },
  Orientation: {
    PORTRAIT_UP: 1,
    PORTRAIT_DOWN: 2,
    LANDSCAPE_LEFT: 3,
    LANDSCAPE_RIGHT: 4,
  },
}));

// Mock pour expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

// Mock pour expo-modules-core
jest.mock('expo-modules-core', () => ({
  requireNativeViewManager: jest.fn(),
  requireNativeModule: jest.fn(),
  EventEmitter: jest.fn(),
  Platform: {
    OS: 'ios',
  },
}));

// Mock pour expo-font
jest.mock('expo-font', () => ({
  isLoaded: jest.fn(() => true),
  loadAsync: jest.fn(),
  isLoading: jest.fn(() => false),
}));

// Configuration de l'environnement de test
global.testEnvironment = {
  mockSecureStore: {},
  mockCredentials: {
    contractNumber: 'TEST_CONTRACT',
    login: 'TEST_LOGIN',
    password: 'TEST_PASSWORD',
    accessToken: 'TEST_ACCESS_TOKEN',
    refreshToken: 'TEST_REFRESH_TOKEN',
  },
  mockUserRights: '2',
};

// Mock pour Buffer qui est utilisé dans DocumentPreviewModal
jest.mock('buffer', () => ({
  Buffer: {
    from: jest.fn((content, encoding) => ({
      toString: jest.fn(() => 'mocked-decoded-content')
    }))
  }
}));

// Mock pour react-native-webview
jest.mock('react-native-webview', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    WebView: jest.fn().mockImplementation(props =>
      React.createElement(View, { ...props, testID: 'mocked-webview' })
    )
  };
});

// Mock amélioré pour expo-secure-store avec encryption
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key) => {
    const store = global.testEnvironment.mockSecureStore;
    return store[key] ? global.testEnvironment.mockCredentials.accessToken : null;
  }),
  setItemAsync: jest.fn(async (key, value) => {
    global.testEnvironment.mockSecureStore[key] = value;
    return Promise.resolve();
  }),
  deleteItemAsync: jest.fn(async (key) => {
    delete global.testEnvironment.mockSecureStore[key];
    return Promise.resolve();
  }),
}));

// Mock pour la gestion des tokens
jest.mock('./services/api/authApi', () => ({
  loginApi: jest.fn(async () => ({
    success: true,
    accessToken: global.testEnvironment.mockCredentials.accessToken,
    refreshToken: global.testEnvironment.mockCredentials.refreshToken,
  })),
  checkRefreshToken: jest.fn(async () => ({
    success: true,
    accessToken: 'NEW_' + global.testEnvironment.mockCredentials.accessToken,
  })),
  hashPassword: jest.fn((password) => 'hashed-' + password),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { changeLanguage: () => new Promise(() => {}) },
  }),
}));

