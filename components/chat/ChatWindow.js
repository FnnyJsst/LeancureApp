import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { COLORS, SIZES } from '../../constants/style';
import InputChatWindow from '../inputs/InputChatWindow';
import ChatMessage from './ChatMessage';
import DocumentPreviewModal from '../modals/chat/DocumentPreviewModal';
import { useDeviceType } from '../../hooks/useDeviceType';
import * as SecureStore from 'expo-secure-store';
import { sendMessageApi } from '../../services/api/messageApi';
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

  /**
   * @function useEffect
   * @description We use the useEffect hook to update the messages when the channel messages change
   */
  useEffect(() => {
    // If there are no messages, we set the messages to an empty array
    if (!channelMessages) {
      setMessages([]);
      return;
    }

    // We filter the messages to be used in the UI
    const validMessages = channelMessages.filter(msg => {
      // If the message has no timestamp, title or message, we ignore it
      if (!msg.savedTimestamp || msg.savedTimestamp === 'undefined' ) {
        return false;
      }
      
      if (!msg.message && !msg.title) {
        return false;
      }
      
      return true;
    });
    
    // We format the messages to be used in the UI
    const formattedMessages = validMessages.map(msg => ({
      ...msg,
      username: msg.login || 'Anonymous',
      text: msg.message || msg.details || '',
      timestamp: new Date(parseInt(msg.savedTimestamp)).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }));
    
    // We update the messages
    setMessages(formattedMessages);
  }, [channelMessages]);

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
        const newMessage = {
          id: currentTimestamp,
          message: typeof messageData === 'string' ? messageData : messageData.fileName,
          channelId: channel.id,
          savedTimestamp: currentTimestamp.toString(),
          isOwnMessage: true,
          login: credentials.login,
          ...(typeof messageData === 'object' && {
            type: 'file',
            fileName: messageData.fileName,
            fileSize: messageData.fileSize,
            fileType: messageData.fileType,
            uri: messageData.uri
          })
        };

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
                    key={`msg-${message.id || index}`}
                    message={{
                      ...message,
                      isUnread: message.isUnread || false
                    }}
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