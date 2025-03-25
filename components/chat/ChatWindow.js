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
 * @param {Object} props.channel - The channel to display
 * @param {Object} props.messages - The messages to display
 * @param {Function} props.onInputFocusChange - The function to call when the input focus changes
 */
export default function ChatWindow({ channel, messages: channelMessages, onInputFocusChange, testID }) {

  // Translation
  const { t } = useTranslation();

  // Device type
  const { isSmartphone } = useDeviceType();

  // Refs
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

  // Load the files of the messages
  useEffect(() => {
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
        // We create a batch size
        const batchSize = 3;
        // We create a copy of the messages
        const updatedMessages = [...messages];
        // We create a flag to check if there are updates
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
                  const base64 = await fetchMessageFile(msg.id, {
                    channelid: parseInt(channel.id, 10),
                    ...msg,
                  }, credentials);

                  // We update the message
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
                  throw new Error(t('errors.errorLoadingFile'), fileError);
                }
              })
            );
          }

          // If there are updates, we update the messages
          if (hasUpdates) {
            setMessages(updatedMessages);
          }
        // We finally set the updatingRef to false
        } finally {
          updatingRef.current = false;
        }
      };

      loadFiles();
    }
  }, [isLoading, credentials, channel, messages]);

  // Update the messages
  useEffect(() => {
    if (channel && channelMessages) {
      // We update the messages only if there are new messages
      if (channelMessages.length > 0) {
        setMessages(channelMessages);
      }
    }
  }, [channel?.id, channelMessages]);

  /**
   * @function handleWebSocketMessage
   * @description Handle the WebSocket message
   * @param {Object} data - The data of the message
   */
  const handleWebSocketMessage = useCallback((data) => {
    console.log('📩 Message WebSocket reçu:', {
      type: data.type,
      hasNotification: !!data.notification,
      messageId: data.message?.id || data.notification?.message?.id
    });

    // On extrait l'ID du message
    const messageId = data.message?.id || data.notification?.message?.id;

    // Si le message a déjà été traité, on l'ignore
    if (messageId && processedMessageIds.current.has(messageId)) {
      console.log('⚠️ Message déjà traité, ignoré:', messageId);
      return;
    }

    // On ajoute l'ID du message à la liste des messages traités
    if (messageId) {
      processedMessageIds.current.add(messageId);
    }

    // Si le message est au format notification directe
    if (data.type === 'notification' || data.type === 'message') {
        const channelId = data.filters?.values?.channel;
        const currentChannelId = channel?.id?.toString();

        if (!currentChannelId) {
            console.log('❌ No current channel');
            return;
        }

        const cleanReceivedChannelId = channelId?.toString()?.replace('channel_', '');
        const cleanCurrentChannelId = currentChannelId?.toString()?.replace('channel_', '');

        if (cleanReceivedChannelId !== cleanCurrentChannelId) {
            console.log('❌ Canal non correspondant après nettoyage, message ignoré');
            return;
        }

        const messageContent = data.message;
        if (!messageContent) {
            console.log('❌ Pas de contenu de message');
            return;
        }

        // Si c'est un tableau de messages
        if (messageContent.type === 'messages' && Array.isArray(messageContent.messages)) {
            setMessages(prevMessages => {
                const newMessages = messageContent.messages
                    .filter(msg => !processedMessageIds.current.has(msg.id))
                    .map(msg => {
                        processedMessageIds.current.add(msg.id);
                        return {
                            id: msg.id?.toString() || Date.now().toString(),
                            type: msg.type || 'text',
                            text: msg.message,
                            message: msg.message,
                            savedTimestamp: msg.savedTimestamp || Date.now().toString(),
                            fileType: msg.fileType || 'none',
                            login: msg.login || 'unknown',
                            isOwnMessage: msg.login === credentials?.login,
                            isUnread: false,
                            username: msg.login === credentials?.login ? 'Me' : (msg.login || 'Unknown'),
                            base64: msg.base64
                        };
                    });

                console.log('✅ Nouveaux messages uniques ajoutés:', newMessages.length);

                return [...prevMessages, ...newMessages].sort((a, b) =>
                    parseInt(a.savedTimestamp) - parseInt(b.savedTimestamp)
                );
            });
            return;
        }

        // Si c'est un message unique
        setMessages(prevMessages => {
            const newMessage = {
                id: messageContent.id || Date.now().toString(),
                type: messageContent.type || 'text',
                text: messageContent.message,
                message: messageContent.message,
                savedTimestamp: messageContent.savedTimestamp || Date.now().toString(),
                fileType: messageContent.fileType || 'none',
                login: messageContent.login || 'unknown',
                isOwnMessage: messageContent.login === credentials?.login,
                isUnread: false,
                username: messageContent.login === credentials?.login ? 'Me' : messageContent.login || 'Unknown'
            };

            console.log('✅ Nouveau message ajouté:', newMessage.id);
            return [...prevMessages, newMessage];
        });
        return;
    }

    // Si le message est au format notification imbriquée
    if (data.notification) {
        const channelId = data.notification.filters?.values?.channel;
        const currentChannelId = channel ? channel.id.toString() : null;

        if (!currentChannelId || channelId !== currentChannelId) {
            console.log('❌ Canal non correspondant, message ignoré');
            return;
        }

        const messageContent = data.notification.message;
        if (!messageContent) {
            console.log('❌ Pas de contenu de message');
            return;
        }

        setMessages(prevMessages => {
            const newMessage = {
                id: messageContent.id || Date.now().toString(),
                type: messageContent.type || 'text',
                text: messageContent.message,
                message: messageContent.message,
                savedTimestamp: messageContent.savedTimestamp || Date.now().toString(),
                fileType: messageContent.fileType || 'none',
                login: messageContent.login || data.sender || 'unknown',
                isOwnMessage: (messageContent.login || data.sender) === credentials?.login,
                isUnread: false,
                username: (messageContent.login || data.sender) === credentials?.login ? 'Me' : (messageContent.login || data.sender || 'Unknown')
            };

            console.log('✅ Nouveau message ajouté:', newMessage.id);
            return [...prevMessages, newMessage];
        });
        return;
    }

    console.log('⚠️ Format de message non reconnu:', data);
  }, [channel, credentials]);

  /**
   * @function handleWebSocketError
   * @description Handle the WebSocket error
   */
  const handleWebSocketError = useCallback((error) => {
    throw new Error(t('errors.errorWebSocket'), error);
  }, [t]);

  /**
   * @function useWebSocket
   * @description Initialize the WebSocket with the current channel
   */
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
   * @function useEffect
   * @description We use the useEffect hook to update the messages when the channel messages change
   */
  useEffect(() => {
    if (channel) {
        console.log('📢 Changement de canal dans ChatWindow:', {
            id: channel.id,
            titre: channel.title,
            canal: channel
        });

        // On force la réinitialisation des messages
        setMessages([]);

        // On met à jour les messages si disponibles
        if (channelMessages && Array.isArray(channelMessages)) {
            console.log('📥 Mise à jour des messages du canal:', channelMessages.length);
            setMessages(channelMessages);
        }
    }
  }, [channel?.id, channelMessages]);

  /**
   * @function useEffect
   * @description We use the useEffect hook to close the WebSocket connection when the component unmounts
   */
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
        // We get the user credentials
        const credentialsStr = await SecureStore.getItemAsync('userCredentials');
        // We get the user rights
        const rightsStr = await SecureStore.getItemAsync('userRights');

        // We parse the rights of the user
        const rights = rightsStr ? JSON.parse(rightsStr) : null;

        // If the credentials are found, we set the credentials and the rights
        if (credentialsStr) {
          const parsedCredentials = JSON.parse(credentialsStr);
          setCredentials(parsedCredentials);
          setUserRights(rights);
        }
      } catch (error) {
        throw new Error(t('errors.errorLoadingUserData'), error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  /**
   * @function openDocumentPreviewModal
   * @description We open the document preview modal
   * @param {Object} message - The message to open the document preview modal
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
   * @description We close the document preview modal
   */
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
      console.log('🚀 Début de l\'envoi du message:', messageData);

      if (!channel) {
        throw new Error(t('errors.noChannelSelected'));
      }

      // We check the type of message
      if (messageData.type === 'file') {
        if (!messageData.base64) {
          throw new Error(t('errors.invalidFile'));
        }
      } else {
        // We check the text of the message
        const messageText = typeof messageData === 'object' ? messageData.text : messageData;
        // If the message text is invalid, we throw an error
        if (!messageText || messageText.trim() === '') {
          throw new Error(t('errors.invalidMessageText'));
        }
      }

      // We get the user credentials
      const credentialsStr = await SecureStore.getItemAsync('userCredentials');
      // If the credentials are not found, we throw an error
      if (!credentialsStr) {
        throw new Error(t('errors.noCredentialsFound'));
      }

      const userCredentials = JSON.parse(credentialsStr);

      // We create a temporary message with a unique ID
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log('📝 Création du message temporaire avec ID:', tempId);

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
        isTemp: true,
        _tempId: tempId // Ajout d'un identifiant unique pour le message temporaire
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
        isTemp: true,
        _tempId: tempId // Ajout d'un identifiant unique pour le message temporaire
      };

      // We add the temporary message
      setMessages(prevMessages => {
        // console.log('📥 Ajout du message temporaire aux messages existants');
        return [...prevMessages, tempMessage];
      });

      // We send the message
      const messageToSend = messageData.type === 'file' ? messageData : {
        type: 'text',
        message: typeof messageData === 'object' ? messageData.text : messageData
      };

      console.log('🔍 DEBUG_FILESIZE_SEND - messageData:', {
        type: messageData.type,
        fileSize: messageData.type === 'file' ? messageData.fileSize : null,
        fileSizeType: messageData.type === 'file' ? typeof messageData.fileSize : null
      });

      // We send the message to the API
      const response = await sendMessageApi(channel.id, messageToSend, userCredentials);

      // console.log('📨 Réponse de l\'API:', response);

      // If the response is not ok, we remove the temporary message
      if (response.status !== 'ok') {
        console.log('❌ Erreur de l\'API, suppression du message temporaire');
        setMessages(prevMessages =>
          prevMessages.filter(msg => msg._tempId !== tempId)
        );
        throw new Error(t('errors.errorSendingMessage'));
      }

      // Si la réponse est ok, on supprime le message temporaire
      console.log('✅ Message envoyé avec succès, suppression du message temporaire');
      setMessages(prevMessages =>
        prevMessages.filter(msg => msg._tempId !== tempId)
      );

    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du message:', error);
      throw new Error(t('errors.errorSendingMessage'), error);
    }
  }, [channel, t]);

  /**
   * @function handleDeleteMessage
   * @description We handle the delete message
   * @param {String} messageId - The ID of the message to delete
   */
  const handleDeleteMessage = async (messageId) => {
    const messageToDelete = messages.find(msg => msg.id === messageId);
    const hasDeleteRights = userRights === "3";
    const isOwnMessage = messageToDelete?.isOwnMessage;

    // If the user does not have delete rights and the message is not own, we throw an error
    if (!hasDeleteRights && !isOwnMessage) {
      throw new Error(t('errors.noDeletePermission'));
    }

    try {
      // We send the message to deleteto the API
      const response = await deleteMessageApi(messageId, credentials);

      // If the response is ok, we update the messages
      if (response.status === 'ok') {
        const updatedMessages = messages.filter(msg => msg.id !== messageId);
        setMessages(updatedMessages);
      } else {
        throw new Error(t('errors.errorDeletingMessage'));
      }
    } catch (error) {
      throw new Error(t('errors.errorDeletingMessage'), error);
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
    return null;
  }

  // We filter the messages
  const validMessages = messages.filter(message =>
    message &&
    (message.text || message.message || message.type === 'file')
  );

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
              // If there are no messages, we return an empty message container
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