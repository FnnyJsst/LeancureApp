import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Navbar from '../../components/navigation/Navbar';
import Sidebar from '../../components/navigation/Sidebar';
import ChatWindow from '../../components/chat/ChatWindow';
import ChatHeader from '../../components/chat/ChatHeader';
import { COLORS } from '../../assets/styles/constants';

export default function ChatScreen({ isExpanded, setIsExpanded, setCurrentScreen }) {
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
      setCurrentScreen('SettingsMessage');
    } else if (section === 'account') {
      setCurrentSection('account');
      setCurrentScreen('AccountScreen');
    } 
  };


  return (
    <View style={styles.container}>
      <ChatHeader setCurrentScreen={setCurrentScreen}/>
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
          toggleMenu={toggleMenu}
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
    backgroundColor: COLORS.darkGray,
  },
  mainContent: {
    flex: 1,
  },
});