import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { COLORS, SIZES } from '../../constants/style';
import InputChatWindow from '../inputs/InputChatWindow';
import ChatMessage from './ChatMessage';
import DocumentPreviewModal from '../modals/chat/DocumentPreviewModal';
import { useDeviceType } from '../../hooks/useDeviceType';
import * as SecureStore from 'expo-secure-store';
import { sendMessageApi, fetchMessageFile, deleteMessageApi } from '../../services/api/messageApi';
import { useWebSocket } from '../../hooks/useWebSocket';
import DateBanner from './DateBanner';
import { Text } from '../text/CustomText';
import { useTranslation } from 'react-i18next';
/**
 * @component ChatWindow
 * @description A component that renders the chat window in the chat screen
 *
 * @param {Object} props - The properties of the component
 * @param {Object} props.channel - The channel to display
 *
 * @example
 * <ChatWindow channel={channel} messages={channelMessages} onInputFocusChange={() => console.log('Input focused')} />
 */
export default function ChatWindow({ channel, messages: channelMessages, onInputFocusChange, onMessageSent, testID }) {

  const { t } = useTranslation();

  const { isSmartphone } = useDeviceType();
  const scrollViewRef = useRef();
  const updatingRef = useRef(false);
  const previousMessagesRef = useRef([]);

  const [isDocumentPreviewModalVisible, setIsDocumentPreviewModalVisible] = useState(false);
  const [selectedFileUrl, setSelectedFileUrl] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState(null);
  const [selectedFileSize, setSelectedFileSize] = useState(null);
  const [selectedFileType, setSelectedFileType] = useState(null);
  const [selectedBase64, setSelectedBase64] = useState(null);
  const [messages, setMessages] = useState([]);
  const [credentials, setCredentials] = useState(null);
  const [error, setError] = useState(null);
  const [userRights, setUserRights] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingMessage, setEditingMessage] = useState(null);
  const [selectedMessageId, setSelectedMessageId] = useState(null);

  // Fonction pour charger les messages
  const loadMessages = useCallback(async () => {
    if (!channel || !credentials) return;

    try {
      const channelMessages = await fetchMessageFile(channel.id, credentials);
      setMessages(channelMessages);
      onMessageSent && onMessageSent();
    } catch (error) {
      console.error('🔴 Erreur chargement messages:', error);
      // setError(t('errors.loadingMessages'));
    }
  }, [channel, credentials, onMessageSent]);

  // Gestion des fichiers optimisée
  useEffect(() => {
    if (!isLoading && credentials && channel && messages.length > 0 && !updatingRef.current) {
      const messagesNeedingFiles = messages.filter(msg =>
        msg.type === 'file' &&
        !msg.base64 &&
        msg.fileType &&
        msg.fileType.toLowerCase() !== 'none'
      );

      if (messagesNeedingFiles.length === 0) return;

      const loadFiles = async () => {
        updatingRef.current = true;
        const batchSize = 3;
        const updatedMessages = [...messages];
        let hasUpdates = false;

        try {
          for (let i = 0; i < messagesNeedingFiles.length; i += batchSize) {
            const batch = messagesNeedingFiles.slice(i, i + batchSize);
            await Promise.all(
              batch.map(async (msg) => {
                try {
                  const base64 = await fetchMessageFile(msg.id, {
                    channelid: parseInt(channel.id, 10),
                    ...msg,
                  }, credentials);

                  const index = updatedMessages.findIndex(m => m.id === msg.id);
                  if (index !== -1 && base64) {
                    updatedMessages[index] = {
                      ...updatedMessages[index],
                      base64: base64,
                      type: 'file',
                    };
                    hasUpdates = true;
                  }
                } catch (fileError) {
                  console.error('Erreur chargement fichier:', fileError);
                }
              })
            );
          }

          if (hasUpdates) {
            setMessages(updatedMessages);
          }
        } finally {
          updatingRef.current = false;
        }
      };

      loadFiles();
    }
  }, [isLoading, credentials, channel, messages]);

  // Chargement initial des messages
  useEffect(() => {
    if (channelMessages && channel && !updatingRef.current) {
      console.log('📥 Chargement initial des messages du channel:', channel.id);
      // On ne met à jour que si on n'a pas déjà des messages
      if (messages.length === 0) {
        setMessages(channelMessages);
      }
    }
  }, [channelMessages, channel]);

  // WebSocket simplifié
  const handleWebSocketMessage = useCallback((data) => {
    if (!updatingRef.current && data.notification?.filters?.values?.channel) {
      const receivedChannelId = parseInt(data.notification.filters.values.channel, 10);
      const currentChannelId = channel ? parseInt(channel.id, 10) : null;

      console.log('🌐 WebSocket - Message reçu:', {
        channelRecu: receivedChannelId,
        channelActuel: currentChannelId,
        messageType: data.notification?.message?.type,
        messageId: data.notification?.message?.id
      });

      // Vérification stricte du canal avec les IDs convertis en nombres
      if (!currentChannelId || receivedChannelId !== currentChannelId) {
        console.log('🚫 Message ignoré - Canal différent', {
          recu: receivedChannelId,
          actuel: currentChannelId
        });
        return;
      }

      const newMessageData = data.notification.message;
      if (!newMessageData || !newMessageData.id) {
        console.log('🚫 Message ignoré - Données invalides');
        return;
      }

      setMessages(prevMessages => {
        // Vérifie si le message existe déjà
        const messageExists = prevMessages.some(msg => msg.id === newMessageData.id);
        if (messageExists) {
          console.log('🚫 Message ignoré - Déjà existant');
          return prevMessages;
        }

        // Cherche un message temporaire correspondant
        const tempMessage = prevMessages.find(msg =>
          msg.isTemp &&
          ((msg.type === 'file' && msg.fileName === newMessageData.fileName) ||
           (msg.type === 'text' && msg.text === (newMessageData.message?.message || newMessageData.message)))
        );

        if (tempMessage) {
          console.log('🔄 Remplacement du message temporaire');
          return prevMessages.map(msg =>
            msg.id === tempMessage.id ? {
              ...newMessageData,
              id: newMessageData.id,
              type: newMessageData.type || 'text',
              text: newMessageData.message?.message || newMessageData.message,
              message: newMessageData.message?.message || newMessageData.message,
              savedTimestamp: newMessageData.savedTimestamp,
              endTimestamp: newMessageData.endTimestamp,
              fileType: newMessageData.fileType || 'none',
              login: tempMessage.login,
              isOwnMessage: true,
              isUnread: false,
              username: 'Me'
            } : msg
          );
        }

        // Ajout d'un nouveau message
        console.log("➕ Ajout d'un nouveau message");
        const messageContent = newMessageData.message?.message || newMessageData.message;
        return [...prevMessages, {
          ...newMessageData,
          id: newMessageData.id,
          type: newMessageData.type || 'text',
          text: messageContent,
          message: messageContent,
          savedTimestamp: newMessageData.savedTimestamp,
          endTimestamp: newMessageData.endTimestamp,
          fileType: newMessageData.fileType || 'none',
          login: newMessageData.login,
          isOwnMessage: newMessageData.login === credentials?.login,
          isUnread: false,
          username: newMessageData.login === credentials?.login ? 'Me' : newMessageData.login
        }];
      });
    }
  }, [channel, credentials]);

  const handleWebSocketError = useCallback((error) => {
    console.error('🔴 Erreur WebSocket:', error);
  }, []);

  // Initialisation WebSocket avec le canal actuel
  const { closeConnection } = useWebSocket({
    onMessage: handleWebSocketMessage,
    onError: handleWebSocketError,
    channels: channel ? [`channel_${channel.id}`] : [], // Préfixe unique pour éviter les conflits
    subscriptions: channel ? [{
      type: 'channel',
      id: channel.id
    }] : []
  });

  // Réinitialisation des messages lors du changement de canal
  useEffect(() => {
    if (channel) {
      console.log('🔄 Changement de canal, réinitialisation des messages');
      setMessages([]); // On vide les messages
      if (channelMessages) {
        setMessages(channelMessages); // On charge les nouveaux messages
      }
    }
  }, [channel?.id]); // Dépendance sur l'ID du canal uniquement

  useEffect(() => {
    return () => {
      closeConnection();
    };
  }, [closeConnection]);

  /**
   * @function useEffect
   * @description We use the useEffect hook to update the messages when the channel messages change
   */
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const credentialsStr = await SecureStore.getItemAsync('userCredentials');
        const rightsStr = await SecureStore.getItemAsync('userRights');

        // Parser les droits correctement
        const rights = rightsStr ? JSON.parse(rightsStr) : null;

        if (credentialsStr) {
          const parsedCredentials = JSON.parse(credentialsStr);
          setCredentials(parsedCredentials);
          setUserRights(rights);
        }
      } catch (error) {
        console.error("Erreur chargement données utilisateur:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Function to open the document preview modal
  const openDocumentPreviewModal = (message) => {
    if (!message) return;

    setIsDocumentPreviewModalVisible(true);
    setSelectedFileUrl(message.uri);
    setSelectedFileName(message.fileName);
    setSelectedFileSize(message.fileSize);
    setSelectedFileType(message.fileType?.toLowerCase());
    setSelectedBase64(message.base64);
    setSelectedMessageId(message.id);
  };

  // Function to close the document preview modal
  const closeDocumentPreviewModal = () => {
    setIsDocumentPreviewModalVisible(false);
    setSelectedFileUrl(null);
  };

  /**
   * @function sendMessage
   * @description We send a message to the channel
   * @param {Object} messageData - The message data
   */
  const sendMessage = useCallback(async (messageData) => {
    try {
      console.log('🔵 Début sendMessage - messageData reçu:', JSON.stringify(messageData, null, 2));

      if (!channel) {
        console.log('❌ Pas de channel sélectionné');
        return;
      }

      // Vérification différente selon le type de message
      if (messageData.type === 'file') {
        if (!messageData.base64) {
          console.log('❌ Fichier invalide');
          return;
        }
      } else {
        const messageText = typeof messageData === 'object' ? messageData.text : messageData;
        if (!messageText || messageText.trim() === '') {
          console.log('❌ Message texte vide ou invalide');
          return;
        }
      }

      const credentialsStr = await SecureStore.getItemAsync('userCredentials');
      if (!credentialsStr) {
        console.log('❌ Pas de credentials trouvés');
        setError(t('errors.noCredentialsFound'));
        return;
      }

      const userCredentials = JSON.parse(credentialsStr);
      console.log('👤 Credentials utilisateur trouvés');

      // Message temporaire avec un ID unique
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const tempMessage = messageData.type === 'file' ? {
        id: tempId,
        type: 'file',
        fileName: messageData.fileName,
        fileType: messageData.fileType,
        fileSize: messageData.fileSize,
        base64: messageData.base64,
        uri: messageData.uri,
        text: messageData.messageText,
        savedTimestamp: Date.now(),
        login: userCredentials.login,
        isOwnMessage: true,
        isUnread: false,
        username: 'Me',
        isTemp: true
      } : {
        id: tempId,
        type: 'text',
        text: typeof messageData === 'object' ? messageData.text : messageData,
        message: typeof messageData === 'object' ? messageData.text : messageData,
        savedTimestamp: Date.now(),
        fileType: 'none',
        login: userCredentials.login,
        isOwnMessage: true,
        isUnread: false,
        username: 'Me',
        isTemp: true
      };

      console.log('📝 Message temporaire créé:', JSON.stringify(tempMessage, null, 2));

      // Ajout du message temporaire
      setMessages(prevMessages => [...prevMessages, tempMessage]);

      // Envoi du message
      const messageToSend = messageData.type === 'file' ? messageData : {
        type: 'text',
        message: typeof messageData === 'object' ? messageData.text : messageData
      };

      console.log('📤 Message à envoyer à l\'API:', JSON.stringify(messageToSend, null, 2));
      const response = await sendMessageApi(channel.id, messageToSend, userCredentials);
      console.log('📥 Réponse de l\'API:', JSON.stringify(response, null, 2));

      if (response.status !== 'ok') {
        console.log('❌ Erreur API, suppression du message temporaire');
        setMessages(prevMessages =>
          prevMessages.filter(msg => msg.id !== tempId)
        );
        setError(t('errors.errorSendingMessage'));
      } else {
        console.log('✅ Message envoyé avec succès, attente du WebSocket');
      }
    } catch (error) {
      console.error('🔴 Erreur dans sendMessage:', error);
      setError(t('errors.errorSendingMessage'));
    }
  }, [channel, t, setError]);

  const handleDeleteMessage = async (messageId) => {
    const messageToDelete = messages.find(msg => msg.id === messageId);
    const hasDeleteRights = userRights === "3";
    const isOwnMessage = messageToDelete?.isOwnMessage;

    if (!hasDeleteRights && !isOwnMessage) {
      setError(t('errors.noDeletePermission'));
      return;
    }

    try {
      const response = await deleteMessageApi(messageId, credentials);

      if (response.status === 'ok') {
        const updatedMessages = messages.filter(msg => msg.id !== messageId);
        setMessages(updatedMessages);
      } else {
        setError(t('errors.errorDeletingMessage'));
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setError(t('errors.errorDeletingMessage'));
    }
  };

  const handleEditMessage = async (messageToEdit) => {
    console.log('✏️ Message à éditer dans ChatWindow:', messageToEdit);
    setEditingMessage(messageToEdit);
  };

  /**
   * @function formatDate
   * @description We format the date of a message
   * @param {Object} timestamp - The timestamp of the message
   * @returns {String} The formatted date
   */
  const formatDate = (timestamp) => {
    // If the timestamp is missing, we return today
    if (!timestamp) {
      return t('dateTime.today'); // Default value
    }

    // If the timestamp is a string, we convert it to an integer
    const parsedTimestamp = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;

    // If the timestamp is not a number, we return today
    if (isNaN(parsedTimestamp)) {
      return t('dateTime.today'); // Default value
    }

    const date = new Date(parsedTimestamp);
    const today = new Date();
    // We create a date object for yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // If the date is today, we return "Today"
    if (date.toDateString() === today.toDateString()) {
      return t('dateTime.today');
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t('dateTime.yesterday');
    }

    // If the date is not today or yesterday, we return the date in the format "day month year"
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return null; // ou un indicateur de chargement
  }

  return (
    <View style={styles.container}>
      {channel ? (
        <>
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {(() => {
              // Si pas de messages, on retourne null
              if (!messages || messages.length === 0) {
                return (
                  <View style={styles.emptyMessagesContainer}>
                    <Text style={[
                      styles.emptyMessagesText,
                      isSmartphone && styles.emptyMessagesTextSmartphone
                    ]}>
                      {t('messages.noMessages')}
                    </Text>
                  </View>
                );
              }

              // Filtrer les messages invalides
              const validMessages = messages.filter(message =>
                message &&
                (message.text || message.message || message.type === 'file')
              );

              return validMessages.reduce((acc, message, index) => {
                // Vérifier que le message est valide
                if (!message || (!message.text && !message.message && message.type !== 'file')) {
                  return acc;
                }

                const currentDate = formatDate(message.savedTimestamp);
                const prevMessage = validMessages[index - 1];
                const prevDate = prevMessage ? formatDate(prevMessage.savedTimestamp) : null;

                if (currentDate !== prevDate) {
                  acc.push(
                    <DateBanner
                      key={`date-${currentDate}-${index}`}
                      date={currentDate}
                    />
                  );
                }

                acc.push(
                  <ChatMessage
                    key={message.id || `temp-${index}`}
                    message={message}
                    isOwnMessage={message.isOwnMessage}
                    onFileClick={openDocumentPreviewModal}
                    onDeleteMessage={handleDeleteMessage}
                    onEditMessage={handleEditMessage}
                    canDelete={userRights === "3"}
                    userRights={userRights}
                  />
                );

                return acc;
              }, []);
            })()}
          </ScrollView>

          <InputChatWindow
            onSendMessage={sendMessage}
            onFocusChange={onInputFocusChange}
            editingMessage={editingMessage}
          />

          <DocumentPreviewModal
            visible={isDocumentPreviewModalVisible}
            onClose={closeDocumentPreviewModal}
            fileName={selectedFileName}
            fileSize={selectedFileSize}
            fileType={selectedFileType}
            base64={selectedBase64}
            messageId={selectedMessageId}
            channelId={channel.id}
          />
        </>
      ) : (
        <View style={styles.noChannelContainer}>
          <Text style={[
            styles.noChannelText,
            isSmartphone && styles.noChannelTextSmartphone,
          ]}>
            {t('screens.selectChannel')}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray950,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  noChannelContainer: {
    alignItems: 'center',
    paddingTop: 50,
  },
  noChannelText: {
    color: COLORS.gray600,
    fontSize: SIZES.fonts.subtitleTablet,
  },
  noChannelTextSmartphone: {
    fontSize: SIZES.fonts.subtitleSmartphone,
  },
  channelDescription: {
    fontSize: SIZES.fonts.textSmartphone,
    color: COLORS.gray300,
    marginTop: 4,
  },
  messagesContainer: {
    flex: 1,
    padding: 10,
    marginBottom: 10,
  },
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyMessagesText: {
    color: COLORS.gray600,
    fontSize: SIZES.fonts.textTablet,
    textAlign: 'center',
  },
  emptyMessagesTextSmartphone: {
    fontSize: SIZES.fonts.textSmartphone,
  },
});