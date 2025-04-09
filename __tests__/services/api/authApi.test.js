import * as SecureStore from 'expo-secure-store';
import { saveCredentials, getCredentials, cleanSecureStore } from '../../../services/api/authApi';

// Mock des dépendances
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined)
}));

// Mock pour les utils d'erreurs
jest.mock('../../../utils/errorHandling', () => ({
  handleError: jest.fn(),
  handleApiError: jest.fn(),
  ErrorType: {
    AUTH: 'auth',
    SYSTEM: 'system'
  }
}));

// Mock pour console
global.console = {
  ...console,
  error: jest.fn(),
  log: jest.fn()
};

// Mock pour i18n
global.t = jest.fn(key => key);

describe('authApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveCredentials', () => {
    it('devrait sauvegarder les credentials dans SecureStore', async () => {
      const mockCredentials = {
        contractNumber: '12345',
        login: 'testuser',
        password: 'testpassword',
        accountApiKey: 'apikey123',
        rights: 'admin',
        refreshToken: 'refresh123',
        accessToken: 'access123'
      };

      await saveCredentials(mockCredentials);

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'userCredentials',
        JSON.stringify(mockCredentials)
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'userRights',
        mockCredentials.rights
      );
    });
  });

  describe('getCredentials', () => {
    it('devrait retourner null quand aucun credential n\'est trouvé', async () => {
      SecureStore.getItemAsync.mockResolvedValue(null);

      const result = await getCredentials();

      expect(result).toBeNull();
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('userCredentials');
    });

    it('devrait récupérer et parser les credentials depuis SecureStore', async () => {
      const mockCredentials = {
        contractNumber: '12345',
        login: 'testuser',
        password: 'testpassword'
      };

      SecureStore.getItemAsync.mockResolvedValue(JSON.stringify(mockCredentials));

      const result = await getCredentials();

      expect(result).toEqual(mockCredentials);
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('userCredentials');
    });
  });

  describe('cleanSecureStore', () => {
    it('devrait nettoyer toutes les clés du SecureStore', async () => {
      const result = await cleanSecureStore();

      expect(result).toBe(true);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('userCredentials');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('savedLoginInfo');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('custom_api_url');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('isMessagesHidden');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('userRights');
    });
  });
});