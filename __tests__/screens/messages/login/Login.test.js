import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import Login from '../../../../screens/messages/login/Login';
import { loginApi, checkRefreshToken } from '../../../../services/api/authApi';
import { fetchUserChannels } from '../../../../services/api/messageApi';
import { synchronizeTokenWithAPI } from '../../../../services/notification/notificationService';
import * as SecureStore from 'expo-secure-store';
import { cleanSecureStore } from '../../../../utils/secureStore';
import * as Notifications from 'expo-notifications';
import { SCREENS } from '../../../../constants/screens';
import { hashPassword } from '../../../../utils/encryption';
import i18n from 'i18next';

// Mock des dépendances
jest.mock('../../../../services/api/authApi', () => ({
  loginApi: jest.fn(),
  checkRefreshToken: jest.fn(),
  cleanSecureStore: jest.fn().mockResolvedValue(true)
}));

jest.mock('../../../../utils/secureStore', () => ({
  cleanSecureStore: jest.fn().mockResolvedValue(true)
}));

jest.mock('../../../../services/api/messageApi', () => ({
  fetchUserChannels: jest.fn()
}));

jest.mock('../../../../services/notification/notificationService', () => ({
  synchronizeTokenWithAPI: jest.fn().mockResolvedValue(true)
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  getItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'expo-push-token-123' })
}));

jest.mock('../../../../utils/encryption', () => ({
  hashPassword: jest.fn(pwd => `hashed-${pwd}`),
  secureStore: {
    saveCredentials: jest.fn(),
    getCredentials: jest.fn(),
    deleteCredentials: jest.fn()
  }
}));

// Mock de react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      changeLanguage: jest.fn(),
    },
  }),
}));

// Mock de useDeviceType
jest.mock('../../../../hooks/useDeviceType', () => ({
  useDeviceType: () => ({
    isSmartphone: false,
    isSmartphoneLandscape: false,
    isLandscape: false
  })
}));

// Mock pour ENV
jest.mock('../../../../config/env', () => ({
  ENV: {
    EXPO_PROJECT_ID: 'test-project-id'
  }
}));

// Mock pour react-native-linear-gradient
jest.mock('react-native-linear-gradient', () => 'LinearGradient', { virtual: true });

// Mock console.log et console.error
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn()
};

// Fonction d'aide pour attendre que les promesses se résolvent
const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

