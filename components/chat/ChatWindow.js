import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS, SIZES } from '../../constants/style';
import InputChatWindow from '../inputs/InputChatWindow';
import ChatMessage from './ChatMessage';
import DocumentPreviewModal from '../modals/chat/DocumentPreviewModal';
import { useDeviceType } from '../../hooks/useDeviceType';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendMessageApi } from '../../services/messageApi';
import DateBanner from './DateBanner';

export default function ChatWindow({ channel, messages: channelMessages, onInputFocusChange }) {
  const { isSmartphone } = useDeviceType();
  const scrollViewRef = useRef();

  const [isDocumentPreviewModalVisible, setIsDocumentPreviewModalVisible] = useState(false);
  const [selectedFileUrl, setSelectedFileUrl] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState(null);
  const [selectedFileSize, setSelectedFileSize] = useState(null);
  const [selectedFileType, setSelectedFileType] = useState(null);
  const [selectedBase64, setSelectedBase64] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    console.log('🔄 Messages mis à jour:', channelMessages?.length);
    if (channelMessages) {
      const validMessages = channelMessages.filter(msg => {
        // Check only the timestamp and the message content
        if (!msg.savedTimestamp || msg.savedTimestamp === 'undefined') {
          console.log('❌ Message without timestamp ignored:', msg);
          return false;
        }
        
        // Check if the message has content (message or title)
        if (!msg.message && !msg.title) {
          console.log('❌ Message without content ignored:', msg);
          return false;
        }
        
        return true;
      });
      
      // Format the messages to be used in the UI
      const formattedMessages = validMessages.map(msg => ({
        ...msg,
        username: msg.login || 'Anonymous',
        text: msg.message || msg.title || '',
        timestamp: new Date(parseInt(msg.savedTimestamp)).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      }));
      
      console.log('✅ Messages formatted:', formattedMessages.length);
      setMessages(formattedMessages);
    }
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

  // Function to send a message
  const sendMessage = async (messageData) => {
    try {
      // Add a log to see when sendMessage is called
      console.log('📩 Attempt to send message:', messageData);
      
      // Strict check for empty message
      if (!messageData || 
          (typeof messageData === 'string' && !messageData.trim()) || 
          messageData === undefined) {
        console.log('❌ Empty message ignored');
        return;
      }

      const credentialsStr = await AsyncStorage.getItem('userCredentials');
      if (!credentialsStr) {
        console.error('❌ No credentials found');
        return;
      }
      
      const credentials = JSON.parse(credentialsStr);
      console.log('📤 Envoi message:', { messageData, channelId: channel.id });
      
      const response = await sendMessageApi(channel.id, messageData, credentials);
      
      if (response.status === 'ok') {
        const currentTimestamp = Date.now();
        const newMessage = {
          id: currentTimestamp,
          username: "Moi",
          text: typeof messageData === 'string' ? messageData : '',
          timestamp: new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          savedTimestamp: currentTimestamp.toString(),
          isOwnMessage: true,
          ...(typeof messageData === 'object' && {
            type: messageData.type,
            fileName: messageData.fileName,
            fileSize: messageData.fileSize,
            fileType: messageData.fileType,
            uri: messageData.uri,
            base64: messageData.base64
          })
        };
        
        setMessages(prev => [...prev, newMessage]);

        setTimeout(() => {
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollToEnd({ animated: true });
          }
        }, 100);
      }
    } catch (error) {
      console.error('🔴 Error sending message:', error);
    }
  };

  // Function to format the date of a message
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
              let hasShownUnreadBanner = false;
              console.log('🎯 Rendu des messages - total:', messages.length);
              
              return messages.reduce((acc, message, index) => {
                console.log(`🔄 Message ${index} - isUnread: ${message.isUnread}, isOwnMessage: ${message.isOwnMessage}`);
                
                const currentDate = formatDate(message.savedTimestamp);
                const prevMessage = messages[index - 1];
                const prevDate = prevMessage ? formatDate(prevMessage.savedTimestamp) : null;

                if (currentDate !== prevDate) {
                  acc.push(
                    <DateBanner 
                      key={`date-${message.savedTimestamp}`} 
                      date={currentDate} 
                    />
                  );
                }

                // Afficher la bannière uniquement pour le premier message non lu
                // if (!hasShownUnreadBanner && !message.isOwnMessage && message.isUnread) {
                //   hasShownUnreadBanner = true;
                //   console.log(`🚩 Affichage bannière pour message ${index}`);
                //   acc.push(
                //     <View style={styles.unreadBanner} key={`unread-${message.id}`}>
                //       <View style={styles.separatorBanner} />
                //       <Text style={styles.unreadText}>New messages</Text>
                //       <View style={styles.separatorBanner} />
                //     </View>
                //   );
                // }

                acc.push(
                  <ChatMessage
                    key={message.id || index}
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
    backgroundColor: "#111111"
  },
  chatContainer: {
    flex: 1,
    padding: 10,
    marginBottom: 10,
  },
  chatContainerTablet: {
    padding: 20,
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
  // unreadBanner: {
  //   width: '100%',
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   justifyContent: 'center',
  //   gap: 10,
  //   marginVertical: 15,
  //   paddingHorizontal: 20,
  // },
  // separatorBanner: {
  //   height: 1,
  //   backgroundColor: COLORS.orange,
  //   flex: 1,
  // },
  // unreadText: {
  //   color: COLORS.orange,
  //   fontWeight: SIZES.fontWeight.medium,
  //   fontSize: SIZES.fonts.textSmartphone,
  //   paddingHorizontal: 10,
  // },
});
