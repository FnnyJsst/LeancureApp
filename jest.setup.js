import { jest, expect } from '@jest/globals';
import { SCREENS } from './constants/screens';
global.jest = jest;
global.expect = expect;

import '@testing-library/jest-native/extend-expect';
import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');


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

