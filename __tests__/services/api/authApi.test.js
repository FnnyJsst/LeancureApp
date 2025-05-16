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
jest.mock('../../../config/env', () => ({
  ENV: {
    API_URL: jest.fn().mockResolvedValue('https://api.example.com/ic.php'),
    API_KEY: 'test-api-key'
  }
}));
jest.mock('../../../services/api/baseApi', () => ({
  createApiRequest: jest.fn(data => data)
}));
jest.mock('../../../utils/secureStore', () => ({
  cleanSecureStore: jest.fn()
}));

// Mock de CustomAlert
jest.mock('../../../components/modals/webviews/CustomAlert', () => ({
  CustomAlert: {
    show: jest.fn(),
    hide: jest.fn()
  }
}));

// Mock de i18n
jest.mock('../../../i18n/index', () => ({
  t: jest.fn(key => key)
}));

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loginApi', () => {
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
                      '4': { rights: 'admin_rights' }
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
      axios.mockResolvedValueOnce(mockLoginResponse);
      axios.mockResolvedValueOnce(mockChannelsResponse);

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

      // Vérifier que les credentials ont été sauvegardés
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'userCredentials',
        expect.any(String)
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'userRights',
        'admin_rights'
      );
    });

    it('devrait gérer les erreurs réseau', async () => {
      // Configuration
      axios.mockRejectedValueOnce(new Error('Network error'));

      // Exécution
      const result = await authApi.loginApi('123', 'user', 'pass', '');

      // Vérifications
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

  describe('checkRefreshToken', () => {
    it('devrait vérifier un refresh token avec succès', async () => {
      // Configuration du mock
      const mockResponse = {
        data: {
          cmd: [{
            accounts: {
              token: {
                refresh: {
                  data: {
                    access_token: 'new-access-token'
                  }
                }
              }
            }
          }]
        }
      };

      axios.mockResolvedValueOnce(mockResponse);

      // Exécution
      const result = await authApi.checkRefreshToken('123', 'apikey', 'token');

      // Vérifications
      expect(axios).toHaveBeenCalledWith(expect.objectContaining({
        method: 'POST',
        url: expect.stringContaining('ic.php'),
        data: expect.any(Object),
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      }));

      expect(result).toEqual({
        success: true,
        data: {
          access_token: 'new-access-token'
        }
      });
    });

    it('devrait gérer les erreurs lors de la vérification du refresh token', async () => {
      // Configuration
      axios.mockRejectedValueOnce(new Error('Network error'));

      // Exécution
      const result = await authApi.checkRefreshToken('123', 'apikey', 'token');

      // Vérifications
      expect(result).toEqual({
        success: false,
        error: 'Network error'
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
      it('devrait sauvegarder les credentials avec succès', async () => {
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

      it('devrait gérer les erreurs de stockage', async () => {
        SecureStore.setItemAsync.mockRejectedValueOnce(new Error('Storage error'));

        await expect(authApi.saveCredentials(testCredentials))
          .rejects
          .toThrow('errors.errorSavingLoginInfo');

        expect(CustomAlert.show).toHaveBeenCalledWith({
          message: 'errors.errorSavingLoginInfo'
        });
      });
    });

    describe('getCredentials', () => {
      it('devrait récupérer les credentials avec succès', async () => {
        SecureStore.getItemAsync.mockResolvedValueOnce(
          JSON.stringify(testCredentials)
        );

        const result = await authApi.getCredentials();
        expect(result).toEqual(testCredentials);
      });

      it('devrait gérer les erreurs de lecture', async () => {
        SecureStore.getItemAsync.mockRejectedValueOnce(new Error('Read error'));

        const result = await authApi.getCredentials();
        expect(result).toBeNull();
        expect(CustomAlert.show).toHaveBeenCalledWith({
          message: 'errors.errorLoadingLoginInfo'
        });
      });
    });

    describe('getUserRights', () => {
      it('devrait récupérer les droits utilisateur', async () => {
        SecureStore.getItemAsync.mockResolvedValueOnce(
          JSON.stringify(testCredentials)
        );

        const result = await authApi.getUserRights();
        expect(result).toBe('admin_rights');
      });

      it('devrait retourner null si pas de credentials', async () => {
        SecureStore.getItemAsync.mockResolvedValueOnce(null);

        const result = await authApi.getUserRights();
        expect(result).toBeNull();
      });

      it('devrait gérer les erreurs de lecture', async () => {
        SecureStore.getItemAsync.mockRejectedValueOnce(new Error('Read error'));

        const result = await authApi.getUserRights();
        expect(result).toBeNull();
      });
    });
  });
});