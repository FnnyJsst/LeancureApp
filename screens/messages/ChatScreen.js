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

  const handleNewMessage = (message) => {
    setChannelMessages(prevMessages => [...prevMessages, message]);
  };

  useEffect(() => {
    let interval;
    
    const fetchMessages = async () => {
      try {
        const credentialsStr = await AsyncStorage.getItem('userCredentials');
        console.log('🔑 Credentials trouvées:', !!credentialsStr);
        
        if (!credentialsStr || !selectedChannel) {
          console.log('❌ Pas de credentials ou de canal sélectionné');
          return;
        }
        
        const credentials = JSON.parse(credentialsStr);
        console.log('📱 Canal sélectionné:', selectedChannel.id);
        
        const messages = await fetchChannelMessages(selectedChannel.id, credentials);
        console.log('📨 Nombre de messages reçus:', messages.length);
        
        setChannelMessages(messages);
      } catch (error) {
        console.error('Erreur récupération messages:', error);
      }
    };

    if (selectedChannel) {
      // Charger les messages immédiatement
      fetchMessages();
      
      // Rafraîchir toutes les 5 secondes
      interval = setInterval(fetchMessages, 5000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
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
    backgroundColor: COLORS.gray900,
  },
  mainContent: {
    flex: 1,
  },
});