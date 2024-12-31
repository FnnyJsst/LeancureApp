import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, SIZES } from '../../constants/style';
import { Ionicons } from '@expo/vector-icons';
import Separator from '../Separator';
import InputChatWindow from '../inputs/InputChatWindow';
import ChatMessage from './ChatMessage';
import DocumentPreviewModal from '../modals/chat/DocumentPreviewModal';
import { useDeviceType } from '../../hooks/useDeviceType';
export default function ChatWindow({ channel, toggleMenu, onInputFocusChange }) {

  const { isSmartphone, isTablet } = useDeviceType();

  const [isInputFocused, setIsInputFocused] = useState(false);
  const [message, setMessage] = useState('');
  const [isDocumentPreviewModalVisible, setIsDocumentPreviewModalVisible] = useState(false);
  const [selectedFileUrl, setSelectedFileUrl] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState(null);
  const [selectedFileSize, setSelectedFileSize] = useState(null);
  const [selectedFileType, setSelectedFileType] = useState(null);
  const [selectedBase64, setSelectedBase64] = useState(null);

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

  const messageTypes = {
    TEXT: 'text',
    FILE: 'file'
  }

  const [messages, setMessages] = useState([
    {
      id: 1,
      username: "John Doe",
      text: "Bonjour, comment ça va ?",
      timestamp: "10:30",
      isOwnMessage: false
    },
    {
      id: 2,
      username: "Moi",
      text: "Très bien, merci !",
      timestamp: "10:31",
      isOwnMessage: true
    }
  ]);
  
  //Structure of a message with a file
  const fileMessage = {
    id: 1,
    username: "Moi",
    type: messageTypes.FILE,
    fileName: "document.pdf",
    fileUrl: "url_du_fichier",
    fileSize: "1.2 MB",
    fileType: "application/pdf",
    timestamp: "10:30",
    isOwnMessage: true
  };

  const onChangeText = (text) => {
    setMessage(text);
    setIsInputFocused(text.length > 0);
  };

  const groupMessagesByDate = (messages) => {
    return messages.reduce((groups, message) => {
      const date = new Date(message.timestamp).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
      return groups;
    }, {});
  };

  const scrollViewRef = useRef();

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
        <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
          <Ionicons name="menu" size={isSmartphone ? 30 : 40} color={COLORS.lightGray} />
        </TouchableOpacity>
        {channel && (
          <View style={styles.channelNameContainer}>
            <Text style={[styles.channelName, isSmartphone && styles.channelNameSmartphone]}>{channel}</Text>
          </View>
        )}
      </View>
      <Separator width="100%" marginTop={0} marginBottom={0} />
      <ScrollView 
        ref={scrollViewRef}
        //When the content size changes, scroll to the bottom of the scrollview to read new messages
        onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
        style={[styles.chatContainer, isTablet && styles.chatContainerTablet]}>
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
            ]}>Select a channel to start chatting</Text>
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
      {channel && <InputChatWindow 
        onSendMessage={sendMessage} 
        onFocusChange={onInputFocusChange}
     />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkGray,
    marginTop: -34,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  menuButton: {
    padding: 10,
  },
  channelNameContainer: {
    marginLeft: 20,
  },
  channelName: {
    fontSize: SIZES.fonts.subtitleSmartphone,
    color: COLORS.lightGray,
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
  placeholder: {
    color: COLORS.gray,
    fontSize: SIZES.fonts.medium,
    textAlign: 'center',
  },
  noChannelContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  noChannelText: {
    color: COLORS.gray,
    fontSize: SIZES.fonts.subtitleTablet,
  },
  noChannelTextSmartphone: {
    fontSize: SIZES.fonts.subtitleSmartphone,
  },
});
