import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Login from '../../screens/messages/login/Login';
import { SCREENS } from '../../constants/screens';
import ErrorBoundary from '../../components/ErrorBoundary';
import * as SecureStore from 'expo-secure-store';
import NoUrlScreen from '../../screens/webviews/NoUrlScreen';
import SettingsWebviews from '../../screens/webviews/SettingsWebviews'

// We mock LogBox to avoid console errors
jest.mock('react-native/Libraries/LogBox/LogBox', () => ({
  __esModule: true,
  default: {
    ignoreLogs: jest.fn(),
    ignoreAllLogs: jest.fn(),
  },
}));

// We mock SecureStore functions
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn().mockResolvedValue(),
  getItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn().mockResolvedValue(),
}));

// We mock our api services
jest.mock('../../services/api/authApi', () => ({
  loginApi: jest.fn(),
  clearSecureStorage: jest.fn().mockResolvedValue(),
}));

jest.mock('../../services/api/messageApi', () => ({
  fetchUserChannels: jest.fn(),
}));

// We mock expo-font and icons
jest.mock('@expo/vector-icons', () => {
  const React = require('react');

  const createMockIcon = (name) => {
    // Utiliser forwardRef pour supporter les refs
    return React.forwardRef((props, ref) => {
      return React.createElement('view', {
        ...props,
        ref,
        testID: `${name}-icon`
      });
    });
  };

  return {
    Ionicons: createMockIcon('Ionicons'),
    MaterialCommunityIcons: createMockIcon('MaterialCommunityIcons'),
    MaterialIcons: createMockIcon('MaterialIcons'),
    FontAwesome: createMockIcon('FontAwesome'),
    // Ajoutez d'autres familles d'icônes si nécessaire
  };
});

jest.mock('expo-font', () => ({
  useFonts: () => [true],
  isLoaded: () => true,
  loadAsync: () => Promise.resolve()
}));

// Mock pour createIconSet
jest.mock('@expo/vector-icons/build/vendor/react-native-vector-icons/lib/create-icon-set.js', () => {
  const React = require('react');

  return () => {
    const IconComponent = React.forwardRef((props, ref) => {
      return React.createElement('view', {
        ...props,
        ref,
        testID: 'icon-component'
      });
    });

    IconComponent.font = {
      isLoaded: () => true
    };

    return IconComponent;
  };
});

// Mock pour expo-modules-core
jest.mock('expo-modules-core', () => ({
  requireOptionalNativeModule: () => null,
  // Ajouter d'autres méthodes si nécessaire
}));

// Mock pour expo-asset
jest.mock('expo-asset', () => ({
  Asset: {
    fromModule: () => ({ downloadAsync: () => Promise.resolve() }),
    loadAsync: () => Promise.resolve(),
  }
}));

// We start our test flow
describe('Password Webviews Flow', () => {

  // We mock the navigation function
  const mockNavigate = jest.fn();

  // We clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test #1
  it('should complete webviews flow with valid credentials', async () => {
    // Mock pour handleSettingsAccess
    const mockHandleSettingsAccess = jest.fn(() => {
      mockNavigate(SCREENS.SETTINGS);
    });

    // Mock pour handlePasswordSubmit
    const mockHandlePasswordSubmit = jest.fn();

    const { findByTestId } = render(
      <ErrorBoundary>
        <NoUrlScreen
          testID="no-url-screen"
          onNavigate={mockNavigate}
          isPasswordRequired={false}
          password=""
          setPasswordCheckModalVisible={() => {}}
          handleSettingsAccess={mockHandleSettingsAccess}
          isMessagesHidden={false}
        />
      </ErrorBoundary>
    );

    // We wait for the NoUrlScreen to be rendered
    const noUrlScreen = await findByTestId('no-url-screen');
    expect(noUrlScreen).toBeTruthy();

    //We press the button to access the webviews settings
    const settingsButton = await findByTestId('settings-button');
    fireEvent.press(settingsButton);

    // We check that handleSettingsAccess has been called
    expect(mockHandleSettingsAccess).toHaveBeenCalled();

    // We check that the navigation has been called with SETTINGS
    expect(mockNavigate).toHaveBeenCalledWith(SCREENS.SETTINGS);

    // We render the SettingsWebviews screen
    const { getByTestId, getByPlaceholderText, getByText } = render(
      <ErrorBoundary>
        <SettingsWebviews
          testID="settings-webviews-screen"
          onNavigate={mockNavigate}
          selectedWebviews={[]}
          refreshOption="manual"
          handlePasswordSubmit={mockHandlePasswordSubmit}
          isPasswordRequired={false}
          disablePassword={() => {}}
          isReadOnly={false}
          toggleReadOnly={() => {}}
          handleSelectOption={() => {}}
          isMessagesHidden={false}
          onToggleHideMessages={() => {}}
          isPasswordDefineModalVisible={true}
          onSubmitPassword={mockHandlePasswordSubmit}
        />
      </ErrorBoundary>
    );

    // We press the button to access the modal to define the password
    const passwordButton = getByTestId('open-password-button');
    fireEvent.press(passwordButton);

    // We enter the password in the modal
    const passwordInput = getByPlaceholderText('Enter a password (6+ chars)');
    const confirmPasswordInput = getByPlaceholderText('Re-enter password');

    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmPasswordInput, 'password123');

    // We submit the password
    const submitButton = getByText('Ok');
    fireEvent.press(submitButton);

    // We confirm the alert
    const confirmButton = getByTestId('alert-confirm-button');
    fireEvent.press(confirmButton);

    // We check that handlePasswordSubmit has been called with the correct password
    expect(mockHandlePasswordSubmit).toHaveBeenCalledWith('password123');

    // We go back to the NoUrlScreen
    const backButton = getByTestId('back-button');
    fireEvent.press(backButton);

    // We check that the navigation has been called with NO_URL
    expect(mockNavigate).toHaveBeenCalledWith(SCREENS.NO_URL);
  });
});