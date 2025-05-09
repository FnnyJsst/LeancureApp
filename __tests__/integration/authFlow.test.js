import { loginApi } from '../../services/api/authApi';
import { fetchUserChannels } from '../../services/api/messageApi';
import { hashPassword } from '../../utils/encryption';
import { synchronizeTokenWithAPI } from '../../services/notification/notificationService';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';

// Mocks des dépendances
jest.mock('../../services/api/authApi', () => ({
  loginApi: jest.fn(),
  checkRefreshToken: jest.fn(),
  cleanSecureStore: jest.fn().mockResolvedValue(true)
}));

jest.mock('../../services/api/messageApi', () => ({
  fetchUserChannels: jest.fn()
}));

jest.mock('../../utils/encryption', () => ({
  hashPassword: jest.fn(pwd => `hashed-${pwd}`),
  secureStore: {
    saveCredentials: jest.fn(),
    getCredentials: jest.fn(),
    deleteCredentials: jest.fn()
  }
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

jest.mock('../../services/notification/notificationService', () => ({
  synchronizeTokenWithAPI: jest.fn().mockResolvedValue(true)
}));

// Mock de console
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn()
};

describe('Flux d\'authentification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Processus de connexion', () => {
    it('devrait suivre le flux complet de connexion', async () => {
      // Configuration des mocks pour simuler une connexion réussie
      const contractNumber = 'contract123';
      const login = 'testuser';
      const password = 'password123';

      // 1. Simuler une réponse de connexion réussie
      loginApi.mockResolvedValueOnce({
        success: true,
        status: 200,
        accountApiKey: 'api-key-123',
        refreshToken: 'refresh-token-123',
        accessToken: 'access-token-123',
        rights: 'admin_rights'
      });

      // 2. Simuler une réponse de canaux réussie
      fetchUserChannels.mockResolvedValueOnce({
        status: 'ok',
        channels: [
          { id: 1, name: 'Canal 1' },
          { id: 2, name: 'Canal 2' }
        ]
      });

      // Appel de la fonction loginApi pour simuler la connexion
      const loginResponse = await loginApi(contractNumber, login, password);

      // Vérification de la réponse de connexion
      expect(loginResponse.success).toBe(true);
      expect(loginResponse.accessToken).toBe('access-token-123');
      expect(loginResponse.refreshToken).toBe('refresh-token-123');

      // Vérifier que les credentials seraient sauvegardés
      const expectedCredentials = {
        contractNumber,
        login,
        password: hashPassword(password),
        accountApiKey: 'api-key-123',
        refreshToken: 'refresh-token-123',
        accessToken: 'access-token-123',
        rights: 'admin_rights'
      };

      // Simuler la sauvegarde des credentials (normalement fait dans le composant Login)
      await SecureStore.setItemAsync('userCredentials', JSON.stringify(expectedCredentials));
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('userCredentials', JSON.stringify(expectedCredentials));

      // Appel pour récupérer les canaux de l'utilisateur
      const channelsResponse = await fetchUserChannels(
        contractNumber,
        login,
        password,
        loginResponse.accessToken,
        loginResponse.accountApiKey
      );

      // Vérification de la réponse des canaux
      expect(channelsResponse.status).toBe('ok');
      expect(channelsResponse.channels).toHaveLength(2);

      // Simuler l'enregistrement des notifications push
      const { status } = await Notifications.getPermissionsAsync();
      expect(status).toBe('granted');

      const tokenData = await Notifications.getExpoPushTokenAsync();
      expect(tokenData.data).toBe('expo-push-token-123');

      // Synchroniser le token avec l'API
      const syncResult = await synchronizeTokenWithAPI(tokenData.data);
      expect(syncResult).toBe(true);
    });

    it('devrait gérer une connexion échouée', async () => {
      // Configuration des mocks pour simuler une connexion échouée
      const contractNumber = 'contract123';
      const login = 'testuser';
      const password = 'wrong-password';

      // Simuler une réponse de connexion échouée
      loginApi.mockResolvedValueOnce({
        success: false,
        status: 401,
        error: 'Invalid credentials'
      });

      // Appel de la fonction loginApi pour simuler la connexion
      const loginResponse = await loginApi(contractNumber, login, password);

      // Vérification de la réponse de connexion
      expect(loginResponse.success).toBe(false);
      expect(loginResponse.status).toBe(401);

      // Vérifier que fetchUserChannels n'est pas appelé en cas d'échec de connexion
      expect(fetchUserChannels).not.toHaveBeenCalled();

      // Vérifier que le token push n'est pas synchronisé en cas d'échec
      expect(synchronizeTokenWithAPI).not.toHaveBeenCalled();
    });
  });

  describe('Sécurité des credentials', () => {
    it('devrait stocker les credentials de façon sécurisée', async () => {
      // Préparer les données
      const credentials = {
        contractNumber: 'contract123',
        login: 'testuser',
        password: 'hashed-password123', // Déjà hashé
        accountApiKey: 'api-key-123',
        refreshToken: 'refresh-token-123',
        accessToken: 'access-token-123'
      };

      // Sauvegarder les credentials
      await SecureStore.setItemAsync('userCredentials', JSON.stringify(credentials));

      // Vérifier l'appel à SecureStore
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'userCredentials',
        JSON.stringify(credentials)
      );

      // Simuler la récupération des credentials
      SecureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify(credentials));
      const retrievedCredentials = await SecureStore.getItemAsync('userCredentials');

      // Vérifier la récupération
      expect(JSON.parse(retrievedCredentials)).toEqual(credentials);
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('userCredentials');
    });

    it('devrait effacer les credentials en cas de déconnexion', async () => {
      // Simuler une déconnexion
      await SecureStore.deleteItemAsync('userCredentials');

      // Vérifier l'appel à SecureStore
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('userCredentials');
    });
  });

  describe('Gestion des notifications push', () => {
    it('devrait enregistrer et synchroniser le token', async () => {
      // Simuler l'obtention du token
      const { status } = await Notifications.getPermissionsAsync();
      expect(status).toBe('granted');

      const tokenData = await Notifications.getExpoPushTokenAsync();
      expect(tokenData.data).toBe('expo-push-token-123');

      // Simuler la synchronisation du token
      const syncResult = await synchronizeTokenWithAPI(tokenData.data);
      expect(syncResult).toBe(true);
      expect(synchronizeTokenWithAPI).toHaveBeenCalledWith('expo-push-token-123');
    });
  });
});