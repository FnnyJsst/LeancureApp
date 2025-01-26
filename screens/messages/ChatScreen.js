import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Sidebar from '../../components/navigation/Sidebar';
import ChatWindow from '../../components/chat/ChatWindow';
import Header from '../../components/Header';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchChannelMessages } from '../../services/messageApi';
// import { sendNotification } from '../../services/notificationApi';

export default function ChatScreen({ onNavigate, isExpanded, setIsExpanded }) {

  // States related to the chat
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [currentSection, setCurrentSection] = useState('chat');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [channelMessages, setChannelMessages] = useState([]);
  const [unreadChannels, setUnreadChannels] = useState({});

  // Toggle the menu
  const toggleMenu = () => {
    setIsExpanded(!isExpanded);
  };

  // Handle the channel selection
  const handleChannelSelect = (channel) => {
    // Réinitialiser les messages avant de changer de canal
    setChannelMessages([]);
    setSelectedChannel(channel);
    if (isExpanded) {
      toggleMenu();
    }
  };

  // Handle the new message
  const handleNewMessage = async (message) => {
    try {
      // Get the credentials from the async storage
      const credentialsStr = await AsyncStorage.getItem('userCredentials');
      // If the credentials are not found or the selected channel is not found, we don't do anything
      if (!credentialsStr || !selectedChannel) return;
      // Parse the credentials
      const credentials = JSON.parse(credentialsStr);

      // Check if the message is empty. If it is, we don't do anything
      if (!message || (typeof message === 'string' && !message.trim())) {
        console.log('❌ Message vide ignoré');
        return;
      }
      
      // Add the new message with isOwnMessage to true if it comes from us
      const newMessage = {
        id: Date.now().toString(),
        message: message,
        savedTimestamp: Date.now().toString(),
        isOwnMessage: true,
        isUnread: false,
        login: credentials.login
      };
      
      // Add the new message to the channel messages
      setChannelMessages(prev => [...prev, newMessage]);

      //Force the fetch of the messages
      const messages = await fetchChannelMessages(selectedChannel.id, credentials);
      const updatedMessages = messages.map(msg => {
        const isOwnMessage = msg.login === credentials.login;
        return {
          ...msg,
          isOwnMessage,
          // A message is unread if:
          // - it's not our message
          // - the message has the status 'unread' in the API
          isUnread: !isOwnMessage && msg.status === 'unread'
        };
      });
      setChannelMessages(updatedMessages);
      
    } catch (error) {
      console.error('Error updating messages:', error);
    }
  };

  // Handle the input focus change, so we can mark all the messages as read as soon as we use the chat input
  const handleInputFocusChange = async (isFocused) => {
    setIsInputFocused(isFocused);
  };

  const fetchMessages = async () => {
    try {
      const credentialsStr = await AsyncStorage.getItem('userCredentials');
      if (!credentialsStr || !selectedChannel) return;
      
      const credentials = JSON.parse(credentialsStr);
      const previousMessages = channelMessages;
      const messages = await fetchChannelMessages(selectedChannel.id, credentials);
      
      // Check if there are new messages
      const newMessages = messages.filter(newMsg => {
        return !previousMessages.some(prevMsg => prevMsg.id === newMsg.id);
      });

      // If there are new messages and they are not from us
      const newUnreadMessages = newMessages.filter(msg => 
        msg.login !== credentials.login && 
        (msg.message || msg.title)
      );

      if (newUnreadMessages.length > 0) {
        // Send the notification
        await sendNotification({
          title: selectedChannel.title,
          body: `${newUnreadMessages.length} nouveau(x) message(s)`,
          data: { channelId: selectedChannel.id }
        });
      }

      // Continue with the normal message processing...
      const updatedMessages = messages.map(msg => {
        const isOwnMessage = msg.login === credentials.login;
        return {
          ...msg,
          isOwnMessage,
          isUnread: !isOwnMessage && (msg.message || msg.title)
        };
      });

      // Update the unread channels state only if there are valid messages
      const hasUnreadMessages = updatedMessages.some(msg => 
        msg.isUnread && (msg.message || msg.title)
      );
      
      console.log('Channel state:', {
        channelId: selectedChannel.id,
        hasUnread: hasUnreadMessages,
        messageCount: updatedMessages.length
      });
      
      setUnreadChannels(prev => ({
        ...prev,
        [selectedChannel.id]: hasUnreadMessages
      }));
      
      setChannelMessages(updatedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  useEffect(() => {
    let interval;
    
    if (selectedChannel) {
      // Clean the existing messages
      setChannelMessages([]);
  
      // First loading
      fetchMessages();
      
      // Set the interval with a longer delay
      interval = setInterval(fetchMessages, 5000); // 5 seconds instead of 1
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
      // Clean the messages when unmounting
      setChannelMessages([]);
    };
  }, [selectedChannel]);

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