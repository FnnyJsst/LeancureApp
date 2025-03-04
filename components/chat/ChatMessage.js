import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image, Platform, Text as RNText } from 'react-native';
import { COLORS, SIZES } from '../../constants/style';
import { Ionicons } from '@expo/vector-icons';
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
  if (!timestamp) {return '';}
  const date = new Date(parseInt(timestamp, 10));
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatFileSize = (bytes) => {

  const units = ['Ko', 'Mo', 'Go'];
  // Commençons directement en Ko pour éviter d'afficher des valeurs trop petites
  let size = Math.max(1, bytes / 1024);
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${Math.round(size)} ${units[unitIndex]}`;
};

const calculateFileSize = (base64String) => {
  if (!base64String) return 0;
  // La taille du fichier décodé est approximativement 3/4 de la longueur de la chaîne base64
  return Math.ceil(base64String.length * 0.75);
};

export default function ChatMessage({ message, isOwnMessage, onFileClick }) {

  // Customized hook to determine the device type and orientation
  const { isSmartphone } = useDeviceType();
  const messageTime = formatTimestamp(message.savedTimestamp);

  if (message.type === 'file') {
    const isPDF = message.fileType?.toLowerCase().includes('pdf');
    const isImage = message.fileType?.toLowerCase().includes('image/') ||
                message.fileType?.toLowerCase().includes('jpeg') ||
                message.fileType?.toLowerCase().includes('jpg') ||
                message.fileType?.toLowerCase().includes('png');

    return (
      <View style={styles.messageWrapper(isOwnMessage)}>
        <View style={[
          styles.messageHeader,
          isOwnMessage ? styles.messageHeaderRight : styles.messageHeaderLeft,
        ]}>
          <Text style={[
            styles.username,
            isSmartphone && styles.usernameSmartphone,
          ]}>{message.username || 'Utilisateur'}</Text>
          <Text style={styles.timestamp}>{messageTime}</Text>
        </View>

        <TouchableOpacity
          onPress={() => onFileClick(message)}
          style={[
            styles.messageContainer,
            isOwnMessage ? styles.ownMessage : styles.otherMessage,
            styles.fileMessageContainer,
          ]}
        >
          {isPDF && (
            <View style={styles.fileContainer}>
              <View style={styles.pdfPreviewContainer}>
                <View style={styles.fileHeader}>
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

              <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                padding: 12,
                backgroundColor: 'rgba(0,0,0,0.01)',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center'
              }}>
                <Ionicons
                  name="document-text-outline"
                  size={24}
                  color={COLORS.white}
                  style={{ marginRight: 10 }}
                />
                <View style={{ flex: 1 }}>
                  <RNText style={{
                    color: '#FFFFFF',
                    fontSize: 15,
                    fontWeight: 'bold',
                    textShadowColor: 'rgba(0, 0, 0, 0.75)',
                    textShadowOffset: { width: 0.5, height: 0.5 },
                    textShadowRadius: 1,
                    marginBottom: 3
                  }} numberOfLines={1}>
                    {message.fileName || "Document PDF"}
                  </RNText>
                  <RNText style={{
                    color: '#FFFFFF',
                    fontSize: 13,
                    fontWeight: '300',
                    opacity: 0.9,
                    textShadowColor: 'rgba(0, 0, 0, 0.5)',
                    textShadowOffset: { width: 0.5, height: 0.5 },
                    textShadowRadius: 1
                  }}>
                    PDF • {formatFileSize(100 * 1024)}
                  </RNText>
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
                    Image • {formatFileSize(message.fileSize)}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </TouchableOpacity>
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
        styles.textMessageContainer,
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
    width: '100%',
    minWidth: 250,
    padding: 8,
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  fileInfo: {
    flex: 1,
    marginRight: 8,
  },
  fileName: {
    color: COLORS.white,
    fontSize: SIZES.fonts.textSmartphone,
    fontWeight: SIZES.fontWeight.medium,
  },
  fileSize: {
    color: COLORS.gray300,
    fontSize: SIZES.fonts.smallTextSmartphone,
    marginTop: 2,
  },
  pdfPreviewContainer: {
    width: '100%',
    minHeight: 60,
    backgroundColor: COLORS.gray800,
    borderRadius: SIZES.borderRadius.medium,
    overflow: 'hidden',
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
    padding: 0,
    overflow: 'hidden',
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
