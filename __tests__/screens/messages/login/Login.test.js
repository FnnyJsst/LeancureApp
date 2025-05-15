import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import Login from '../../../screens/messages/login/Login';
import { loginApi } from '../../../services/api/authApi';
import { fetchUserChannels } from '../../../services/api/messageApi';
import { synchronizeTokenWithAPI } from '../../../services/notification/notificationService';
import * as SecureStore from 'expo-secure-store';
import { cleanSecureStore } from '../../../utils/secureStore';
import { SCREENS } from '../../../constants/screens';
import { hashPassword } from '../../../utils/encryption';

// Mock des dépendances
jest.mock('expo-notifications', () => ({
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'test-token' }),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  setNotificationHandler: jest.fn(),
  getDevicePushTokenAsync: jest.fn().mockResolvedValue({ data: 'test-device-token' }),
  getRegistrationInfoAsync: jest.fn().mockResolvedValue({ registrationInfo: 'test-info' })
}));

jest.mock('../../../services/api/authApi', () => ({
  loginApi: jest.fn(),
  checkRefreshToken: jest.fn(),
  saveCredentials: jest.fn(),
  getCredentials: jest.fn(),
  getUserRights: jest.fn()
}));

jest.mock('../../../services/api/messageApi', () => ({
  fetchUserChannels: jest.fn()
}));

jest.mock('../../../services/notification/notificationService', () => ({
  synchronizeTokenWithAPI: jest.fn()
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn()
}));

jest.mock('../../../utils/secureStore', () => ({
  cleanSecureStore: jest.fn()
}));

