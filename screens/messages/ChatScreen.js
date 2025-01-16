import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Navbar from '../../components/navigation/Navbar';
import Sidebar from '../../components/navigation/Sidebar';
import ChatWindow from '../../components/chat/ChatWindow';
import Header from '../../components/Header';
import { useNavbarNavigation } from '../../hooks/UseNavbarNavigation';
import { COLORS } from '../../constants/style';
import { SCREENS } from '../../constants/screens';

export default function ChatScreen({ onNavigate, isExpanded, setIsExpanded }) {
   // Custom hook to handle the navbar navigation
   const handleSectionChange = useNavbarNavigation(onNavigate);

  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [currentSection, setCurrentSection] = useState('chat');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [channelMessages, setChannelMessages] = useState([]);

 

  const toggleMenu = () => {
    setIsExpanded(!isExpanded);
  };

  const handleChannelSelect = (channel, messages) => {
    setSelectedChannel(channel);
    setChannelMessages(messages || []);
    if (isExpanded) {
      toggleMenu();
    }
  };

  return (
    <View style={styles.container}>
      <Header showMenuIcon={true} showAccountImage={true} onNavigate={onNavigate} toggleMenu={toggleMenu} onBackPress={() => onNavigate(SCREENS.LOGIN)} />
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
          messages={channelMessages}
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