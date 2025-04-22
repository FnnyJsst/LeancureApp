import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import CryptoJS from 'crypto-js';
import {
  loginApi,
  saveCredentials,
  getCredentials,
  getUserRights,
  cleanSecureStore,
  checkRefreshToken
} from '../../../services/api/authApi';
import { ENV } from '../../../config/env';
import { createApiRequest } from '../../../services/api/baseApi';

// Mock des dépendances
jest.mock('axios');
jest.mock('expo-secure-store');
jest.mock('../../../config/env', () => ({
  ENV: {
    API_URL: jest.fn().mockResolvedValue('https://api.example.com')
  }
}));
jest.mock('../../../services/api/baseApi', () => ({
  createApiRequest: jest.fn().mockReturnValue({ apiRequestData: 'mocked' })
}));
jest.mock('../../../utils/errorHandling', () => ({
  handleError: jest.fn(),
  ErrorType: {
    AUTH: 'auth',
    SYSTEM: 'system'
  },
  handleApiError: jest.fn()
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
  });

  describe('loginApi', () => {
    it('devrait connecter un utilisateur avec succès', async () => {
      // Préparation des données mock
      const contractNumber = 'contract123';
      const login = 'testuser';
      const password = 'password123';
      const accessToken = '';

      // Mock des réponses API
      // Première réponse pour la connexion
      axios.mockResolvedValueOnce({
        status: 200,
        data: {
          cmd: [{
            accounts: {
              loginmsg: {
                get: {
                  data: {
                    accountapikey: 'api-key-123',
                    refresh_token: 'refresh-token-123',
                    access_token: 'access-token-123',
                    firstname: 'Test',
                    lastname: 'User'
                  }
                }
              }
            }
          }]
        }
      });

      // Deuxième réponse pour les droits utilisateur
      axios.mockResolvedValueOnce({
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
      });

      // Exécution de la fonction
      const result = await loginApi(contractNumber, login, password, accessToken);

      // Vérifications
      expect(ENV.API_URL).toHaveBeenCalled();
      expect(createApiRequest).toHaveBeenCalledTimes(2);
      expect(axios).toHaveBeenCalledTimes(2);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('userCredentials', expect.any(String));
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('userRights', 'admin_rights');

      // Vérification du résultat
      expect(result).toEqual({
        status: 200,
        accountApiKey: 'api-key-123',
        refreshToken: 'refresh-token-123',
        accessToken: 'access-token-123',
        firstname: 'Test',
        lastname: 'User',
        rights: 'admin_rights',
        success: true
      });
    });

    it('devrait échouer si la réponse API est incorrecte', async () => {
      // Préparation des données
      const contractNumber = 'contract123';
      const login = 'testuser';
      const password = 'password123';

      // Mock de la réponse API incorrecte
      axios.mockResolvedValueOnce({
        status: 200,
        data: {
          cmd: [{
            // Réponse sans accounts.loginmsg.get.data
          }]
        }
      });

      // Exécution de la fonction
      const result = await loginApi(contractNumber, login, password);

      // Vérifications
      expect(result.success).toBe(false);
    });

    it('devrait gérer les erreurs lors de la connexion', async () => {
      // Préparation des données
      const contractNumber = 'contract123';
      const login = 'testuser';
      const password = 'password123';

      // Mock d'une erreur réseau
      axios.mockRejectedValueOnce(new Error('Network error'));

      // Exécution de la fonction
      const result = await loginApi(contractNumber, login, password);

      // Vérifications
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('checkRefreshToken', () => {
    it('devrait vérifier un refresh token avec succès', async () => {
      // Préparation des données mock
      const contractNumber = 'contract123';
      const accountApiKey = 'api-key-123';
      const refreshToken = 'refresh-token-123';

      // Mock de CryptoJS.HmacSHA256
      const originalHmacSHA256 = CryptoJS.HmacSHA256;
      CryptoJS.HmacSHA256 = jest.fn().mockReturnValue({
        toString: jest.fn().mockReturnValue('hashed-signature')
      });

      // Mock de la réponse API
      axios.mockResolvedValueOnce({
        status: 200,
        data: {
          cmd: [{
            accounts: {
              token: {
                refresh: {
                  data: {
                    refresh_token: 'new-refresh-token-123',
                    access_token: 'new-access-token-123'
                  }
                }
              }
            }
          }]
        }
      });

      // Exécution de la fonction
      const result = await checkRefreshToken(contractNumber, accountApiKey, refreshToken);

      // Vérifications
      expect(ENV.API_URL).toHaveBeenCalled();
      expect(axios).toHaveBeenCalledWith({
        method: 'POST',
        url: 'https://api.example.com',
        data: expect.objectContaining({
          "api-contract-number": contractNumber,
          "api-signature": "hashed-signature",
          "cmd": [expect.objectContaining({
            accounts: {
              token: {
                refresh: {
                  accountapikey: accountApiKey,
                  refresh_token: refreshToken
                }
              }
            }
          })]
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
        validateStatus: expect.any(Function)
      });

      // Vérification du résultat
      expect(result).toEqual({
        success: true,
        data: {
          refresh_token: 'new-refresh-token-123',
          access_token: 'new-access-token-123'
        }
      });

      // Restaurer l'original
      CryptoJS.HmacSHA256 = originalHmacSHA256;
    });

    it('devrait retourner une erreur si le refresh token est invalide', async () => {
      // Préparation des données mock
      const contractNumber = 'contract123';
      const accountApiKey = 'api-key-123';
      const refreshToken = 'invalid-refresh-token';

      // Mock de CryptoJS.HmacSHA256
      const originalHmacSHA256 = CryptoJS.HmacSHA256;
      CryptoJS.HmacSHA256 = jest.fn().mockReturnValue({
        toString: jest.fn().mockReturnValue('hashed-signature')
      });

      // Mock de la réponse API indiquant un refresh token invalide
      axios.mockResolvedValueOnce({
        status: 200,
        data: {
          cmd: [{
            accounts: {
              token: {
                refresh: {
                  // Pas de données retournées
                }
              }
            }
          }]
        }
      });

      // Exécution de la fonction
      const result = await checkRefreshToken(contractNumber, accountApiKey, refreshToken);

      // Vérifications
      expect(result.success).toBe(false);

      // Restaurer l'original
      CryptoJS.HmacSHA256 = originalHmacSHA256;
    });

    it('devrait gérer les erreurs lors de la vérification du refresh token', async () => {
      // Préparation des données mock
      const contractNumber = 'contract123';
      const accountApiKey = 'api-key-123';
      const refreshToken = 'refresh-token-123';

      // Mock de CryptoJS.HmacSHA256
      const originalHmacSHA256 = CryptoJS.HmacSHA256;
      CryptoJS.HmacSHA256 = jest.fn().mockReturnValue({
        toString: jest.fn().mockReturnValue('hashed-signature')
      });

      // Mock d'une erreur réseau
      axios.mockRejectedValueOnce(new Error('Network error'));

      // Exécution de la fonction
      const result = await checkRefreshToken(contractNumber, accountApiKey, refreshToken);

      // Vérifications
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      // Restaurer l'original
      CryptoJS.HmacSHA256 = originalHmacSHA256;
    });
  });

  describe('saveCredentials & getCredentials', () => {
    it('devrait sauvegarder et récupérer les informations d\'identification', async () => {
      // Préparation des données mock
      const credentials = {
        contractNumber: 'contract123',
        login: 'testuser',
        password: 'password123',
        accountApiKey: 'api-key-123',
        rights: 'admin_rights',
        refreshToken: 'refresh-token-123',
        accessToken: 'access-token-123'
      };

      // Mock de SecureStore.setItemAsync pour saveCredentials
      SecureStore.setItemAsync.mockResolvedValue(undefined);

      // Exécution de saveCredentials
      await saveCredentials(credentials);

      // Vérifications pour saveCredentials
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('userCredentials', JSON.stringify(credentials));
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('userRights', 'admin_rights');

      // Mock de SecureStore.getItemAsync pour getCredentials
      SecureStore.getItemAsync.mockResolvedValue(JSON.stringify(credentials));

      // Exécution de getCredentials
      const result = await getCredentials();

      // Vérifications pour getCredentials
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('userCredentials');
      expect(result).toEqual(credentials);
    });

    it('devrait gérer les erreurs lors de la sauvegarde des informations d\'identification', async () => {
      // Préparation des données mock
      const credentials = {
        contractNumber: 'contract123',
        login: 'testuser',
        password: 'password123'
      };

      // Mock d'une erreur lors de la sauvegarde
      SecureStore.setItemAsync.mockRejectedValue(new Error('Storage error'));

      // Vérifications
      await expect(saveCredentials(credentials)).rejects.toThrow();
    });

    it('devrait gérer les erreurs lors de la récupération des informations d\'identification', async () => {
      // Mock d'une erreur lors de la récupération
      SecureStore.getItemAsync.mockRejectedValue(new Error('Storage error'));

      // Vérifications
      await expect(getCredentials()).rejects.toThrow();
    });
  });

  describe('getUserRights', () => {
    it('devrait récupérer les droits de l\'utilisateur', async () => {
      // Mock des credentials avec des droits
      const credentials = {
        contractNumber: 'contract123',
        login: 'testuser',
        rights: 'admin_rights'
      };

      // Mock de getCredentials en utilisant le mock de SecureStore
      SecureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify(credentials));

      // Exécution de getUserRights
      const result = await getUserRights();

      // Vérifications
      expect(result).toBe('admin_rights');
    });

    it('devrait retourner null si aucun droit n\'est trouvé', async () => {
      // Mock de getCredentials retournant des credentials sans droits
      SecureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify({
        contractNumber: 'contract123',
        login: 'testuser'
      }));

      // Exécution de getUserRights
      const result = await getUserRights();

      // Vérifications
      expect(result).toBeNull();
    });

    it('devrait gérer les erreurs et retourner null', async () => {
      // Mock de getCredentials lançant une erreur
      const originalGetCredentials = getCredentials;
      global.getCredentials = jest.fn().mockRejectedValue(new Error('Error getting credentials'));

      // Exécution de getUserRights
      const result = await getUserRights();

      // Vérifications
      expect(result).toBeNull();

      // Restaurer l'original
      global.getCredentials = originalGetCredentials;
    });
  });

  describe('cleanSecureStore', () => {
    it('devrait nettoyer le SecureStore', async () => {
      // Mock de SecureStore.deleteItemAsync
      SecureStore.deleteItemAsync.mockResolvedValue(undefined);

      // Exécution de cleanSecureStore
      const result = await cleanSecureStore();

      // Vérifications
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(5); // 5 clés à nettoyer
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('userCredentials');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('savedLoginInfo');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('custom_api_url');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('isMessagesHidden');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('userRights');
      expect(result).toBe(true);
    });

    it('devrait gérer les erreurs individuelles lors du nettoyage', async () => {
      // Mock de SecureStore.deleteItemAsync pour simuler une erreur sur une clé spécifique
      SecureStore.deleteItemAsync.mockImplementation((key) => {
        if (key === 'userCredentials') {
          return Promise.reject(new Error('Error deleting userCredentials'));
        }
        return Promise.resolve();
      });

      // Exécution de cleanSecureStore
      const result = await cleanSecureStore();

      // Vérifications
      expect(console.log).toHaveBeenCalledWith(
        '⚠️ Error deleting key \'userCredentials\':',
        'Error deleting userCredentials'
      );
      expect(result).toBe(true); // Devrait quand même retourner true
    });

    it('devrait gérer les erreurs générales lors du nettoyage', async () => {
      // Créer une erreur qui sera lancée avant même d'essayer de supprimer les clés
      const originalConsoleLog = console.log;
      console.log = jest.fn().mockImplementation(() => {
        throw new Error('Console error');
      });

      // Exécution de cleanSecureStore
      const result = await cleanSecureStore();

      // Vérifications
      expect(result).toBe(false);

      // Restaurer console
      console.log = originalConsoleLog;
    });
  });
});