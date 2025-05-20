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
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const hasInitialLoad = useRef({});

  // Update the channel context when the selected channel changes
  useEffect(() => {
    if (selectedChannel?.id) {
      updateActiveChannel(selectedChannel.id.toString(), selectedChannel.title);
    } else {
      updateActiveChannel(null);
    }
  }, [selectedChannel, updateActiveChannel]);

  // Use the centralized useWebSocket hook
  const { handleWebSocketMessage } = useWebSocket({
    channels: selectedChannel ? [`channel_${selectedChannel.id}`] : [],
    onMessage: (data) => {
      if (data.type === 'messages' && Array.isArray(data.messages)) {
        setChannelMessages(prevMessages => {
          const existingMessageIds = new Set(prevMessages.map(msg => msg.id));
          const uniqueNewMessages = data.messages.filter(msg => !existingMessageIds.has(msg.id));
          return uniqueNewMessages.length > 0 ? [...prevMessages, ...uniqueNewMessages] : prevMessages;
        });
      }
    },
    onError: (error) => {
      console.error('[ChatScreen] WebSocket error:', error);
      setAlertMessage(t('errors.websocketError'));
      setShowAlert(true);
    }
  });

  // Memoize the refreshMessages function for initial load only
  const loadInitialMessages = useCallback(async () => {
    if (!selectedChannel?.id) {
      console.log('[ChatScreen] No channel selected, clearing messages');
      setChannelMessages([]);
      return;
    }

    // Skip if we already loaded messages for this channel
    if (hasInitialLoad.current[selectedChannel.id]) {
      console.log('[ChatScreen] Messages already loaded for channel:', selectedChannel.id);
      return;
    }

    try {
      setIsLoadingMessages(true);
      const credentialsStr = await SecureStore.getItemAsync('userCredentials');
      if (!credentialsStr) {
        setAlertMessage(t('error.noCredentials'));
        setShowAlert(true);
        return;
      }

      const credentials = JSON.parse(credentialsStr);
      const messages = await fetchChannelMessages(selectedChannel.id, credentials);

      setChannelMessages(messages);
      hasInitialLoad.current[selectedChannel.id] = true;
    } catch (error) {
      console.error('[ChatScreen] Error loading initial messages:', error);
      setAlertMessage(t('error.errorRefreshingMessages'));
      setShowAlert(true);
      setChannelMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [selectedChannel?.id, t]);

  // Effect to load initial messages only once per channel
  useEffect(() => {
    const channelId = selectedChannel?.id;
    if (!channelId) return;

    loadInitialMessages();
  }, [selectedChannel?.id, loadInitialMessages]);

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

      // On ne vide plus les messages ici, on attend le chargement initial
      setSelectedChannel({
        ...channel,
        id: channel.id.toString()
      });

      // On réinitialise le flag de chargement initial pour forcer un nouveau chargement
      hasInitialLoad.current[channel.id] = false;
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
          isLoading={isLoadingMessages}
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