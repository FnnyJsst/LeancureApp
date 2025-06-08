import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { loginApi } from '../../services/api/authApi';
import { fetchUserChannels } from '../../services/api/messageApi';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import { synchronizeTokenWithAPI } from '../../services/notification/notificationService';
import Login from '../../screens/messages/login/Login';
import * as realAuthApi from '../../services/api/authApi';

// Mocks
jest.mock('../../services/api/authApi');
jest.mock('../../services/api/messageApi');
jest.mock('expo-secure-store');
jest.mock('../../services/notification/notificationService', () => ({
  synchronizeTokenWithAPI: jest.fn().mockResolvedValue(true),
}));

// Configuration globale pour les tests
beforeAll(() => {
  // Configuration des mocks globaux
  jest.useRealTimers();
});

afterAll(() => {
  jest.useRealTimers();
});

afterEach(() => {
  jest.clearAllMocks();
});

// Configuration globale pour les timeouts
jest.setTimeout(30000);

describe('Connection Process', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configuration des mocks de Notifications
    Notifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
    Notifications.getExpoPushTokenAsync.mockResolvedValue({ data: 'expo-push-token-123' });
    Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });

    // Mock par défaut de SecureStore
    SecureStore.getItemAsync.mockResolvedValue(null);
    SecureStore.setItemAsync.mockResolvedValue(undefined);
    SecureStore.deleteItemAsync.mockResolvedValue(undefined);
  });

  it('should follow the complete connection flow', async () => {
    const contractNumber = 'contract123';
    const login = 'testuser';
    const password = 'password123';
    const mockNavigate = jest.fn();

    // Mock des réponses API
    loginApi.mockResolvedValueOnce({
      success: true,
      status: 200,
      accountApiKey: 'api-key-123',
      refreshToken: 'refresh-token-123',
      accessToken: 'access-token-123',
      rights: 'admin_rights'
    });

    fetchUserChannels.mockResolvedValueOnce({
      status: 'ok',
      channels: [
        { id: 1, name: 'Channel 1' },
        { id: 2, name: 'Channel 2' }
      ]
    });

    const { getByTestId, queryByTestId } = render(<Login onNavigate={mockNavigate} />);

    // Attendre que le composant soit complètement chargé
    await waitFor(() => {
      expect(queryByTestId('login-screen')).toBeTruthy();
    }, { timeout: 5000 });

    // Remplir le formulaire
    fireEvent.changeText(getByTestId('contract-number-input'), contractNumber);
    fireEvent.changeText(getByTestId('username-input'), login);
    fireEvent.changeText(getByTestId('password-input'), password);

    // Démarrer la connexion
    fireEvent.press(getByTestId('submit-button'));

    // Vérifier les appels API et la navigation
    await waitFor(() => {
      expect(loginApi).toHaveBeenCalledWith(contractNumber, login, password, '');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'userCredentials',
        expect.stringContaining(contractNumber)
      );
      expect(fetchUserChannels).toHaveBeenCalled();
      expect(Notifications.getPermissionsAsync).toHaveBeenCalled();
      expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalled();
      expect(synchronizeTokenWithAPI).toHaveBeenCalledWith('expo-push-token-123');
      expect(mockNavigate).toHaveBeenCalledWith('CHAT');
    }, { timeout: 5000 });
  });

  it('should handle notification permissions correctly during login', async () => {
    const contractNumber = 'contract123';
    const login = 'testuser';
    const password = 'password123';
    const mockNavigate = jest.fn();

    // Mock des réponses API
    loginApi.mockResolvedValueOnce({
      success: true,
      status: 200,
      accountApiKey: 'api-key-123',
      refreshToken: 'refresh-token-123',
      accessToken: 'access-token-123',
      rights: 'admin_rights'
    });

    fetchUserChannels.mockResolvedValueOnce({
      status: 'ok',
      channels: [
        { id: 1, name: 'Channel 1' },
        { id: 2, name: 'Channel 2' }
      ]
    });

    const { getByTestId, queryByTestId } = render(<Login onNavigate={mockNavigate} />);

    // Attendre que le composant soit complètement chargé
    await waitFor(() => {
      expect(queryByTestId('login-screen')).toBeTruthy();
    }, { timeout: 5000 });

    // Remplir le formulaire et soumettre
    fireEvent.changeText(getByTestId('contract-number-input'), contractNumber);
    fireEvent.changeText(getByTestId('username-input'), login);
    fireEvent.changeText(getByTestId('password-input'), password);
    fireEvent.press(getByTestId('submit-button'));

    // Vérifier les appels de notification
    await waitFor(() => {
      expect(Notifications.getPermissionsAsync).toHaveBeenCalled();
      expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalled();
      expect(synchronizeTokenWithAPI).toHaveBeenCalledWith('expo-push-token-123');
    }, { timeout: 5000 });
  });

  it('should handle notification permission denial', async () => {
    const mockNavigate = jest.fn();

    // Mock du refus des permissions
    Notifications.getPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });
    Notifications.requestPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });

    // Mock des réponses API
    loginApi.mockResolvedValueOnce({
      success: true,
      status: 200,
      accountApiKey: 'api-key-123',
      refreshToken: 'refresh-token-123',
      accessToken: 'access-token-123'
    });

    fetchUserChannels.mockResolvedValueOnce({
      status: 'ok',
      channels: []
    });

    const { getByTestId, queryByTestId } = render(<Login onNavigate={mockNavigate} />);

    // Attendre que le composant soit complètement chargé
    await waitFor(() => {
      expect(queryByTestId('login-screen')).toBeTruthy();
    }, { timeout: 5000 });

    // Remplir le formulaire et soumettre
    fireEvent.changeText(getByTestId('contract-number-input'), 'contract123');
    fireEvent.changeText(getByTestId('username-input'), 'testuser');
    fireEvent.changeText(getByTestId('password-input'), 'password123');
    fireEvent.press(getByTestId('submit-button'));

    // Vérifier la navigation et l'absence d'appel à getExpoPushTokenAsync
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('CHAT');
    }, { timeout: 5000 });

    expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
  });
});

