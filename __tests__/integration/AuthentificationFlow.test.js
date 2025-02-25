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

// We mock authApi
jest.mock('../../services/api/authApi', () => ({
  loginApi: jest.fn(),
  // fetchUserChannels: jest.fn(),
  clearSecureStorage: jest.fn().mockResolvedValue(),
}));

// Mock pour messageApi
jest.mock('../../services/api/messageApi', () => ({
  fetchUserChannels: jest.fn(),
}));

// Mock pour expo-font
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('expo-font', () => ({
  useFonts: () => [true],  // Simule que les polices sont chargées
}));

describe('Authentication Flow', () => {
  // Fonction de navigation mockée
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Configuration des mocks pour simuler une connexion réussie
    loginApi.mockResolvedValue({
      success: true,
      accountApiKey: 'test-api-key'
    });

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

    SecureStore.getItemAsync.mockResolvedValue(null);
  });

  it('should complete authentication flow with valid credentials', async () => {
    // Rendu du vrai composant Login sans act()
    const { findByTestId, findByPlaceholderText } = render(
      <ErrorBoundary>
        <Login onNavigate={mockNavigate} testID="login-screen" />
      </ErrorBoundary>
    );

    // Attendre que le composant Login soit rendu
    const loginScreen = await findByTestId('login-screen');
    expect(loginScreen).toBeTruthy();

    // Trouver les champs de saisie
    const contractInput = await findByPlaceholderText('Enter your contract number');
    const loginInput = await findByPlaceholderText('Enter your login');
    const passwordInput = await findByPlaceholderText('Enter your password');

    // Remplir le formulaire avec des identifiants valides
    fireEvent.changeText(contractInput, '12345');
    fireEvent.changeText(loginInput, 'testuser');
    fireEvent.changeText(passwordInput, 'password123');

    // Trouver et soumettre le formulaire
    const loginButton = await findByTestId('login-button');
    fireEvent.press(loginButton);

    // Attendre que loginApi soit appelé avec un timeout plus long
    await waitFor(() => {
      expect(loginApi).toHaveBeenCalledWith('12345', 'testuser', 'password123');
    }, { timeout: 5000 });

    // Attendre que fetchUserChannels soit appelé
    await waitFor(() => {
      expect(fetchUserChannels).toHaveBeenCalledWith(
        '12345', 'testuser', 'password123', '', 'test-api-key'
      );
    }, { timeout: 5000 });

    // Vérifier que les informations sont stockées dans SecureStore
    await waitFor(() => {
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'userCredentials',
        expect.stringContaining('12345')
      );
    }, { timeout: 5000 });

    // Vérifier que la navigation a été appelée avec CHAT
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(SCREENS.CHAT);
    }, { timeout: 5000 });
  });

  it('should show error message with invalid credentials', async () => {
    // Configurer le mock pour simuler un échec de connexion
    loginApi.mockResolvedValue({
      success: false,
      message: 'Invalid credentials'
    });

    // Rendu du vrai composant Login sans act()
    const { findByTestId, findByPlaceholderText, findByText } = render(
      <ErrorBoundary>
        <Login onNavigate={mockNavigate} testID="login-screen" />
      </ErrorBoundary>
    );

    // Attendre que le composant Login soit rendu
    const loginScreen = await findByTestId('login-screen');
    expect(loginScreen).toBeTruthy();

    // Trouver les champs de saisie
    const contractInput = await findByPlaceholderText('Enter your contract number');
    const loginInput = await findByPlaceholderText('Enter your login');
    const passwordInput = await findByPlaceholderText('Enter your password');

    // Remplir le formulaire avec des identifiants invalides
    fireEvent.changeText(contractInput, 'invalid');
    fireEvent.changeText(loginInput, 'invalid');
    fireEvent.changeText(passwordInput, 'invalid');

    // Trouver et soumettre le formulaire
    const loginButton = await findByTestId('login-button');
    fireEvent.press(loginButton);

    // Vérifier que le message d'erreur est affiché avec un timeout plus long
    const errorMessage = await findByText('Invalid credentials', {}, { timeout: 5000 });
    expect(errorMessage).toBeTruthy();

    // Vérifier que la navigation n'a pas été appelée
    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled();
    }, { timeout: 5000 });
  });
});