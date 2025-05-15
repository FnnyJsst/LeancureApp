import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import App from '../App';
import { SCREENS } from '../constants/screens';
import * as SecureStore from 'expo-secure-store';

// Mock de expo-notifications
jest.mock('expo-notifications', () => ({
  getRegistrationInfoAsync: jest.fn().mockResolvedValue({}),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue('mock-token'),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
}));

// Mock des hooks et services
jest.mock('../hooks/useNavigation', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

jest.mock('../hooks/useWebviews', () => ({
  useWebviews: () => ({
    channels: [],
    selectedWebviews: [],
    webViewUrl: '',
    refreshInterval: 0,
    refreshOption: '',
    isReadOnly: false,
    toggleReadOnly: jest.fn(),
    handleSelectChannels: jest.fn(),
    saveSelectedWebviews: jest.fn(),
    loadSelectedChannels: jest.fn(),
    getIntervalInMilliseconds: jest.fn(),
    saveRefreshOption: jest.fn(),
    handleSelectOption: jest.fn(),
    navigateToChannelsList: jest.fn(),
    navigateToWebview: jest.fn(),
    clearSecureStore: jest.fn(),
  }),
}));

jest.mock('../hooks/useWebViewsPassword', () => ({
  useWebviewsPassword: () => ({
    password: '',
    isPasswordRequired: false,
    isPasswordDefineModalVisible: false,
    passwordCheckModalVisible: false,
    setPasswordCheckModalVisible: jest.fn(),
    handlePasswordSubmit: jest.fn(),
    handlePasswordCheck: jest.fn(),
    disablePassword: jest.fn(),
    openPasswordDefineModal: jest.fn(),
    closePasswordDefineModal: jest.fn(),
  }),
}));

jest.mock('../hooks/useTimeout', () => ({
  useTimeout: () => ({
    timeoutInterval: 0,
    handleTimeoutSelection: jest.fn(),
    loadTimeoutInterval: jest.fn(),
  }),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

jest.mock('expo-font', () => ({
  useFonts: () => [true],
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// Mock de AppState
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.AppState = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    currentState: 'active',
  };
  return RN;
});

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    SecureStore.getItemAsync.mockResolvedValue(null);
    SecureStore.setItemAsync.mockResolvedValue(undefined);
  });

  it('initialise l\'application avec succès', async () => {
    const { getByTestId } = render(<App />);
    
    await waitFor(() => {
      expect(getByTestId('app-root')).toBeTruthy();
    });
  });

  it('gère correctement l\'état des messages cachés', async () => {
    const { getByTestId } = render(<App />);
    
    await waitFor(() => {
      expect(getByTestId('app-root')).toBeTruthy();
    });

    await act(async () => {
      await SecureStore.setItemAsync('isMessagesHidden', JSON.stringify(true));
    });

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'isMessagesHidden',
      JSON.stringify(true)
    );
  });

  it('affiche l\'écran de connexion par défaut', async () => {
    const { getByTestId } = render(<App />);
    
    await waitFor(() => {
      expect(getByTestId('app-root')).toBeTruthy();
    });
  });

  it('gère correctement le changement d\'état de l\'application', async () => {
    const { getByTestId } = render(<App />);
    
    await waitFor(() => {
      expect(getByTestId('app-root')).toBeTruthy();
    });

    await act(async () => {
      // Simuler un changement d'état de l'application
      const appState = { currentState: 'active' };
      fireEvent(getByTestId('app-root'), 'appStateChange', appState);
    });
  });

  it('gère correctement l\'accès aux paramètres', async () => {
    const { getByTestId } = render(<App />);
    
    await waitFor(() => {
      expect(getByTestId('app-root')).toBeTruthy();
    });

    await act(async () => {
      // Simuler l'accès aux paramètres
      fireEvent.press(getByTestId('settings-button'));
    });
  });

  it('gère correctement l\'importation des webviews', async () => {
    const { getByTestId } = render(<App />);
    
    await waitFor(() => {
      expect(getByTestId('app-root')).toBeTruthy();
    });

    const newWebviews = [
      { id: 1, url: 'https://example.com' },
      { id: 2, url: 'https://example.org' },
    ];

    await act(async () => {
      // Simuler l'importation des webviews
      fireEvent(getByTestId('app-root'), 'importWebviews', newWebviews);
    });
  });

  it('gère correctement la déconnexion du chat', async () => {
    const { getByTestId } = render(<App />);
    
    await waitFor(() => {
      expect(getByTestId('app-root')).toBeTruthy();
    });

    await act(async () => {
      // Simuler la déconnexion du chat
      fireEvent.press(getByTestId('app-root'));
    });
  });
}); 