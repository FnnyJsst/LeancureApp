import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import Login from '../../../../screens/messages/login/Login';
import * as authApi from '../../../../services/api/authApi';
import { fetchUserChannels } from '../../../../services/api/messageApi';
import { synchronizeTokenWithAPI } from '../../../../services/notification/notificationService';
import * as SecureStore from 'expo-secure-store';
import { cleanSecureStore } from '../../../../utils/secureStore';
import { SCREENS } from '../../../../constants/screens';
import { hashPassword } from '../../../../utils/encryption';

// Mock des dépendances
jest.mock('expo-notifications', () => ({
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'test-token' }),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  setNotificationHandler: jest.fn(),
  getDevicePushTokenAsync: jest.fn().mockResolvedValue({ data: 'test-device-token' }),
  getRegistrationInfoAsync: jest.fn().mockResolvedValue({ registrationInfo: 'test-info' })
}));

jest.mock('../../../../services/api/authApi', () => ({
  loginApi: jest.fn(),
  checkRefreshToken: jest.fn()
}));

jest.mock('../../../../services/api/messageApi', () => ({
  fetchUserChannels: jest.fn()
}));

jest.mock('../../../../services/notification/notificationService', () => ({
  synchronizeTokenWithAPI: jest.fn()
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn()
}));

jest.mock('../../../../utils/secureStore', () => ({
  cleanSecureStore: jest.fn()
}));

jest.mock('../../../../utils/encryption', () => ({
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
    EXPO_PROJECT_ID: 'test-project-id',
    API_URL: jest.fn().mockResolvedValue('https://api.example.com/ic.php')
  }
}));

