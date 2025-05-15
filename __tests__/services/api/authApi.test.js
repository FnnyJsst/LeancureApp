import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import CryptoJS from 'crypto-js';
import * as authApi from '../../../services/api/authApi';
import { ENV } from '../../../config/env';
import { createApiRequest } from '../../../services/api/baseApi';
import { cleanSecureStore } from '../../../utils/secureStore';

// Mock des dépendances
jest.mock('axios');
jest.mock('expo-secure-store');
jest.mock('../../../config/env', () => ({
  ENV: {
    API_URL: jest.fn().mockResolvedValue('https://api.example.com/ic.php'),
    API_KEY: 'test-api-key'
  }
}));
jest.mock('../../../services/api/baseApi', () => ({
  createApiRequest: jest.fn()
}));
jest.mock('../../../utils/secureStore', () => ({
  cleanSecureStore: jest.fn()
}));

// Mock CustomAlert
jest.mock('../../../components/modals/webviews/CustomAlert', () => ({
  __esModule: true,
  default: {
    show: jest.fn()
  }
}));

// Mock de console
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn()
};

// Mock pour la fonction de traduction
global.t = jest.fn(key => key);

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    SecureStore.getItemAsync.mockResolvedValue(null);
    SecureStore.setItemAsync.mockResolvedValue(undefined);
    SecureStore.deleteItemAsync.mockResolvedValue(undefined);
    createApiRequest.mockReset();
    axios.mockReset();
  });

  describe('loginApi', () => {
    it('devrait connecter un utilisateur avec succès', async () => {
      // Configuration des mocks
      const mockLoginResponse = {
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
        },
        status: 200
      };

      const mockChannelsResponse = {
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

      axios.mockImplementation((config) => {
        if (config.url.includes('ic.php')) {
          return Promise.resolve(mockLoginResponse);
        }
        return Promise.resolve(mockChannelsResponse);
      });

      // Exécution
      const result = await authApi.loginApi('123', 'user', 'pass', '');

      // Vérifications
      expect(axios).toHaveBeenCalledTimes(2);
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
    });

    it('devrait gérer les erreurs lors de la connexion', async () => {
      // Configuration des mocks
      axios.mockImplementation(() => Promise.reject(new Error('Network error')));

      // Exécution
      const result = await authApi.loginApi('123', 'user', 'pass', '');

      // Vérifications
      expect(result).toEqual({
        status: 500,
        success: false,
        error: 'errors.connectionError'
      });
    });
  });

  describe('checkRefreshToken', () => {
    it('devrait vérifier un refresh token avec succès', async () => {
      // Configuration des mocks
      const mockResponse = {
        data: {
          success: true,
          accessToken: 'new-access-token'
        }
      };
      axios.mockResolvedValueOnce(mockResponse);

      // Exécution
      const result = await authApi.checkRefreshToken('123', 'apikey', 'token');

      // Vérifications
      expect(axios).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        success: true,
        accessToken: 'new-access-token'
      });
    });

    it('devrait gérer les erreurs lors de la vérification du refresh token', async () => {
      // Configuration des mocks
      axios.mockRejectedValueOnce(new Error('Network error'));

      // Exécution
      const result = await authApi.checkRefreshToken('123', 'apikey', 'token');

      // Vérifications
      expect(result).toEqual({
        success: false,
        error: expect.any(String)
      });
    });
  });

  describe('Gestion des credentials', () => {
    const testCredentials = {
      contractNumber: '123',
      login: 'user',
      password: 'hashed-password',
      accountApiKey: 'api-key',
      refreshToken: 'refresh-token',
      accessToken: 'access-token',
      rights: 'admin_rights'
    };

    describe('saveCredentials', () => {
      it('devrait sauvegarder les informations d\'identification', async () => {
        await authApi.saveCredentials(testCredentials);

        expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
          'userCredentials',
          JSON.stringify(testCredentials)
        );
        expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
          'userRights',
          testCredentials.rights
        );
      });

      it('devrait gérer les erreurs lors de la sauvegarde', async () => {
        SecureStore.setItemAsync.mockRejectedValueOnce(new Error('Storage error'));
        await expect(authApi.saveCredentials(testCredentials)).rejects.toThrow('errors.errorSavingLoginInfo');
      });
    });

    describe('getCredentials', () => {
      it('devrait récupérer les informations d\'identification', async () => {
        SecureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify(testCredentials));
        const result = await authApi.getCredentials();
        expect(result).toEqual(testCredentials);
      });

      it('devrait retourner null si aucune donnée n\'est trouvée', async () => {
        SecureStore.getItemAsync.mockResolvedValueOnce(null);
        const result = await authApi.getCredentials();
        expect(result).toBeNull();
      });
    });

    describe('getUserRights', () => {
      it('devrait récupérer les droits de l\'utilisateur', async () => {
        SecureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify(testCredentials));
        const result = await authApi.getUserRights();
        expect(result).toBe('admin_rights');
      });

      it('devrait retourner null si aucun droit n\'est trouvé', async () => {
        SecureStore.getItemAsync.mockResolvedValueOnce(null);
        const result = await authApi.getUserRights();
        expect(result).toBeNull();
      });
    });
  });
});