describe('Login Component Loading States', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock des dépendances nécessaires pour le composant Login
    Notifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
    Notifications.getExpoPushTokenAsync.mockResolvedValue({ data: 'expo-push-token-123' });
    SecureStore.getItemAsync.mockResolvedValue(null);
  });

  it('should show loading state during login', async () => {
    const mockNavigate = jest.fn();

    // Mock de la réponse de loginApi
    loginApi.mockResolvedValueOnce({
      success: true,
      status: 200,
      accountApiKey: 'api-key-123',
      refreshToken: 'refresh-token-123',
      accessToken: 'access-token-123'
    });

    fetchUserChannels.mockResolvedValueOnce({
      status: 'ok',
      channels: []
    });

    const { getByTestId, queryByTestId } = render(<Login onNavigate={mockNavigate} />);

    // Attendre que le composant soit complètement chargé
    await waitFor(() => {
      expect(queryByTestId('login-screen')).toBeTruthy();
    }, { timeout: 5000 });

    // Remplir le formulaire et soumettre
    fireEvent.changeText(getByTestId('contract-number-input'), 'contract123');
    fireEvent.changeText(getByTestId('username-input'), 'testuser');
    fireEvent.changeText(getByTestId('password-input'), 'password123');
    fireEvent.press(getByTestId('submit-button'));

    // Vérifier que le bouton est en état de chargement
    expect(getByTestId('spinner')).toBeTruthy();

    // Attendre la fin du chargement et vérifier la navigation
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('CHAT');
    }, { timeout: 5000 });
  });
});

