import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Sidebar from '../../components/navigation/Sidebar';
import ChatWindow from '../../components/chat/ChatWindow';
import Header from '../../components/Header';
import * as SecureStore from 'expo-secure-store';
import { fetchChannelMessages } from '../../services/api/messageApi';
import { initSocket, disconnectSocket } from '../../services/websocket/socketService';
import { COLORS } from '../../constants/style';
/**
 * @component ChatScreen
 * @description Displays the chat screen
 * @param {Function} onNavigate - A function to navigate to a screen
 * @param {boolean} isExpanded - A boolean to indicate if the menu is expanded
 * @param {Function} setIsExpanded - A function to set the isExpanded state
 * @param {Function} handleLogout - A function to handle logout
 * @returns {JSX.Element} - A JSX element
 * 
 * @example
 * <ChatScreen onNavigate={(screen) => navigate(screen)} isExpanded={isExpanded} setIsExpanded={setIsExpanded} handleLogout={handleLogout} />
 */
export default function ChatScreen({ onNavigate, isExpanded, setIsExpanded, handleLogout }) {

  // States related to the chat
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [currentSection, setCurrentSection] = useState('chat');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [channelMessages, setChannelMessages] = useState([]);
  const [unreadChannels, setUnreadChannels] = useState({});

  useEffect(() => {
    let socket;
    let isMounted = true;
    let refreshInterval;

    /**
     * @function initializeSocket
     * @description Creates a socket when a channel is selected
     * @returns {Promise<void>} - A promise
     */
    const initializeSocket = async () => {
      // We get the user credentials and parse them
      try {
        const credentialsStr = await SecureStore.getItemAsync('userCredentials');
        if (!credentialsStr || !isMounted) return;
        
        const credentials = JSON.parse(credentialsStr);
        socket = initSocket(credentials);

        // We check if the socket is initialized and if the channel is selected
        if (socket && selectedChannel) {
          // We listen for new messages
          socket.on('new_message', async (message) => {
            if (!isMounted || !selectedChannel || message.channelId !== selectedChannel.id) {
              return;
            }

            await fetchMessages();
          });
          // We tell the socket we want to enter a specific channel
          socket.emit('join_channel', selectedChannel.id);
          
          // We fetch the messages of the channel
          await fetchMessages();

          // We refresh the messages every 5 seconds
          refreshInterval = setInterval(async () => {
            if (isMounted) {
              await fetchMessages();
            }
          }, 5000);
        }
      } catch (error) {
        console.error('Error initializing socket:', error);
      }
    };

    // We initialize the socket when we select a channel
    if (selectedChannel) {
      initializeSocket();
    }

    return () => {
      isMounted = false;
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      if (socket) {
        if (selectedChannel) {
          // We tell the socket we want to leave a specific channel
          socket.emit('leave_channel', selectedChannel.id);
        }
        // We disconnect the socket
        disconnectSocket();
      }
    };
  }, [selectedChannel]);

  /**
   * @function toggleMenu
   * @description Toggles the sidebar menu
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
   * @description Fetches the messages from the API
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
        onLogout={handleLogout}
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