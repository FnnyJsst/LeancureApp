import React from 'react';
import { render, fireEvent, waitFor, act, screen } from '@testing-library/react-native';
import { View, TouchableOpacity, TextInput } from 'react-native';
import ChatWindow from '../../../components/chat/ChatWindow';
import { sendMessageApi, fetchMessageFile, deleteMessageApi, editMessageApi } from '../../../services/api/messageApi';
import { useWebSocket } from '../../../hooks/useWebSocket';
import * as SecureStore from 'expo-secure-store';
import { playNotificationSound } from '../../../services/notification/notificationService';
import { useNotification } from '../../../services/notification/notificationContext';
import { Ionicons } from '@expo/vector-icons';

// Mock des dépendances
jest.mock('../../../services/api/messageApi', () => ({
  sendMessageApi: jest.fn(),
  fetchMessageFile: jest.fn(),
  deleteMessageApi: jest.fn(),
  editMessageApi: jest.fn()
}));

jest.mock('../../../hooks/useWebSocket', () => ({
  useWebSocket: jest.fn().mockReturnValue({
    closeConnection: jest.fn(),
    sendMessage: jest.fn(),
    lastMessage: null,
    readyState: 'OPEN'
  })
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn()
}));

jest.mock('../../../services/notification/notificationService', () => ({
  playNotificationSound: jest.fn()
}));

