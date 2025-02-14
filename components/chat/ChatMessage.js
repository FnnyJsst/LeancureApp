import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image, Platform, ActivityIndicator } from "react-native";
import { COLORS, SIZES } from "../../constants/style";
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useDeviceType } from '../../hooks/useDeviceType';
import { Text } from '../text/CustomText';

/**
 * @component ChatMessage
 * @description A component that renders a message in the chat screen
 * 
 * @param {Object} props - The properties of the component
 * @param {Object} props.message - The message to display
 * @param {boolean} props.isOwnMessage - Whether the message is own
 * @param {Function} props.onFileClick - The function to call when the file is clicked
 * 
 * @example
 * <ChatMessage message={message} isOwnMessage={isOwnMessage} onFileClick={() => console.log('File clicked')} />
 */

const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(parseInt(timestamp));
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatFileSize = (bytes) => {
  if (!bytes) return '0 Ko';
  
  const units = ['Ko', 'Mo', 'Go'];
  let size = bytes / 1024; // Conversion directe en Ko
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${Math.round(size)} ${units[unitIndex]}`;
};

export default function ChatMessage({ message, isOwnMessage, onFileClick }) {
  // console.log('🖼️ Message reçu dans ChatMessage:', {
  //   type: message.type,
  //   fileType: message.fileType,
  //   hasBase64: !!message.base64,
  //   messageComplet: message
  // });

  // Customized hook to determine the device type and orientation
  const { isSmartphone } = useDeviceType();
  const messageTime = formatTimestamp(message.savedTimestamp);

  if (message.type === 'file') {
    const isPDF = message.fileType?.toLowerCase().includes('pdf');
    const isImage = message.fileType?.toLowerCase().includes('image/') || 
                message.fileType?.toLowerCase().includes('jpeg') || 
                message.fileType?.toLowerCase().includes('jpg') || 
                message.fileType?.toLowerCase().includes('png');
    
    console.log('📄 Message PDF détecté:', {
      isPDF,
      fileType: message.fileType,
      fileName: message.fileName,
      hasBase64: !!message.base64,
      messageType: message.type
    });

    return (
      <View style={styles.messageWrapper(isOwnMessage)}>
        {/* Ajout de l'en-tête avec username et timestamp */}
        <View style={[
          styles.messageHeader,
          isOwnMessage ? styles.messageHeaderRight : styles.messageHeaderLeft
        ]}>
          <Text style={[
            styles.username,
            isSmartphone && styles.usernameSmartphone
          ]}>{message.username}</Text>
          <Text style={styles.timestamp}>{messageTime}</Text>
        </View>

        <View style={[
          styles.messageContainer, 
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
          styles.fileMessageContainer,
          message.isUnread && styles.unreadMessage
        ]}>
          <TouchableOpacity onPress={() => {
            onFileClick(message);
          }} style={styles.fileContainer}>
            {isPDF && (
              <View style={styles.pdfPreviewContainer}>
                <View style={styles.fileHeader}>
                  <Ionicons name="document-outline" size={25} color={COLORS.white} />
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {message.fileName}
                    </Text>
                    <Text style={styles.fileSize}>
                      PDF • {formatFileSize(message.fileSize)}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {isImage && message.base64 && (
              <View style={styles.previewContainer}>
                <Image
                  source={{ 
                    uri: `data:${message.fileType};base64,${message.base64}`
                  }}
                  style={styles.preview}
                  resizeMode="contain"
                />
                <View style={styles.fileHeader}>
                  <Ionicons 
                    name="image-outline" 
                    size={25} 
                    color={COLORS.white} 
                  />
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {message.fileName}
                    </Text>
                    <Text style={styles.fileSize}>
                      Image • {formatFileSize(message.fileSize)}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.messageWrapper(isOwnMessage)}>
      {/* Username and timestamp container */}
      <View style={[
        styles.messageHeader,
        isOwnMessage ? styles.messageHeaderRight : styles.messageHeaderLeft
      ]}>
        <Text style={[
          styles.username,
          isSmartphone && styles.usernameSmartphone
        ]}>{message.username}</Text>
        <Text style={styles.timestamp}>{messageTime}</Text>
      </View>

      {/* Message bubble */}
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage,
        styles.textMessageContainer,
        message.isUnread && styles.unreadMessage
      ]}>
        <Text style={[
          styles.messageText,
          isSmartphone && styles.messageTextSmartphone
        ]}>{message.text}</Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  messageWrapper: (isOwnMessage) => ({
    marginVertical: 3,
    maxWidth: '70%',
    alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
  }),
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    paddingHorizontal: 4,
    gap: 8,
  },
  messageHeaderLeft: {
    alignSelf: 'flex-start',
  },
  messageHeaderRight: {
    alignSelf: 'flex-end',
  },
  username: {
    color: COLORS.white,
    fontSize: SIZES.fonts.biggerTextTablet,
    fontWeight: SIZES.fontWeight.medium,
  },
  usernameSmartphone: {
    fontSize: SIZES.fonts.textSmartphone,
  },
  timestamp: {
    color: COLORS.gray600,
    fontSize: SIZES.fonts.smallTextSmartphone,
    fontWeight: SIZES.fontWeight.light,
  },
  messageContainer: {
    width: '100%',
    minWidth: 50,
    marginBottom: 10,
    marginTop: 4,
    borderRadius: SIZES.borderRadius.xLarge,
  },
  textMessageContainer: {
    padding: 15,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.orange,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.gray850,
  },
  messageText: {
    color: COLORS.white,
    fontSize: SIZES.fonts.textTablet,
    fontWeight: SIZES.fontWeight.light,
    fontFamily: Platform.select({
      android: 'Roboto',
      ios: 'System', 
    }),
  },
  messageTextSmartphone: {
    fontSize: SIZES.fonts.biggerTextSmartphone,
    fontWeight: SIZES.fontWeight.regular,
  },
  fileContainer: {
    minWidth: 250,
    paddingVertical: 8,
    alignItems: 'center',
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderBottomLeftRadius: SIZES.borderRadius.medium,
    borderBottomRightRadius: SIZES.borderRadius.medium,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    color: COLORS.white,
    fontSize: SIZES.fonts.textSmartphone,
    fontWeight: SIZES.fontWeight.medium,
  },
  fileSize: {
    color: COLORS.gray300,
    fontSize: SIZES.fonts.errorText,
  },
  pdfPreviewContainer: {
    width: '93%',
    height: 50,
    borderRadius: SIZES.borderRadius.medium,
    overflow: 'hidden',
    backgroundColor: COLORS.overlayLight,
    position: 'relative',
  },
  previewContainer: {
    width: '93%',
    height: 150,
    borderRadius: SIZES.borderRadius.medium,
    overflow: 'hidden',
    backgroundColor: COLORS.overlayLight,
    position: 'relative',
  },
  preview: {
    width: '100%',
    height: '100%',
    borderRadius: SIZES.borderRadius.medium,
  },
  previewContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: COLORS.white,
    fontSize: SIZES.fonts.textSmartphone,
    fontWeight: SIZES.fontWeight.regular,
  },
  fileMessageContainer: {
    padding: 8,
    backgroundColor: COLORS.gray850,
  },
  pdfPreviewContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gray850,
    borderRadius: SIZES.borderRadius.medium,
  },
  pdfPreviewText: {
    color: COLORS.white,
    marginTop: 10,
    fontSize: SIZES.fonts.textSmartphone,
    fontWeight: SIZES.fontWeight.regular,
  },
});