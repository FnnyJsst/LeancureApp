import React, { useState} from 'react';
import { View, TouchableOpacity, StyleSheet, Image, Platform } from 'react-native';
import { COLORS, SIZES } from '../../constants/style';
import { Ionicons } from '@expo/vector-icons';
import { useDeviceType } from '../../hooks/useDeviceType';
import { Text } from '../text/CustomText';
import MenuMessage from './MenuMessage';
import { handleError, ErrorType } from '../../utils/errorHandling';
import { useTranslation } from 'react-i18next';

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

/**
 * @function formatFileSize
 * @description Format the file size to display in the chat message
 * @param {number} bytes - The file size in bytes
 * @returns {string} The formatted file size
 */
const formatFileSize = (bytes) => {
  // If the value is a string, try to convert it to a number
  if (typeof bytes === 'string') {
    bytes = parseFloat(bytes);
  }

  // If the value is not a number or is NaN, we return nothing
  if (!bytes || isNaN(bytes) || bytes === 0) {
    return '';
  }

  const k = 1024;
  const sizes = ['Ko', 'Mo', 'Go'];

  // If the size is very small (< 100 bytes) for a real file,
  // assume it is already in Ko and not in bytes
  if (bytes < 100) {
    // The size is already in Ko, no need to divide by 1024
    let size = bytes;
    let unitIndex = 0;

    // If the size is very small (< 10), display one decimal for more precision
    if (size < 10) {
      const result = `${size.toFixed(1)} ${sizes[unitIndex]}`;
      return result;
    }

    // For larger sizes, round to the nearest integer
    const result = `${Math.round(size)} ${sizes[unitIndex]}`;
    return result;
  }

  // Normal conversion to Ko as a starting point
  let size = bytes / 1024;
  let unitIndex = 0;

  // If the size is very small (< 0.1 Ko), display at least 0.1 Ko
  if (size < 0.1) {
    return '0.1 Ko';
  }

  // Conversion to higher units if necessary
  while (size >= 1024 && unitIndex < sizes.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  // For very small sizes (< 10), display one decimal for more precision
  if (size < 10) {
    const result = `${size.toFixed(1)} ${sizes[unitIndex]}`;
    return result;
  }

  // For larger sizes, round to the nearest integer
  const result = `${Math.round(size)} ${sizes[unitIndex]}`;
  return result;
};

/**
 * @component ChatMessage
 * @description A component that renders a message in the chat screen
 * @param {Object} props.message - The message to display
 * @param {boolean} props.isOwnMessage - Whether the message is own
 * @param {Function} props.onFileClick - The function to call when the file is clicked
 * @param {Function} props.onDeleteMessage - The function to call when the message is deleted
 * @param {string} props.userRights - The user rights for the message to determine if the user can delete someone else's message
 */
export default function ChatMessage({ message, isOwnMessage, onFileClick, onDeleteMessage, onEditMessage, userRights }) {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [menuMessageVisible, setMenuMessageVisible] = useState(false);

  // Get the device type and the translation function
  const { isSmartphone } = useDeviceType();
  const { t } = useTranslation();

  // Format the timestamp to display in the chat message
  const messageTime = formatTimestamp(message.savedTimestamp);

  /**
   * @description Handle message-related errors
   * @param {Error} error - The error
   * @param {string} source - The source
   * @param {object} options - Additional options
   */
  const handleMessageError = (error, source, options = {}) => {
    return handleError(error, `chatMessage.${source}`, {
      type: ErrorType.SYSTEM,
      silent: true,  // Silent errors by default to not overload the console
      ...options
    });
  };

  /**
   * @function handleLongPress
   * @description Handle the long press event to allow the user to delete/edit the message
   */
  const handleLongPress = () => {
    try {
      // Allow the user to delete the message if it is own or if the user has admin rights
      if (isOwnMessage || userRights === 3) {
        setMenuMessageVisible(true);
      }
    } catch (error) {
      handleMessageError(error, 'longPress');
    }
  };

  /**
   * @function handlePress
   * @description Handle the press event to allow the user to open the file
   */
  const handlePress = () => {
    try {
      if (message.type === 'file') {
        if (!message.id) {
          handleMessageError('Message ID is missing', 'press.validation', { silent: false });
          return;
        }
        onFileClick(message);
      }
    } catch (error) {
      handleMessageError(error, 'press', { silent: false });
    }
  };

  /**
   * @function handleDelete
   * @description Handle the delete event to allow the user to delete the message
   */
  const handleDelete = () => {
    try {
      if (!message.id) {
        handleMessageError('Message ID is missing', 'delete.validation', { silent: false });
        return;
      }

      if (onDeleteMessage) {
        onDeleteMessage(message.id);
      }
      setMenuMessageVisible(false);
    } catch (error) {
      handleMessageError(error, 'delete', { silent: false });
    }
  };

  /**
   * @function handleEdit
   * @description Handle the edit event to allow the user to edit the message
   */
  const handleEdit = () => {
    try {
      if (!message.id) {
        handleMessageError('Message ID is missing', 'edit.validation', { silent: false });
        return;
      }

      if (onEditMessage) {
        onEditMessage({
          id: message.id,
          text: message.text || '',
          type: message.type,
          fileInfo: message.type === 'file' ? {
            fileName: message.fileName,
            fileType: message.fileType,
            fileSize: message.fileSize
          } : null
        });
      } else {
        handleMessageError(
          'Edit handler not defined',
          'edit.handlerMissing',
          { silent: false }
        );
      }
      setMenuMessageVisible(false);
    } catch (error) {
      handleMessageError(error, 'edit', { silent: false });
    }
  };

  try {
    // If the message is a file, we display the file preview
    if (message.type === 'file') {
      const isPDF = message.fileType?.toLowerCase().includes('pdf');
      const isCSV = message.fileType?.toLowerCase().includes('csv');
      const isImage = message.fileType?.toLowerCase().includes('image/') ||
                  message.fileType?.toLowerCase().includes('jpeg') ||
                  message.fileType?.toLowerCase().includes('jpg') ||
                  message.fileType?.toLowerCase().includes('png');

      // Estimate the file size
      let fileSizeInBytes;

      // Option 1: Use the provided size if it is valid
      if (message.fileSize && !isNaN(parseInt(message.fileSize, 10))) {
        fileSizeInBytes = parseInt(message.fileSize, 10);
      }
      // Option 2: Estimate the size from the base64 (approximately 3/4 of the length)
      else if (message.base64) {
        // The approximate size in bytes is approximately 3/4 of the length of the base64 string
        fileSizeInBytes = Math.ceil(message.base64.length * 0.75);
      }
      // Option 3: Use a default value based on the type
      else {
        // Default values more realistic based on the type
        if (isPDF) {
          fileSizeInBytes = 150 * 1024; // ~150 Ko for a typical PDF
        } else if (isCSV) {
          fileSizeInBytes = 100 * 1024; // ~100 Ko for a typical CSV
        } else if (isImage) {
          fileSizeInBytes = 350 * 1024; // ~350 Ko for a typical image
        } else {
          fileSizeInBytes = 100 * 1024; // ~100 Ko by default
        }
      }

      const messageContent = (
        <TouchableOpacity
          onLongPress={handleLongPress}
          onPress={handlePress}
          delayLongPress={500}
          style={[
            styles.messageContainer,
            isOwnMessage ? styles.ownMessage : styles.otherMessage,
            styles.fileMessageContainer,
            isOwnMessage && styles.ownFileMessageContainer,
            message.isUnread && styles.unreadMessage,
          ]}
        >
          <View
            style={[
              styles.fileContainer,
              (isPDF || isCSV) && message.text && message.text !== message.fileName ? [
                styles.darkContainer,
                isOwnMessage && styles.ownDarkContainer
              ] : null
            ]}
          >
            {(isPDF || isCSV) && (
              <View style={[
                styles.pdfPreviewContainer,
                message.text && message.text !== message.fileName && styles.pdfPreviewWithText
              ]}>
                <View style={styles.fileHeader}>
                  <Ionicons name="document-outline" size={isSmartphone ? 20 : 30} color={COLORS.white} />
                  <View>
                    <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="tail">
                      {message.fileName || (isPDF ? 'PDF' : 'CSV')}
                    </Text>
                    <Text style={styles.fileSize}>
                      {message.fileType?.toUpperCase() || (isPDF ? 'PDF' : 'CSV')} • {formatFileSize(fileSizeInBytes)}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {isImage && message.base64 && (
              <View style={[
                styles.imagePreviewContainer,
                { height: Math.min(240, imageSize.height) }
              ]}>
                <Image
                  source={{
                    uri: `data:${message.fileType};base64,${message.base64}`,
                  }}
                  style={[
                    styles.preview,
                    { height: Math.min(300, imageSize.height) }
                  ]}
                  resizeMode="contain"
                  onLoad={(event) => {
                    const { width, height } = event.nativeEvent.source;
                    const ratio = height / width;
                    const newHeight = 200 * ratio;
                    setImageSize({ width: 200, height: newHeight });
                  }}
                />
                <View style={styles.imageFileHeader}>
                  <Ionicons
                    name="image-outline"
                    size={25}
                    color={COLORS.white}
                  />
                  <View>
                    <Text style={styles.pictureName} numberOfLines={1} ellipsizeMode="tail">
                      {message.fileName || 'Image'}
                    </Text>
                    <Text style={styles.fileSize}>
                      {message.fileType?.toUpperCase() || 'IMAGE'} • {formatFileSize(fileSizeInBytes)}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
          {message.text && message.text !== message.fileName && (
            <Text style={[styles.messageText, isSmartphone && styles.messageTextSmartphone]}>
              {message.text}
            </Text>
          )}
        </TouchableOpacity>
      );

      return (
        <View style={styles.messageWrapper(isOwnMessage)}>
          {menuMessageVisible && (
            <>
              <TouchableOpacity
                style={styles.menuOverlay}
                onPress={() => setMenuMessageVisible(false)}
                activeOpacity={1}
              />
              <MenuMessage
                onDelete={handleDelete}
                onEdit={isOwnMessage ? handleEdit : null}
                onClose={() => setMenuMessageVisible(false)}
                style={[
                  styles.menuMessageContainer,
                  isOwnMessage ? styles.menuRight : styles.menuLeft
                ]}
              />
            </>
          )}
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

          <View style={styles.messageContentWrapper}>
            {messageContent}
          </View>
        </View>
      );
    }

    return (
      <View style={styles.messageWrapper(isOwnMessage)}>
        {menuMessageVisible && (
          <>
            <TouchableOpacity
              style={styles.menuOverlay}
              onPress={() => setMenuMessageVisible(false)}
              activeOpacity={1}
            />
            <MenuMessage
              onDelete={handleDelete}
              onEdit={isOwnMessage ? handleEdit : null}
              onClose={() => setMenuMessageVisible(false)}
              style={[
                styles.menuMessageContainer,
                isOwnMessage ? styles.menuRight : styles.menuLeft
              ]}
            />
          </>
        )}
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

        <View style={styles.messageContentWrapper}>
          <TouchableOpacity
            onLongPress={handleLongPress}
            onPress={handlePress}
            delayLongPress={500} // 500ms pour l'appui long
            style={[
              styles.messageContainer,
              isOwnMessage ? styles.ownMessage : styles.otherMessage,
              message.isUnread && styles.unreadMessage,
            ]}
          >
            <Text style={[styles.messageText, isSmartphone && styles.messageTextSmartphone]}>
              {message.text}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  } catch (error) {
    // Global error handling for the component rendering
    handleMessageError(error, 'render', { silent: false });

    // Fallback rendering in case of error
    return (
      <View style={styles.messageWrapper(isOwnMessage)}>
        <View style={[
          styles.messageContainer,
          styles.errorMessage
        ]}>
          <Text style={styles.errorText}>
            {t('errors.messageDisplayError')}
          </Text>
        </View>
      </View>
    );
  }
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
    padding: 8,

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
    marginHorizontal: 8,
    marginVertical: 6,
  },
  messageTextSmartphone: {
    fontSize: SIZES.fonts.biggerTextSmartphone,
    fontWeight: SIZES.fontWeight.regular,
  },
  fileContainer: {
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
    maxWidth: 220,
  },
  pictureName: {
    color: COLORS.white,
    fontSize: SIZES.fonts.textSmartphone,
    fontWeight: SIZES.fontWeight.medium,
    maxWidth: 150,
  },
  fileSize: {
    color: COLORS.gray300,
    fontSize: SIZES.fonts.errorText,
  },
  pdfPreviewContainer: {
    width: '100%',
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
  imagePreviewContainer: {
    width: 200,
    borderRadius: SIZES.borderRadius.medium,
    overflow: 'hidden',
    position: 'relative',
    alignSelf: 'center',
  },
  imageFileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  preview: {
    width: '100%',
    height: '100%',
    borderRadius: SIZES.borderRadius.medium,
  },
  fileMessageContainer: {
    backgroundColor: COLORS.gray850,
    width: '100%',
    minWidth: 50,
    marginBottom: 10,
    marginTop: 4,
    borderRadius: SIZES.borderRadius.xLarge,
  },
  ownFileMessageContainer: {
    backgroundColor: COLORS.orange,
  },
  darkContainer: {
    backgroundColor: COLORS.gray950,
    borderRadius: SIZES.borderRadius.medium,
    marginBottom: 5,
    marginHorizontal: 0,
    paddingVertical: 8,
    maxWidth: '100%',
  },
  ownDarkContainer: {
    backgroundColor: '#cc5200',
  },
  messageContentWrapper: {
    position: 'relative',
    width: '100%',
  },
  menuMessageContainer: {
    position: 'absolute',
    top: '100%',
    marginTop: -100,
    zIndex: 9999,
  },
  menuLeft: {
    left: 0,
  },
  menuRight: {
    right: 0,
  },
  menuOverlay: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    backgroundColor: 'transparent',
    zIndex: 9998,
  },
  errorMessage: {
    backgroundColor: COLORS.gray850,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.burgundy,
  },
  errorText: {
    color: COLORS.red,
    fontSize: SIZES.fonts.smallTextSmartphone,
  }
});