import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { COLORS, SIZES } from '../../constants/style';
import InputChatWindow from '../inputs/InputChatWindow';
import ChatMessage from './ChatMessage';
import DocumentPreviewModal from '../modals/chat/DocumentPreviewModal';
import { useDeviceType } from '../../hooks/useDeviceType';
import * as SecureStore from 'expo-secure-store';
import { sendMessageApi, fetchMessageFile } from '../../services/api/messageApi';
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

  const [isDocumentPreviewModalVisible, setIsDocumentPreviewModalVisible] = useState(false);
  const [selectedFileUrl, setSelectedFileUrl] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState(null);
  const [selectedFileSize, setSelectedFileSize] = useState(null);
  const [selectedFileType, setSelectedFileType] = useState(null);
  const [selectedBase64, setSelectedBase64] = useState(null);
  const [messages, setMessages] = useState([]);
  const [credentials, setCredentials] = useState(null);
  const [error, setError] = useState(null);

  /**
   * @function useEffect
   * @description We use the useEffect hook to update the messages when the channel messages change
   */
  useEffect(() => {
    const loadCredentials = async () => {
      const credentialsStr = await SecureStore.getItemAsync('userCredentials');
      if (credentialsStr) {
        setCredentials(JSON.parse(credentialsStr));
      }
    };
    loadCredentials();
  }, []);

  useEffect(() => {
    if (channelMessages && credentials) {
      console.log('📨 Messages reçus:', channelMessages.map(msg => ({
        id: msg.id,
        type: msg.type,
        fileType: msg.fileType,
        fileName: msg.fileName
      })));

      const loadFiles = async () => {
        const messagesNeedingFiles = channelMessages.filter(msg =>
          msg.type === 'file' &&
          !msg.base64 &&
          msg.fileType &&
          msg.fileType.toLowerCase() !== 'none'
        );

        const batchSize = 3;
        const updatedMessages = [...channelMessages];

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
                }
              } catch (fileError) {
                console.error('Erreur chargement fichier:', fileError);
                setError(`${t('errors.errorLoadingFile')} ${fileError.message}`);
              }
            })
          );
        }

        setMessages(updatedMessages);
      };

      loadFiles();
    }
  }, [channelMessages, credentials, channel]);

  // Function to open the document preview modal
  const openDocumentPreviewModal = (message) => {
    if (!message) return;

    console.log('Ouverture document:', {
      type: message.type,
      fileType: message.fileType,
      fileName: message.fileName,
      hasBase64: !!message.base64
    });

    setIsDocumentPreviewModalVisible(true);
    setSelectedFileUrl(message.uri);
    setSelectedFileName(message.fileName);
    setSelectedFileSize(message.fileSize);
    setSelectedFileType(message.fileType?.toLowerCase());
    setSelectedBase64(message.base64);
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
  const sendMessage = async (messageData) => {
    try {
      console.log('💬 Début sendMessage:', {
        type: typeof messageData,
        isObject: typeof messageData === 'object',
        content: typeof messageData === 'object' ? {
          fileName: messageData.fileName,
          fileType: messageData.fileType,
          size: messageData.fileSize
        } : 'text'
      });

      // If we don't have any message data or any credentials, we return nothing
      if (!messageData ||
          (typeof messageData === 'string' && !messageData.trim()) ||
          messageData === undefined) {
        return;
      }

      const credentialsStr = await SecureStore.getItemAsync('userCredentials');
      if (!credentialsStr) {
        setError(t('errors.noCredentialsFound'));
        return;
      }

      // We parse the credentials
      const userCredentials = JSON.parse(credentialsStr);
      // We send the message to the API
      const response = await sendMessageApi(channel.id, messageData, userCredentials);
      // If the message is sent successfully, we create a new message object
      if (response.status === 'ok') {
        const currentTimestamp = Date.now();
        // console.log('📤 Réponse API:', response);

        const newMessage = {
          id: currentTimestamp,
          type: typeof messageData === 'object' ? 'file' : 'text',
          title: typeof messageData === 'string' ? messageData.substring(0, 50) : messageData.fileName,
          message: typeof messageData === 'string' ? messageData : messageData.fileName,
          savedTimestamp: currentTimestamp,
          endTimestamp: currentTimestamp + 99999,
          fileType: typeof messageData === 'object' ? messageData.fileType.toLowerCase() : 'none',
          login: userCredentials.login,
          isOwnMessage: true,
          isUnread: false,
          username: 'Me',
          ...(typeof messageData === 'object' && {
            fileName: messageData.fileName,
            fileSize: messageData.fileSize,
            base64: messageData.base64,
            uri: messageData.uri
          }),
        };

        console.log('💬 Message créé:', {
          id: newMessage.id,
          type: newMessage.type,
          fileType: newMessage.fileType,
          fileName: newMessage.fileName,
          hasBase64: !!newMessage.base64
        });

        if (typeof onMessageSent === 'function') {
          onMessageSent(newMessage);
        }
      }
    } catch (error) {
      console.error('🔴 Erreur sendMessage:', error);
      setError(`${t('errors.errorSendingMessage')} ${error.message}`);
    }
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

              return messages.reduce((acc, message, index) => {

                const currentDate = formatDate(message.savedTimestamp);
                const prevMessage = messages[index - 1];
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
                    key={message.id}
                    message={message}
                    isOwnMessage={message.isOwnMessage}
                    onFileClick={openDocumentPreviewModal}
                  />
                );

                return acc;
              }, []);
            })()}
          </ScrollView>

          <InputChatWindow
            onSendMessage={sendMessage}
            onFocusChange={onInputFocusChange}
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
      {/* If the document preview modal is visible, we display it */}
      <DocumentPreviewModal
        visible={isDocumentPreviewModalVisible}
        onClose={closeDocumentPreviewModal}
        fileUrl={selectedFileUrl}
        fileName={selectedFileName}
        fileSize={selectedFileSize}
        fileType={selectedFileType}
        base64={selectedBase64}
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
});
