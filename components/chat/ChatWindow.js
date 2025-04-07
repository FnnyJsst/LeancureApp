import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { COLORS, SIZES } from '../../constants/style';
import InputChatWindow from '../inputs/InputChatWindow';
import ChatMessage from './ChatMessage';
import DocumentPreviewModal from '../modals/chat/DocumentPreviewModal';
import { useDeviceType } from '../../hooks/useDeviceType';
import { sendMessageApi, fetchMessageFile, deleteMessageApi, editMessageApi } from '../../services/api/messageApi';
import { useWebSocket } from '../../hooks/useWebSocket';
import DateBanner from './DateBanner';
import { Text } from '../text/CustomText';
import { useTranslation } from 'react-i18next';
import { handleError, ErrorType } from '../../utils/errorHandling';
import { playNotificationSound } from '../../services/notificationService';
import { useNotification } from '../../services/notificationContext';
import { useCredentials } from '../../hooks/useCredentials';

/**
 * @component ChatWindow
 * @description A component that renders the chat window in the chat screen
 * @param {Object} props.channel - The channel to display
 * @param {Object} props.messages - The messages to display
 * @param {Function} props.onInputFocusChange - The function to call when the input focus changes
 */
export default function ChatWindow({ channel, messages: channelMessages, onInputFocusChange }) {

  // Hooks
  const { t } = useTranslation();
  const { isSmartphone } = useDeviceType();
  const { recordSentMessage, markChannelAsUnread } = useNotification();
  const { credentials, userRights, isLoading } = useCredentials();

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
  const [editingMessage, setEditingMessage] = useState(null);
  const [selectedMessageId, setSelectedMessageId] = useState(null);

  // Error handling
  const handleChatError = useCallback((error, source, options = {}) => {
    return handleError(error, `chatWindow.${source}`, {
      type: ErrorType.SYSTEM,
      ...options
    });
  }, []);


  useEffect(() => {
    // We load the files of the messages only if the component is loaded, the credentials are set, the channel is set and there are messages
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

      /**
       * @function loadFiles
       * @description Load the files of the messages
       */
      const loadFiles = async () => {
        updatingRef.current = true;
        try {
          // We create a batch size to avoid loading all the files at once
          const batchSize = 3;
          const updatedMessages = [...messages];
          let hasUpdates = false;

          // We loop through the messages needing files
          for (let i = 0; i < messagesNeedingFiles.length; i += batchSize) {
            // We create a batch of messages and load the files
            const batch = messagesNeedingFiles.slice(i, i + batchSize);
            await Promise.all(
              batch.map(async (msg) => {
                try {
                  // We fetch the file of the message
                  const base64 = await fetchMessageFile(msg.id, {
                    channelid: parseInt(channel.id, 10),
                    ...msg,
                  }, credentials);

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
        } catch (error) {
          handleChatError(error, 'loadFiles', { silent: true });
        } finally {
          updatingRef.current = false;
        }
      };

      loadFiles().catch(error => {
        console.error('Error in loadFiles:', error);
        handleChatError(error, 'loadFiles', { silent: true });
      });
    }
  }, [isLoading, credentials, channel, messages]);


  useEffect(() => {
    if (channel && channelMessages) {
      // We update the messages only if there are new messages in the channel
      if (channelMessages.length > 0) {
        setMessages(channelMessages);
      }
    }
  }, [channel?.id, channelMessages]);

  /**
   * @function formatMessage
   * @description Format a message for display
   * @param {Object} msg - The raw message
   * @param {Object} credentials - The user credentials
   * @returns {Object} The formatted message
   */
  const formatMessage = (msg, credentials) => {
    const messageText = msg.text || msg.message || '';
    // We check if the message is our own
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
   * @description Handle the message received from the WebSocket
   */
  const handleWebSocketMessage = useCallback(async (data) => {
    try {
        // Vérification des doublons
        const messageId = data.message?.id || data.notification?.message?.id;
        if (messageId && processedMessageIds.current.has(messageId)) {
            return;
        }
        if (messageId) {
            processedMessageIds.current.add(messageId);
        }

        // Extraction du message et du canal
        const messageContent = data.message || data.notification?.message;
        const channelId = data.filters?.values?.channel || data.notification?.filters?.values?.channel;

        if (!messageContent) {
            return;
        }

        // Vérification du canal
        const currentChannelId = channel?.id?.toString();
        if (!currentChannelId) {
            handleChatError(t('errors.noCurrentChannel'), 'message.validation');
            return;
        }

        // Nettoyage des IDs de canal
        const cleanReceivedChannelId = channelId?.toString()?.replace('channel_', '');
        const cleanCurrentChannelId = currentChannelId?.toString()?.replace('channel_', '');

        if (cleanReceivedChannelId !== cleanCurrentChannelId) {
            handleChatError(t('errors.channelMismatch'), 'message.validation');
            return;
        }

        // Enrichissement du message
        messageContent.channelId = cleanReceivedChannelId;
        messageContent.isOwnMessage = credentials?.login === messageContent.login;

        // Gestion des notifications non lues
        if (data.notification?.type === 'chat' && !messageContent.isOwnMessage) {
            markChannelAsUnread(cleanReceivedChannelId);
        }

        // Son de notification
        try {
            await playNotificationSound(messageContent, null, credentials);
        } catch (error) {
            handleChatError(error, 'notification.sound', { silent: true });
        }

        // Mise à jour des messages
        const updateMessages = (messages) => {
            if (Array.isArray(messages)) {
                return messages
                    .filter(msg => !processedMessageIds.current.has(msg.id))
                    .map(msg => {
                        processedMessageIds.current.add(msg.id);
                        return formatMessage(msg, credentials);
                    });
            }
            return [formatMessage(messages, credentials)];
        };

        setMessages(prevMessages => {
            const newMessages = updateMessages(
                messageContent.type === 'messages' ? messageContent.messages : messageContent
            );

            // Filtrer les messages déjà existants
            const uniqueNewMessages = newMessages.filter(newMsg =>
                !prevMessages.some(prevMsg => prevMsg.id === newMsg.id)
            );

            if (uniqueNewMessages.length === 0) {
                return prevMessages;
            }

            return [...prevMessages, ...uniqueNewMessages].sort((a, b) =>
                parseInt(a.savedTimestamp) - parseInt(b.savedTimestamp)
            );
        });

    } catch (error) {
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
      const currentTime = Date.now();
      recordSentMessage(currentTime);

      if (!channel) {
        handleChatError(t('errors.noChannel'), 'sendMessage.validation');
        return;
      }

      if (!credentials) {
        handleChatError(t('errors.noCredentials'), 'sendMessage.validation');
        return;
      }

      const sendTimestamp = Date.now();

      // Check if the message is an edit of an existing message
      const isEditing = messageData.isEditing === true && messageData.messageId;

      if (isEditing) {
        try {
          // We send the editing request
          const response = await editMessageApi(messageData.messageId, messageData, credentials);

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
            throw new Error(response.message || t('errors.editFailed'));
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
          handleChatError(t('errors.invalidFile'), 'sendMessage.validation');
          return;
        }

      } else {
        const messageText = typeof messageData === 'object' ? messageData.text : messageData;
        // If the message text is invalid, we throw an error
        if (!messageText || messageText.trim() === '') {
          handleChatError(t('errors.emptyMessage'), 'sendMessage.validation');
          return;
        }
      }

      // We send the message
      const messageToSend = messageData.type === 'file' ? {
        ...messageData,
        login: credentials.login,
        isOwnMessage: true,
        sendTimestamp
      } : {
        type: 'text',
        message: typeof messageData === 'object' ? messageData.text : messageData,
        login: credentials.login,
        isOwnMessage: true,
        sendTimestamp
      };

      // We format the message and add it to the list of messages
      const message = formatMessage(messageToSend, credentials);

      // Try to send the message
      const response = await sendMessageApi(channel.id, messageToSend, credentials);

      if (!response || !response.status) {
        throw new Error(t('errors.invalidResponse'));
      }

      if (response.status === 'ok' && response.id) {
        setMessages((prevMessages) => {
          const messageExists = prevMessages.some((msg) => msg.id === response.id);
          if (messageExists) return prevMessages;

          const completeMessage = {
            ...message,
            id: response.id,
            savedTimestamp: Date.now().toString(),
          };
          return [...prevMessages, completeMessage];
        });
      } else {
        throw new Error(response.message || t('errors.messageSendFailed'));
      }
    } catch (error) {
      handleChatError(error, 'sendMessage', { silent: false });
      // Ne pas relancer l'erreur, mais la gérer ici
      console.error('Error sending message:', error);
    }
  }, [channel, credentials, t, recordSentMessage]);

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