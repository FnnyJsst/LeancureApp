import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Sidebar from '../../components/navigation/Sidebar';
import ChatWindow from '../../components/chat/ChatWindow';
import Header from '../../components/Header';
import * as SecureStore from 'expo-secure-store';
import { fetchChannelMessages } from '../../services/api/messageApi';
import { COLORS } from '../../constants/style';
/**
 * @component ChatScreen
 * @description Displays the chat screen
 * @param {Function} onNavigate - A function to navigate to a screen
 * @param {boolean} isExpanded - A boolean to indicate if the menu is expanded
 * @param {Function} setIsExpanded - A function to set the isExpanded state
 * @param {Function} handleChatLogout - A function to handle logout
 * 
 * @example
 * <ChatScreen onNavigate={(screen) => navigate(screen)} isExpanded={isExpanded} setIsExpanded={setIsExpanded} handleChatLogout={handleChatLogout} />
 */
export default function ChatScreen({ onNavigate, isExpanded, setIsExpanded, handleChatLogout }) {

  // States related to the chat
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [currentSection, setCurrentSection] = useState('chat');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [channelMessages, setChannelMessages] = useState([]);
  const [unreadChannels, setUnreadChannels] = useState({});

  /**
   * @function useEffect
   * @description Fetches the channel data and refreshes it every 5 seconds
   */
  useEffect(() => {
    let isMounted = true;
    let refreshInterval;


    const fetchChannelData = async () => {
      try {
        if (!isMounted || !selectedChannel) return;
        await fetchMessages();
      } catch (error) {
        console.error('🔴 Erreur lors du rafraîchissement des messages:', error);
      }
    };

    fetchChannelData();
    refreshInterval = setInterval(fetchChannelData, 5000);

    // When the component is unmounted, we clear the interval
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
      // We get the user credentials and parse them
      const credentialsStr = await SecureStore.getItemAsync('userCredentials');
      if (!credentialsStr || !selectedChannel) {
        console.log('❌ Missing credentials or selectedChannel');
        return;
      }
      
      const credentials = JSON.parse(credentialsStr);

      if (!message || (typeof message === 'string' && !message.trim())) {
        console.log('❌ Empty message');
        return;
      }

      // We create the message object
      const newMessage = {
        id: Date.now().toString(),
        message: typeof message === 'string' ? message : message.message,
        channelId: selectedChannel.id,
        savedTimestamp: Date.now().toString(),
        isOwnMessage: typeof message === 'object' ? message.login === credentials.login : true,
        isUnread: false,
        login: typeof message === 'object' ? message.login : credentials.login
      };

      // Update the interface once the message is sent
      setChannelMessages(prev => {
        return [...prev, newMessage];
      });

      // Update the unread channels if necessary
      if (!newMessage.isOwnMessage) {
        setUnreadChannels(prev => ({
          ...prev,
          [selectedChannel.id]: true
        }));
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

  /**
   * @function fetchMessages
   * @description Fetches the user messages from the API
   * @returns {Promise<Array>} - The messages
   */
  const fetchMessages = async () => {
    try {
      // We get the user credentials and parse them
      const credentialsStr = await SecureStore.getItemAsync('userCredentials');
      if (!credentialsStr || !selectedChannel) {
        return;
      }
      
      const credentials = JSON.parse(credentialsStr);
      
      // We fetch the messages of the channel
      const messages = await fetchChannelMessages(selectedChannel.id, credentials);
      
      if (!messages || messages.length === 0) {
        setChannelMessages([]);
        return;
      }

      // We update the messages of the channel
      setChannelMessages(messages);
    } catch (error) {
      console.error('🔴 Error fetching messages:', error);
      setChannelMessages([]);
    }
  };

  return (
    <View style={styles.container}>
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
    backgroundColor: COLORS.gray950,
  },
  mainContent: {
    flex: 1,
  },
});