import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Sidebar from '../../components/navigation/Sidebar';
import ChatWindow from '../../components/chat/ChatWindow';
import Header from '../../components/Header';
import * as SecureStore from 'expo-secure-store';
import { fetchChannelMessages } from '../../services/api/messageApi';
import { useTranslation } from 'react-i18next';

/**
 * @component ChatScreen
 * @description Displays the chat screen
 * @param {Function} onNavigate - A function to navigate to a screen
 * @param {boolean} isExpanded - A boolean to indicate if the menu is expanded
 * @param {Function} setIsExpanded - A function to set the isExpanded state
 * @param {Function} handleChatLogout - A function to handle logout
 */
export default function ChatScreen({ onNavigate, isExpanded, setIsExpanded, handleChatLogout, testID }) {

  const { t } = useTranslation();

  // States related to the chat
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [currentSection, setCurrentSection] = useState('chat');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [channelMessages, setChannelMessages] = useState([]);
  const [unreadChannels, setUnreadChannels] = useState({});
  const [editingMessage, setEditingMessage] = useState(null);

  /**
   * @function useEffect
   * @description Loads the initial messages of the channel
   */
  useEffect(() => {
    // Check if the component is mounted
    let isMounted = true;

    // Fetch messages from the channel
    const fetchMessages = async () => {
      try {
        // If the component is not mounted or the channel is not selected, we don't fetch messages
        if (!isMounted || !selectedChannel) return;

        // Get the user credentials
        const credentialsStr = await SecureStore.getItemAsync('userCredentials');
        if (!credentialsStr) return;

        // Parse the credentials
        const credentials = JSON.parse(credentialsStr);

        // Fetch the messages
        const messages = await fetchChannelMessages(selectedChannel.id, credentials);

        // If there are no messages, we set the channel messages to an empty array
        if (!messages || messages.length === 0) {
          setChannelMessages([]);
          return;
        }

        // If the component is mounted, we set the channel messages
        if (isMounted) {
          setChannelMessages(messages);
        }
      } catch (error) {
        // If there is an error, we set the channel messages to an empty array
        if (__DEV__) {
          throw new Error(t('errors.errorFetchingMessages'), error);
        }
        setChannelMessages([]);
      }
    };

    // Fetch the messages
    fetchMessages();

    // Return a cleanup function
    return () => {
      isMounted = false;
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

    console.log('🔄 Changement de canal dans ChatScreen:', {
        ancien: selectedChannel?.id,
        nouveau: channel?.id,
        channel: channel
    });

    // On réinitialise les messages avant de changer de canal
    setChannelMessages([]);
    // On met à jour le canal sélectionné
    setSelectedChannel({
        ...channel,
        id: channel.id.toString()  // On s'assure que l'ID est une chaîne
    });
  };

  // On ajoute un useEffect pour surveiller les changements de canal
  useEffect(() => {
    if (selectedChannel) {
        console.log('📢 Canal sélectionné mis à jour dans ChatScreen:', {
            id: selectedChannel.id,
            titre: selectedChannel.title
        });
    }
  }, [selectedChannel]);

  /**
   * @function handleInputFocusChange
   * @description Handles the input focus change, so we can mark all the messages as read as soon as we use the chat input
   * @param {boolean} isFocused - A boolean to indicate if the input is focused
   */
  const handleInputFocusChange = async (isFocused) => {
    setIsInputFocused(isFocused);
  };

  const handleEditMessage = (messageToEdit) => {
    console.log('📝 Message à éditer reçu dans ChatScreen:', messageToEdit);
    setEditingMessage(messageToEdit);
  };

  return (
    <View style={styles.container} testID={testID}>
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
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
  },
});