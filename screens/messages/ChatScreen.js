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
    console.log('Canal sélectionné:', channel);
    setSelectedChannel(channel);
    setChannelMessages(channel.messages || []);
    if (isExpanded) {
      toggleMenu();
    }
  };

  return (
    <View style={styles.container}>
      {/* We show the header with the menu icon, the account image and the back button */}
      <Header showMenuIcon={true} showAccountImage={true} onNavigate={onNavigate} toggleMenu={toggleMenu} onBackPress={() => onNavigate(SCREENS.APP_MENU)} />
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
        {/* We show the navbar only if the input is not focused */}
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