import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import Sidebar from '../../components/navigation/Sidebar';
import ChatWindow from '../../components/chat/ChatWindow';
import Header from '../../components/Header';
import * as SecureStore from 'expo-secure-store';
import { fetchChannelMessages } from '../../services/api/messageApi';
import { useTranslation } from 'react-i18next';
import { handleError, ErrorType } from '../../utils/errorHandling';
import { useWebSocket } from '../../hooks/useWebSocket';

// Variable globale pour stocker l'ID du canal actuellement visualisé
// Cette variable sera utilisée par le service de notification
export let currentlyViewedChannel = null;

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

  // Mise à jour de la variable globale quand le canal sélectionné change
  useEffect(() => {
    if (selectedChannel && selectedChannel.id) {
      console.log('🔔 Mise à jour du canal actuellement visualisé:', selectedChannel.id);
      currentlyViewedChannel = selectedChannel.id.toString();

      // Sauvegarder également le nom du canal pour la comparaison avec les notifications
      if (selectedChannel.title) {
        console.log('🔔 Enregistrement du nom du canal actuel:', selectedChannel.title);
        // Définir une variable globale pour un accès facile
        global.currentlyViewedChannel = selectedChannel.id.toString();
        // Stocker dans SecureStore pour la persistance
        SecureStore.setItemAsync('viewedChannelName', selectedChannel.title)
          .catch(err => console.error('❌ Erreur lors de l\'enregistrement du nom du canal:', err));
      }
    } else {
      currentlyViewedChannel = null;
      global.currentlyViewedChannel = null;
      // Effacer le nom du canal si aucun canal n'est sélectionné
      SecureStore.deleteItemAsync('viewedChannelName')
        .catch(err => console.error('❌ Erreur lors de la suppression du nom du canal:', err));
    }

    // Nettoyage lors du démontage du composant
    return () => {
      currentlyViewedChannel = null;
      global.currentlyViewedChannel = null;
      SecureStore.deleteItemAsync('viewedChannelName')
        .catch(err => console.error('❌ Erreur lors du nettoyage du nom du canal:', err));
    };
  }, [selectedChannel]);

  // Gestion des messages WebSocket
  const handleWebSocketMessage = useCallback((data) => {

    if (data.message && data.message.type === 'messages') {
      const newMessages = data.message.messages;

      setChannelMessages(prevMessages => {
        // Création d'un Set des IDs des messages existants pour éviter les doublons
        const existingMessageIds = new Set(prevMessages.map(msg => msg.id));

        // Filtrage des nouveaux messages pour ne garder que ceux qui n'existent pas déjà
        const uniqueNewMessages = newMessages.filter(msg => !existingMessageIds.has(msg.id));

        if (uniqueNewMessages.length === 0) {
          console.log('ℹ️ Aucun nouveau message à ajouter');
          return prevMessages;
        }

        console.log('➕ Ajout de', uniqueNewMessages.length, 'nouveaux messages');
        return [...prevMessages, ...uniqueNewMessages];
      });
    }
  }, []);

  // Initialisation du WebSocket
  const { sendMessage, closeConnection, isConnected } = useWebSocket({
    onMessage: handleWebSocketMessage,
    onError: (error) => {
      console.error('❌ Erreur WebSocket dans ChatScreen:', error);
    },
    channels: selectedChannel ? [`channel_${selectedChannel.id}`] : []
  });

  // Rafraîchissement des messages
  const refreshMessages = useCallback(async () => {
    try {
      console.log('🔄 Rafraîchissement des messages pour le canal:', selectedChannel?.id);

      if (!selectedChannel) {
        console.log('⚠️ Aucun canal sélectionné');
        return;
      }

      const credentialsStr = await SecureStore.getItemAsync('userCredentials');
      if (!credentialsStr) {
        console.log('❌ Pas de credentials trouvés');
        return;
      }

      const credentials = JSON.parse(credentialsStr);
      const messages = await fetchChannelMessages(selectedChannel.id, credentials);

      console.log('📥 Messages récupérés:', messages.length);
      setChannelMessages(messages);
    } catch (error) {
      console.error('❌ Erreur lors du rafraîchissement des messages:', error);
    }
  }, [selectedChannel]);

  // Effet pour charger les messages initiaux
  useEffect(() => {
    refreshMessages();
  }, [selectedChannel, refreshMessages]);

  // Effet pour nettoyer la connexion WebSocket
  useEffect(() => {
    return () => {
      console.log('🧹 Nettoyage de la connexion WebSocket');
      closeConnection();
    };
  }, [closeConnection]);

  /**
   * @description Handle chat-related errors
   * @param {Error} error - The error
   * @param {string} source - The source
   * @param {object} options - Additional options
   * @returns {object} Formatted error
   */
  const handleChatError = (error, source, options = {}) => {
    return handleError(error, `chat.${source}`, {
      type: ErrorType.SYSTEM,
      ...options
    });
  };

  // Toggle the sidebar menu
  const toggleMenu = () => {
    setIsExpanded(!isExpanded);
  };

  /**
   * @function handleChannelSelect
   * @description Handles the channel selection
   * @param {Object} channel - The channel to select
   */
  const handleChannelSelect = (channel) => {
    try {
      if (isExpanded) {
        toggleMenu();
      }

      if (!channel || !channel.id) {
        handleChatError(
          'Tentative de sélection d\'un canal invalide',
          'channelSelect.validation',
          { silent: true }
        );
        return;
      }

      // We reset the messages before changing the channel
      setChannelMessages([]);
      // We update the selected channel
      setSelectedChannel({
        ...channel,
        id: channel.id.toString()
      });
    } catch (error) {
      handleChatError(error, 'channelSelect.process');
    }
  };

  // Handle the input focus change to mark all the messages as read as soon as we use the chat input
  const handleInputFocusChange = async (isFocused) => {
    try {
      setIsInputFocused(isFocused);
    } catch (error) {
      handleChatError(error, 'inputFocusChange');
    }
  };

  const handleEditMessage = (messageToEdit) => {
    try {
      if (!messageToEdit || !messageToEdit.id) {
        handleChatError(
          'Tentative d\'édition d\'un message invalide',
          'editMessage.validation',
          { silent: true }
        );
        return;
      }

      setEditingMessage(messageToEdit);
    } catch (error) {
      handleChatError(error, 'editMessage.process');
    }
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
          onEditMessage={handleEditMessage}
          editingMessage={editingMessage}
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