import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image, Platform } from 'react-native';
import { COLORS, SIZES } from '../../constants/style';
import { Ionicons } from '@expo/vector-icons';
import { useDeviceType } from '../../hooks/useDeviceType';
import { Text } from '../text/CustomText';


/**
 * @function formatTimestamp
 * @description Format the timestamp to display in the chat message
 * @param {string} timestamp - The timestamp to format
 * @returns {string} The formatted timestamp
 */
const formatTimestamp = (timestamp) => {
  if (!timestamp) {return '';}
  const date = new Date(parseInt(timestamp, 10));
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatFileSize = (bytes) => {
  if (bytes === 0) {return '0 B';}

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

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
export default function ChatMessage({ message, isOwnMessage, onFileClick }) {


  const { isSmartphone } = useDeviceType();
  const messageTime = formatTimestamp(message.savedTimestamp);

  if (message.type === 'file') {
    // console.log('📥 Message reçu dans ChatMessage:', { ...message, base64: '...' });
    const isPDF = message.fileType?.toLowerCase().includes('pdf');
    const isImage = message.fileType?.toLowerCase().includes('image/') ||
                message.fileType?.toLowerCase().includes('jpeg') ||
                message.fileType?.toLowerCase().includes('jpg') ||
                message.fileType?.toLowerCase().includes('png');

    const fileSizeInBytes = parseInt(message.fileSize, 10);

    console.log('File size in bytes:', fileSizeInBytes);
    console.log('Formatted file size:', formatFileSize(fileSizeInBytes));

    return (
      <View style={styles.messageWrapper(isOwnMessage)}>
        <View style={[
          styles.messageHeader,
          isOwnMessage ? styles.messageHeaderRight : styles.messageHeaderLeft,
        ]}>
          <Text style={[
            styles.username,
            isSmartphone && styles.usernameSmartphone,
          ]}>{message.username}</Text>
          <Text style={styles.timestamp}>{messageTime}</Text>
        </View>

        <View style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
          styles.fileMessageContainer,
          message.isUnread && styles.unreadMessage,
        ]}>
          <TouchableOpacity
            onPress={() => {
              onFileClick(message);
            }}
            style={[
              styles.fileContainer,
              message.text && message.text !== message.fileName && styles.darkContainer
            ]}
          >
            {isPDF && (
              <View style={[
                styles.pdfPreviewContainer,
                message.text && message.text !== message.fileName && styles.pdfPreviewWithText
              ]}>
                <View style={styles.fileHeader}>
                  <Ionicons name="document-outline" size={isSmartphone ? 20 : 30} color={COLORS.white} />
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {message.fileName}
                    </Text>
                    <Text style={styles.fileSize}>
                      {message.fileType.toUpperCase()} • {formatFileSize(parseInt(message.fileSize, 10))}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {isImage && message.base64 && (
              <View style={styles.previewContainer}>
                <Image
                  source={{
                    uri: `data:${message.fileType};base64,${message.base64}`,
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
                      {message.fileType.toUpperCase()} • {formatFileSize(fileSizeInBytes)}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </TouchableOpacity>
          {message.text && (
            <Text style={[styles.messageText, isSmartphone && styles.messageTextSmartphone]}>{message.text}</Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.messageWrapper(isOwnMessage)}>
      {/* Username and timestamp container */}
      <View style={[
        styles.messageHeader,
        isOwnMessage ? styles.messageHeaderRight : styles.messageHeaderLeft,
      ]}>
        <Text style={[
          styles.username,
          isSmartphone && styles.usernameSmartphone,
        ]}>{message.username}</Text>
        <Text style={styles.timestamp}>{messageTime}</Text>
      </View>

      {/* Message bubble */}
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage,
        message.isUnread && styles.unreadMessage,
      ]}>
        <Text style={[
          styles.messageText,
          isSmartphone && styles.messageTextSmartphone,
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
    paddingVertical: 4,
    alignItems: 'center',
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    width: '100%',
    borderRadius: SIZES.borderRadius.medium,
    overflow: 'hidden',
    position: 'relative',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  pdfPreviewWithText: {
    padding: 8,
  },
  previewContainer: {
    width: '100%',
    height: 150,
    borderRadius: SIZES.borderRadius.medium,
    overflow: 'hidden',
    position: 'relative',
  },
  preview: {
    width: '100%',
    height: '100%',
    borderRadius: SIZES.borderRadius.medium,
  },
  fileMessageContainer: {
    // padding: 8,
    backgroundColor: COLORS.gray850,
    width: '100%',
    minWidth: 50,
    marginBottom: 10,
    marginTop: 4,
    borderRadius: SIZES.borderRadius.xLarge,
    padding: 15,
  },
  darkContainer: {
    backgroundColor: COLORS.gray950,
    borderRadius: SIZES.borderRadius.medium,
    marginTop: -5,
    marginBottom: 5,
    marginHorizontal: 0,
    paddingVertical: 8,
  },
});