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
export default function ChatWindow({ channel, messages: channelMessages, onInputFocusChange, onMessageSent }) {
  
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
      const loadFiles = async () => {
        const messagesNeedingFiles = channelMessages.filter(msg => msg.type === 'file' && !msg.base64);
        
        console.log('📥 Messages nécessitant chargement:', {
          total: messagesNeedingFiles.length,
          types: messagesNeedingFiles.map(msg => msg.fileType)
        });

        const batchSize = 3;
        const updatedMessages = [...channelMessages];
        
        for (let i = 0; i < messagesNeedingFiles.length; i += batchSize) {
          const batch = messagesNeedingFiles.slice(i, i + batchSize);
          console.log('📥 Traitement batch:', {
            batchNumber: Math.floor(i / batchSize) + 1,
            batchSize: batch.length
          });
          const results = await Promise.all(
            batch.map(async (msg) => {
              try {
                const base64 = await fetchMessageFile(msg.id, {
                  channelid: parseInt(channel.id),
                  ...msg
                }, credentials);
                
                // Mettre à jour le message dans le tableau original
                const index = updatedMessages.findIndex(m => m.id === msg.id);
                if (index !== -1) {
                  updatedMessages[index] = {
                    ...updatedMessages[index],
                    base64: base64 || null
                  };
                }
              } catch (error) {
                console.error('🔴 Erreur chargement fichier:', error);
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
    setIsDocumentPreviewModalVisible(true);
    setSelectedFileUrl(message.uri);
    setSelectedFileName(message.fileName);
    setSelectedFileSize(message.fileSize);
    setSelectedFileType(message.fileType);
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
      // console.log('📤 Données du message à envoyer:', {
      //   type: typeof messageData,
      //   isObject: typeof messageData === 'object',
      //   content: messageData
      // });

      // If we don't have any message data or any credentials, we return nothing
      if (!messageData || 
          (typeof messageData === 'string' && !messageData.trim()) || 
          messageData === undefined) {
        return;
      }

      const credentialsStr = await SecureStore.getItemAsync('userCredentials');
      if (!credentialsStr) {
        console.log('❌ No credentials found');
        return;
      }
      
      // We parse the credentials
      const credentials = JSON.parse(credentialsStr);
      // We send the message to the API
      const response = await sendMessageApi(channel.id, messageData, credentials);
      // If the message is sent successfully, we create a new message object
      if (response.status === 'ok') {
        const currentTimestamp = Date.now();
        // console.log('📤 Réponse API:', response);
        
        const newMessage = {
          id: currentTimestamp,
          title: typeof messageData === 'string' ? messageData.substring(0, 50) : messageData.fileName,
          message: typeof messageData === 'string' ? messageData : messageData.fileName,
          savedTimestamp: currentTimestamp,
          endTimestamp: currentTimestamp + 99999,
          fileType: typeof messageData === 'object' ? messageData.fileType : 'none',
          login: credentials.login,
          isOwnMessage: true,
          isUnread: false,
          username: 'Moi',
          ...(typeof messageData === 'object' && {
            type: 'file',
            fileName: messageData.fileName,
            fileSize: messageData.fileSize,
            base64: messageData.base64,
            uri: messageData.uri
          })
        };
        
        // console.log('📤 Nouveau message créé:', newMessage);

        // If the onMessageSent function is defined, we call it to inform the parent component that a message has been sent
        if (typeof onMessageSent === 'function') {
          onMessageSent(newMessage);
        } 
      }
    } catch (error) {
      console.error('🔴 Error sending message:', error);
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

      console.warn('Missing timestamp for message');
      return 'Today'; // Default value
    }

    // If the timestamp is a string, we convert it to an integer
    const parsedTimestamp = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
    
    // If the timestamp is not a number, we return today
    if (isNaN(parsedTimestamp)) {
      console.warn('Invalid timestamp format:', timestamp);
      return 'Today'; // Default value
    }

    const date = new Date(parsedTimestamp);
    const today = new Date();
    // We create a date object for yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // If the date is today, we return "Today"
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    
    // If the date is not today or yesterday, we return the date in the format "day month year"
    return date.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
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
            isSmartphone && styles.noChannelTextSmartphone
          ]}>
            Select a channel to start chatting
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
    backgroundColor: COLORS.gray950
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
    marginTop: 4
  },
  messagesContainer: {
    flex: 1,
    padding: 10,
    marginBottom: 10,
  },
});