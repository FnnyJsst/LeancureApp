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
import { playNotificationSound } from '../../services/notification/notificationService';
import { useNotification } from '../../services/notification/notificationContext';

/**
 * @component ChatWindow
 * @description A component that renders the chat window in the chat screen
 * @param {Object} props.channel - The channel to display
 * @param {Object} props.messages - The messages to display
 * @param {Function} props.onInputFocusChange - The function to call when the input focus changes
 */
export default function ChatWindow({ channel, messages: channelMessages, onInputFocusChange }) {

  //Translations
  const { t } = useTranslation();
  // Device type detection
  const { isSmartphone } = useDeviceType();
  // Notification hook
  const { recordSentMessage, markChannelAsUnread } = useNotification();
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


  // Refs are used to avoid re-rendering the component when the state changes
  const scrollViewRef = useRef();
  const updatingRef = useRef(false);
  const processedMessageIds = useRef(new Set());

  // States
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
    try {
      // Si l'erreur est déjà un objet Error, on l'utilise directement
      if (error instanceof Error) {
        return handleError(error, `chatWindow.${source}`, {
          type: ErrorType.SYSTEM,
          ...options
        });
      }

      // Si l'erreur est une chaîne, on crée un nouvel objet Error
      if (typeof error === 'string') {
        const formattedError = new Error(error);
        return handleError(formattedError, `chatWindow.${source}`, {
          type: ErrorType.SYSTEM,
          ...options
        });
      }

      // Si l'erreur est un objet, on essaie d'extraire le message
      if (typeof error === 'object' && error !== null) {
        const errorMessage = error.message || error.error || JSON.stringify(error);
        const formattedError = new Error(errorMessage);
        return handleError(formattedError, `chatWindow.${source}`, {
          type: ErrorType.SYSTEM,
          ...options
        });
      }

      // Si on ne peut pas déterminer le type d'erreur, on crée une erreur par défaut
      const defaultError = new Error('Une erreur inattendue est survenue');
      return handleError(defaultError, `chatWindow.${source}`, {
        type: ErrorType.SYSTEM,
        ...options
      });
    } catch (e) {
      // En cas d'erreur dans la gestion de l'erreur, on crée une erreur par défaut
      console.error('Erreur dans handleChatError:', e);
      const fallbackError = new Error('Erreur lors de la gestion de l\'erreur');
      return handleError(fallbackError, `chatWindow.${source}`, {
        type: ErrorType.SYSTEM,
        ...options
      });
    }
  };

  /**
   * @function formatMessage
   * @description Format a message for display
   * @param {Object} msg - The raw message
   * @param {Object} credentials - The user credentials
   * @returns {Object} The formatted message
   */
  const formatMessage = (msg, credentials) => {
    const messageText = msg.text || msg.message || '';
    const isOwnMessageByLogin = msg.login === credentials?.login;

    return {
      id: msg.id?.toString() || Date.now().toString(),
      type: msg.type || 'text',
      text: messageText,
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
      console.log('📨 Message WebSocket reçu:', JSON.stringify(data, null, 2));

      const messageId = data.message?.id || data.notification?.message?.id;
      console.log('🔑 ID du message:', messageId);

      // If the message has already been processed, we ignore it
      if (messageId && processedMessageIds.current.has(messageId)) {
        console.log('🔄 Message déjà traité, ignoré');
        return;
      }

      // We add the message ID to the list of processed messages
      if (messageId) {
        processedMessageIds.current.add(messageId);
        console.log('✅ Message ajouté à la liste des messages traités');
      }

      // Check if it's a notification to mark a channel as unread
      if (data.notification && data.notification.type === 'chat' && data.notification.message) {
        console.log('🔔 Notification de chat détectée');
        // It's a chat message notification
        const notifMessage = data.notification.message;
        console.log('📝 Détails du message:', JSON.stringify(notifMessage, null, 2));

        // Check if the message is from the current user
        const credentialsStr = await SecureStore.getItemAsync('userCredentials');
        const userCredentials = credentialsStr ? JSON.parse(credentialsStr) : null;
        const isOwnMessage = userCredentials && notifMessage.login === userCredentials.login;
        console.log('👤 Message propre:', isOwnMessage);

        // Extract channel ID from the notification
        let channelId = null;
        if (notifMessage.channelId) {
          channelId = notifMessage.channelId.toString().replace('channel_', '');
        } else if (data.notification.body) {
          // Try to extract channel name from the notification body
          const channelMatch = data.notification.body.match(/channel\s+(.+)$/i);
          if (channelMatch) {
            const channelName = channelMatch[1].trim();
            console.log('📌 Nom du canal extrait:', channelName);

            // Get the channel ID from the notification filters
            if (data.notification.filters?.values?.channel) {
              channelId = data.notification.filters.values.channel.toString().replace('channel_', '');
              console.log('✅ ID du canal trouvé dans les filtres:', channelId);
            }
          }
        }

        // If we have a channel ID and it's not the current channel, mark as unread
        if (channelId) {
          const currentChannelId = channel?.id?.toString();
          console.log('📌 Canal du message:', channelId);
          console.log('📌 Canal actuel:', currentChannelId);

          // Only mark as unread if it's not the current channel
          if (channelId !== currentChannelId) {
            console.log('🔔 Marquer le canal comme non lu:', channelId);
            markChannelAsUnread(channelId, true);
          } else {
            console.log('🔕 Canal actuel, pas marqué comme non lu');
          }
        } else {
          console.log('❌ Impossible de trouver l\'ID du canal');
        }
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

        messageContent.channelId = cleanReceivedChannelId;

        // We check if we are the sender of the message
        if (credentials && credentials.login && messageContent.login) {
          messageContent.isOwnMessage = messageContent.login === credentials.login;
        }

        // We play the notification sound
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
      console.error('❌ Erreur dans handleWebSocketMessage:', error);
      handleChatError(error, 'message.processing', { silent: false });
    }
  }, [channel, credentials, t, markChannelAsUnread]);

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
   */
  const sendMessage = useCallback(async (messageData) => {
    try {
      // We record the timestamp of the sent message to avoid notifications
      const currentTime = Date.now();
      recordSentMessage(currentTime);

      // If the channel is not set, we throw an error
      if (!channel) {
        const error = new Error(t('errors.noChannel'));
        handleChatError(error, 'sendMessage.validation');
        return;
      }

      // If the credentials are not set, we get them
      if (!credentials) {
        const credentialsStr = await SecureStore.getItemAsync('userCredentials');
        if (!credentialsStr) {
          const error = new Error(t('errors.noCredentials'));
          handleChatError(error, 'sendMessage.validation');
          return;
        }
        const userCredentials = JSON.parse(credentialsStr);
        setCredentials(userCredentials);
      }

      // We get the user credentials
      const userCredentials = credentials;

      // Create a timestamp for the message
      const sendTimestamp = Date.now();

      // Check if the message is an edit of an existing message
      const isEditing = messageData.isEditing === true && messageData.messageId;

      if (isEditing) {
        try {
          // We send the editing request
          const response = await editMessageApi(messageData.messageId, messageData, userCredentials);

          if (response.status === 'ok') {
            setEditingMessage(null);

            // We update the messages
            setMessages(prevMessages => {
              const updatedMessages = prevMessages.map(msg => {
                if (msg.id === messageData.messageId) {
                  const updatedText = messageData.text || '';
                  // We update the message
                  return {
                    ...msg,
                    message: updatedText,
                    text: updatedText
                  };
                }
                return msg;
              });
              return updatedMessages;
            });
          } else {
            const error = new Error(response.message || t('errors.editFailed'));
            handleChatError(error, 'editMessage');
            return;
          }

          return; // We stop the execution here
        } catch (error) {
          handleChatError(error, 'editMessage');
          return;
        }
      }

      // For a new message (non-editing), we continue with the existing code
      // We check the type of message
      if (messageData.type === 'file') {
        if (!messageData.base64) {
          const error = new Error(t('errors.invalidFile'));
          handleChatError(error, 'sendMessage.validation');
          return;
        }
      } else {
        const messageText = typeof messageData === 'object' ? messageData.text : messageData;
        // If the message text is invalid, we throw an error
        if (!messageText || messageText.trim() === '') {
          const error = new Error(t('errors.emptyMessage'));
          handleChatError(error, 'sendMessage.validation');
          return;
        }
      }

      // We send the message
      const messageToSend = messageData.type === 'file' ? {
        ...messageData,
        login: userCredentials.login,
        isOwnMessage: true,
        sendTimestamp
      } : {
        type: 'text',
        message: typeof messageData === 'object' ? messageData.text : messageData,
        login: userCredentials.login,
        isOwnMessage: true,
        sendTimestamp
      };

      // We format the message and add it to the list of messages
      const message = formatMessage(messageToSend, userCredentials);

      // Try to send the message
      const response = await sendMessageApi(channel.id, messageToSend, userCredentials);

      // We check if the sending was successful
      if (response.status === 'ok' && response.id) {
        // Add the message to the existing ones
        setMessages((prevMessages) => {
          // Check if the message already exists
          const messageExists = prevMessages.some((msg) => msg.id === response.id);

          if (messageExists) {
            return prevMessages;
          }

          // Create a complete message from the response
          const completeMessage = {
            ...message,
            id: response.id,
            savedTimestamp: Date.now().toString(),
          };

          return [...prevMessages, completeMessage];
        });
      } else {
        const errorMessage = response?.message || t('errors.sendFailed');
        const error = new Error(errorMessage);
        handleChatError(error, 'sendMessage');
        return;
      }
    } catch (error) {
      console.error('Error in sendMessage:', error);
      handleChatError(error, 'sendMessage', { silent: false });
      return;
    }
  }, [channel, credentials, t, recordSentMessage, markChannelAsUnread]);

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