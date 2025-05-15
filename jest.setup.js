import { jest, expect } from '@jest/globals';
import { SCREENS } from './constants/screens';
global.jest = jest;
global.expect = expect;

import '@testing-library/jest-native/extend-expect';
import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

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

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  createIconSet: () => 'Icon',
}));
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
  getLocalizationAsync: jest.fn().mockResolvedValue({
    locale: 'fr-FR',
    locales: ['fr-FR', 'en-US'],
    country: 'FR',
    isRTL: false,
    timezone: 'Europe/Paris',
    currency: 'EUR',
    region: 'FR',
  })
}));

// Ajout du mock pour expo-screen-orientation
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

// Mock plus complet pour expo-modules-core
jest.mock('expo-modules-core', () => ({
  requireNativeViewManager: jest.fn(),
  requireNativeModule: jest.fn(),
  EventEmitter: jest.fn(),
  Platform: {
    OS: 'ios',
  },
}));

// Mock plus complet pour expo-font
jest.mock('expo-font', () => ({
  isLoaded: jest.fn(() => true),
  loadAsync: jest.fn(),
  isLoading: jest.fn(() => false),
}));

// Configuration de l'environnement de test sécurisé
global.testSecurityEnvironment = {
  mockSecureStore: {},
  mockEncryption: {
    encrypt: jest.fn(data => `encrypted_${data}`),
    decrypt: jest.fn(data => data.replace('encrypted_', '')),
  },
  mockCredentials: {
    contractNumber: 'TEST_CONTRACT',
    login: 'TEST_LOGIN',
    password: 'TEST_PASSWORD',
    accessToken: 'TEST_ACCESS_TOKEN',
    refreshToken: 'TEST_REFRESH_TOKEN',
  },
  mockUserRights: '2',
};

// Mock amélioré pour expo-secure-store avec encryption
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key) => {
    const store = global.testSecurityEnvironment.mockSecureStore;
    return store[key] ? global.testSecurityEnvironment.mockEncryption.decrypt(store[key]) : null;
  }),
  setItemAsync: jest.fn(async (key, value) => {
    global.testSecurityEnvironment.mockSecureStore[key] = global.testSecurityEnvironment.mockEncryption.encrypt(value);
    return Promise.resolve();
  }),
  deleteItemAsync: jest.fn(async (key) => {
    delete global.testSecurityEnvironment.mockSecureStore[key];
    return Promise.resolve();
  }),
}));

// Mock pour la gestion des tokens
jest.mock('./services/api/authApi', () => ({
  loginApi: jest.fn(async () => ({
    success: true,
    accessToken: global.testSecurityEnvironment.mockCredentials.accessToken,
    refreshToken: global.testSecurityEnvironment.mockCredentials.refreshToken,
  })),
  checkRefreshToken: jest.fn(async () => ({
    success: true,
    accessToken: 'NEW_' + global.testSecurityEnvironment.mockCredentials.accessToken,
  })),
}));

// Helpers pour les tests de sécurité
global.securityTestHelpers = {
  // Simuler une connexion réussie
  mockSuccessfulLogin: async () => {
    await require('expo-secure-store').setItemAsync(
      'userCredentials',
      JSON.stringify(global.testSecurityEnvironment.mockCredentials)
    );
    await require('expo-secure-store').setItemAsync(
      'userRights',
      global.testSecurityEnvironment.mockUserRights
    );
  },
  // Nettoyer l'environnement de test
  cleanSecurityTestEnvironment: () => {
    global.testSecurityEnvironment.mockSecureStore = {};
  },
};