// Mock pour CustomAlert
jest.mock('../../../../components/modals/webviews/CustomAlert', () => {
  const MockCustomAlert = ({ visible, message, onClose, onConfirm, type, testID }) => {
    return null; // Un composant React valide qui ne rend rien
  };
  return MockCustomAlert;
});

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
          accountApiKey: 'test-api-key',
          refreshToken: 'test-refresh-token',
          accessToken: 'test-access-token'
        });
      }
      if (key === 'savedLoginInfo') {
        return null;
      }
      return null;
    });

    SecureStore.setItemAsync.mockResolvedValue(undefined);
    SecureStore.deleteItemAsync.mockResolvedValue(undefined);
    
    authApi.loginApi.mockResolvedValue({
      success: true,
      status: 200,
      accountApiKey: 'test-api-key',
      refreshToken: 'test-refresh-token',
      accessToken: 'test-access-token'
    });

    fetchUserChannels.mockResolvedValue({
      status: 'ok',
      channels: []
    });

    synchronizeTokenWithAPI.mockResolvedValue(true);
    cleanSecureStore.mockResolvedValue(undefined);
  });

  test('effectue une connexion réussie et navigue vers le chat', async () => {
    const { getByTestId, getByText } = render(<Login onNavigate={onNavigate} />);

    await waitFor(() => {
      expect(getByTestId('login-screen')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.changeText(getByTestId('contract-number-input'), '123456');
      fireEvent.changeText(getByTestId('username-input'), 'testuser');
      fireEvent.changeText(getByTestId('password-input'), 'password123');
      fireEvent.press(getByText('auth.rememberMe'));
      fireEvent.press(getByTestId('submit-button'));
    });

    await waitFor(() => {
      expect(authApi.loginApi).toHaveBeenCalledWith('123456', 'testuser', 'password123', '');
    }, { timeout: 5000 });

    await waitFor(() => {
      expect(fetchUserChannels).toHaveBeenCalled();
      expect(synchronizeTokenWithAPI).toHaveBeenCalledWith('test-token');
      expect(onNavigate).toHaveBeenCalledWith(SCREENS.CHAT);
    }, { timeout: 5000 });
  }, 30000);

  test('affiche une erreur en cas d\'échec de connexion', async () => {
    authApi.loginApi.mockResolvedValueOnce({
      success: false,
      status: 401,
      error: 'LOGIN_FAILED'
    });

    const { getByTestId } = render(<Login onNavigate={onNavigate} />);

    await waitFor(() => {
      expect(getByTestId('login-screen')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.changeText(getByTestId('contract-number-input'), '123456');
      fireEvent.changeText(getByTestId('username-input'), 'testuser');
      fireEvent.changeText(getByTestId('password-input'), 'wrongpassword');
      fireEvent.press(getByTestId('submit-button'));
    });

    await waitFor(() => {
      expect(authApi.loginApi).toHaveBeenCalledWith('123456', 'testuser', 'wrongpassword', '');
    }, { timeout: 5000 });

    await waitFor(() => {
      expect(onNavigate).not.toHaveBeenCalled();
    }, { timeout: 5000 });
  }, 30000);

  test('sauvegarde les informations de connexion lorsque "Se souvenir de moi" est coché', async () => {
    const { getByTestId, getByText } = render(<Login onNavigate={onNavigate} />);

    await waitFor(() => {
      expect(getByTestId('login-screen')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.changeText(getByTestId('contract-number-input'), '123456');
      fireEvent.changeText(getByTestId('username-input'), 'testuser');
      fireEvent.changeText(getByTestId('password-input'), 'password123');
      fireEvent.press(getByText('auth.rememberMe'));
      fireEvent.press(getByTestId('submit-button'));
    });

    await waitFor(() => {
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'userCredentials',
        expect.any(String)
      );
    }, { timeout: 5000 });

    await waitFor(() => {
      expect(onNavigate).toHaveBeenCalledWith(SCREENS.CHAT);
    }, { timeout: 5000 });
  }, 30000);

  test('permet la saisie des informations de connexion', async () => {
    const { getByTestId } = render(<Login onNavigate={onNavigate} />);

    await waitFor(() => {
      expect(getByTestId('login-screen')).toBeTruthy();
    });

    fireEvent.changeText(getByTestId('contract-number-input'), '123456');
    fireEvent.changeText(getByTestId('username-input'), 'testuser');
    fireEvent.changeText(getByTestId('password-input'), 'password123');

    await waitFor(() => {
      expect(getByTestId('contract-number-input').props.value).toBe('123456');
      expect(getByTestId('username-input').props.value).toBe('testuser');
      expect(getByTestId('password-input').props.value).toBe('password123');
    });
  });

  describe('Stockage Sécurisé', () => {
    beforeEach(() => {
      SecureStore.setItemAsync.mockClear();
      SecureStore.getItemAsync.mockClear();
      cleanSecureStore.mockClear();

      // Reset les mocks avec les valeurs par défaut
      authApi.loginApi.mockResolvedValue({
        success: true,
        status: 200,
        accountApiKey: 'test-api-key',
        refreshToken: 'test-refresh-token',
        accessToken: 'test-access-token'
      });

      fetchUserChannels.mockResolvedValue({
        status: 'ok',
        channels: []
      });
    });

    test('vérifie le chiffrement des credentials stockés', async () => {
      const { getByTestId } = render(<Login onNavigate={onNavigate} />);

      await waitFor(() => {
        expect(getByTestId('login-screen')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.changeText(getByTestId('contract-number-input'), '123456');
        fireEvent.changeText(getByTestId('username-input'), 'testuser');
        fireEvent.changeText(getByTestId('password-input'), 'password123');
        fireEvent.press(getByTestId('submit-button'));
      });

      await waitFor(() => {
        expect(authApi.loginApi).toHaveBeenCalledWith('123456', 'testuser', 'password123', '');
      }, { timeout: 5000 });

      await waitFor(() => {
        expect(fetchUserChannels).toHaveBeenCalledWith(
          '123456',
          'testuser',
          'password123',
          'test-access-token',
          'test-api-key'
        );
      }, { timeout: 5000 });

      await waitFor(() => {
        expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
          'userCredentials',
          expect.stringContaining('test-api-key')
        );
      }, { timeout: 5000 });

      await waitFor(() => {
        expect(onNavigate).toHaveBeenCalledWith(SCREENS.CHAT);
      }, { timeout: 5000 });
    }, 30000);
  });
});