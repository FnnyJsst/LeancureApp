import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { ENV } from '../../../config/env';
import { createApiRequest } from '../../../services/api/baseApi';
import { cleanSecureStore } from '../../../utils/secureStore';
import { CustomAlert } from '../../../components/modals/webviews/CustomAlert';
import { t } from '../../../i18n/index';
import * as authApi from '../../../services/api/authApi';

// Mock des dépendances
jest.mock('axios');
jest.mock('expo-secure-store');
jest.mock('../../../components/modals/webviews/CustomAlert', () => ({
  CustomAlert: {
    show: jest.fn()
  }
}));

jest.mock('../../../config/env', () => ({
  ENV: {
    API_URL: jest.fn().mockResolvedValue('https://api.example.com/ic.php'),
    API_KEY: 'test-api-key'
  }
}));

jest.mock('../../../services/api/baseApi', () => ({
  createApiRequest: jest.fn(data => data)
}));

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    SecureStore.setItemAsync.mockResolvedValue(undefined);
    SecureStore.getItemAsync.mockResolvedValue(null);
  });

  describe('loginApi', () => {
    const mockLoginResponse = {
      status: 200,
      data: {
        cmd: [{
          accounts: {
            loginmsg: {
              get: {
                data: {
                  accountapikey: 'test-api-key',
                  refresh_token: 'test-refresh-token',
                  access_token: 'test-access-token',
                  firstname: 'John',
                  lastname: 'Doe'
                }
              }
            }
          }
        }]
      }
    };

    const mockChannelsResponse = {
      status: 200,
      data: {
        cmd: [{
          amaiia_msg_srv: {
            client: {
              get_account_links: {
                data: {
                  private: {
                    groups: {
                      '4': {
                        rights: 'admin_rights'
                      }
                    }
                  }
                }
              }
            }
          }
        }]
      }
    };

    it('devrait gérer une connexion réussie', async () => {
      // Configuration des mocks
      axios
        .mockResolvedValueOnce(mockLoginResponse)
        .mockResolvedValueOnce(mockChannelsResponse);

      // Exécution
      const result = await authApi.loginApi('123', 'user', 'pass', '');

      // Vérifications
      expect(axios).toHaveBeenCalledTimes(2);
      
      // Vérification du premier appel (login)
      expect(axios).toHaveBeenNthCalledWith(1, {
        method: 'POST',
        url: 'https://api.example.com/ic.php',
        data: expect.any(Object),
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000,
        validateStatus: expect.any(Function),
        maxRedirects: 0
      });

      // Vérification du deuxième appel (channels)
      expect(axios).toHaveBeenNthCalledWith(2, {
        method: 'POST',
        url: 'https://api.example.com/ic.php',
        data: expect.any(Object),
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      expect(result).toEqual({
        status: 200,
        accountApiKey: 'test-api-key',
        refreshToken: 'test-refresh-token',
        accessToken: 'test-access-token',
        firstname: 'John',
        lastname: 'Doe',
        rights: 'admin_rights',
        success: true
      });

      // Vérification de la sauvegarde des credentials
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'userCredentials',
        expect.stringContaining('test-api-key')
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'userRights',
        'admin_rights'
      );
    });

    it('devrait gérer les erreurs réseau', async () => {
      // Configuration
      const networkError = new Error('Network error');
      axios.mockRejectedValue(networkError);

      // Exécution
      const result = await authApi.loginApi('123', 'user', 'pass', '');

      // Vérifications
      expect(axios).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        status: 500,
        success: false,
        error: 'errors.connectionError'
      });
      expect(CustomAlert.show).toHaveBeenCalledWith({
        message: 'errors.connectionError'
      });
    });

    it('devrait gérer une réponse invalide', async () => {
      // Configuration
      const invalidResponse = {
        status: 200,
        data: {
          cmd: [{
            accounts: {}  // Réponse sans les données attendues
          }]
        }
      };
      axios.mockResolvedValue(invalidResponse);

      // Exécution
      const result = await authApi.loginApi('123', 'user', 'pass', '');

      // Vérifications
      expect(axios).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        status: 500,
        success: false,
        error: 'errors.connectionError'
      });
      expect(CustomAlert.show).toHaveBeenCalledWith({
        message: 'errors.connectionError'
      });
    });
  });

  describe('saveCredentials', () => {
    it('devrait sauvegarder les credentials avec succès', async () => {
      const credentials = {
        contractNumber: '123',
        login: 'user',
        password: 'pass',
        accountApiKey: 'test-api-key',
        rights: 'admin_rights'
      };

      await authApi.saveCredentials(credentials);

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'userCredentials',
        JSON.stringify(credentials)
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'userRights',
        'admin_rights'
      );
    });

    it('devrait gérer les erreurs de sauvegarde', async () => {
      const error = new Error('Storage error');
      SecureStore.setItemAsync.mockRejectedValue(error);

      const credentials = {
        contractNumber: '123',
        rights: 'admin_rights'
      };

      await expect(authApi.saveCredentials(credentials)).rejects.toThrow('errors.errorSavingLoginInfo');
      expect(CustomAlert.show).toHaveBeenCalledWith({
        message: 'errors.errorSavingLoginInfo'
      });
    });
  });

  describe('getCredentials', () => {
    it('devrait récupérer les credentials avec succès', async () => {
      const mockCredentials = {
        contractNumber: '123',
        login: 'user'
      };
      SecureStore.getItemAsync.mockResolvedValue(JSON.stringify(mockCredentials));

      const result = await authApi.getCredentials();
      expect(result).toEqual(mockCredentials);
    });

    it('devrait retourner null si pas de credentials', async () => {
      SecureStore.getItemAsync.mockResolvedValue(null);

      const result = await authApi.getCredentials();
      expect(result).toBeNull();
    });

    it('devrait gérer les erreurs de lecture', async () => {
      SecureStore.getItemAsync.mockRejectedValue(new Error('Storage error'));

      const result = await authApi.getCredentials();
      expect(result).toBeUndefined();
      expect(CustomAlert.show).toHaveBeenCalledWith({
        message: 'errors.errorLoadingLoginInfo'
      });
    });
  });
});