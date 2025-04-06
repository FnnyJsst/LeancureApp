import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import Sidebar from '../../components/navigation/Sidebar';
import ChatWindow from '../../components/chat/ChatWindow';
import Header from '../../components/Header';
import * as SecureStore from 'expo-secure-store';
import { fetchChannelMessages } from '../../services/api/messageApi';
import { useTranslation } from 'react-i18next';
import { handleError, ErrorType } from '../../utils/errorHandling';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useNotification } from '../../services/notificationContext';

/**
 * @component ChatScreen
 * @description Displays the chat screen
 * @param {Function} onNavigate - A function to navigate to a screen
 * @param {boolean} isExpanded - A boolean to indicate if the menu is expanded
 * @param {Function} setIsExpanded - A function to set the isExpanded state
 * @param {Function} handleChatLogout - A function to handle logout
 */
export default function ChatScreen({ onNavigate, isExpanded, setIsExpanded, handleChatLogout, testID }) {

  const { t } = useTranslation();
  const { updateActiveChannel } = useNotification();

  // States related to the chat
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [currentSection, setCurrentSection] = useState('chat');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [channelMessages, setChannelMessages] = useState([]);
  const [unreadChannels, setUnreadChannels] = useState({});
  const [editingMessage, setEditingMessage] = useState(null);

  // Update the channel context when the selected channel changes
  useEffect(() => {
    if (selectedChannel && selectedChannel.id) {
      updateActiveChannel(selectedChannel.id.toString(), selectedChannel.title);
    } else {
      updateActiveChannel(null);
    }
  }, [selectedChannel, updateActiveChannel]);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((data) => {

    if (data.message && data.message.type === 'messages') {
      const newMessages = data.message.messages;

      setChannelMessages(prevMessages => {
        // Create a Set of existing message IDs to avoid duplicates
        const existingMessageIds = new Set(prevMessages.map(msg => msg.id));

        // Filter new messages to keep only those that do not already exist
        const uniqueNewMessages = newMessages.filter(msg => !existingMessageIds.has(msg.id));

        if (uniqueNewMessages.length === 0) {
          return prevMessages;
        }

        // Add the new messages to the list
        return [...prevMessages, ...uniqueNewMessages];
      });
    }
  }, []);

  // Initialize the WebSocket
  const { sendMessage, closeConnection, isConnected } = useWebSocket({
    onMessage: handleWebSocketMessage,
    onError: (error) => {
      console.error('❌ Erreur WebSocket dans ChatScreen:', error);
    },
    channels: selectedChannel ? [`channel_${selectedChannel.id}`] : []
  });

  // Refresh the messages
  const refreshMessages = useCallback(async () => {
    try {

      if (!selectedChannel) {
        return;
      }

      const credentialsStr = await SecureStore.getItemAsync('userCredentials');
      if (!credentialsStr) {
        console.log('❌ Pas de credentials trouvés');
        return;
      }

      const credentials = JSON.parse(credentialsStr);
      const messages = await fetchChannelMessages(selectedChannel.id, credentials);

      setChannelMessages(messages);
    } catch (error) {
      console.error('❌ Erreur lors du rafraîchissement des messages:', error);
    }
  }, [selectedChannel]);

  // Effet pour charger les messages initiaux
  useEffect(() => {
    refreshMessages();
  }, [selectedChannel, refreshMessages]);

  // Effet pour nettoyer la connexion WebSocket
  useEffect(() => {
    return () => {
      console.log('🧹 Nettoyage de la connexion WebSocket');
      closeConnection();
    };
  }, [closeConnection]);

  /**
   * @description Handle chat-related errors
   * @param {Error} error - The error
   * @param {string} source - The source
   * @param {object} options - Additional options
   * @returns {object} Formatted error
   */
  const handleChatError = (error, source, options = {}) => {
    return handleError(error, `chat.${source}`, {
      type: ErrorType.SYSTEM,
      ...options
    });
  };

  // Toggle the sidebar menu
  const toggleMenu = () => {
    setIsExpanded(!isExpanded);
  };

  /**
   * @function handleChannelSelect
   * @description Handles the channel selection
   * @param {Object} channel - The channel to select
   */
  const handleChannelSelect = (channel) => {
    try {
      if (isExpanded) {
        toggleMenu();
      }

      if (!channel || !channel.id) {
        handleChatError(
          'Tentative de sélection d\'un canal invalide',
          'channelSelect.validation',
          { silent: true }
        );
        return;
      }

      // We reset the messages before changing the channel
      setChannelMessages([]);
      // We update the selected channel
      setSelectedChannel({
        ...channel,
        id: channel.id.toString()
      });
    } catch (error) {
      handleChatError(error, 'channelSelect.process');
    }
  };

  // Handle the input focus change to mark all the messages as read as soon as we use the chat input
  const handleInputFocusChange = async (isFocused) => {
    try {
      setIsInputFocused(isFocused);
    } catch (error) {
      handleChatError(error, 'inputFocusChange');
    }
  };

  const handleEditMessage = (messageToEdit) => {
    try {
      if (!messageToEdit || !messageToEdit.id) {
        handleChatError(
          'Tentative d\'édition d\'un message invalide',
          'editMessage.validation',
          { silent: true }
        );
        return;
      }

      setEditingMessage(messageToEdit);
    } catch (error) {
      handleChatError(error, 'editMessage.process');
    }
  };

  return (
    <View style={styles.container} testID={testID}>
      <Header
        showMenuIcon={true}
        showBackButton={false}
        showAccountImage={true}
        onNavigate={onNavigate}
        toggleMenu={toggleMenu}
        title={selectedChannel?.title}
        currentSection={currentSection}
      />
      <Sidebar
        onChannelSelect={handleChannelSelect}
        selectedGroup={selectedGroup}
        selectedChannel={selectedChannel}
        onGroupSelect={setSelectedGroup}
        isExpanded={isExpanded}
        toggleMenu={toggleMenu}
        onNavigate={onNavigate}
        currentSection={currentSection}
        unreadChannels={unreadChannels}
        onLogout={handleChatLogout}
      />
      <View style={styles.mainContent}>
        <ChatWindow
          channel={selectedChannel}
          messages={channelMessages}
          isExpanded={isExpanded}
          onInputFocusChange={handleInputFocusChange}
          onEditMessage={handleEditMessage}
          editingMessage={editingMessage}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
  },
});