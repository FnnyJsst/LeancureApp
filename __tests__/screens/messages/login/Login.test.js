import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import Login from '../../../../screens/messages/login/Login';
import { loginApi, checkRefreshToken, cleanSecureStore } from '../../../../services/api/authApi';
import { fetchUserChannels } from '../../../../services/api/messageApi';
import { synchronizeTokenWithAPI } from '../../../../services/notificationService';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import { SCREENS } from '../../../../constants/screens';
import { hashPassword } from '../../../../utils/encryption';

// Mock des dépendances
jest.mock('../../../../services/api/authApi', () => ({
  loginApi: jest.fn(),
  checkRefreshToken: jest.fn(),
  cleanSecureStore: jest.fn().mockResolvedValue(true)
}));

jest.mock('../../../../services/api/messageApi', () => ({
  fetchUserChannels: jest.fn()
}));

jest.mock('../../../../services/notificationService', () => ({
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
  useTranslation: () => ({ t: key => key })
}));

// Mock de useDeviceType
jest.mock('../../../../hooks/useDeviceType', () => ({
  useDeviceType: () => ({
    isSmartphone: false,
    isSmartphoneLandscape: false,
    isLandscape: false
  })
}));

// Mock pour le handleError
jest.mock('../../../../utils/errorHandling', () => ({
  handleError: jest.fn(),
  ErrorType: {
    AUTH: 'auth',
    SYSTEM: 'system'
  }
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

  beforeEach(() => {
    onNavigate = jest.fn();
    jest.clearAllMocks();

    // Par défaut, aucune information de connexion enregistrée
    SecureStore.getItemAsync.mockResolvedValue(null);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('affiche le formulaire de connexion', async () => {
    const { findByText } = render(<Login onNavigate={onNavigate} />);

    // Vérifier que les éléments du formulaire sont présents
    expect(await findByText('titles.welcome')).toBeTruthy();
    expect(await findByText('titles.signIn')).toBeTruthy();
    expect(await findByText('titles.contractNumber')).toBeTruthy();
    expect(await findByText('titles.login')).toBeTruthy();
    expect(await findByText('titles.password')).toBeTruthy();
    expect(await findByText('buttons.login')).toBeTruthy();
  });

  it('affiche une erreur lorsque les champs requis ne sont pas remplis', async () => {
    const { findByTestId, findByText, getByText } = render(<Login onNavigate={onNavigate} />);

    // Cliquer sur le bouton de connexion sans remplir les champs
    const loginButton = await findByTestId('login-button');
    fireEvent.press(loginButton);

    // Vérifier qu'un message d'erreur s'affiche
    await waitFor(() => {
      expect(getByText('errors.fieldsRequired')).toBeTruthy();
    });
  });

  it('effectue une connexion réussie et navigue vers le chat', async () => {
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

    const { findByText, findByTestId, findByPlaceholderText } = render(<Login onNavigate={onNavigate} />);

    // Trouver les champs du formulaire
    const contractInput = await findByPlaceholderText('auth.contractNumber');
    const loginInput = await findByPlaceholderText('auth.login');
    const passwordInput = await findByPlaceholderText('auth.password');

    // Remplir le formulaire
    fireEvent.changeText(contractInput, '123456');
    fireEvent.changeText(loginInput, 'testuser');
    fireEvent.changeText(passwordInput, 'password123');

    // Soumettre le formulaire
    const loginButton = await findByTestId('login-button');
    await act(async () => {
      fireEvent.press(loginButton);
      await flushPromises();
    });

    // Vérifier que loginApi a été appelé avec les bonnes données
    expect(loginApi).toHaveBeenCalledWith('123456', 'testuser', 'password123', '');

    // Vérifier que fetchUserChannels a été appelé
    expect(fetchUserChannels).toHaveBeenCalledWith(
      '123456',
      'testuser',
      'password123',
      'access-token-123',
      'api-key-123'
    );

    // Vérifier que les informations de connexion sont sauvegardées dans SecureStore
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'userCredentials',
      expect.stringContaining('hashed-password123')
    );

    // Vérifier que la navigation vers l'écran de chat a été déclenchée
    expect(onNavigate).toHaveBeenCalledWith(SCREENS.CHAT);
  });

  it('affiche une erreur en cas d\'échec de connexion', async () => {
    // Configurer le mock pour un échec de connexion
    loginApi.mockResolvedValueOnce({
      success: false,
      status: 401,
      error: 'Invalid credentials'
    });

    checkRefreshToken.mockResolvedValueOnce({
      success: false,
      error: 'Invalid refresh token'
    });

    const { findByPlaceholderText, findByTestId, getByText } = render(<Login onNavigate={onNavigate} />);

    // Trouver les champs du formulaire
    const contractInput = await findByPlaceholderText('auth.contractNumber');
    const loginInput = await findByPlaceholderText('auth.login');
    const passwordInput = await findByPlaceholderText('auth.password');

    // Remplir le formulaire
    fireEvent.changeText(contractInput, '123456');
    fireEvent.changeText(loginInput, 'testuser');
    fireEvent.changeText(passwordInput, 'wrongpassword');

    // Soumettre le formulaire
    const loginButton = await findByTestId('login-button');
    await act(async () => {
      fireEvent.press(loginButton);
      await flushPromises();
    });

    // Vérifier que le message d'erreur s'affiche
    await waitFor(() => {
      expect(getByText('errors.sessionExpired')).toBeTruthy();
    });

    // Vérifier que la navigation n'a pas été déclenchée
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('effectue une connexion avec le token de rafraîchissement', async () => {
    // Configurer les mocks pour un scénario de connexion avec refresh token
    loginApi.mockResolvedValueOnce({
      success: false,
      status: 401,
      accountApiKey: 'api-key-123',
      refreshToken: 'refresh-token-123'
    });

    checkRefreshToken.mockResolvedValueOnce({
      success: true,
      data: {
        refresh_token: 'new-refresh-token-123'
      }
    });

    loginApi.mockResolvedValueOnce({
      success: true,
      status: 200,
      accountApiKey: 'api-key-123',
      refreshToken: 'new-refresh-token-123',
      accessToken: 'new-access-token-123'
    });

    fetchUserChannels.mockResolvedValueOnce({
      status: 'ok',
      channels: [{ id: 'channel1', name: 'Channel 1' }]
    });

    const { findByPlaceholderText, findByTestId } = render(<Login onNavigate={onNavigate} />);

    // Trouver les champs du formulaire
    const contractInput = await findByPlaceholderText('auth.contractNumber');
    const loginInput = await findByPlaceholderText('auth.login');
    const passwordInput = await findByPlaceholderText('auth.password');

    // Remplir le formulaire
    fireEvent.changeText(contractInput, '123456');
    fireEvent.changeText(loginInput, 'testuser');
    fireEvent.changeText(passwordInput, 'password123');

    // Soumettre le formulaire
    const loginButton = await findByTestId('login-button');
    await act(async () => {
      fireEvent.press(loginButton);
      await flushPromises();
    });

    // Vérifier que checkRefreshToken a été appelé
    expect(checkRefreshToken).toHaveBeenCalledWith(
      '123456',
      'api-key-123',
      'refresh-token-123'
    );

    // Vérifier que loginApi a été appelé une seconde fois avec le nouveau refresh token
    expect(loginApi).toHaveBeenCalledWith(
      '123456',
      'testuser',
      'password123',
      'new-refresh-token-123'
    );

    // Vérifier que la navigation vers l'écran de chat a été déclenchée
    expect(onNavigate).toHaveBeenCalledWith(SCREENS.CHAT);
  });

  // it('nettoie le SecureStore en cas d\'erreur de déchiffrement', async () => {
  //   // Simuler une erreur de déchiffrement
  //   SecureStore.deleteItemAsync.mockImplementationOnce(() => {
  //     throw new Error('Error with decrypt');
  //   });

    const { findByPlaceholderText, findByTestId } = render(<Login onNavigate={onNavigate} />);

    // Trouver les champs du formulaire
    const contractInput = await findByPlaceholderText('auth.contractNumber');
    const loginInput = await findByPlaceholderText('auth.login');
    const passwordInput = await findByPlaceholderText('auth.password');

    // Remplir le formulaire
    fireEvent.changeText(contractInput, '123456');
    fireEvent.changeText(loginInput, 'testuser');
    fireEvent.changeText(passwordInput, 'password123');

    // Soumettre le formulaire
    const loginButton = await findByTestId('login-button');
    await act(async () => {
      fireEvent.press(loginButton);
      await flushPromises();
    });

    // Vérifier que cleanSecureStore a été appelé
    expect(cleanSecureStore).toHaveBeenCalled();
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
    const contractInput = await findByPlaceholderText('auth.contractNumber');
    const loginInput = await findByPlaceholderText('auth.login');
    const passwordInput = await findByPlaceholderText('auth.password');

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
    // Configurer les mocks pour un scénario de connexion avec informations sauvegardées
    SecureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify({
      contractNumber: '123456',
      login: 'testuser',
      password: 'hashed-password123',
      wasChecked: true
    }));

    const { findByText } = render(<Login onNavigate={onNavigate} />);

    // Vérifier que le formulaire simplifié est affiché
    await waitFor(() => {
      expect(findByText('titles.welcomeBack')).toBeTruthy();
    });

    // Soumettre le formulaire
    const loginButton = await findByText('buttons.login');
    await act(async () => {
      fireEvent.press(loginButton);
      await flushPromises();
    });

    // Vérifier que loginApi a été appelé
    expect(loginApi).toHaveBeenCalled();
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

  it('nettoie SecureStore en cas d\'erreur de déchiffrement lors du chargement', async () => {
    // Simuler une erreur lors de la récupération des informations
    SecureStore.getItemAsync.mockRejectedValueOnce(new Error('Decryption failed'));

    // Mock de cleanSecureStore pour être sûr qu'il est appelé
    cleanSecureStore.mockResolvedValueOnce(true);

    // Rendre le composant
    render(<Login onNavigate={onNavigate} />);

    // Vérifier que cleanSecureStore a été appelé
    await waitFor(() => {
      expect(cleanSecureStore).toHaveBeenCalled();
    }, { timeout: 3000 });
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