jest.mock('../../../utils/encryption', () => ({
  hashPassword: jest.fn(pwd => `hashed-${pwd}`)
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
jest.mock('../../../hooks/useDeviceType', () => ({
  useDeviceType: () => ({
    isSmartphone: false,
    isSmartphoneLandscape: false,
    isLandscape: false
  })
}));

// Mock pour ENV
jest.mock('../../../config/env', () => ({
  ENV: {
    EXPO_PROJECT_ID: 'test-project-id',
    API_URL: jest.fn().mockResolvedValue('https://api.example.com/ic.php')
  }
}));

// Mock pour CustomAlert
jest.mock('../../../components/modals/webviews/CustomAlert', () => ({
  __esModule: true,
  default: {
    show: jest.fn()
  }
}));

describe('Login Component', () => {
  let onNavigate;

  beforeEach(async () => {
    onNavigate = jest.fn();
    jest.clearAllMocks();

    // Configuration par défaut des mocks
    SecureStore.getItemAsync.mockImplementation(async (key) => {
      if (key === 'userCredentials') {
        return JSON.stringify({
          contractNumber: 'TEST_CONTRACT',
          login: 'TEST_LOGIN',
          password: 'TEST_PASSWORD',
          accessToken: 'TEST_ACCESS_TOKEN',
          refreshToken: 'TEST_REFRESH_TOKEN'
        });
      }
      return null;
    });

    SecureStore.setItemAsync.mockResolvedValue(undefined);
    SecureStore.deleteItemAsync.mockResolvedValue(undefined);
    
    loginApi.mockImplementation(() => Promise.resolve({
      success: true,
      status: 200,
      accountApiKey: 'api-key-123',
      refreshToken: 'refresh-token-123',
      accessToken: 'access-token-123'
    }));

    fetchUserChannels.mockImplementation(() => Promise.resolve({
      status: 'ok',
      channels: []
    }));

    synchronizeTokenWithAPI.mockImplementation(() => Promise.resolve(true));
    cleanSecureStore.mockImplementation(() => Promise.resolve());
  });

  test('effectue une connexion réussie et navigue vers le chat', async () => {
    const { getByTestId } = render(<Login onNavigate={onNavigate} />);

    await waitFor(() => {
      expect(getByTestId('login-form')).toBeTruthy();
      expect(getByTestId('contract-input')).toBeTruthy();
      expect(getByTestId('username-input')).toBeTruthy();
      expect(getByTestId('password-input')).toBeTruthy();
      expect(getByTestId('login-button')).toBeTruthy();
    }, { timeout: 10000 });

    await act(async () => {
      fireEvent.changeText(getByTestId('contract-input'), '123456');
      fireEvent.changeText(getByTestId('username-input'), 'testuser');
      fireEvent.changeText(getByTestId('password-input'), 'password123');
      await new Promise(resolve => setTimeout(resolve, 1000));
      fireEvent.press(getByTestId('login-button'));
    });

    await waitFor(() => {
      expect(loginApi).toHaveBeenCalledWith('123456', 'testuser', expect.any(String), '');
      expect(fetchUserChannels).toHaveBeenCalled();
      expect(synchronizeTokenWithAPI).toHaveBeenCalledWith('test-token');
      expect(onNavigate).toHaveBeenCalledWith(SCREENS.CHAT);
    }, { timeout: 10000 });
  }, 30000);

  test('affiche une erreur en cas d\'échec de connexion', async () => {
    loginApi.mockImplementationOnce(() => Promise.resolve({
      success: false,
      status: 401,
      error: 'Invalid credentials'
    }));

    const { getByTestId } = render(<Login onNavigate={onNavigate} />);

    await waitFor(() => {
      expect(getByTestId('login-form')).toBeTruthy();
      expect(getByTestId('contract-input')).toBeTruthy();
      expect(getByTestId('username-input')).toBeTruthy();
      expect(getByTestId('password-input')).toBeTruthy();
      expect(getByTestId('login-button')).toBeTruthy();
    }, { timeout: 10000 });

    await act(async () => {
      fireEvent.changeText(getByTestId('contract-input'), '123456');
      fireEvent.changeText(getByTestId('username-input'), 'testuser');
      fireEvent.changeText(getByTestId('password-input'), 'wrongpassword');
      await new Promise(resolve => setTimeout(resolve, 1000));
      fireEvent.press(getByTestId('login-button'));
    });

    await waitFor(() => {
      expect(loginApi).toHaveBeenCalledWith('123456', 'testuser', expect.any(String), '');
      expect(onNavigate).not.toHaveBeenCalled();
    }, { timeout: 10000 });
  }, 30000);

  test('sauvegarde les informations de connexion lorsque "Se souvenir de moi" est coché', async () => {
    const { getByTestId, getByText } = render(<Login onNavigate={onNavigate} />);

    await waitFor(() => {
      expect(getByTestId('login-form')).toBeTruthy();
      expect(getByTestId('contract-input')).toBeTruthy();
      expect(getByTestId('username-input')).toBeTruthy();
      expect(getByTestId('password-input')).toBeTruthy();
      expect(getByTestId('login-button')).toBeTruthy();
      expect(getByText('auth.rememberMe')).toBeTruthy();
    }, { timeout: 10000 });

    await act(async () => {
      fireEvent.changeText(getByTestId('contract-input'), '123456');
      fireEvent.changeText(getByTestId('username-input'), 'testuser');
      fireEvent.changeText(getByTestId('password-input'), 'password123');
      fireEvent.press(getByText('auth.rememberMe'));
      await new Promise(resolve => setTimeout(resolve, 1000));
      fireEvent.press(getByTestId('login-button'));
    });

    await waitFor(() => {
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'userCredentials',
        expect.any(String)
      );
      expect(onNavigate).toHaveBeenCalledWith(SCREENS.CHAT);
    }, { timeout: 10000 });
  }, 30000);

  describe('Stockage Sécurisé', () => {
    beforeEach(() => {
      SecureStore.setItemAsync.mockClear();
      SecureStore.getItemAsync.mockClear();
      cleanSecureStore.mockClear();
    });

    test('vérifie le chiffrement des credentials stockés', async () => {
      const { getByTestId } = render(<Login onNavigate={onNavigate} />);
      
      loginApi.mockImplementation(() => Promise.resolve({
        success: true,
        accountApiKey: 'test-api-key',
        refreshToken: 'test-refresh',
        accessToken: 'test-access'
      }));

      await waitFor(() => {
        expect(getByTestId('login-form')).toBeTruthy();
        expect(getByTestId('contract-input')).toBeTruthy();
        expect(getByTestId('username-input')).toBeTruthy();
        expect(getByTestId('password-input')).toBeTruthy();
        expect(getByTestId('login-button')).toBeTruthy();
      }, { timeout: 10000 });

      await act(async () => {
        fireEvent.changeText(getByTestId('contract-input'), '123456');
        fireEvent.changeText(getByTestId('username-input'), 'testuser');
        fireEvent.changeText(getByTestId('password-input'), 'password123');
        await new Promise(resolve => setTimeout(resolve, 1000));
        fireEvent.press(getByTestId('login-button'));
      });

      await waitFor(() => {
        expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
          'userCredentials',
          expect.any(String)
        );
        expect(onNavigate).toHaveBeenCalledWith(SCREENS.CHAT);
      }, { timeout: 10000 });
    }, 30000);

    test('vérifie la suppression des données lors du nettoyage', async () => {
      render(<Login onNavigate={onNavigate} />);
      
      await act(async () => {
        await cleanSecureStore();
        SecureStore.getItemAsync.mockResolvedValue(null);
      });

      await waitFor(() => {
        expect(cleanSecureStore).toHaveBeenCalled();
        expect(SecureStore.getItemAsync('userCredentials')).resolves.toBeNull();
        expect(SecureStore.getItemAsync('savedLoginInfo')).resolves.toBeNull();
      }, { timeout: 10000 });
    }, 30000);
  });
});