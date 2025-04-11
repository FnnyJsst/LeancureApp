import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { View } from 'react-native';
import ChatWindow from '../../../components/chat/ChatWindow';
import { sendMessageApi, fetchMessageFile, deleteMessageApi, editMessageApi } from '../../../services/api/messageApi';
import { useWebSocket } from '../../../hooks/useWebSocket';
import * as SecureStore from 'expo-secure-store';
import { playNotificationSound } from '../../../services/notificationService';
import { useNotification } from '../../../services/notificationContext';

// Mock des dépendances
jest.mock('../../../services/api/messageApi', () => ({
  sendMessageApi: jest.fn(),
  fetchMessageFile: jest.fn(),
  deleteMessageApi: jest.fn(),
  editMessageApi: jest.fn()
}));

jest.mock('../../../hooks/useWebSocket', () => ({
  useWebSocket: jest.fn()
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn()
}));

jest.mock('../../../services/notificationService', () => ({
  playNotificationSound: jest.fn()
}));

jest.mock('../../../services/notificationContext', () => ({
  useNotification: jest.fn()
}));

// Mock pour react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key })
}));

// Mock pour useDeviceType
jest.mock('../../../hooks/useDeviceType', () => ({
  useDeviceType: () => ({
    isSmartphone: false
  })
}));

// Mock de console.log et console.error
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn()
};

