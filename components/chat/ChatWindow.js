import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
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
import { playNotificationSound } from '../../services/notification/notificationService';
import { useNotification } from '../../services/notification/notificationContext';
import CustomAlert from '../modals/webviews/CustomAlert';
import Ionicons from 'react-native-vector-icons/Ionicons';


/**
 * @component ChatWindow
 * @description A component that renders the chat window in the chat screen
 * @param {Object} props.channel - The channel to display
 * @param {Object} props.messages - The messages to display
 * @param {Function} props.onInputFocusChange - The function to call when the input focus changes
 */
export default function ChatWindow({ channel, messages: channelMessages, onInputFocusChange, testID }) {

  const { t } = useTranslation();
  const { isSmartphone } = useDeviceType();
  const { recordSentMessage, markChannelAsUnread } = useNotification();
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
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');


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

      if (messagesNeedingFiles.length === 0) return;

      /**
       * @function loadFiles
       * @description Load the files of the messages
       */
      const loadFiles = async () => {
        updatingRef.current = true;
        // We create a batch size to avoid loading all the files at once
        const batchSize = 3;
        const updatedMessages = [...messages];
        let hasUpdates = false;

        try {
          // We loop through the messages needing files
          for (let i = 0; i < messagesNeedingFiles.length; i += batchSize) {
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
                    // On calcule la taille du fichier à partir du base64
                    const fileSize = (() => {
                      const base64Length = base64.length;
                      const paddingLength = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
                      return Math.floor(((base64Length - paddingLength) * 3) / 4);
                    })();

                    updatedMessages[index] = {
                      ...updatedMessages[index],
                      base64: base64,
                      type: 'file',
                      fileSize: fileSize
                    };
                    hasUpdates = true;
                  }
                } catch (fileError) {
                  console.error('[ChatWindow] Error while loading the file:', fileError);
                }
              })
            );
          }
          // We update the messages
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

  useEffect(() => {
    if (channel && channelMessages) {
      // We update the messages only if there are new messages
      if (channelMessages.length > 0) {
        // On traite chaque message pour s'assurer que la taille des fichiers est correcte
        const processedMessages = channelMessages.map(msg => {
          if (msg.type === 'file') {
            // On calcule la taille du fichier si nécessaire
            const fileSize = (() => {
              if (msg.fileSize && !isNaN(parseInt(msg.fileSize, 10))) {
                return parseInt(msg.fileSize, 10);
              }
              if (msg.base64) {
                const base64Length = msg.base64.length;
                const paddingLength = msg.base64.endsWith('==') ? 2 : msg.base64.endsWith('=') ? 1 : 0;
                return Math.floor(((base64Length - paddingLength) * 3) / 4);
              }
              return 0;
            })();
            return { ...msg, fileSize };
          }
          return msg;
        });
        setMessages(processedMessages);
      }
    }
  }, [channel?.id, channelMessages]);

  /**
   * @function formatMessage
   * @description Format a message for display
   * @param {Object} msg - The raw message
   * @param {Object} credentials - The user credentials
   */
  const formatMessage = (msg, credentials) => {
    const messageText = msg.text || msg.message || '';
    const isOwnMessageByLogin = msg.login === credentials?.login;

    // We calculate the file size
    let fileSize = 0;
    if (msg.type === 'file') {
      // If we have a valid stored size, we use it
      if (msg.fileSize && !isNaN(parseInt(msg.fileSize, 10))) {
        fileSize = parseInt(msg.fileSize, 10);
      }
      // Otherwise, if we have a base64, we calculate the size
      else if (msg.base64) {
        const base64Length = msg.base64.length;
        const paddingLength = msg.base64.endsWith('==') ? 2 : msg.base64.endsWith('=') ? 1 : 0;
        fileSize = Math.floor(((base64Length - paddingLength) * 3) / 4);
      }
    }

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
      base64: msg.base64,
      fileSize: fileSize
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
        return;
      }

      // We add the message ID to the list of processed messages
      if (messageId) {
        processedMessageIds.current.add(messageId);
      }

      // We check if it's a notification to mark a channel as unread
      if (data.notification && data.notification.type === 'chat' && data.notification.message) {
        const notifMessage = data.notification.message;

        // Si c'est un message de type fichier, on s'assure de préserver la taille
        if (notifMessage.type === 'file') {
          const fileSize = (() => {
            if (notifMessage.fileSize && !isNaN(parseInt(notifMessage.fileSize, 10))) {
              return parseInt(notifMessage.fileSize, 10);
            }
            if (notifMessage.base64) {
              const base64Length = notifMessage.base64.length;
              const paddingLength = notifMessage.base64.endsWith('==') ? 2 : notifMessage.base64.endsWith('=') ? 1 : 0;
              return Math.floor(((base64Length - paddingLength) * 3) / 4);
            }
            return 0;
          })();
          notifMessage.fileSize = fileSize;
        }

        // We check if the message is from the current user
        const credentialsStr = await SecureStore.getItemAsync('userCredentials');
        const userCredentials = credentialsStr ? JSON.parse(credentialsStr) : null;
        const isOwnMessage = userCredentials && notifMessage.login === userCredentials.login;

        // We extract the channel ID from the notification
        let channelId = null;
        if (notifMessage.channelId) {
          channelId = notifMessage.channelId.toString().replace('channel_', '');
        } else if (data.notification.body) {
          // Try to extract channel name from the notification body
          const channelMatch = data.notification.body.match(/channel\s+(.+)$/i);
          if (channelMatch) {
            const channelName = channelMatch[1].trim();

            // We get the channel ID from the notification filters
            if (data.notification.filters?.values?.channel) {
              channelId = data.notification.filters.values.channel.toString().replace('channel_', '');
            }
          }
        }

        // If we have a channel ID and it's not the current channel, mark as unread
        if (channelId) {
          const currentChannelId = channel?.id?.toString();

          if (channelId !== currentChannelId) {
            markChannelAsUnread(channelId, true);
          }
        }
      }

      // We check if the message is a notification or a message
      if (data.type === 'notification' || data.type === 'message') {
        // We extract the channel ID
        const channelId = data.filters?.values?.channel;
        const currentChannelId = channel?.id?.toString();

        if (!currentChannelId) {
          console.error('[ChatWindow] No current channel');
          return;
        }

        // We clean the received and current channel IDs
        const cleanReceivedChannelId = channelId?.toString()?.replace('channel_', '');
        const cleanCurrentChannelId = currentChannelId?.toString()?.replace('channel_', '');

        if (cleanReceivedChannelId !== cleanCurrentChannelId) {
          console.error('[ChatWindow] Channel mismatch');
          return;
        }

        // We extract the message content
        const messageContent = data.message;

        if (!messageContent) {
          setAlertMessage(t('errors.noMessageContent'));
          setShowAlert(true);
          return;
        }

        messageContent.channelId = cleanReceivedChannelId;

        // We check if we are the sender of the message
        if (credentials && credentials.login && messageContent.login) {
          messageContent.isOwnMessage = messageContent.login === credentials.login;
        }

        // If not, we play the notification sound
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
          console.error('[ChatWindow] Channel mismatch');
          return;
        }

        const messageContent = data.notification.message;
        if (!messageContent) {
          return;
        }

        messageContent.channelId = channelId;

        // If we have credentials and a login, we can determine if it's a personal message
        if (credentials && credentials.login && messageContent.login) {
          messageContent.isOwnMessage = messageContent.login === credentials.login;
        }

        // We play the notification sound
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
      setAlertMessage(t('errors.messageProcessingError'));
      setShowAlert(true);
    }
  }, [channel, credentials, t, markChannelAsUnread]);

  /**
   * @function handleWebSocketError
   * @description Handle the WebSocket error
   */
  const handleWebSocketError = useCallback((error) => {
    console.error('[WebSocket] Error:', error);
  }, []);

  useEffect(() => {
    return () => {
      // We close the WebSocket connection when the component unmounts
      closeConnection();
    };
  }, [closeConnection]);

  useEffect(() => {
    /**
     * @function loadUserData
     * @description Load the user data
     */
    const loadUserData = async () => {
      try {
        // We get the user credentials, and the user rights and parse them
        const credentialsStr = await SecureStore.getItemAsync('userCredentials');
        const rightsStr = await SecureStore.getItemAsync('userRights');
        const rights = rightsStr ? JSON.parse(rightsStr) : null;

        if (credentialsStr) {
          const parsedCredentials = JSON.parse(credentialsStr);
          setCredentials(parsedCredentials);
          setUserRights(rights);
        }
      } catch (error) {
        setAlertMessage(t('errors.userDataLoadingError'));
        setShowAlert(true);
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
      const currentTime = Date.now();
      recordSentMessage(currentTime);

      if (!channel) {
        console.error('[ChatWindow] No channel selected');
        return;
      }

      if (!credentials) {
        const credentialsStr = await SecureStore.getItemAsync('userCredentials');
        if (!credentialsStr) {
          console.error('[ChatWindow] No credentials found');
          return;
        }
        const userCredentials = JSON.parse(credentialsStr);
        setCredentials(userCredentials);
      }

      // For file messages
      if (messageData.type === 'file' && !messageData.base64) {
        setAlertMessage(t('errors.invalidFile'));
        setShowAlert(true);
        return;
      }

      // Pour les messages texte
      if (messageData.type !== 'file') {
        const messageText = typeof messageData === 'object' ? messageData.text : messageData;
        if (!messageText || messageText.trim() === '') {
          setAlertMessage(t('errors.emptyMessage'));
          setShowAlert(true);
          return;
        }
      }

      // We get the user credentials
      const userCredentials = credentials;
      // We create a timestamp for the message
      const sendTimestamp = Date.now();
      // We check if the message is an edit of an existing message
      const isEditing = messageData.isEditing === true && messageData.messageId;

      if (isEditing) {
        try {
          // We send the edit request
          const response = await editMessageApi(messageData.messageId, messageData, userCredentials);

          if (response.status === 'ok') {
            setEditingMessage(null);

            // We update the messages
            setMessages(prevMessages => {
              const updatedMessages = prevMessages.map(msg => {
                if (msg.id === messageData.messageId) {
                  const updatedText = messageData.text || '';
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
            setAlertMessage(t('errors.editFailed'));
            setShowAlert(true);
            return;
          }

          return;
        } catch (error) {
          setAlertMessage(t('errors.editFailed'));
          setShowAlert(true);
          return;
        }
      }

      // For a new message (non-modification), we continue with the existing code
      // We check the type of message
      if (messageData.type === 'file') {
        if (!messageData.base64) {
          setAlertMessage(t('errors.invalidFile'));
          setShowAlert(true);
          return;
        }
      } else {
        const messageText = typeof messageData === 'object' ? messageData.text : messageData;
        // If the message text is invalid, we throw an error
        if (!messageText || messageText.trim() === '') {
          setAlertMessage(t('errors.emptyMessage'));
          setShowAlert(true);
          return;
        }
      }

      // We send the message
      const messageToSend = messageData.type === 'file' ? {
        ...messageData,
        login: userCredentials.login,
        isOwnMessage: true,
        sendTimestamp,
        // On calcule et inclut la taille du fichier
        fileSize: (() => {
          if (messageData.fileSize && !isNaN(parseInt(messageData.fileSize, 10))) {
            return parseInt(messageData.fileSize, 10);
          }
          if (messageData.base64) {
            const base64Length = messageData.base64.length;
            const paddingLength = messageData.base64.endsWith('==') ? 2 : messageData.base64.endsWith('=') ? 1 : 0;
            return Math.floor(((base64Length - paddingLength) * 3) / 4);
          }
          return 0;
        })()
      } : {
        type: 'text',
        message: typeof messageData === 'object' ? messageData.text : messageData,
        login: userCredentials.login,
        isOwnMessage: true,
        sendTimestamp
      };

      // We format the message and try to send it
      const message = formatMessage(messageToSend, userCredentials);
      const response = await sendMessageApi(channel.id, messageToSend, userCredentials);

      if (response.status === 'ok' && response.id) {
        // We add the message to the existing messages
        setMessages((prevMessages) => {
          // We check if the message already exists
          const messageExists = prevMessages.some((msg) => msg.id === response.id);

          if (messageExists) {
            return prevMessages;
          }

          // We create a complete message from the response
          const completeMessage = {
            ...message,
            id: response.id,
            savedTimestamp: Date.now().toString(),
          };

          return [...prevMessages, completeMessage];
        });
      } else {
        setAlertMessage(t('errors.sendFailed'));
        setShowAlert(true);
        return;
      }
    } catch (error) {
      setAlertMessage(t('errors.sendFailed'));
      setShowAlert(true);
      return;
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
        setAlertMessage(t('errors.noDeletePermission'));
        setShowAlert(true);
        return;
      }

      const response = await deleteMessageApi(messageId, credentials);

      if (response.status === 'ok') {
        const updatedMessages = messages.filter(msg => msg.id !== messageId);
        setMessages(updatedMessages);
      } else {
        setAlertMessage(t('errors.messageNotDeleted'));
        setShowAlert(true);
      }

      const updatedMessages = messages.filter(msg => msg.id !== messageId);
      setMessages(updatedMessages);
    } catch (error) {
      setAlertMessage(t('errors.deleteFailed'));
      setShowAlert(true);
    }
  };

  /**
   * @function handleEditMessage
   * @description We handle the edit message
   * @param {Object} messageToEdit - The message to edit
   */
  const handleEditMessage = async (messageToEdit) => {
    try {
      if (!messageToEdit || !messageToEdit.id) {
        setAlertMessage(t('errors.invalidMessageEdit'));
        setShowAlert(true);
        return;
      }

      setEditingMessage(messageToEdit);
    } catch (error) {
      setAlertMessage(t('errors.editFailed'));
      setShowAlert(true);
    }
  };

  /**
   * @function formatDate
   * @description Format the date of a message
   * @param {Object} timestamp - The timestamp of the message
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
            testID="messages-container"
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
                    isFileMessage={message.type === 'file'}
                    testID={`message-${message.id}`}
                  />
                );

                return acc;
              }, []);
            })()}
          </ScrollView>

          <View style={styles.inputContainer}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="send"
              testID="send-button"
              onPress={sendMessage}
              style={styles.sendButton}
            >
              <Ionicons name="send" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <InputChatWindow
            onSendMessage={sendMessage}
            onFocusChange={onInputFocusChange}
            editingMessage={editingMessage}
            testID="chat-input"
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

      <CustomAlert
        visible={showAlert}
        message={alertMessage}
        onClose={() => setShowAlert(false)}
        onConfirm={() => setShowAlert(false)}
        type="error"
      />
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  sendButton: {
    padding: 10,
  },
});
