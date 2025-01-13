import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS, SIZES } from '../../constants/style';
import InputChatWindow from '../inputs/InputChatWindow';
import ChatMessage from './ChatMessage';
import DocumentPreviewModal from '../modals/chat/DocumentPreviewModal';
import { useDeviceType } from '../../hooks/useDeviceType';

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
    if (channelMessages && channelMessages.length > 0) {
      const formattedMessages = channelMessages.map(msg => ({
        id: msg.id,
        username: "User",
        text: msg.content || msg.message,
        title: msg.title,
        timestamp: new Date(parseInt(msg.savedTimestamp)).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        isOwnMessage: false,
        fileType: msg.fileType,
        fileName: msg.fileName,
        fileSize: msg.fileSize,
        uri: msg.uri,
        base64: msg.base64
      }));
      setMessages(formattedMessages);
    } else {
      setMessages([]);
    }
  }, [channelMessages]);

  const openDocumentPreviewModal = (message) => {
    setIsDocumentPreviewModalVisible(true);
    setSelectedFileUrl(message.uri);
    setSelectedFileName(message.fileName);
    setSelectedFileSize(message.fileSize);
    setSelectedFileType(message.fileType);
    setSelectedBase64(message.base64);
  };

  const closeDocumentPreviewModal = () => {
    setIsDocumentPreviewModalVisible(false);
    setSelectedFileUrl(null);
  };

  const sendMessage = (messageData) => {
    const newMessage = {
      id: messages.length + 1,
      username: "Moi",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwnMessage: true,
      ...(typeof messageData === 'string' 
        ? { type: 'text', text: messageData }
        : { type: 'file', ...messageData }
      )
    };
    
    setMessages([...messages, newMessage]);

    setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {channel && (
          <View style={styles.channelNameContainer}>
            <Text style={[styles.channelName, isSmartphone && styles.channelNameSmartphone]}>
              {channel}
            </Text>
          </View>
        )}
      </View>
      <ScrollView 
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
        style={[styles.chatContainer, isTablet && styles.chatContainerTablet]}
      >
        {channel ? (
          messages.map(message => (
            <ChatMessage 
              key={message.id}
              message={message}
              isOwnMessage={message.isOwnMessage}
              onFileClick={openDocumentPreviewModal}
            />
          ))
        ) : (
          <View style={styles.noChannelContainer}>
            <Text style={[
              styles.noChannelText,
              isSmartphone && styles.noChannelTextSmartphone
            ]}>
              Sélectionnez un canal pour commencer à discuter
            </Text>
          </View>
        )}
      </ScrollView>
      <DocumentPreviewModal
        visible={isDocumentPreviewModalVisible}
        onClose={closeDocumentPreviewModal}
        fileUrl={selectedFileUrl}
        fileName={selectedFileName}
        fileSize={selectedFileSize}
        fileType={selectedFileType}
        base64={selectedBase64}
      />
      {channel && (
        <InputChatWindow 
          onSendMessage={sendMessage} 
          onFocusChange={onInputFocusChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray900,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  channelNameContainer: {
    marginLeft: 20,
  },
  channelName: {
    fontSize: SIZES.fonts.subtitleTablet,
    color: COLORS.gray300,
  },
  channelNameSmartphone: {
    fontSize: SIZES.fonts.subtitleSmartphone,
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
});