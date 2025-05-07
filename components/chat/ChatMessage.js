import React, { useState} from 'react';
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { COLORS, SIZES } from '../../constants/style';
import { Ionicons } from '@expo/vector-icons';
import { useDeviceType } from '../../hooks/useDeviceType';
import { Text } from '../text/CustomText';
import MenuMessage from './MenuMessage';
import { handleError, ErrorType } from '../../utils/errorHandling';
import { useTranslation } from 'react-i18next';
import { formatFileSize, formatTimestamp } from '../../utils/fileUtils';

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

  const { isSmartphone, isLowResTablet } = useDeviceType();
  const { t } = useTranslation();

  // Format the timestamp to display in the chat message
  const messageTime = formatTimestamp(message.savedTimestamp);

  /**
   * @function handleMessageError
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
          handleMessageError(t('error.messageIdMissing'), 'press.validation', { silent: false });
          return;
        }
        onFileClick(message);
      }
    } catch (error) {
      handleMessageError(error, 'press', { silent: false });
    }
  };

  /**
   * @function renderMenu
   * @description Render the menu
   * @returns {React.ReactNode} The menu
   */
  const renderMenu = () => {
    if (!menuMessageVisible) return null;

    return (
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
    );
  };

  /**
   * @function handleDelete
   * @description Handle the delete event to allow the user to delete the message
   */
  const handleDelete = () => {
    try {

      if (!message.id) {
        handleMessageError(t('error.messageIdMissing'), 'delete.validation', { silent: false });
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
        handleMessageError(t('error.messageIdMissing'), 'edit.validation', { silent: false });
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

  // Fonction utilitaire pour calculer la taille d'un fichier à partir du base64
  function getBase64FileSize(base64String) {
    if (!base64String) return 0;
    const cleaned = base64String.split(',').pop();
    return Math.ceil(cleaned.length * 0.75);
  }

  try {
    // If the message is a file, we display the file preview
    if (message.type === 'file') {
      const isPDF = message.fileType?.toLowerCase().includes('pdf');
      const isCSV = message.fileType?.toLowerCase().includes('csv');
      const isImage = message.fileType?.toLowerCase().includes('image/') ||
                  message.fileType?.toLowerCase().includes('jpeg') ||
                  message.fileType?.toLowerCase().includes('jpg') ||
                  message.fileType?.toLowerCase().includes('png');

      // We calculate the file size
      let fileSizeInBytes = 0;

      // If we have a valid stored size, we use it
      if (message.fileSize && !isNaN(parseInt(message.fileSize, 10))) {
        fileSizeInBytes = parseInt(message.fileSize, 10);
      }
      // Otherwise, if we have a base64, we calculate the size
      else if (message.base64) {
        const base64Length = message.base64.length;
        const paddingLength = message.base64.endsWith('==') ? 2 : message.base64.endsWith('=') ? 1 : 0;
        fileSizeInBytes = Math.floor(((base64Length - paddingLength) * 3) / 4);
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
                    {message.fileType?.toUpperCase() || (isPDF ? 'PDF' : 'CSV')} • {formatFileSize(fileSizeInBytes, {
                      startWithBytes: false,
                      precision: 1,
                      defaultUnit: 'Ko'
                    })}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {isImage && message.base64 && (
              <View style={[
                styles.imagePreviewContainer,
                isLowResTablet && styles.imagePreviewContainerLowResTablet,
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
                  resizeMode="cover"
                  onLoad={(event) => {
                    const { width, height } = event.nativeEvent.source;
                    const ratio = height / width;
                    const newHeight = (isLowResTablet ? 180 : 200) * ratio;
                    setImageSize({ width: isLowResTablet ? 180 : 200, height: newHeight });
                  }}
                />
                <View style={styles.imageFileHeader}>
                  <Ionicons
                    name="image-outline"
                    size={25}
                    color={COLORS.white}
                  />
                  <View>
                    <Text style={[
                      styles.pictureName,
                      isLowResTablet && styles.pictureNameLowResTablet
                    ]} numberOfLines={1} ellipsizeMode="tail">
                      {message.fileName || 'Image'}
                    </Text>
                    <Text style={styles.fileSize}>
                    {message.fileType?.toUpperCase() || 'IMAGE'} • {formatFileSize(fileSizeInBytes, {
                      startWithBytes: false,
                      precision: 1,
                      defaultUnit: 'Ko'
                    })}
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
          {renderMenu()}
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
        {renderMenu()}
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
            delayLongPress={500}
            style={[
              styles.messageContainer,
              isOwnMessage ? styles.ownMessage : styles.otherMessage,
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
    fontFamily: 'Roboto',
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
  pictureNameLowResTablet: {
    maxWidth: 160,
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
  imagePreviewContainer: {
    width: 200,
    borderRadius: SIZES.borderRadius.medium,
    overflow: 'hidden',
    position: 'relative',
    alignSelf: 'center',
    display: 'flex',
    flexDirection: 'column',
  },
  imagePreviewContainerLowResTablet: {
    width: 180,
  },
  imageFileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    width: '100%',
    zIndex: 1,
  },
  preview: {
    width: '100%',
    height: '100%',
    borderRadius: SIZES.borderRadius.medium,
    objectFit: 'cover',
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
    backgroundColor: COLORS.darkOrange,
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
});