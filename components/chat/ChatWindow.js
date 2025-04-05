import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { COLORS, SIZES } from '../../constants/style';
import InputChatWindow from '../inputs/InputChatWindow';
import ChatMessage from './ChatMessage';
import DocumentPreviewModal from '../modals/chat/DocumentPreviewModal';
import { useDeviceType } from '../../hooks/useDeviceType';
import * as SecureStore from 'expo-secure-store';
import { sendMessageApi, fetchMessageFile, deleteMessageApi, editMessageApi } from '../../services/api/messageApi';
import { useWebSocket } from '../../hooks/useWebSocket';
import DateBanner from './DateBanner';
import { Text } from '../text/CustomText';
import { useTranslation } from 'react-i18next';
import { handleError, ErrorType } from '../../utils/errorHandling';
import { playNotificationSound } from '../../services/notificationService';

/**
 * @component ChatWindow
 * @description A component that renders the chat window in the chat screen
 * @param {Object} props.channel - The channel to display
 * @param {Object} props.messages - The messages to display
 * @param {Function} props.onInputFocusChange - The function to call when the input focus changes
 */
export default function ChatWindow({ channel, messages: channelMessages, onInputFocusChange }) {

  //Translation and device type hooks
  const { t } = useTranslation();
  const { isSmartphone } = useDeviceType();

  // Refs are used to avoid re-rendering the component when the state changes
  const scrollViewRef = useRef();
  const updatingRef = useRef(false);
  const processedMessageIds = useRef(new Set());

  const [isDocumentPreviewModalVisible, setIsDocumentPreviewModalVisible] = useState(false);
  const [selectedFileUrl, setSelectedFileUrl] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState(null);
  const [selectedFileSize, setSelectedFileSize] = useState(null);
  const [selectedFileType, setSelectedFileType] = useState(null);
  const [selectedBase64, setSelectedBase64] = useState(null);
  const [messages, setMessages] = useState([]);
  const [credentials, setCredentials] = useState(null);
  const [userRights, setUserRights] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingMessage, setEditingMessage] = useState(null);
  const [selectedMessageId, setSelectedMessageId] = useState(null);

  // WebSocket hook
  const { closeConnection } = useWebSocket({
    onMessage: handleWebSocketMessage,
    onError: handleWebSocketError,
    channels: channel ? [`channel_${channel.id}`] : [],
    subscriptions: channel ? [{
      type: 'channel',
      id: channel.id
    }] : []
  });

  /**
   * @description Load the files of the messages
   */
  useEffect(() => {
    // If the component is loaded, the credentials/channel/messages are set and the updatingRef is not current, we load the files
    if (!isLoading && credentials && channel && messages.length > 0 && !updatingRef.current) {
      // We filter the messages that need to be loaded
      const messagesNeedingFiles = messages.filter(msg =>
        msg.type === 'file' &&
        !msg.base64 &&
        msg.fileType &&
        msg.fileType.toLowerCase() !== 'none'
      );

      // If there are no messages needing files, we don't load anything
      if (messagesNeedingFiles.length === 0) return;

      // We load the files
      const loadFiles = async () => {
        updatingRef.current = true;
        // We create a batch size to avoid loading all the files at once
        const batchSize = 3;
        // We create a copy of the messages
        const updatedMessages = [...messages];
        let hasUpdates = false;

        try {
          // We loop through the messages needing files
          for (let i = 0; i < messagesNeedingFiles.length; i += batchSize) {
            // We create a batch of messages
            const batch = messagesNeedingFiles.slice(i, i + batchSize);
            // We load the files
            await Promise.all(
              batch.map(async (msg) => {
                try {
                  // We fetch the file of the message
                  const base64 = await fetchMessageFile(msg.id, {
                    channelid: parseInt(channel.id, 10),
                    ...msg,
                  }, credentials);

                  // We update the message
                  const index = updatedMessages.findIndex(m => m.id === msg.id);
                  // If the message is found and the base64 is set, we update the message
                  if (index !== -1 && base64) {
                    updatedMessages[index] = {
                      ...updatedMessages[index],
                      base64: base64,
                      type: 'file',
                    };
                    hasUpdates = true;
                  }
                } catch (fileError) {
                  handleChatError(fileError, 'message.file', { silent: false });
                }
              })
            );
          }
          // If there are updates, we update the messages
          if (hasUpdates) {
            setMessages(updatedMessages);
          }
        // We finally set the updatingRef to false to avoid re-rendering the component when the state changes
        } finally {
          updatingRef.current = false;
        }
      };

      loadFiles();
    }
  }, [isLoading, credentials, channel, messages]);

  /**
   * @description Update the messages when the channel messages change
   */
  useEffect(() => {
    if (channel && channelMessages) {
      // We update the messages only if there are new messages
      if (channelMessages.length > 0) {
        setMessages(channelMessages);
      }
    }
  }, [channel?.id, channelMessages]);

  /**
   * @description Handle chat-related errors
   * @returns {object} Formatted error
   */
  const handleChatError = (error, source, options = {}) => {
    const { t } = useTranslation();
    return handleError(error, `chatWindow.${source}`, {
      type: ErrorType.SYSTEM,
      ...options
    });
  };

  /**
   * @function formatMessage
   * @description Format a message for display
   * @param {Object} msg - The raw message
   * @param {Object} credentials - The user credentials
   * @returns {Object} The formatted message
   */
  const formatMessage = (msg, credentials) => {
    const messageText = msg.message || '';
    const isOwnMessageByLogin = msg.login === credentials?.login;

    return {
      id: msg.id?.toString() || Date.now().toString(),
      type: msg.type || 'text',
      text: messageText,
      message: messageText,
      savedTimestamp: msg.savedTimestamp || Date.now().toString(),
      fileType: msg.fileType || 'none',
      login: msg.login || 'unknown',
      isOwnMessage: isOwnMessageByLogin,
      isUnread: false,
      username: isOwnMessageByLogin ? 'Me' : (msg.login || 'Unknown'),
      base64: msg.base64
    };
  };

  /**
   * @function handleWebSocketMessage
   * @description Handle the WebSocket message
   */
  const handleWebSocketMessage = useCallback(async (data) => {
    try {
      const messageId = data.message?.id || data.notification?.message?.id;

      // If the message has already been processed, we ignore it
      if (messageId && processedMessageIds.current.has(messageId)) {
        console.log('⏭️ Message déjà traité, ignoré:', messageId);
        return;
      }

      // We add the message ID to the list of processed messages
      if (messageId) {
        processedMessageIds.current.add(messageId);
      }

      // We check if the message is a notification or a message
      if (data.type === 'notification' || data.type === 'message') {
        // We extract the channel ID
        const channelId = data.filters?.values?.channel;
        const currentChannelId = channel?.id?.toString();

        // If the current channel ID is not set, we throw an error
        if (!currentChannelId) {
          handleChatError(t('errors.noCurrentChannel'), 'message.validation');
          return;
        }

        // We clean the received and current channel IDs
        const cleanReceivedChannelId = channelId?.toString()?.replace('channel_', '');
        const cleanCurrentChannelId = currentChannelId?.toString()?.replace('channel_', '');

        // If the cleaned channel IDs are not the same, we throw an error
        if (cleanReceivedChannelId !== cleanCurrentChannelId) {
          handleChatError(t('errors.channelMismatch'), 'message.validation');
          return;
        }

        // We extract the message content
        const messageContent = data.message;

        // If the message content is not set, we throw an error
        if (!messageContent) {
          handleChatError(t('errors.noMessageContent'), 'message.validation');
          return;
        }

        // Enrichissement du message avec les informations nécessaires pour la détection des messages propres
        messageContent.channelId = cleanReceivedChannelId;

        // Si nous avons des credentials et un login, nous pouvons pré-déterminer si c'est un message propre
        if (credentials && credentials.login && messageContent.login) {
          messageContent.isOwnMessage = messageContent.login === credentials.login;
        }

        // We play the notification sound
        // The variable globally currentlyViewedChannel will be used automatically
        await playNotificationSound(messageContent, null, credentials);

        // If the message content is an array of messages, we update the messages
        if (messageContent.type === 'messages' && Array.isArray(messageContent.messages)) {
          setMessages(prevMessages => {
            const newMessages = messageContent.messages
              .filter(msg => {
                // We check if the message exists in the previous messages
                const messageExists = prevMessages.some(prevMsg => prevMsg.id === msg.id);
                if (messageExists) {
                  return false;
                }
                return true;
              })
              // We format the messages
              .map(msg => {
                processedMessageIds.current.add(msg.id);
                return formatMessage(msg, credentials);
              });
            return [...prevMessages, ...newMessages].sort((a, b) =>
              parseInt(a.savedTimestamp) - parseInt(b.savedTimestamp)
            );
          });
          return;
        }

        // If the message content is a unique message, we update the messages
        setMessages(prevMessages => {
          const newMessage = formatMessage(messageContent, credentials);

          // On vérifie si le message existe déjà
          const messageExists = prevMessages.some(msg => msg.id === newMessage.id);

          if (messageExists) {
            return prevMessages;
          }

          return [...prevMessages, newMessage];
        });
        return;
      }

      // If the message is in the format of a nested notification
      if (data.notification) {
        const channelId = data.notification.filters?.values?.channel;
        const currentChannelId = channel ? channel.id.toString() : null;

        if (!currentChannelId || channelId !== currentChannelId) {
          handleChatError(t('errors.channelMismatch'), 'message.validation');
          return;
        }

        // If the message content is not set, we return nothing
        const messageContent = data.notification.message;
        if (!messageContent) {
          return;
        }

        // Enrichissement du message avec les informations nécessaires pour le filtrage des notifications
        messageContent.channelId = channelId;

        // Si nous avons des credentials et un login, nous pouvons pré-déterminer si c'est un message propre
        if (credentials && credentials.login && messageContent.login) {
          messageContent.isOwnMessage = messageContent.login === credentials.login;
        }

        console.log('📨 Notification imbriquée formatée:', JSON.stringify({
          id: messageContent.id,
          login: messageContent.login,
          isOwnMessage: messageContent.isOwnMessage,
          channelId
        }));

        // We play the notification sound
        // The variable globally currentlyViewedChannel will be used automatically
        await playNotificationSound(messageContent, null, credentials);

        // We format the message
        setMessages(prevMessages => {
          const newMessage = formatMessage(messageContent, credentials);

          // We check if the message exists in the previous messages
          const messageExists = prevMessages.some(msg => msg.id === newMessage.id);

          if (messageExists) {
            return prevMessages;
          }

          return [...prevMessages, newMessage];
        });
        return;
      }

    } catch (error) {
      handleChatError(error, 'message.processing', { silent: false });
    }
  }, [channel, credentials, t]);

  /**
   * @function handleWebSocketError
   * @description Handle the WebSocket error
   */
  const handleWebSocketError = useCallback((error) => {
    handleChatError(error, 'websocket', { silent: false });
  }, []);

  /**
   * @description Close the WebSocket connection when the component unmounts
   */
  useEffect(() => {
    return () => {
      closeConnection();
    };
  }, [closeConnection]);

  /**
   * @description Update the messages when the channel messages change
   */
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // We get the user credentials
        const credentialsStr = await SecureStore.getItemAsync('userCredentials');
        // We get the user rights and parse them
        const rightsStr = await SecureStore.getItemAsync('userRights');
        const rights = rightsStr ? JSON.parse(rightsStr) : null;

        // If the credentials are found, we set the credentials and the rights
        if (credentialsStr) {
          const parsedCredentials = JSON.parse(credentialsStr);
          setCredentials(parsedCredentials);
          setUserRights(rights);
        }
      } catch (error) {
        handleChatError(error, 'userData.loading', { silent: false });
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  /**
   * @function openDocumentPreviewModal
   * @description Open the document preview modal when a file is clicked
   */
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

  /**
   * @function closeDocumentPreviewModal
   * @description Close the document preview modal
   */
  const closeDocumentPreviewModal = () => {
    setIsDocumentPreviewModalVisible(false);
    setSelectedFileUrl(null);
  };

  /**
   * @function sendMessage
   * @description Send a message to the channel
   * @param {Object} messageData - The message data
   */
  const sendMessage = useCallback(async (messageData) => {
    try {
      console.log('=== Début sendMessage ===');
      console.log('MessageData reçu:', messageData);

      // If the channel is not set, we throw an error
      if (!channel) {
        console.log('Erreur: Pas de channel sélectionné');
        handleChatError(t('errors.noChannelSelected'), 'sendMessage.validation');
        return;
      }

      // Check if the message is an edit of an existing message
      const isEditing = messageData.isEditing === true && messageData.messageId;
      console.log('Est-ce une édition?', isEditing);

      // If the message is an editing, use the editing function
      if (isEditing) {
        // We get the user credentials and parse them
        const credentialsStr = await SecureStore.getItemAsync('userCredentials');
        const userCredentials = JSON.parse(credentialsStr);
        // If the credentials are not found, we throw an error
        if (!credentialsStr) {
          console.log('Erreur: Pas de credentials trouvés pour l\'édition');
          handleChatError(t('errors.noCredentialsFound'), 'sendMessage.validation');
          return;
        }

        // We send the editing request
        const response = await editMessageApi(messageData.messageId, messageData, userCredentials);
        console.log('Réponse de l\'édition:', response);

        // If the response is ok, we update the message locally immediately
        if (response.status === 'ok') {
          // We update the message locally immediately
          setMessages(prevMessages => {
            const updatedMessages = prevMessages.map(msg => {
              if (msg.id === messageData.messageId) {
                const updatedText = messageData.text || '';
                // We update the message
                return {
                  ...msg,
                  text: updatedText,
                  message: updatedText,
                  title: updatedText.substring(0, 50),
                  savedTimestamp: Date.now()
                };
              }
              return msg;
            });
            return updatedMessages;
          });

          setEditingMessage(null);
          return;
        } else {
          console.log('Erreur lors de l\'édition du message');
          handleChatError(t('errors.errorEditingMessage'), 'sendMessage.process');
        }
      }

      // For a new message (non-editing), we continue with the existing code
      // We check the type of message
      if (messageData.type === 'file') {
        console.log('Message de type fichier détecté');
        console.log('Type de fichier:', messageData.fileType);
        console.log('Nom du fichier:', messageData.fileName);
        console.log('Taille du fichier:', messageData.fileSize);

        if (!messageData.base64) {
          console.log('Erreur: Pas de base64 pour le fichier');
          handleChatError(t('errors.invalidFile'), 'sendMessage.validation');
          return;
        }

        if (messageData.fileType === 'csv') {
          console.log('Traitement spécial pour un fichier CSV');
          console.log('Contenu CSV (premiers caractères):', messageData.base64.substring(0, 100));
        }
      } else {
        const messageText = typeof messageData === 'object' ? messageData.text : messageData;
        console.log('Message texte:', messageText);
        // If the message text is invalid, we throw an error
        if (!messageText || messageText.trim() === '') {
          console.log('Erreur: Message texte invalide');
          handleChatError(t('errors.invalidMessageText'), 'sendMessage.validation');
          return;
        }
      }

      const credentialsStr = await SecureStore.getItemAsync('userCredentials');
      const userCredentials = JSON.parse(credentialsStr);
      console.log('Credentials récupérés:', userCredentials?.login);

      // If the credentials are not found, we throw an error
      if (!credentialsStr) {
        console.log('Erreur: Pas de credentials trouvés');
        handleChatError(t('errors.noCredentialsFound'), 'sendMessage.validation');
        return;
      }

      // Enregistrer le timestamp du message envoyé
      // Cette information sera utilisée pour détecter les notifications de nos propres messages
      const sendTimestamp = Date.now();
      await SecureStore.setItemAsync('lastMessageSent', sendTimestamp.toString());

      // We send the message
      // Important: we explicitly mark that it is our own message
      const messageToSend = messageData.type === 'file' ? {
        ...messageData,
        login: userCredentials.login,
        isOwnMessage: true,  // Explicit flag
        sendTimestamp        // Add the timestamp for traceability
      } : {
        type: 'text',
        message: typeof messageData === 'object' ? messageData.text : messageData,
        login: userCredentials.login,
        isOwnMessage: true,  // Explicit flag
        sendTimestamp        // Add the timestamp for traceability
      };

      console.log('Message préparé pour l\'envoi:', messageToSend);

      // We send the message to the API
      console.log('Envoi du message à l\'API...');
      const response = await sendMessageApi(channel.id, messageToSend, userCredentials);
      console.log('Réponse de l\'API:', response);

      // Update the global variable to indicate that a message has been sent recently
      global.lastSentMessageTime = sendTimestamp;
      // Duration during which we consider that a notification is related to our sending (in ms)
      global.messageNotificationWindow = 5000; // 5 seconds

      // If we have a server message ID, also register it
      if (response.status === 'ok' && response.message && response.message.id) {
        global.lastSentMessageId = response.message.id.toString();
        console.log('🆔 ID du dernier message envoyé:', global.lastSentMessageId);
      }

      // If the response is not ok, we throw an error
      if (response.status !== 'ok') {
        console.log('Erreur: Le message n\'a pas été envoyé');
        handleChatError(t('errors.messageNotSent'), 'sendMessage.process');
        return;
      }

      // The message will be added via the WebSocket
      console.log('Message sent successfully, waiting for WebSocket confirmation');

      console.log('=== Fin sendMessage ===');

    } catch (error) {
      console.error('Erreur dans sendMessage:', error);
      handleChatError(error, 'sendMessage.process', { silent: false });
      throw error;
    }
  }, [channel, t]);

  /**
   * @function handleDeleteMessage
   * @description We handle the delete message
   * @param {String} messageId - The ID of the message to delete
   */
  const handleDeleteMessage = async (messageId) => {
    try {
      const messageToDelete = messages.find(msg => msg.id === messageId);
      const hasDeleteRights = userRights === "3";
      const isOwnMessage = messageToDelete?.isOwnMessage;

      if (!hasDeleteRights && !isOwnMessage) {
        handleChatError(t('errors.noDeletePermission'), 'deleteMessage.validation');
        return;
      }

      const response = await deleteMessageApi(messageId, credentials);

      if (response.status === 'ok') {
        const updatedMessages = messages.filter(msg => msg.id !== messageId);
        setMessages(updatedMessages);
      } else {
        handleChatError(t('errors.messageNotDeleted'), 'deleteMessage.process');
      }
    } catch (error) {
      handleChatError(error, 'deleteMessage.process', { silent: false });
      throw error;
    }
  };

  const handleEditMessage = async (messageToEdit) => {
    try {
      if (!messageToEdit || !messageToEdit.id) {
        handleChatError(t('errors.invalidMessageEdit'), 'editMessage.validation');
        return;
      }

      setEditingMessage(messageToEdit);
    } catch (error) {
      handleChatError(error, 'editMessage.process');
    }
  };

  /**
   * @function formatDate
   * @description Format the date of a message
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
    return null;
  }

  // We filter the messages
  const validMessages = messages.filter(message => {
    if (!message) {
      return false;
    }

    const hasText = !!message.text;
    const hasMessageProp = !!message.message;
    const isFileType = message.type === 'file';
    const isValid = hasText || hasMessageProp || isFileType;

    return isValid;
  });

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
              return validMessages.reduce((acc, message, index) => {
                // If the message is not valid, we return the accumulator
                if (!message || (!message.text && !message.message && message.type !== 'file')) {
                  return acc;
                }

                const currentDate = formatDate(message.savedTimestamp);
                const prevMessage = validMessages[index - 1];
                const prevDate = prevMessage ? formatDate(prevMessage.savedTimestamp) : null;

                if (currentDate !== prevDate) {
                  acc.push(
                    <DateBanner
                      key={`date-${currentDate}-${index}-${message.id}`}
                      date={currentDate}
                    />
                  );
                }

                acc.push(
                  <ChatMessage
                    key={`msg-${message.id || index}-${index}`}
                    message={{
                      ...message,
                      text: message.text || message.message || '',
                    }}
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
  messagesContainer: {
    flex: 1,
    padding: 10,
    marginBottom: 10,
  },
});