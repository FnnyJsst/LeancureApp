import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Sidebar from '../../components/navigation/Sidebar';
import ChatWindow from '../../components/chat/ChatWindow';
import Header from '../../components/Header';
import { COLORS } from '../../constants/style';
import { SCREENS } from '../../constants/screens';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchChannelMessages } from '../../services/messageApi';

export default function ChatScreen({ onNavigate, isExpanded, setIsExpanded }) {

  // States related to the chat
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [currentSection, setCurrentSection] = useState('chat');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [channelMessages, setChannelMessages] = useState([]);

  const toggleMenu = () => {
    setIsExpanded(!isExpanded);
  };

  const handleChannelSelect = (channel) => {
    setSelectedChannel(channel);
    setChannelMessages(channel.messages || []);
    if (isExpanded) {
      toggleMenu();
    }
  };

  const handleNewMessage = async (message) => {
    try {
      // Get the credentials from the async storage
      const credentialsStr = await AsyncStorage.getItem('userCredentials');
      // If the credentials are not found or the selected channel is not found, we don't do anything
      if (!credentialsStr || !selectedChannel) return;
      // Parse the credentials
      const credentials = JSON.parse(credentialsStr);
      
      // Add the new message with isOwnMessage to true if it comes from us
      const newMessage = {
        id: Date.now().toString(),
        message: message,
        savedTimestamp: Date.now().toString(),
        isOwnMessage: true,
        login: credentials.login
      };
      
      // Add the new message to the channel messages
      setChannelMessages(prev => [...prev, newMessage]);

      //Force the fetch of the messages
      const messages = await fetchChannelMessages(selectedChannel.id, credentials);
      const updatedMessages = messages.map(msg => ({
        ...msg,
        isOwnMessage: msg.login === credentials.login
      }));
      setChannelMessages(updatedMessages);
      
    } catch (error) {
      console.error('Error updating messages:', error);
    }
  };

  useEffect(() => {
    let interval;
    
    const fetchMessages = async () => {
      try {
        // Get the credentials from the async storage
        const credentialsStr = await AsyncStorage.getItem('userCredentials');
        // If the credentials are not found or the selected channel is not found, we don't do anything
        if (!credentialsStr || !selectedChannel) return;
        // Parse the credentials
        const credentials = JSON.parse(credentialsStr);
        const messages = await fetchChannelMessages(selectedChannel.id, credentials);
        
        // Keep the isOwnMessage state of the existing messages
        const updatedMessages = messages.map(msg => {
          const existingMessage = channelMessages.find(m => m.id === msg.id);
          return {
            ...msg,
            isOwnMessage: existingMessage ? existingMessage.isOwnMessage : (msg.login === credentials.login)
          };
        });
        
        setChannelMessages(updatedMessages);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    // If the channel is selected, we fetch the messages and set an interval to fetch the messages every 2 seconds
    if (selectedChannel) {
      fetchMessages();
      interval = setInterval(fetchMessages, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
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
      />
      <View style={styles.mainContent}>
        <ChatWindow 
          channel={selectedChannel}
          messages={channelMessages}
          isExpanded={isExpanded}
          onInputFocusChange={setIsInputFocused}
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