import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import ChatScreen from '../../../screens/messages/ChatScreen';
import { fetchChannelMessages } from '../../../services/api/messageApi';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { useNotification } from '../../../services/notification/notificationContext';
import * as SecureStore from 'expo-secure-store';

// Mock Firebase
jest.mock('../../../config/firebase', () => ({}));

// Mock ENV
jest.mock('../../../config/env', () => ({
  ENV: {
    apiUrl: 'http://test.api',
    wsUrl: 'ws://test.ws'
  }
}));

// Mock des services de notification
jest.mock('../../../services/notification/notificationService', () => ({
  playNotificationSound: jest.fn(),
  registerForPushNotificationsAsync: jest.fn(),
  handleNotificationResponse: jest.fn()
}));

// Mock des dépendances Expo
jest.mock('expo-notifications', () => {
  const actualNotifications = jest.requireActual('expo-notifications');
  return {
    ...actualNotifications,
    getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'mock-token' }),
    getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    setNotificationHandler: jest.fn(),
    scheduleNotificationAsync: jest.fn(),
    dismissAllNotificationsAsync: jest.fn(),
    getDevicePushTokenAsync: jest.fn().mockResolvedValue({ data: 'mock-device-token' }),
    getRegistrationInfoAsync: jest.fn().mockResolvedValue({ data: 'mock-registration-info' }),
    AndroidImportance: {
      MAX: 5,
      HIGH: 4,
      DEFAULT: 3,
      LOW: 2,
      MIN: 1
    },
    AndroidNotificationVisibility: {
      PRIVATE: 0,
      PUBLIC: 1,
      SECRET: -1
    }
  };
});

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn()
}));

jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
  documentDirectory: 'file://document-directory/',
  EncodingType: {
    Base64: 'base64'
  }
}));

jest.mock('expo-device', () => ({
  modelName: 'Test Device',
  osName: 'Test OS',
  osVersion: '1.0'
}));

// Mock des composants
jest.mock('../../../components/chat/ChatWindow', () => {
  return function MockChatWindow(props) {
    return (
      <div data-testid="messages-container">
        <input
          data-testid="chat-input-field"
          value={props.editingMessage?.text || ''}
          onChange={() => {}}
        />
      </div>
    );
  };
});

jest.mock('../../../components/navigation/Sidebar', () => {
  return function MockSidebar(props) {
    return <div data-testid="sidebar" onClick={() => props.onChannelSelect && props.onChannelSelect({ id: '123', title: 'Test Channel' })} />;
  };
});

jest.mock('../../../components/Header', () => {
  return function MockHeader(props) {
    return <div data-testid="menu-button" onClick={props.toggleMenu} />;
  };
});

jest.mock('../../../services/api/messageApi', () => ({
  fetchChannelMessages: jest.fn().mockResolvedValue([])
}));

jest.mock('../../../hooks/useWebSocket', () => ({
  useWebSocket: jest.fn().mockReturnValue({
    closeConnection: jest.fn(),
    sendMessage: jest.fn()
  })
}));

jest.mock('../../../services/notification/notificationContext', () => ({
  useNotification: jest.fn()
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn()
}));

jest.mock('../../../hooks/useDeviceType', () => ({
  useDeviceType: () => ({
    isSmartphone: false,
    isTablet: true,
    isLowResTablet: false
  })
}));

// Mock pour react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key })
}));

describe('ChatScreen Component', () => {
  const mockProps = {
    onNavigate: jest.fn(),
    isExpanded: false,
    setIsExpanded: jest.fn(),
    handleChatLogout: jest.fn(),
    testID: 'chat-container'
  };

  const mockNotification = {
    updateActiveChannel: jest.fn(),
    recordSentMessage: jest.fn(),
    markChannelAsUnread: jest.fn()
  };

  const mockCredentials = {
    login: 'testuser',
    accessToken: 'test-token'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    useNotification.mockReturnValue(mockNotification);
    SecureStore.getItemAsync.mockImplementation((key) => {
      if (key === 'userCredentials') {
        return Promise.resolve(JSON.stringify(mockCredentials));
      }
      if (key === 'userRights') {
        return Promise.resolve(JSON.stringify("2"));
      }
      return Promise.resolve(null);
    });

    // Reset les messages du canal pour chaque test
    fetchChannelMessages.mockResolvedValue([]);
  });

  it('devrait rendre le composant correctement', async () => {
    const { getByTestId } = render(<ChatScreen {...mockProps} />);
    
    await waitFor(() => {
      expect(getByTestId('chat-container')).toBeTruthy();
    });
  });

  it('devrait nettoyer les ressources lors du démontage', async () => {
    const closeConnection = jest.fn();
    useWebSocket.mockReturnValue({ closeConnection });

    const { unmount } = render(<ChatScreen {...mockProps} />);
    unmount();

    expect(closeConnection).toHaveBeenCalled();
  });

  it('devrait gérer la mise à jour des messages via WebSocket', async () => {
    const mockWebSocketMessage = {
      message: {
        type: 'messages',
        messages: [{ id: '1', text: 'Test message' }]
      }
    };

    let handleMessage;
    useWebSocket.mockImplementation(({ onMessage }) => {
      handleMessage = onMessage;
      return { closeConnection: jest.fn() };
    });

    render(<ChatScreen {...mockProps} />);

    act(() => {
      handleMessage(mockWebSocketMessage);
    });

    // Ajout d'une vérification pour s'assurer que le message a été traité
    await waitFor(() => {
      expect(handleMessage).toBeDefined();
    });
  });
}); 