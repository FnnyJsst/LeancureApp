import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Navbar from '../../components/navigation/Navbar';
import Sidebar from '../../components/navigation/Sidebar';
import ChatWindow from '../../components/chat/ChatWindow';
import ChatHeader from '../../components/chat/ChatHeader';
import { COLORS } from '../../constants/style';

export default function ChatScreen({ onNavigate, isExpanded, setIsExpanded }) {
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [currentSection, setCurrentSection] = useState('chat');
  const [isInputFocused, setIsInputFocused] = useState(false);

  const toggleMenu = () => {
    setIsExpanded(!isExpanded);
  };

  const handleChannelSelect = (channel) => {
    setSelectedChannel(channel);
    if (isExpanded) {
      toggleMenu();
    }
  };

  const handleSectionChange = (section) => {
    if (section === 'chat') {
      setCurrentSection('chat');
    } else if (section === 'settings') {
      setCurrentSection('settings');
      onNavigate('SETTINGS_MESSAGE');
    } else if (section === 'account') {
      setCurrentSection('account');
      onNavigate('ACCOUNT');
    } 
  };


  return (
    <View style={styles.container}>
      <ChatHeader onNavigate={onNavigate} toggleMenu={toggleMenu} />
      <Sidebar 
        onChannelSelect={handleChannelSelect}
        selectedGroup={selectedGroup}
        onGroupSelect={setSelectedGroup}
        isExpanded={isExpanded}
        toggleMenu={toggleMenu}
      />
      <View style={styles.mainContent}>
        <ChatWindow 
          channel={selectedChannel}
          isExpanded={isExpanded}
          onInputFocusChange={setIsInputFocused}
        />
      {!isInputFocused && (
        <Navbar 
          currentSection={currentSection}
          onSectionChange={handleSectionChange}
        />
      )}
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