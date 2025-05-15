import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Sidebar from '../../components/navigation/Sidebar';
import ChatWindow from '../../components/chat/ChatWindow';
import Header from '../../components/Header';
import * as SecureStore from 'expo-secure-store';
import { fetchChannelMessages } from '../../services/api/messageApi';
import { useTranslation } from 'react-i18next';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useNotification } from '../../services/notification/notificationContext';
import CustomAlert from '../../components/modals/webviews/CustomAlert';

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
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // Référence pour éviter les mises à jour inutiles
  const previousChannelId = useRef(null);

  // Update the channel context when the selected channel changes
  useEffect(() => {
    if (selectedChannel?.id !== previousChannelId.current) {
      previousChannelId.current = selectedChannel?.id;
      if (selectedChannel && selectedChannel.id) {
        updateActiveChannel(selectedChannel.id.toString(), selectedChannel.title);
      } else {
        updateActiveChannel(null);
      }
    }
  }, [selectedChannel, updateActiveChannel]);

  // Handle WebSocket messages with memoization
  const handleWebSocketMessage = useCallback((data) => {
    if (data.message?.type === 'messages') {
      const newMessages = data.message.messages;
      setChannelMessages(prevMessages => {
        const existingMessageIds = new Set(prevMessages.map(msg => msg.id));
        const uniqueNewMessages = newMessages.filter(msg => !existingMessageIds.has(msg.id));
        return uniqueNewMessages.length > 0 ? [...prevMessages, ...uniqueNewMessages] : prevMessages;
      });
    }
  }, []);

  // Initialize the WebSocket
  const { closeConnection } = useWebSocket({
    onMessage: handleWebSocketMessage,
    channels: selectedChannel ? [`channel_${selectedChannel.id}`] : []
  });

  // Memoize the refreshMessages function
  const refreshMessages = useCallback(async () => {
    if (!selectedChannel?.id) {
      setChannelMessages([]);
      return;
    }

    try {
      const credentialsStr = await SecureStore.getItemAsync('userCredentials');
      if (!credentialsStr) return;

      const credentials = JSON.parse(credentialsStr);
      const messages = await fetchChannelMessages(selectedChannel.id, credentials);
      setChannelMessages(messages);
    } catch (error) {
      console.error('[ChatScreen] Error refreshing messages:', error);
      setAlertMessage(t('error.errorRefreshingMessages'));
      setShowAlert(true);
    }
  }, [selectedChannel?.id, t]);

  // Effect to load the initial messages
  useEffect(() => {
    if (selectedChannel?.id !== previousChannelId.current) {
      refreshMessages();
    }
  }, [selectedChannel?.id, refreshMessages]);

  // Effect to clean the WebSocket connection
  useEffect(() => {
    return () => {
      if (closeConnection) {
        closeConnection();
      }
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
        console.error('[ChatScreen] Invalid channel');
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
      console.error('[ChatScreen] Error while selecting the channel:', error);
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
        console.error('[ChatScreen] Invalid message');
        return;
      }

      setEditingMessage(messageToEdit);
    } catch (error) {
      setAlertMessage(t('error.errorEditingMessage'));
      setShowAlert(true);
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
      <CustomAlert
        visible={showAlert}
        message={alertMessage}
        onClose={() => setShowAlert(false)}
        onConfirm={() => setShowAlert(false)}
        type="error"
      />
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