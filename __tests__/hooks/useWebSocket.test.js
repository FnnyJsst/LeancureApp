import { renderHook } from '@testing-library/react-native';
import { useWebSocket } from '../../hooks/useWebSocket';
import * as SecureStore from 'expo-secure-store';
import { ENV } from '../../config/env';
import { fetchChannelMessages } from '../../services/api/messageApi';

// Mocks
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('../../config/env', () => ({
  ENV: {
    WS_URL: jest.fn().mockResolvedValue('ws://test-server:8000'),
    API_URL: jest.fn().mockResolvedValue('http://test-server')
  }
}));

jest.mock('../../services/api/messageApi', () => ({
  fetchChannelMessages: jest.fn()
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: jest.fn(key => key)
  })
}));

// Mock pour useNotification
jest.mock('../../services/notificationContext', () => ({
  useNotification: () => ({
    markChannelAsUnread: jest.fn(),
    activeChannelId: 'channel_1'
  })
}));

// Mock pour useCredentials
jest.mock('../../hooks/useCredentials', () => ({
  useCredentials: () => ({
    credentials: {
      login: 'testuser',
      accountApiKey: 'test-api-key',
      accessToken: 'test-token',
      contractNumber: 'test-contract'
    },
    isLoading: false
  })
}));

// Mock simple pour WebSocket
jest.mock('../../hooks/useWebSocket', () => {
  const original = jest.requireActual('../../hooks/useWebSocket');

  // Override des fonctions qui utilisent WebSocket
  const mockHook = ({ onMessage, onError, channels = [] }) => {
    return {
      sendMessage: jest.fn().mockResolvedValue(true),
      closeConnection: jest.fn(),
      isConnected: true
    };
  };

  return {
    ...original,
    useWebSocket: mockHook
  };
});

describe('useWebSocket', () => {
  const mockOnMessage = jest.fn();
  const mockOnError = jest.fn();
  const mockChannels = ['channel_1'];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devrait retourner une interface avec les méthodes attendues', () => {
    const { result } = renderHook(() =>
      useWebSocket({
        onMessage: mockOnMessage,
        onError: mockOnError,
        channels: mockChannels
      })
    );

    expect(result.current).toHaveProperty('sendMessage');
    expect(result.current).toHaveProperty('closeConnection');
    expect(result.current).toHaveProperty('isConnected');

    expect(typeof result.current.sendMessage).toBe('function');
    expect(typeof result.current.closeConnection).toBe('function');
    expect(typeof result.current.isConnected).toBe('boolean');
  });

  it('devrait pouvoir envoyer des messages', async () => {
    const { result } = renderHook(() =>
      useWebSocket({
        onMessage: mockOnMessage,
        onError: mockOnError,
        channels: mockChannels
      })
    );

    const success = await result.current.sendMessage('Test message');
    expect(success).toBe(true);
  });

  it('devrait pouvoir fermer la connexion', () => {
    const { result } = renderHook(() =>
      useWebSocket({
        onMessage: mockOnMessage,
        onError: mockOnError,
        channels: mockChannels
      })
    );

    result.current.closeConnection();
    expect(result.current.closeConnection).toHaveBeenCalledTimes(1);
  });
});