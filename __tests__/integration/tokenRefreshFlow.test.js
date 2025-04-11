import { loginApi, checkRefreshToken } from '../../services/api/authApi';
import { fetchChannelMessages } from '../../services/api/messageApi';
import * as SecureStore from 'expo-secure-store';

// Mocks des dépendances
jest.mock('../../services/api/authApi', () => ({
  loginApi: jest.fn(),
  checkRefreshToken: jest.fn(),
  cleanSecureStore: jest.fn().mockResolvedValue(true)
}));

jest.mock('../../services/api/messageApi', () => ({
  fetchChannelMessages: jest.fn()
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  getItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined)
}));

// Mock de console
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn()
};

describe('Flux de rafraîchissement des tokens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devrait rafraîchir automatiquement un token expiré et réessayer la requête', async () => {
    // Configuration des mocks
    const contractNumber = 'contract123';
    const login = 'testuser';
    const apiKey = 'api-key-123';
    const oldAccessToken = 'expired-access-token';
    const oldRefreshToken = 'old-refresh-token';
    const channelId = 'channel123';

    // Stocker les credentials existants
    const storedCredentials = {
      contractNumber,
      login,
      accountApiKey: apiKey,
      accessToken: oldAccessToken,
      refreshToken: oldRefreshToken
    };

    SecureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify(storedCredentials));

    // 1. Simuler une première requête avec un token expiré (401)
    fetchChannelMessages.mockResolvedValueOnce({
      status: 'error',
      code: 401,
      message: 'Token expired'
    });

    // 2. Simuler une réponse de rafraîchissement de token réussie
    const newRefreshToken = 'new-refresh-token';
    const newAccessToken = 'new-access-token';

    checkRefreshToken.mockResolvedValueOnce({
      success: true,
      data: {
        refresh_token: newRefreshToken,
        access_token: newAccessToken
      }
    });

    // 3. Simuler une seconde requête réussie avec le nouveau token
    fetchChannelMessages.mockResolvedValueOnce({
      status: 'ok',
      messages: [
        { id: 'msg1', content: 'Message 1' },
        { id: 'msg2', content: 'Message 2' }
      ]
    });

    // Simuler la fonction qui gère le rafraîchissement du token
    async function fetchMessagesWithTokenRefresh() {
      // Récupérer les credentials stockés
      const credentialsJson = await SecureStore.getItemAsync('userCredentials');
      const credentials = JSON.parse(credentialsJson);

      // Première tentative avec le token actuel
      let result = await fetchChannelMessages(
        credentials.contractNumber,
        channelId,
        credentials.accessToken,
        credentials.accountApiKey
      );

      // Si le token est expiré (401), essayer de le rafraîchir
      if (result.code === 401) {
        console.log('Token expiré, tentative de rafraîchissement');

        // Rafraîchir le token
        const refreshResult = await checkRefreshToken(
          credentials.contractNumber,
          credentials.accountApiKey,
          credentials.refreshToken
        );

        if (refreshResult.success) {
          // Mettre à jour les credentials stockés avec les nouveaux tokens
          const updatedCredentials = {
            ...credentials,
            accessToken: refreshResult.data.access_token,
            refreshToken: refreshResult.data.refresh_token
          };

          await SecureStore.setItemAsync('userCredentials', JSON.stringify(updatedCredentials));

          // Réessayer la requête avec le nouveau token
          result = await fetchChannelMessages(
            credentials.contractNumber,
            channelId,
            updatedCredentials.accessToken,
            credentials.accountApiKey
          );
        }
      }

      return result;
    }

    // Exécuter la fonction
    const finalResult = await fetchMessagesWithTokenRefresh();

    // Vérifications
    expect(fetchChannelMessages).toHaveBeenCalledTimes(2);

    // Première appel avec l'ancien token
    expect(fetchChannelMessages).toHaveBeenNthCalledWith(
      1,
      contractNumber,
      channelId,
      oldAccessToken,
      apiKey
    );

    // Vérifier que checkRefreshToken a été appelé
    expect(checkRefreshToken).toHaveBeenCalledWith(
      contractNumber,
      apiKey,
      oldRefreshToken
    );

    // Vérifier que les credentials ont été mis à jour
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'userCredentials',
      JSON.stringify({
        ...storedCredentials,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      })
    );

    // Vérifier le second appel avec le nouveau token
    expect(fetchChannelMessages).toHaveBeenNthCalledWith(
      2,
      contractNumber,
      channelId,
      newAccessToken,
      apiKey
    );

    // Vérifier le résultat final
    expect(finalResult.status).toBe('ok');
    expect(finalResult.messages).toHaveLength(2);
  });

  it('devrait gérer l\'échec du rafraîchissement du token', async () => {
    // Configuration des mocks
    const contractNumber = 'contract123';
    const login = 'testuser';
    const apiKey = 'api-key-123';
    const oldAccessToken = 'expired-access-token';
    const oldRefreshToken = 'invalid-refresh-token';
    const channelId = 'channel123';

    // Stocker les credentials existants
    const storedCredentials = {
      contractNumber,
      login,
      accountApiKey: apiKey,
      accessToken: oldAccessToken,
      refreshToken: oldRefreshToken
    };

    SecureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify(storedCredentials));

    // 1. Simuler une première requête avec un token expiré (401)
    fetchChannelMessages.mockResolvedValueOnce({
      status: 'error',
      code: 401,
      message: 'Token expired'
    });

    // 2. Simuler une réponse de rafraîchissement de token échouée
    checkRefreshToken.mockResolvedValueOnce({
      success: false,
      status: 400,
      message: 'Invalid refresh token'
    });

    // Simuler la fonction qui gère le rafraîchissement du token
    async function fetchMessagesWithTokenRefresh() {
      // Récupérer les credentials stockés
      const credentialsJson = await SecureStore.getItemAsync('userCredentials');
      const credentials = JSON.parse(credentialsJson);

      // Première tentative avec le token actuel
      let result = await fetchChannelMessages(
        credentials.contractNumber,
        channelId,
        credentials.accessToken,
        credentials.accountApiKey
      );

      // Si le token est expiré (401), essayer de le rafraîchir
      if (result.code === 401) {
        console.log('Token expiré, tentative de rafraîchissement');

        // Rafraîchir le token
        const refreshResult = await checkRefreshToken(
          credentials.contractNumber,
          credentials.accountApiKey,
          credentials.refreshToken
        );

        if (refreshResult.success) {
          // Mettre à jour les credentials stockés avec les nouveaux tokens
          const updatedCredentials = {
            ...credentials,
            accessToken: refreshResult.data.access_token,
            refreshToken: refreshResult.data.refresh_token
          };

          await SecureStore.setItemAsync('userCredentials', JSON.stringify(updatedCredentials));

          // Réessayer la requête avec le nouveau token
          result = await fetchChannelMessages(
            credentials.contractNumber,
            channelId,
            updatedCredentials.accessToken,
            credentials.accountApiKey
          );
        } else {
          // Le rafraîchissement a échoué, renvoyer une erreur
          console.error('Échec du rafraîchissement du token');
          result = {
            status: 'error',
            code: 403,
            message: 'Session expirée, veuillez vous reconnecter'
          };
        }
      }

      return result;
    }

    // Exécuter la fonction
    const finalResult = await fetchMessagesWithTokenRefresh();

    // Vérifications
    expect(fetchChannelMessages).toHaveBeenCalledTimes(1);
    expect(checkRefreshToken).toHaveBeenCalledWith(
      contractNumber,
      apiKey,
      oldRefreshToken
    );

    // Vérifier que le résultat indique une erreur d'authentification
    expect(finalResult.status).toBe('error');
    expect(finalResult.code).toBe(403);
    expect(finalResult.message).toBe('Session expirée, veuillez vous reconnecter');

    // Vérifier que console.error a été appelé
    expect(console.error).toHaveBeenCalledWith('Échec du rafraîchissement du token');
  });
});