jest.mock('../../../services/notification/notificationContext', () => ({
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

  const mockWebSocketCallback = jest.fn();

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

  it("devrait gérer la suppression d'un message", async () => {
    const { getByTestId, getByText } = render(
      <ChatWindow
        channel={mockChannel}
        messages={mockMessages}
      />
    );

    // Attendre que le message soit rendu
    await waitFor(() => {
      expect(getByTestId(`message-${mockMessages[1].id}`)).toBeTruthy();
    });

    // Simuler un appui long sur le message
    await act(async () => {
      fireEvent(
        getByTestId(`message-${mockMessages[1].id}`),
        'onLongPress'
      );
    });

    // Utiliser le texte du bouton au lieu du testID
    await waitFor(() => {
      const deleteButton = getByText('buttons.delete');
      fireEvent.press(deleteButton);
    });

    expect(deleteMessageApi).toHaveBeenCalledWith(mockMessages[1].id, expect.any(Object));
  });

  it("devrait empêcher la suppression des messages d'autres utilisateurs", async () => {
    const { getByTestId, queryByTestId } = render(
      <ChatWindow
        channel={mockChannel}
        messages={[mockMessages[0]]} // Message d'un autre utilisateur
      />
    );

    // Attendre que le message soit rendu
    await waitFor(() => {
      expect(getByTestId(`message-${mockMessages[0].id}`)).toBeTruthy();
    });

    // Simuler un appui long
    await act(async () => {
      fireEvent(
        getByTestId(`message-${mockMessages[0].id}`),
        'onLongPress'
      );
    });

    // Vérifier que l'option de suppression n'est pas disponible
    expect(queryByTestId(`message-${mockMessages[0].id}-delete`)).toBeNull();
  });

  it("devrait permettre l'édition d'un message", async () => {
    const { getByTestId, getByText } = render(
      <ChatWindow
        channel={mockChannel}
        messages={[mockMessages[1]]}
        testID="chat-input"
      />
    );

    await waitFor(() => {
      expect(getByTestId(`message-${mockMessages[1].id}`)).toBeTruthy();
    });

    await act(async () => {
      fireEvent(getByTestId(`message-${mockMessages[1].id}`), 'onLongPress');
    });

    const editButton = getByText('buttons.edit');
    fireEvent.press(editButton);

    const input = getByTestId('chat-input');
    fireEvent(input, 'onSubmitEditing', {
      nativeEvent: { text: 'Message modifié' }
    });

    expect(editMessageApi).toHaveBeenCalledWith(
      mockMessages[1].id,
      expect.objectContaining({
        text: mockMessages[1].text,
        isEditing: true,
        messageId: mockMessages[1].id
      }),
      mockCredentials
    );
  });

  it("devrait charger les fichiers pour les messages de type 'file'", async () => {
    const messagesWithFile = [{
      id: "3",
      type: "file",
      fileType: "image/jpeg",
      savedTimestamp: "1630000200000",
      login: "user2",
      isOwnMessage: true,
      text: "image.jpg"
    }];

    const { findByTestId } = render(
      <ChatWindow
        channel={mockChannel}
        messages={messagesWithFile}
        onInputFocusChange={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(fetchMessageFile).toHaveBeenCalled();
    });
  });

  it("devrait ouvrir la prévisualisation d'un document", async () => {
    const messagesWithFile = [{
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
    }];

    const { getByText, getByTestId } = render(
      <ChatWindow
        channel={mockChannel}
        messages={messagesWithFile}
      />
    );

    // Attendre que le fichier soit affiché et cliquer dessus
    await waitFor(() => {
      const fileMessage = getByText('image.jpg');
      fireEvent.press(fileMessage);
    });

    // Vérifier que la modal est ouverte en cherchant le bouton de fermeture
    await waitFor(() => {
      expect(getByTestId('close-button')).toBeTruthy();
    });
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

  it("devrait afficher les testIDs pour les messages", async () => {
    // Mock des credentials
    SecureStore.getItemAsync.mockImplementation((key) => {
      if (key === 'userCredentials') {
        return Promise.resolve(JSON.stringify(mockCredentials));
      }
      return Promise.resolve(null);
    });

    const { getByTestId } = render(
      <ChatWindow
        channel={mockChannel}
        messages={mockMessages}
      />
    );

    // Attendre que les messages soient rendus
    await waitFor(() => {
      const message1 = getByTestId(`message-${mockMessages[0].id}`);
      const message2 = getByTestId(`message-${mockMessages[1].id}`);

      expect(message1).toBeTruthy();
      expect(message2).toBeTruthy();
    });
  });

  it("devrait afficher le testID de l'input", async () => {
    // Ajouter un channel mock pour que l'input soit rendu
    const mockChannel = {
      id: "123",
      name: "Test Channel"
    };

    const { getByTestId } = render(
      <ChatWindow
        channel={mockChannel}
        messages={[]}
        onInputFocusChange={jest.fn()}
        testID="chat-input"
      />
    );

    // Attendre que le composant soit rendu
    await waitFor(() => {
      const input = getByTestId('chat-input');
      expect(input).toBeTruthy();
    });
  });

  it("devrait gérer les erreurs lors de l'édition d'un message", async () => {
    editMessageApi.mockRejectedValueOnce(new Error('Erreur d\'édition'));

    const { getByTestId, getByText } = render(
      <ChatWindow
        channel={mockChannel}
        messages={[mockMessages[1]]}
        testID="chat-input"
      />
    );

    await waitFor(() => {
      expect(getByTestId(`message-${mockMessages[1].id}`)).toBeTruthy();
    });

    await act(async () => {
      fireEvent(getByTestId(`message-${mockMessages[1].id}`), 'onLongPress');
    });

    const editButton = getByText('buttons.edit');
    fireEvent.press(editButton);

    const input = getByTestId('chat-input');
    fireEvent.changeText(input, 'Message modifié');
    fireEvent(input, 'onSubmitEditing', {
      nativeEvent: { text: 'Message modifié' }
    });

    await waitFor(() => {
      expect(editMessageApi).toHaveBeenCalled();
    });
  });

  it("devrait gérer les erreurs lors du chargement des fichiers", async () => {
    console.error = jest.fn();
    fetchMessageFile.mockRejectedValueOnce(new Error('Erreur de chargement'));

    const fileMessage = {
      id: "4",
      type: "file",
      fileType: "pdf",
      text: "document.pdf",
      savedTimestamp: "1630000300000",
      login: "user2",
      isOwnMessage: true
    };

    render(
      <ChatWindow
        channel={mockChannel}
        messages={[fileMessage]}
      />
    );

    await waitFor(() => {
      expect(fetchMessageFile).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });

  it("devrait gérer le focus de l'input", async () => {
    const mockOnInputFocusChange = jest.fn();

    const { getByTestId } = render(
      <ChatWindow
        channel={mockChannel}
        messages={mockMessages}
        onInputFocusChange={mockOnInputFocusChange}
        testID="chat-input"
      />
    );

    await waitFor(() => {
      const input = getByTestId('chat-input');
      expect(input).toBeTruthy();
    });

    const input = getByTestId('chat-input');

    await act(async () => {
      fireEvent(input, 'focus');
    });
    expect(mockOnInputFocusChange).toHaveBeenCalledWith(true);

    await act(async () => {
      fireEvent(input, 'blur');
    });
    expect(mockOnInputFocusChange).toHaveBeenCalledWith(false);
  });

  it("devrait nettoyer les ressources lors du démontage", async () => {
    const { unmount } = render(
      <ChatWindow
        channel={mockChannel}
        messages={mockMessages}
      />
    );

    unmount();

    expect(mockWebSocketHook.closeConnection).toHaveBeenCalled();
  });
});