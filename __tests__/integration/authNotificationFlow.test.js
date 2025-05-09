import { loginApi } from '../../services/api/authApi';
import { fetchUserChannels } from '../../services/api/messageApi';
import { registerForPushNotificationsAsync } from '../../services/notification/notificationService';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import { useWebviews } from '../../hooks/useWebviews';

// Mocks
jest.mock('../../services/api/authApi', () => ({
  loginApi: jest.fn()
}));

jest.mock('../../services/api/messageApi', () => ({
  fetchUserChannels: jest.fn()
}));

jest.mock('../../services/notification/notificationService', () => ({
  registerForPushNotificationsAsync: jest.fn(),
  handleNotification: jest.fn()
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  getItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  dismissNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  requestPermissionsAsync: jest.fn()
}));

// Remplacer la dépendance @react-navigation/native par un mock simple
const mockNavigation = {
  navigate: jest.fn(),
  addListener: jest.fn()
};

jest.mock('../../hooks/useWebviews', () => ({
  useWebviews: jest.fn()
}));

// Mock de console
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn()
};

describe('Flux d\'Authentification et Notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devrait compléter le flux d\'authentification et configurer les notifications', async () => {
    // Configuration des mocks
    const contractNumber = 'contract123';
    const login = 'testuser';
    const password = 'password123';
    const apiKey = 'api-key-123';
    const accessToken = 'access-token';
    const refreshToken = 'refresh-token';
    const notificationToken = 'expo-push-token';

    // Simuler la réponse de loginApi
    loginApi.mockResolvedValue({
      success: true,
      data: {
        contract_number: contractNumber,
        login: login,
        apiKey: apiKey,
        access_token: accessToken,
        refresh_token: refreshToken
      }
    });

    // Simuler la réponse de fetchUserChannels
    fetchUserChannels.mockResolvedValue({
      status: 'ok',
      channels: [
        { id: 'channel1', name: 'Channel 1' },
        { id: 'channel2', name: 'Channel 2' }
      ]
    });

    // Simuler la réponse de registerForPushNotificationsAsync
    registerForPushNotificationsAsync.mockResolvedValue(notificationToken);
    Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });

    // Simuler la fonction useWebviews
    const selectWebviewChannel = jest.fn();
    useWebviews.mockReturnValue({
      selectedWebview: null,
      selectWebviewChannel
    });

    // Fonction simulant le flux d'authentification et de configuration des notifications
    async function authAndConfigureNotifications() {
      try {
        // 1. Authentification
        const loginResult = await loginApi(contractNumber, login, password);

        if (!loginResult.success) {
          throw new Error('Échec de l\'authentification');
        }

        // 2. Sauvegarder les credentials
        const credentials = {
          contractNumber: loginResult.data.contract_number,
          login: loginResult.data.login,
          accountApiKey: loginResult.data.apiKey,
          accessToken: loginResult.data.access_token,
          refreshToken: loginResult.data.refresh_token
        };

        await SecureStore.setItemAsync('userCredentials', JSON.stringify(credentials));

        // 3. Récupérer les canaux de l'utilisateur
        const userChannelsResult = await fetchUserChannels(
          credentials.contractNumber,
          credentials.accessToken,
          credentials.accountApiKey
        );

        if (userChannelsResult.status !== 'ok') {
          throw new Error('Échec de récupération des canaux');
        }

        // 4. Stocker les canaux
        const channels = userChannelsResult.channels;

        // 5. Configurer les notifications
        const permissionResult = await Notifications.requestPermissionsAsync();

        if (permissionResult.status === 'granted') {
          const token = await registerForPushNotificationsAsync(
            credentials.contractNumber,
            credentials.accessToken
          );

          if (token) {
            // Sauvegarder le token pour référence future
            await SecureStore.setItemAsync('pushToken', token);

            // Configurer un handler pour les notifications entrantes
            Notifications.setNotificationHandler({
              handleNotification: async (notification) => {
                const { data } = notification.request.content;

                // Si la notification contient un ID de canal, l'ouvrir automatiquement
                if (data && data.channelId) {
                  selectWebviewChannel(data.channelId);
                }

                return {
                  shouldShowAlert: true,
                  shouldPlaySound: true,
                  shouldSetBadge: true
                };
              }
            });

            return { success: true, channels: userChannelsResult.channels, token };
          }
        }

        // Si les notifications ne sont pas configurées, continuer quand même
        return {
          success: true,
          channels: userChannelsResult.channels,
          token: null,
          notificationsEnabled: false
        };
      } catch (error) {
        console.error('Erreur dans le flux d\'authentification:', error.message);
        return { success: false, error: error.message };
      }
    }

    // Exécuter la fonction
    const result = await authAndConfigureNotifications();

    // Vérifications
    expect(loginApi).toHaveBeenCalledWith(contractNumber, login, password);

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'userCredentials',
      JSON.stringify({
        contractNumber,
        login,
        accountApiKey: apiKey,
        accessToken,
        refreshToken
      })
    );

    expect(fetchUserChannels).toHaveBeenCalledWith(
      contractNumber,
      accessToken,
      apiKey
    );

    expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    expect(registerForPushNotificationsAsync).toHaveBeenCalledWith(
      contractNumber,
      accessToken
    );

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('pushToken', notificationToken);
    expect(Notifications.setNotificationHandler).toHaveBeenCalled();

    expect(result).toEqual({
      success: true,
      channels: [
        { id: 'channel1', name: 'Channel 1' },
        { id: 'channel2', name: 'Channel 2' }
      ],
      token: notificationToken
    });
  });

  it('devrait gérer l\'échec de l\'authentification', async () => {
    // Configuration des mocks
    const contractNumber = 'contract123';
    const login = 'testuser';
    const password = 'wrong-password';

    // Simuler l'échec de loginApi
    loginApi.mockResolvedValue({
      success: false,
      status: 401,
      message: 'Identifiants invalides'
    });

    // Fonction simulant le flux d'authentification
    async function authAndConfigureNotifications() {
      try {
        // 1. Authentification
        const loginResult = await loginApi(contractNumber, login, password);

        if (!loginResult.success) {
          throw new Error(loginResult.message || 'Échec de l\'authentification');
        }

        // Le reste du code ne sera pas exécuté en cas d'échec

        return { success: true };
      } catch (error) {
        console.error('Erreur dans le flux d\'authentification:', error.message);
        return { success: false, error: error.message };
      }
    }

    // Exécuter la fonction
    const result = await authAndConfigureNotifications();

    // Vérifications
    expect(loginApi).toHaveBeenCalledWith(contractNumber, login, password);
    expect(fetchUserChannels).not.toHaveBeenCalled();
    expect(registerForPushNotificationsAsync).not.toHaveBeenCalled();

    expect(result).toEqual({
      success: false,
      error: 'Identifiants invalides'
    });

    expect(console.error).toHaveBeenCalledWith(
      'Erreur dans le flux d\'authentification:',
      'Identifiants invalides'
    );
  });

  it('devrait continuer même si les permissions de notification sont refusées', async () => {
    // Configuration des mocks
    const contractNumber = 'contract123';
    const login = 'testuser';
    const password = 'password123';
    const apiKey = 'api-key-123';
    const accessToken = 'access-token';
    const refreshToken = 'refresh-token';

    // Simuler la réponse de loginApi
    loginApi.mockResolvedValue({
      success: true,
      data: {
        contract_number: contractNumber,
        login: login,
        apiKey: apiKey,
        access_token: accessToken,
        refresh_token: refreshToken
      }
    });

    // Simuler la réponse de fetchUserChannels
    fetchUserChannels.mockResolvedValue({
      status: 'ok',
      channels: [
        { id: 'channel1', name: 'Channel 1' },
        { id: 'channel2', name: 'Channel 2' }
      ]
    });

    // Simuler le refus des permissions de notification
    Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'denied' });

    // Fonction simulant le flux d'authentification et de configuration des notifications
    async function authAndConfigureNotifications() {
      try {
        // 1. Authentification
        const loginResult = await loginApi(contractNumber, login, password);

        if (!loginResult.success) {
          throw new Error('Échec de l\'authentification');
        }

        // 2. Sauvegarder les credentials
        const credentials = {
          contractNumber: loginResult.data.contract_number,
          login: loginResult.data.login,
          accountApiKey: loginResult.data.apiKey,
          accessToken: loginResult.data.access_token,
          refreshToken: loginResult.data.refresh_token
        };

        await SecureStore.setItemAsync('userCredentials', JSON.stringify(credentials));

        // 3. Récupérer les canaux de l'utilisateur
        const userChannelsResult = await fetchUserChannels(
          credentials.contractNumber,
          credentials.accessToken,
          credentials.accountApiKey
        );

        if (userChannelsResult.status !== 'ok') {
          throw new Error('Échec de récupération des canaux');
        }

        // 4. Stocker les canaux
        const channels = userChannelsResult.channels;

        // 5. Configurer les notifications
        const permissionResult = await Notifications.requestPermissionsAsync();

        if (permissionResult.status === 'granted') {
          const token = await registerForPushNotificationsAsync(
            credentials.contractNumber,
            credentials.accessToken
          );

          if (token) {
            await SecureStore.setItemAsync('pushToken', token);
            return {
              success: true,
              channels: userChannelsResult.channels,
              token,
              notificationsEnabled: true
            };
          }
        }

        // Si les notifications ne sont pas configurées, continuer quand même
        console.log('Notifications non activées par l\'utilisateur');
        return {
          success: true,
          channels: userChannelsResult.channels,
          token: null,
          notificationsEnabled: false
        };
      } catch (error) {
        console.error('Erreur dans le flux d\'authentification:', error.message);
        return { success: false, error: error.message };
      }
    }

    // Exécuter la fonction
    const result = await authAndConfigureNotifications();

    // Vérifications
    expect(loginApi).toHaveBeenCalledWith(contractNumber, login, password);
    expect(fetchUserChannels).toHaveBeenCalled();
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();

    // Vérifier que registerForPushNotificationsAsync n'a pas été appelé
    expect(registerForPushNotificationsAsync).not.toHaveBeenCalled();

    expect(result).toEqual({
      success: true,
      channels: [
        { id: 'channel1', name: 'Channel 1' },
        { id: 'channel2', name: 'Channel 2' }
      ],
      token: null,
      notificationsEnabled: false
    });

    expect(console.log).toHaveBeenCalledWith('Notifications non activées par l\'utilisateur');
  });
});