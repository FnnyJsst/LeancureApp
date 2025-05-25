import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { COLORS, SIZES } from '../../constants/style';
import InputChatWindow from '../inputs/InputChatWindow';
import ChatMessage from './ChatMessage';
import DocumentPreviewModal from '../modals/chat/DocumentPreviewModal';
import { useDeviceType } from '../../hooks/useDeviceType';
import * as SecureStore from 'expo-secure-store';
import { sendMessageApi, fetchMessageFile, deleteMessageApi, editMessageApi } from '../../services/api/messageApi';
import { useWebSocket } from '../../hooks/useWebSocket';
import { Text } from '../text/CustomText';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../../services/notification/notificationContext';
import CustomAlert from '../modals/webviews/CustomAlert';


/**
 * @component ChatWindow
 * @description A component that renders the chat window in the chat screen
 * @param {Object} props.channel - The channel to display
 * @param {Object} props.messages - The messages to display
 * @param {Function} props.onInputFocusChange - The function to call when the input focus changes
 * @param {boolean} props.isLoading - Whether the messages are being loaded
 */
export default function ChatWindow({ channel, messages: channelMessages, onInputFocusChange, isLoading, testID }) {

  const { t } = useTranslation();
  const { isSmartphone } = useDeviceType();
  const { recordSentMessage, markChannelAsUnread } = useNotification();
  const { closeConnection } = useWebSocket({
    onMessage: (data) => {
      if (data.type === 'messages' && Array.isArray(data.messages)) {
        setMessages(prevMessages => {
          const existingMessageIds = new Set(prevMessages.map(msg => msg.id));
          const uniqueNewMessages = data.messages.filter(msg => {
            // Ne pas ajouter les messages qui sont déjà en cours d'envoi
            if (sendingMessage && msg.id === sendingMessage.id) {
              return false;
            }
            return !existingMessageIds.has(msg.id);
          });
          return uniqueNewMessages.length > 0 ? [...prevMessages, ...uniqueNewMessages] : prevMessages;
        });
      }
    },
    onError: (error) => {
      console.error('[ChatWindow] WebSocket error:', error);
      setAlertMessage(t('messages.errors.websocketError'));
      setShowAlert(true);
    },
    channels: channel ? [`channel_${channel.id}`] : []
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
  const [editingMessage, setEditingMessage] = useState(null);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(null);


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
                    // We calculate the file size
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
      setMessages(channelMessages);
    }
  }, [channel?.id, channelMessages]);

  /**
   * @function sendMessage
   * @description Send a message to the channel
   */
  const sendMessage = useCallback(async (messageData) => {
    try {
      const currentTime = Date.now();
      recordSentMessage(currentTime);

      if (!channel) {
        console.error('[ChatWindow] Pas de canal sélectionné');
        return;
      }

      // Récupération des credentials si nécessaire
      let userCredentials = credentials;
      if (!userCredentials) {
        const credentialsStr = await SecureStore.getItemAsync('userCredentials');
        if (!credentialsStr) {
          console.error('[ChatWindow] Pas de credentials trouvés');
          return;
        }
        userCredentials = JSON.parse(credentialsStr);
        setCredentials(userCredentials);
      }

      // Récupération du nom d'affichage de l'utilisateur
      const displayName = await SecureStore.getItemAsync('userDisplayName');
      const username = displayName || 'Moi';

      const sendTimestamp = Date.now();
      const isEditing = messageData.isEditing === true && messageData.messageId;

      // If the message is being edited
      if (isEditing) {
        try {
          const response = await editMessageApi(messageData.messageId, {
            channelid: parseInt(channel.id, 10),
            text: messageData.text,
            type: messageData.type,
            fileInfo: messageData.fileInfo,
            username: username
          }, userCredentials);

          if (response.status === "ok") {
            // Update the message in the list
            setMessages(prevMessages =>
              prevMessages.map(msg =>
                msg.id === messageData.messageId
                  ? { ...msg, text: messageData.text, details: messageData.text, username: username }
                  : msg
              )
            );
            // Reset the editing state
            setEditingMessage(null);
          } else {
            setAlertMessage(t('messages.errors.editFailed'));
            setShowAlert(true);
          }
        } catch (editError) {
          console.error('[ChatWindow] Erreur lors de l\'édition du message:', editError);
          setAlertMessage(t('messages.errors.editFailed'));
          setShowAlert(true);
        }
        return;
      }

      // Validation of the message
      if (messageData.type === 'file') {
        if (!messageData.base64) {
          console.error('[ChatWindow] Fichier invalide: pas de base64');
          setAlertMessage(t('messages.errors.invalidFile'));
          setShowAlert(true);
          return;
        }
      } else {
        const messageText = typeof messageData === 'object' ? messageData.text : messageData;
        if (!messageText || messageText.trim() === '') {
          console.error('[ChatWindow] Message vide');
          setAlertMessage(t('messages.errors.emptyMessage'));
          setShowAlert(true);
          return;
        }
      }

      // Preparation of the message to send
      const messageToSend = {
        ...messageData,
        type: messageData.type || 'text',
        login: userCredentials.login,
        username: username,
        isOwnMessage: true,
        sendTimestamp,
        message: typeof messageData === 'object' ? messageData.text : messageData,
        text: typeof messageData === 'object' ? messageData.text : messageData,
        details: typeof messageData === 'object' ? messageData.text : messageData,
      };

      // Send the message to the server
      const response = await sendMessageApi(channel.id, messageToSend, userCredentials);
      if (response.status === 'ok' && response.id) {
        // Add the message once the response is received
        const formattedMessage = {
          ...messageToSend,
          id: response.id,
          savedTimestamp: Date.now().toString(),
          username: username
        };

        // Mettre à jour l'état local immédiatement
        setMessages(prevMessages => [...prevMessages, formattedMessage]);

        // Marquer le message comme en cours d'envoi pour éviter les doublons
        setSendingMessage(formattedMessage);

        // Attendre un court instant avant de réinitialiser sendingMessage
        setTimeout(() => {
          setSendingMessage(null);
        }, 1000);
      } else {
        console.error('[ChatWindow] Échec envoi message:', response);
        setAlertMessage(t('messages.errors.sendFailed'));
        setShowAlert(true);
      }
    } catch (error) {
      console.error('[ChatWindow] Erreur lors de l\'envoi du message:', error);
      setAlertMessage(t('messages.errors.sendFailed'));
      setShowAlert(true);
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
        setAlertMessage(t('messages.errors.noDeletePermission'));
        setShowAlert(true);
        return;
      }

      const response = await deleteMessageApi(messageId, credentials);

      if (response.status === 'ok') {
        const updatedMessages = messages.filter(msg => msg.id !== messageId);
        setMessages(updatedMessages);
      } else {
        setAlertMessage(t('messages.errors.messageNotDeleted'));
        setShowAlert(true);
      }

      const updatedMessages = messages.filter(msg => msg.id !== messageId);
      setMessages(updatedMessages);
    } catch (error) {
      setAlertMessage(t('messages.errors.deleteFailed'));
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
        console.error('[ChatWindow] Message invalide pour édition:', messageToEdit);
        setAlertMessage(t('messages.errors.invalidMessageEdit'));
        setShowAlert(true);
        return;
      }

      // On s'assure de passer toutes les propriétés nécessaires
      const messageToEditWithDetails = {
        ...messageToEdit,
        text: messageToEdit.text || messageToEdit.message || messageToEdit.details || '',
        type: messageToEdit.type || 'text',
        fileInfo: messageToEdit.type === 'file' ? {
          fileName: messageToEdit.fileName,
          fileType: messageToEdit.fileType,
          fileSize: messageToEdit.fileSize,
          base64: messageToEdit.base64
        } : null
      };

      setEditingMessage(messageToEditWithDetails);
    } catch (error) {
      console.error('[ChatWindow] Erreur lors de la préparation du message à éditer:', error);
      setAlertMessage(t('messages.errors.editFailed'));
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

  const openDocumentPreviewModal = (fileUrl, fileName, fileSize, fileType, base64, messageId) => {
    setSelectedFileUrl(fileUrl);
    setSelectedFileName(fileName);
    setSelectedFileSize(fileSize);
    setSelectedFileType(fileType);
    setSelectedBase64(base64);
    setSelectedMessageId(messageId);
    setIsDocumentPreviewModalVisible(true);
  };

  const closeDocumentPreviewModal = () => {
    setIsDocumentPreviewModalVisible(false);
    setSelectedFileUrl(null);
    setSelectedFileName(null);
    setSelectedFileSize(null);
    setSelectedFileType(null);
    setSelectedBase64(null);
    setSelectedMessageId(null);
  };

  const handleFileClick = (message) => {
    if (!message) return;

    openDocumentPreviewModal(
      null, // fileUrl n'est plus utilisé
      message.fileName,
      message.fileSize,
      message.fileType,
      message.base64,
      message.id
    );
  };

  // Vérification de sécurité pour le channel
  if (!channel) {
    return (
      <View style={styles.container}>
        <View style={styles.noChannelContainer}>
          <Text style={[styles.noChannelText, isSmartphone && styles.noChannelTextSmartphone]}>
            {t('messages.selectChannel')}
          </Text>
        </View>
      </View>
    );
  }

  // Vérification de sécurité pour les messages
  const validMessages = messages.filter(message => {
    if (!message || !message.id) {
      return false;
    }

    const hasText = !!message.text;
    const hasMessageProp = !!message.message;
    const isFileType = message.type === 'file';
    const isValid = hasText || hasMessageProp || isFileType;

    return isValid;
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.orange} />
        </View>
        <InputChatWindow
          onSendMessage={sendMessage}
          onFocusChange={onInputFocusChange}
          editingMessage={editingMessage}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {validMessages.length > 0 ? (
          validMessages.reduce((acc, message, index) => {
            acc.push(
              <ChatMessage
                key={message.id}
                message={message}
                isOwnMessage={message.isOwnMessage}
                onFileClick={handleFileClick}
                onDeleteMessage={handleDeleteMessage}
                onEditMessage={handleEditMessage}
                userRights={userRights}
              />
            );
            return acc;
          }, [])
        ) : (
          <View style={styles.noMessagesContainer}>
            <Text style={[styles.noMessagesText, isSmartphone && styles.noMessagesTextSmartphone]}>
              {t('messages.noMessages')}
            </Text>
          </View>
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
  },
  loadingIcon: {
    marginBottom: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
  },
  emptyText: {
    color: COLORS.gray300,
    fontSize: SIZES.fonts.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 10,
  },
  noMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  noMessagesText: {
    color: COLORS.gray600,
    fontSize: SIZES.fonts.textTablet,
    textAlign: 'center',
  },
  noMessagesTextSmartphone: {
    fontSize: SIZES.fonts.textSmartphone,
  },
});
