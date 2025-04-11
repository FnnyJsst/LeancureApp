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
import { useNotification } from '../../services/notification/notificationContext';

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
  const { closeConnection } = useWebSocket({
    onMessage: handleWebSocketMessage,
    channels: selectedChannel ? [`channel_${selectedChannel.id}`] : []
  });

  /**
   * @function refreshMessages
   * @description Refreshes the initial messages
   */
  const refreshMessages = useCallback(async () => {
    try {
      if (!selectedChannel || !selectedChannel.id) {
        setChannelMessages([]);
        return;
      }

      const credentialsStr = await SecureStore.getItemAsync('userCredentials');
      const credentials = JSON.parse(credentialsStr);
      const messages = await fetchChannelMessages(selectedChannel.id, credentials);

      setChannelMessages(messages);
    } catch (error) {
      handleError(error, t('error.errorRefreshingMessages'), {
        type: ErrorType.SYSTEM,
        silent: false
      });
    }
  }, [selectedChannel, t]);

  // Effect to load the initial messages
  useEffect(() => {
    refreshMessages();
  }, [selectedChannel, refreshMessages]);

  // Effect to clean the WebSocket connection
  useEffect(() => {
    return () => {
      closeConnection();
    };
  }, [closeConnection]);

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
        handleError(new Error('Invalid channel'), t('error.errorChannelSelect'), {
          type: ErrorType.SYSTEM,
          silent: false
        });
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
      handleError(error, t('error.errorChannelSelect'), {
        type: ErrorType.SYSTEM,
        silent: false
      });
    }
  };

  // Handle the input focus change to mark all the messages as read as soon as we use the chat input
  const handleInputFocusChange = async (isFocused) => {
    setIsInputFocused(isFocused);
  };

  /**
   * @function handleEditMessage
   * @description Handles the message edition
   * @param {Object} messageToEdit - The message to edit
   */
  const handleEditMessage = (messageToEdit) => {
    try {
      if (!messageToEdit || !messageToEdit.id) {
        handleError(new Error('Invalid message'), t('error.errorEditingMessage'), {
          type: ErrorType.SYSTEM,
          silent: false
        });
        return;
      }

      setEditingMessage(messageToEdit);
    } catch (error) {
      handleError(error, t('error.errorEditingMessage'), {
        type: ErrorType.SYSTEM,
        silent: false
      });
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