describe("ChatWindow Component", () => {
  // Mock des props et états pour les tests
  const mockChannel = { id: "123", name: "Test Channel" };
  const mockMessages = [
    {
      id: "1",
      type: "text",
      text: "Bonjour !",
      savedTimestamp: "1630000000000",
      login: "user1",
      isOwnMessage: false,
      username: "User 1"
    },
    {
      id: "2",
      type: "text",
      text: "Salut comment ça va ?",
      savedTimestamp: "1630000100000",
      login: "user2",
      isOwnMessage: true,
      username: "Me"
    }
  ];

  const mockCredentials = {
    login: "user2",
    accessToken: "access-token-123",
    refreshToken: "refresh-token-123"
  };

  const mockWebSocketHook = {
    closeConnection: jest.fn()
  };

  const mockNotificationHook = {
    recordSentMessage: jest.fn(),
    markChannelAsUnread: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Configuration des mocks par défaut
    SecureStore.getItemAsync.mockImplementation((key) => {
      if (key === 'userCredentials') {
        return Promise.resolve(JSON.stringify(mockCredentials));
      }
      if (key === 'userRights') {
        return Promise.resolve(JSON.stringify("2")); // Droits standard
      }
      return Promise.resolve(null);
    });

    useWebSocket.mockReturnValue(mockWebSocketHook);
    useNotification.mockReturnValue(mockNotificationHook);

    // Mock des fonctions API
    sendMessageApi.mockResolvedValue({ status: 'ok', id: '3' });
    fetchMessageFile.mockResolvedValue('base64-file-content');
    deleteMessageApi.mockResolvedValue({ status: 'ok' });
    editMessageApi.mockResolvedValue({ status: 'ok' });
  });

  it("devrait afficher un message quand aucun canal n'est sélectionné", async () => {
    const { findByText } = render(
      <ChatWindow channel={null} messages={[]} onInputFocusChange={jest.fn()} />
    );

    const noChannelMessage = await findByText('screens.selectChannel');
    expect(noChannelMessage).toBeTruthy();
  });

  it("devrait afficher les messages du canal", async () => {
    const { findByText } = render(
      <ChatWindow channel={mockChannel} messages={mockMessages} onInputFocusChange={jest.fn()} />
    );

    // Vérifier que les messages sont affichés
    const message1 = await findByText('Bonjour !');
    const message2 = await findByText('Salut comment ça va ?');

    expect(message1).toBeTruthy();
    expect(message2).toBeTruthy();
  });

  it("devrait envoyer un nouveau message texte", async () => {
    const { findByTestId } = render(
      <ChatWindow channel={mockChannel} messages={mockMessages} onInputFocusChange={jest.fn()} />
    );

    // Trouver l'input de message
    const messageInput = await findByTestId('message-input');
    fireEvent.changeText(messageInput, 'Nouveau message de test');

    // Trouver et cliquer sur le bouton d'envoi
    const sendButton = await findByTestId('send-button');
    await act(async () => {
      fireEvent.press(sendButton);
    });

    // Vérifier que la fonction d'envoi a été appelée
    expect(sendMessageApi).toHaveBeenCalledWith(
      "123",
      expect.objectContaining({
        type: 'text',
        message: 'Nouveau message de test'
      }),
      mockCredentials
    );

    // Vérifier que le hook de notification a été appelé
    expect(mockNotificationHook.recordSentMessage).toHaveBeenCalled();
  });

  it("devrait gérer la suppression d'un message", async () => {
    const { findByTestId } = render(
      <ChatWindow
        channel={mockChannel}
        messages={[
          {
            ...mockMessages[1], // Message de l'utilisateur courant
            id: "2"
          }
        ]}
        onInputFocusChange={jest.fn()}
      />
    );

    // Trouver et cliquer sur le bouton de menu du message
    const messageMenuButton = await findByTestId('message-menu-2');
    fireEvent.press(messageMenuButton);

    // Trouver et cliquer sur l'option de suppression
    const deleteOption = await findByTestId('delete-option-2');
    await act(async () => {
      fireEvent.press(deleteOption);
    });

    // Vérifier que deleteMessageApi a été appelé avec le bon ID
    expect(deleteMessageApi).toHaveBeenCalledWith("2", mockCredentials);
  });

  it("devrait empêcher la suppression des messages d'autres utilisateurs", async () => {
    // Mock des droits utilisateur standard (pas admin)
    SecureStore.getItemAsync.mockImplementation((key) => {
      if (key === 'userCredentials') {
        return Promise.resolve(JSON.stringify(mockCredentials));
      }
      if (key === 'userRights') {
        return Promise.resolve(JSON.stringify("2")); // Droits standard
      }
      return Promise.resolve(null);
    });

    const { findByTestId, queryByTestId } = render(
      <ChatWindow
        channel={mockChannel}
        messages={[
          {
            ...mockMessages[0], // Message d'un autre utilisateur
            id: "1"
          }
        ]}
        onInputFocusChange={jest.fn()}
      />
    );

    // Trouver et cliquer sur le bouton de menu du message
    const messageMenuButton = await findByTestId('message-menu-1');
    fireEvent.press(messageMenuButton);

    // Vérifier que l'option de suppression n'est pas disponible
    const deleteOption = queryByTestId('delete-option-1');
    expect(deleteOption).toBeNull();
  });

  it("devrait permettre l'édition d'un message", async () => {
    const { findByTestId, findByDisplayValue } = render(
      <ChatWindow
        channel={mockChannel}
        messages={[
          {
            ...mockMessages[1], // Message de l'utilisateur courant
            id: "2"
          }
        ]}
        onInputFocusChange={jest.fn()}
      />
    );

    // Trouver et cliquer sur le bouton de menu du message
    const messageMenuButton = await findByTestId('message-menu-2');
    fireEvent.press(messageMenuButton);

    // Trouver et cliquer sur l'option d'édition
    const editOption = await findByTestId('edit-option-2');
    await act(async () => {
      fireEvent.press(editOption);
    });

    // Vérifier que l'input contient le texte du message
    const messageInput = await findByDisplayValue('Salut comment ça va ?');

    // Modifier le texte
    fireEvent.changeText(messageInput, 'Message modifié');

    // Envoyer le message modifié
    const sendButton = await findByTestId('send-button');
    await act(async () => {
      fireEvent.press(sendButton);
    });

    // Vérifier que editMessageApi a été appelé avec les bons paramètres
    expect(editMessageApi).toHaveBeenCalledWith(
      "2",
      expect.objectContaining({
        text: 'Message modifié',
        isEditing: true,
        messageId: "2"
      }),
      mockCredentials
    );
  });

  it("devrait charger les fichiers pour les messages de type 'file'", async () => {
    // Message avec un fichier
    const messagesWithFile = [
      {
        id: "3",
        type: "file",
        fileType: "image/jpeg",
        savedTimestamp: "1630000200000",
        login: "user2",
        isOwnMessage: true,
        text: "image.jpg"
      }
    ];

    await act(async () => {
      render(
        <ChatWindow
          channel={mockChannel}
          messages={messagesWithFile}
          onInputFocusChange={jest.fn()}
        />
      );
    });

    // Vérifier que fetchMessageFile a été appelé
    await waitFor(() => {
      expect(fetchMessageFile).toHaveBeenCalledWith(
        "3",
        expect.objectContaining({
          channelid: 123,
          id: "3",
          type: "file",
          fileType: "image/jpeg"
        }),
        mockCredentials
      );
    });
  });

  it("devrait gérer la réception d'un nouveau message via WebSocket", async () => {
    let webSocketCallback;

    // Capturer la fonction de callback onMessage
    useWebSocket.mockImplementation(({ onMessage }) => {
      webSocketCallback = onMessage;
      return mockWebSocketHook;
    });

    const { findByText } = render(
      <ChatWindow channel={mockChannel} messages={mockMessages} onInputFocusChange={jest.fn()} />
    );

    // Simuler la réception d'un nouveau message via WebSocket
    const newMessage = {
      type: 'message',
      filters: { values: { channel: '123' } },
      message: {
        id: '4',
        type: 'text',
        text: 'Message reçu via WebSocket',
        login: 'user3',
        savedTimestamp: '1630000300000'
      }
    };

    // Appeler manuellement le callback WebSocket
    await act(async () => {
      await webSocketCallback(newMessage);
    });

    // Vérifier que le nouveau message est affiché
    const websocketMessage = await findByText('Message reçu via WebSocket');
    expect(websocketMessage).toBeTruthy();
  });

  it("devrait ouvrir la prévisualisation d'un document", async () => {
    // Message avec un fichier
    const messagesWithFile = [
      {
        id: "3",
        type: "file",
        fileType: "image/jpeg",
        savedTimestamp: "1630000200000",
        login: "user2",
        isOwnMessage: true,
        text: "image.jpg",
        base64: "base64-image-content",
        fileName: "image.jpg",
        fileSize: "1024"
      }
    ];

    const { findByTestId, findByText } = render(
      <ChatWindow
        channel={mockChannel}
        messages={messagesWithFile}
        onInputFocusChange={jest.fn()}
      />
    );

    // Trouver et cliquer sur le fichier pour ouvrir la prévisualisation
    const fileMessage = await findByTestId('file-message-3');
    fireEvent.press(fileMessage);

    // Vérifier que la modal de prévisualisation est ouverte
    const previewTitle = await findByText('filePreview.preview');
    expect(previewTitle).toBeTruthy();

    // Fermer la modal
    const closeButton = await findByTestId('close-preview-button');
    fireEvent.press(closeButton);
  });

  it("devrait permettre à un administrateur de supprimer les messages d'autres utilisateurs", async () => {
    // Mock des droits administrateur
    SecureStore.getItemAsync.mockImplementation((key) => {
      if (key === 'userCredentials') {
        return Promise.resolve(JSON.stringify(mockCredentials));
      }
      if (key === 'userRights') {
        return Promise.resolve(JSON.stringify("3")); // Droits admin
      }
      return Promise.resolve(null);
    });

    const { findByTestId } = render(
      <ChatWindow
        channel={mockChannel}
        messages={[
          {
            ...mockMessages[0], // Message d'un autre utilisateur
            id: "1"
          }
        ]}
        onInputFocusChange={jest.fn()}
      />
    );

    // Trouver et cliquer sur le bouton de menu du message
    const messageMenuButton = await findByTestId('message-menu-1');
    fireEvent.press(messageMenuButton);

    // Trouver et cliquer sur l'option de suppression
    const deleteOption = await findByTestId('delete-option-1');
    await act(async () => {
      fireEvent.press(deleteOption);
    });

    // Vérifier que deleteMessageApi a été appelé avec le bon ID
    expect(deleteMessageApi).toHaveBeenCalledWith("1", mockCredentials);
  });

  it("devrait afficher les messages par date avec des bannières de date", async () => {
    // Messages sur des jours différents
    const messagesWithDifferentDates = [
      {
        id: "1",
        type: "text",
        text: "Message d'hier",
        savedTimestamp: (Date.now() - 86400000).toString(), // Hier
        login: "user1",
        isOwnMessage: false
      },
      {
        id: "2",
        type: "text",
        text: "Message d'aujourd'hui",
        savedTimestamp: Date.now().toString(), // Aujourd'hui
        login: "user2",
        isOwnMessage: true
      }
    ];

    const { findByText } = render(
      <ChatWindow
        channel={mockChannel}
        messages={messagesWithDifferentDates}
        onInputFocusChange={jest.fn()}
      />
    );

    // Vérifier que les bannières de date sont affichées
    const yesterdayBanner = await findByText('dateTime.yesterday');
    const todayBanner = await findByText('dateTime.today');

    expect(yesterdayBanner).toBeTruthy();
    expect(todayBanner).toBeTruthy();

    // Vérifier que les messages sont affichés
    const yesterdayMessage = await findByText("Message d'hier");
    const todayMessage = await findByText("Message d'aujourd'hui");

    expect(yesterdayMessage).toBeTruthy();
    expect(todayMessage).toBeTruthy();
  });
});