describe('Stockage sécurisé des credentials', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    SecureStore.getItemAsync.mockResolvedValue(null);
    SecureStore.setItemAsync.mockResolvedValue(undefined);
    SecureStore.deleteItemAsync.mockResolvedValue(undefined);
  });

  it('devrait stocker les credentials de manière sécurisée avec le bon format', async () => {
    const contractNumber = 'contract123';
    const login = 'testuser';
    const password = 'password123';
    const mockNavigate = jest.fn();

    loginApi.mockResolvedValueOnce({
      success: true,
      status: 200,
      accountApiKey: 'api-key-123',
      refreshToken: 'refresh-token-123',
      accessToken: 'access-token-123',
      rights: 'admin_rights'
    });

    fetchUserChannels.mockResolvedValueOnce({
      status: 'ok',
      channels: []
    });

    const { getByTestId } = render(<Login onNavigate={mockNavigate} />);

    // Attendre que le composant soit complètement chargé
    await waitFor(() => {
      expect(getByTestId('login-screen')).toBeTruthy();
    });

    // Remplir et soumettre le formulaire
    fireEvent.changeText(getByTestId('contract-number-input'), contractNumber);
    fireEvent.changeText(getByTestId('username-input'), login);
    fireEvent.changeText(getByTestId('password-input'), password);
    fireEvent.press(getByTestId('submit-button'));

    // Vérifier le format des données stockées
    await waitFor(() => {
      // Vérifier que les credentials sont stockés avec le bon format
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'userCredentials',
        expect.stringMatching(/^{"contractNumber":"contract123","login":"testuser","password":"[a-f0-9]{64}","accountApiKey":"api-key-123","refreshToken":"refresh-token-123","accessToken":"access-token-123"}$/)
      );
    });
  });

  it('devrait gérer les erreurs de stockage sécurisé', async () => {
    const mockNavigate = jest.fn();
    const mockError = new Error('Erreur de stockage');
    
    // Simuler une erreur de stockage
    SecureStore.setItemAsync.mockRejectedValueOnce(mockError);

    loginApi.mockResolvedValueOnce({
      success: true,
      status: 200,
      accountApiKey: 'api-key-123',
      refreshToken: 'refresh-token-123',
      accessToken: 'access-token-123'
    });

    const { getByTestId, getByText } = render(<Login onNavigate={mockNavigate} />);

    // Attendre que le composant soit complètement chargé
    await waitFor(() => {
      expect(getByTestId('login-screen')).toBeTruthy();
    });

    // Remplir et soumettre le formulaire
    fireEvent.changeText(getByTestId('contract-number-input'), 'contract123');
    fireEvent.changeText(getByTestId('username-input'), 'testuser');
    fireEvent.changeText(getByTestId('password-input'), 'password123');
    fireEvent.press(getByTestId('submit-button'));

    // Vérifier que l'erreur est affichée
    await waitFor(() => {
      expect(getByTestId('custom-alert')).toBeTruthy();
    });
  });

  it('devrait sauvegarder les credentials pour la connexion simplifiée', async () => {
    const mockNavigate = jest.fn();
    const { getByTestId } = render(<Login onNavigate={mockNavigate} />);

    // Attendre que le composant soit complètement chargé
    await waitFor(() => {
      expect(getByTestId('login-screen')).toBeTruthy();
    });

    // Remplir le formulaire
    fireEvent.changeText(getByTestId('contract-number-input'), 'contract123');
    fireEvent.changeText(getByTestId('username-input'), 'testuser');
    fireEvent.changeText(getByTestId('password-input'), 'password123');
    
    // Cocher la case "Se souvenir de moi"
    fireEvent.press(getByTestId('remember-me-checkbox'));

    // Simuler une connexion réussie
    loginApi.mockResolvedValueOnce({
      success: true,
      status: 200,
      accountApiKey: 'api-key-123',
      refreshToken: 'refresh-token-123',
      accessToken: 'access-token-123'
    });

    fetchUserChannels.mockResolvedValueOnce({
      status: 'ok',
      channels: []
    });

    // Soumettre le formulaire
    fireEvent.press(getByTestId('submit-button'));

    // Vérifier que les informations de connexion sont sauvegardées
    await waitFor(() => {
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'savedLoginInfo',
        expect.stringMatching(/^{"contractNumber":"contract123","login":"testuser","password":"password123","wasChecked":true}$/)
      );
    });
  });

  it('devrait nettoyer les credentials lors du retour au menu', async () => {
    const mockNavigate = jest.fn();
    const { getByTestId } = render(<Login onNavigate={mockNavigate} />);

    // Attendre que le composant soit complètement chargé
    await waitFor(() => {
      expect(getByTestId('login-screen')).toBeTruthy();
    });

    // Cliquer sur le bouton de retour
    fireEvent.press(getByTestId('login-back-button'));

    // Vérifier que la navigation est appelée
    expect(mockNavigate).toHaveBeenCalledWith('APP_MENU');
  });
});
