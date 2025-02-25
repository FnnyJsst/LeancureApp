import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Login from '../../screens/messages/login/Login';
import { SCREENS } from '../../constants/screens';
import ErrorBoundary from '../../components/ErrorBoundary';
import * as SecureStore from 'expo-secure-store';
import { loginApi } from '../../services/api/authApi';
import { fetchUserChannels } from '../../services/api/messageApi';

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
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('expo-font', () => ({
  useFonts: () => [true],
}));

// We start our test flow
describe('Authentication Flow', () => {

  // We mock the navigation function
  const mockNavigate = jest.fn();

  // We clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();

    // We configure the mocks to simulate a successful connection
    loginApi.mockResolvedValue({
      success: true,
      accountApiKey: 'test-api-key'
    });

    // We mock the fetchUserChannels function
    fetchUserChannels.mockResolvedValue({
      status: 'ok',
      privateGroups: [
        {
          id: 'group1',
          title: 'Groupe 1',
          channels: [
            {
              id: 'channel1',
              title: 'Canal 1',
              unreadCount: 0,
              groupId: 'group1'
            }
          ]
        }
      ]
    });

    // We mock the SecureStore getItemAsync function
    SecureStore.getItemAsync.mockResolvedValue(null);
  });

  // Test #1
  it('should complete authentication flow with valid credentials', async () => {

    const { findByTestId, findByPlaceholderText } = render(
      <ErrorBoundary>
        <Login onNavigate={mockNavigate} testID="login-screen" />
      </ErrorBoundary>
    );

    // We wait for the Login component to be rendered
    const loginScreen = await findByTestId('login-screen');
    expect(loginScreen).toBeTruthy();

    // We find the input fields
    const contractInput = await findByPlaceholderText('Enter your contract number');
    const loginInput = await findByPlaceholderText('Enter your login');
    const passwordInput = await findByPlaceholderText('Enter your password');

    // We fill the form with valid credentials
    fireEvent.changeText(contractInput, '12345');
    fireEvent.changeText(loginInput, 'testuser');
    fireEvent.changeText(passwordInput, 'password123');

    // We find and submit the form
    const loginButton = await findByTestId('login-button');
    fireEvent.press(loginButton);

    // We wait for loginApi to be called with a timeout
    await waitFor(() => {
      expect(loginApi).toHaveBeenCalledWith('12345', 'testuser', 'password123');
    }, { timeout: 5000 });

    // We wait for fetchUserChannels to be called
    await waitFor(() => {
      expect(fetchUserChannels).toHaveBeenCalledWith(
        '12345', 'testuser', 'password123', '', 'test-api-key'
      );
    }, { timeout: 5000 });

    // We wait for the user credentials to be stored in SecureStore
    await waitFor(() => {
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'userCredentials',
        expect.stringContaining('12345')
      );
    }, { timeout: 5000 });

    // We wait for the navigation to be called with CHAT
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(SCREENS.CHAT);
    }, { timeout: 5000 });
  });

  // Test #2
  it('should show error message with invalid credentials', async () => {
    // We configure the mock to simulate a failed connection
    loginApi.mockResolvedValue({
      success: false,
      message: 'Invalid credentials'
    });

    const { findByTestId, findByPlaceholderText, findByText } = render(
      <ErrorBoundary>
        <Login onNavigate={mockNavigate} testID="login-screen" />
      </ErrorBoundary>
    );

    // We wait for the Login component to be rendered
    const loginScreen = await findByTestId('login-screen');
    expect(loginScreen).toBeTruthy();

    // We find the input fields
    const contractInput = await findByPlaceholderText('Enter your contract number');
    const loginInput = await findByPlaceholderText('Enter your login');
    const passwordInput = await findByPlaceholderText('Enter your password');

    // We fill the form with invalid credentials
    fireEvent.changeText(contractInput, 'invalid');
    fireEvent.changeText(loginInput, 'invalid');
    fireEvent.changeText(passwordInput, 'invalid');

    // We find and submit the form
    const loginButton = await findByTestId('login-button');
    fireEvent.press(loginButton);

    // We wait for the error message to be displayed with a timeout
    const errorMessage = await findByText('Invalid credentials', {}, { timeout: 5000 });
    expect(errorMessage).toBeTruthy();

    // We wait for the navigation to not be called
    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled();
    }, { timeout: 5000 });
  });
});