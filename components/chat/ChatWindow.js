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
  const { isSmartphone, isTablet } = useDeviceType();
  const scrollViewRef = useRef();

  const [isDocumentPreviewModalVisible, setIsDocumentPreviewModalVisible] = useState(false);
  const [selectedFileUrl, setSelectedFileUrl] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState(null);
  const [selectedFileSize, setSelectedFileSize] = useState(null);
  const [selectedFileType, setSelectedFileType] = useState(null);
  const [selectedBase64, setSelectedBase64] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (channel?.messages && Array.isArray(channel.messages)) {
      const formattedMessages = channel.messages.map(msg => ({
        id: msg.id,
        username: msg.isOwnMessage ? "Moi" : "Utilisateur",
        text: msg.message,
        title: msg.title,
        timestamp: new Date(parseInt(msg.savedTimestamp)).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        isOwnMessage: msg.isOwnMessage || false,
        fileType: msg.fileType,
        fileName: msg.fileName,
        fileSize: msg.fileSize,
        uri: msg.uri,
        base64: msg.base64,
        savedTimestamp: msg.savedTimestamp || Date.now().toString(),
      }));
      setMessages(formattedMessages);
    } else {
      setMessages([]);
    }
  }, [channel]);

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
      if (typeof messageData === 'string' && !messageData.trim()) {
        return;
      }

      const credentialsStr = await AsyncStorage.getItem('userCredentials');
      if (!credentialsStr) {
        console.error('❌ Pas de credentials trouvées');
        return;
      }
      
      const credentials = JSON.parse(credentialsStr);
      
      const response = await sendMessageApi(channel.id, messageData, credentials);
      
      if (response.status === 'ok') {
        const newMessage = {
          id: Date.now(),
          username: "Moi",
          text: typeof messageData === 'string' ? messageData : '',
          timestamp: new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          isOwnMessage: true,
          type: messageData.type,
          fileName: messageData.fileName,
          fileSize: messageData.fileSize,
          fileType: messageData.fileType,
          uri: messageData.uri,
          base64: messageData.base64
        };
        
        setMessages([...messages, newMessage]);

        setTimeout(() => {
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollToEnd({ animated: true });
          }
        }, 100);
      }
    } catch (error) {
      console.error('🔴 Erreur envoi message:', error);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(parseInt(timestamp));
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
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
            {messages.reduce((acc, message, index) => {
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

              acc.push(
                <ChatMessage
                  key={message.id || index}
                  message={message}
                  isOwnMessage={message.isOwnMessage}
                  onFileClick={openDocumentPreviewModal}
                />
              );

              return acc;
            }, [])}
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
});