describe('Login Component', () => {
  let onNavigate;
  const mockCheckRefreshToken = jest.fn();
  const mockCleanSecureStore = jest.fn();

  beforeEach(() => {
    onNavigate = jest.fn();
    jest.clearAllMocks();
    SecureStore.getItemAsync.mockResolvedValue(null);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('affiche le formulaire de connexion', async () => {
    const { getByTestId } = render(<Login onNavigate={onNavigate} />);
    await waitFor(() => {
      expect(getByTestId('login-screen')).toBeTruthy();
    }, { timeout: 10000 });
  }, 15000);

  test('affiche une erreur si champs vides', async () => {
    const { getByTestId } = render(<Login onNavigate={onNavigate} />);

    await waitFor(() => {
      const loginButton = getByTestId('login-button');
      expect(loginButton).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByTestId('login-button'));
    });

    await waitFor(() => {
      expect(getByTestId('custom-alert')).toBeTruthy();
    });
  });

  test('effectue une connexion réussie et navigue vers le chat', async () => {
    // Mock des réponses
    loginApi.mockResolvedValueOnce({
      success: true,
      status: 200,
      accountApiKey: 'api-key-123',
      refreshToken: 'refresh-token-123',
      accessToken: 'access-token-123'
    });

    fetchUserChannels.mockResolvedValueOnce({
      status: 'ok',
      channels: [{ id: 'channel1', name: 'Channel 1' }]
    });

    const { getByTestId } = render(<Login onNavigate={onNavigate} />);

    // Attendre que les éléments soient rendus
    await waitFor(() => {
      expect(getByTestId('contract-input')).toBeTruthy();
    });

    // Remplir le formulaire
    await act(async () => {
      fireEvent.changeText(getByTestId('contract-input'), '123456');
      fireEvent.changeText(getByTestId('login-input'), 'testuser');
      fireEvent.changeText(getByTestId('password-input'), 'password123');
    });

    // Soumettre le formulaire
    await act(async () => {
      fireEvent.press(getByTestId('login-button'));
    });

    // Attendre la navigation
    await waitFor(() => {
      expect(loginApi).toHaveBeenCalled();
      expect(fetchUserChannels).toHaveBeenCalled();
      expect(onNavigate).toHaveBeenCalledWith(SCREENS.CHAT);
    }, { timeout: 5000 });
  });

  it('affiche une erreur en cas d\'échec de connexion', async () => {
    // Utiliser mockImplementation au lieu de mockResolvedValue
    loginApi.mockImplementation(() => Promise.resolve({
      success: false,
      status: 401,
      error: 'Invalid credentials'
    }));

    checkRefreshToken.mockImplementation(() => Promise.resolve({
      success: false,
      error: 'Invalid refresh token'
    }));

    const { getByTestId } = render(<Login onNavigate={onNavigate} />);

    // Attendre que les éléments soient rendus
    await waitFor(() => {
      expect(getByTestId('contract-input')).toBeTruthy();
    });

    const contractInput = getByTestId('contract-input');
    const loginInput = getByTestId('login-input');
    const passwordInput = getByTestId('password-input');
    const loginButton = getByTestId('login-button');

    // Remplir le formulaire
    fireEvent.changeText(contractInput, '123456');
    fireEvent.changeText(loginInput, 'testuser');
    fireEvent.changeText(passwordInput, 'wrongpassword');

    // Cliquer sur le bouton de connexion
    await act(async () => {
      fireEvent.press(loginButton);
    });

    // Vérifier que loginApi a été appelé et que la navigation n'a pas eu lieu
    await waitFor(() => {
      expect(loginApi).toHaveBeenCalledWith('123456', 'testuser', 'wrongpassword', '');
      expect(onNavigate).not.toHaveBeenCalled();
    }, { timeout: 3000 });
  });


  it('sauvegarde les informations de connexion lorsque "Se souvenir de moi" est coché', async () => {
    // Configurer les mocks pour un scénario de connexion réussie
    loginApi.mockResolvedValueOnce({
      success: true,
      status: 200,
      accountApiKey: 'api-key-123',
      refreshToken: 'refresh-token-123',
      accessToken: 'access-token-123'
    });

    fetchUserChannels.mockResolvedValueOnce({
      status: 'ok',
      channels: [{ id: 'channel1', name: 'Channel 1' }]
    });

    const { findByPlaceholderText, findByTestId, findByText } = render(<Login onNavigate={onNavigate} />);

    // Trouver les champs du formulaire
    const contractInput = await findByTestId('contract-input');
    const loginInput = await findByTestId('login-input');
    const passwordInput = await findByTestId('password-input');

    // Remplir le formulaire
    fireEvent.changeText(contractInput, '123456');
    fireEvent.changeText(loginInput, 'testuser');
    fireEvent.changeText(passwordInput, 'password123');

    // Cocher la case "Se souvenir de moi"
    const checkbox = await findByText('auth.rememberMe');
    fireEvent.press(checkbox);

    // Soumettre le formulaire
    const loginButton = await findByTestId('login-button');
    await act(async () => {
      fireEvent.press(loginButton);
      await flushPromises();
    });

    // Vérifier que les informations de connexion sont sauvegardées
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      expect.stringMatching(/userCredentials|savedLoginInfo/),
      expect.any(String)
    );

    // Vérifier la navigation
    expect(onNavigate).toHaveBeenCalledWith(SCREENS.CHAT);
  });

  it('utilise les informations de connexion sauvegardées', async () => {
    SecureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify({
      contractNumber: '123456',
      login: 'testuser',
      password: 'hashed-password123',
      wasChecked: true
    }));

    const { getByText } = render(<Login onNavigate={onNavigate} />);

    await waitFor(() => {
      expect(getByText('titles.welcomeBack')).toBeTruthy();
    });
  });

  it('permet de basculer entre la connexion simplifiée et manuelle', async () => {
    // Configurer les mocks pour un scénario avec des informations sauvegardées
    SecureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify({
      contractNumber: '123456',
      login: 'testuser',
      password: 'hashed-password123',
      wasChecked: true
    }));

    const { findByText } = render(<Login onNavigate={onNavigate} />);

    // Attendre que le formulaire simplifié soit affiché
    const switchAccountButton = await findByText('buttons.switchAccount');

    // Cliquer sur le bouton de changement de compte
    fireEvent.press(switchAccountButton);

    // Vérifier que le formulaire complet est affiché
    await waitFor(() => {
      expect(findByText('titles.welcome')).toBeTruthy();
    });
  });

  it('navigue vers le menu principal lorsqu\'on clique sur le lien de retour', async () => {
    const { findByTestId } = render(<Login onNavigate={onNavigate} />);

    // Cliquer sur le lien de retour
    const backLink = await findByTestId('login-back');
    fireEvent.press(backLink);

    // Vérifier que la navigation a été déclenchée vers le menu principal
    expect(onNavigate).toHaveBeenCalledWith(SCREENS.APP_MENU);
  });
});