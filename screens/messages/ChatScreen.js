import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Sidebar from '../../components/navigation/Sidebar';
import ChatWindow from '../../components/chat/ChatWindow';
import Header from '../../components/Header';
import * as SecureStore from 'expo-secure-store';
import { fetchChannelMessages } from '../../services/api/messageApi';
import { sendNotification } from '../../services/notificationService';
import { initSocket, getSocket, disconnectSocket } from '../../services/websocket/socketService';

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
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [unreadChannels, setUnreadChannels] = useState({});

  //////////////////TESTS SOCKET//////////////////
  useEffect(() => {
    let socket;
    let isMounted = true;
    let refreshInterval;
    console.log('🔄 Channel changed, initializing...', selectedChannel?.id);

    const initializeSocket = async () => {
      try {
        const credentialsStr = await SecureStore.getItemAsync('userCredentials');
        if (!credentialsStr || !isMounted) return;
        
        const credentials = JSON.parse(credentialsStr);
        socket = initSocket(credentials);

        if (socket && selectedChannel) {
          console.log('🔌 Socket initialized for channel:', selectedChannel.id);
          
          socket.on('new_message', async (message) => {
            if (isMounted && selectedChannel && message.channelId === selectedChannel.id) {
              console.log('📩 New message received, reloading messages');
              await fetchMessages();
            }
          });

          socket.emit('join_channel', selectedChannel.id);
          
          // Chargement initial des messages
          await fetchMessages();

          // Rafraîchissement périodique
          refreshInterval = setInterval(async () => {
            if (isMounted) {
              console.log('🔄 Refreshing messages...');
              await fetchMessages();
            }
          }, 5000); // Toutes les 5 secondes
        }
      } catch (error) {
        console.error('Erreur initialisation socket:', error);
      }
    };

    if (selectedChannel) {
      initializeSocket();
    }

    return () => {
      isMounted = false;
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      if (socket) {
        console.log('🔌 Cleaning up socket for channel:', selectedChannel?.id);
        if (selectedChannel) {
          socket.emit('leave_channel', selectedChannel.id);
        }
        disconnectSocket();
      }
    };
  }, [selectedChannel]);
  ///////////////////////////////////////////////

  /**
   * @function toggleMenu
   * @description Toggles the menu
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
    console.log('📱 Channel selection:', channel?.id);
    if (isExpanded) {
      toggleMenu();
    }
    // On met à jour le canal sélectionné en dernier
    setSelectedChannel(channel);
  };

  /**
   * @function handleNewMessage
   * @description Handles the new message sent by the user
   * @param {string} message - The message to handle
   */
  const handleNewMessage = async (message) => {
    try {
      console.log('🎯 handleNewMessage called with:', message);
      const credentialsStr = await SecureStore.getItemAsync('userCredentials');
      if (!credentialsStr || !selectedChannel) {
        console.log('❌ Missing credentials or selectedChannel');
        return;
      }
      
      const credentials = JSON.parse(credentialsStr);
      console.log('👤 User credentials:', credentials.login);

      if (!message || (typeof message === 'string' && !message.trim())) {
        console.log('❌ Message vide ignoré');
        return;
      }

      // Créer l'objet message
      const newMessage = {
        id: Date.now().toString(),
        message: typeof message === 'string' ? message : message.message,
        channelId: selectedChannel.id,
        savedTimestamp: Date.now().toString(),
        isOwnMessage: typeof message === 'object' ? message.login === credentials.login : true,
        isUnread: false,
        login: typeof message === 'object' ? message.login : credentials.login
      };
      console.log('📝 New message created:', newMessage);

      // Mettre à jour l'interface une seule fois
      setChannelMessages(prev => {
        console.log('📊 Previous messages count:', prev.length);
        return [...prev, newMessage];
      });

      // Mettre à jour les messages non lus si nécessaire
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
      const credentialsStr = await SecureStore.getItemAsync('userCredentials');
      if (!credentialsStr || !selectedChannel) {
        console.log('❌ Missing credentials or channel');
        return;
      }
      
      const credentials = JSON.parse(credentialsStr);
      console.log('🔄 Fetching messages for channel:', selectedChannel.id);
      
      const messages = await fetchChannelMessages(selectedChannel.id, credentials);
      
      if (!messages || messages.length === 0) {
        console.log('❌ No messages received');
        setChannelMessages([]);
        return;
      }

      console.log('✅ Messages received:', messages.length);
      setChannelMessages(messages);
    } catch (error) {
      console.error('🔴 Error fetching messages:', error);
      setChannelMessages([]);
    }
  };

  return (
    <View style={styles.container}>
      {/* We show the header with the menu icon, the account image and the back button */}
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
    backgroundColor: '#111111',
  },
  mainContent: {
    flex: 1,
  },
});