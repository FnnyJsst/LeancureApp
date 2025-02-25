import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Sidebar from '../../components/navigation/Sidebar';
import ChatWindow from '../../components/chat/ChatWindow';
import Header from '../../components/Header';
import * as SecureStore from 'expo-secure-store';
import { fetchChannelMessages } from '../../services/api/messageApi';
import { sendMessageApi } from '../../services/api/messageApi';

/**
 * @component ChatScreen
 * @description Displays the chat screen
 * @param {Function} onNavigate - A function to navigate to a screen
 * @param {boolean} isExpanded - A boolean to indicate if the menu is expanded
 * @param {Function} setIsExpanded - A function to set the isExpanded state
 * @param {Function} handleChatLogout - A function to handle logout
 */
export default function ChatScreen({ onNavigate, isExpanded, setIsExpanded, handleChatLogout, testID }) {

  // States related to the chat
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [currentSection, setCurrentSection] = useState('chat');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [channelMessages, setChannelMessages] = useState([]);
  const [unreadChannels, setUnreadChannels] = useState({});

  /**
   * @function useEffect
   * @description Fetches the channel data and refreshes it every 5 seconds to ensure the user sees the new messages
   */
  useEffect(() => {
    let isMounted = true;
    let refreshInterval;

    const fetchMessages = async () => {
      try {
        if (!isMounted || !selectedChannel) {return;}

        const credentialsStr = await SecureStore.getItemAsync('userCredentials');
        if (!credentialsStr) {return;}

        const credentials = JSON.parse(credentialsStr);
        const messages = await fetchChannelMessages(selectedChannel.id, credentials);

        if (!messages || messages.length === 0) {
          setChannelMessages([]);
          return;
        }

        setChannelMessages(messages);
      } catch (error) {
        if (__DEV__) {
          console.error('🔴 Error fetching messages:', error);
        }
        setChannelMessages([]);
      }
    };

    fetchMessages();
    refreshInterval = setInterval(fetchMessages, 5000);

    return () => {
      isMounted = false;
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [selectedChannel]);

  /**
   * @function toggleMenu
   * @description Opens or closes the sidebar menu
   */
  const toggleMenu = () => {
    setIsExpanded(!isExpanded);
  };

  /**
   * @function handleChannelSelect
   * @description Handles the channel selection
   * @param {Object} channel - The channel to select
   */
  const handleChannelSelect = (channel) => {
    if (isExpanded) {
      toggleMenu();
    }

    setSelectedChannel(channel);
  };

  /**
   * @function handleNewMessage
   * @description Handles the new message sent by the user
   * @param {string} message - The message to handle
   */
  const handleNewMessage = async (message) => {
    try {
      const credentialsStr = await SecureStore.getItemAsync('userCredentials');
      if (!credentialsStr || !selectedChannel) {
        console.log('❌ Missing credentials or selectedChannel');
        return;
      }

      const credentials = JSON.parse(credentialsStr);

      // We check if the message is not empty
      if (!message || (typeof message === 'string' && !message.trim())) {
        console.log('❌ Empty message');
        return;
      }

      // We send the message to the API
      const response = await sendMessageApi(selectedChannel.id, message, credentials);

      if (response.status === 'ok') {
        // We update the messages after a delay to ensure the user sees the new message
        setTimeout(async () => {
          const updatedMessages = await fetchChannelMessages(selectedChannel.id, credentials);
          setChannelMessages(updatedMessages);
        }, 1000);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  };

  /**
   * @function handleInputFocusChange
   * @description Handles the input focus change, so we can mark all the messages as read as soon as we use the chat input
   * @param {boolean} isFocused - A boolean to indicate if the input is focused
   */
  const handleInputFocusChange = async (isFocused) => {
    setIsInputFocused(isFocused);
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
          onMessageSent={handleNewMessage}
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
