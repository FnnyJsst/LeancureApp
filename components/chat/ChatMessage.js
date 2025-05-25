import React, { useState} from 'react';
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { COLORS, SIZES } from '../../constants/style';
import { Ionicons } from '@expo/vector-icons';
import { useDeviceType } from '../../hooks/useDeviceType';
import { Text } from '../text/CustomText';
import MenuMessage from './MenuMessage';
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
export default function ChatMessage({ message, isOwnMessage, onFileClick, onDeleteMessage, onEditMessage, userRights, testID }) {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [menuMessageVisible, setMenuMessageVisible] = useState(false);

  const { isSmartphone, isLowResTablet } = useDeviceType();
  const { t } = useTranslation();

  // Format the timestamp to display in the chat message
  const messageTime = formatTimestamp(message.savedTimestamp);

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
      console.error('[ChatMessage] Error while handling the long press event:', error);
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
          console.error('[ChatMessage] Error while handling the press event:', error);
          return;
        }
        onFileClick(message);
      }
    } catch (error) {
      console.error('[ChatMessage] Error while handling the press event:', error);
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
          onEdit={isOwnMessage && message.type !== 'file' ? handleEdit : null}
          onClose={() => setMenuMessageVisible(false)}
          testID={testID}
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
        console.error('[ChatMessage] Error while handling the delete event:', error);
        return;
      }

      if (onDeleteMessage) {
        onDeleteMessage(message.id);
      }
      setMenuMessageVisible(false);
    } catch (error) {
      console.error('[ChatMessage] Error while handling the delete event:', error);
    }
  };

  /**
   * @function handleEdit
   * @description Handle the edit event to allow the user to edit the message
   */
  const handleEdit = () => {
    try {
      if (!message.id) {
        console.error('[ChatMessage] Error while handling the edit event:', error);
        return;
      }

      if (onEditMessage) {
        onEditMessage(message);
      } else {
        handleMessageError(
          'Edit handler not defined',
          'edit.handlerMissing',
          { silent: false }
        );
      }
      setMenuMessageVisible(false);
    } catch (error) {
      console.error('[ChatMessage] Error while handling the edit event:', error);
    }
  };

  try {
    // If the message is a file, we display the file preview
    if (message.type === 'file') {
      const normalizeFileType = (type) => {
        if (!type) return '';
        const lowerType = type.toLowerCase();
        if (lowerType.includes('pdf') || lowerType.includes('application/pdf')) return 'PDF';
        if (lowerType.includes('csv')) return 'CSV';
        if (lowerType.includes('image/') || lowerType.includes('jpeg') || lowerType.includes('jpg') || lowerType.includes('png')) {
          return 'IMAGE';
        }
        return type.toUpperCase();
      };

      const isPDF = message.fileType?.toLowerCase().includes('pdf') || message.fileType?.toLowerCase().includes('application/pdf');
      const isCSV = message.fileType?.toLowerCase().includes('csv');
      const isImage = message.fileType?.toLowerCase().includes('image/') ||
                  message.fileType?.toLowerCase().includes('jpeg') ||
                  message.fileType?.toLowerCase().includes('jpg') ||
                  message.fileType?.toLowerCase().includes('png');

      const displayFileType = normalizeFileType(message.fileType);

      // Calculate the file size
      let fileSizeInBytes = 0;

      // If we have a file size
      if (message.fileSize) {
        // If it's a string containing a unit (ex: "6.8 Ko")
        if (typeof message.fileSize === 'string' && message.fileSize.match(/[\d.]+\s*[KMG]o|[B]/i)) {
          fileSizeInBytes = formatFileSize(message.fileSize, { convertToBytes: true });
        }
        // If it's a number or a numeric string
        else if (!isNaN(parseFloat(message.fileSize))) {
          fileSizeInBytes = parseFloat(message.fileSize);
        }
      }
      // If we have a base64, we calculate the size
      else if (message.base64) {
        const base64Length = message.base64.length;
        // We remove the padding (=) at the end
        const paddingLength = message.base64.endsWith('==') ? 2 : message.base64.endsWith('=') ? 1 : 0;
        // More precise calculation of the size
        fileSizeInBytes = Math.floor(((base64Length - paddingLength) * 3) / 4);
        console.log('[ChatMessage] Taille du fichier calculée depuis base64:', {
          base64Length,
          paddingLength,
          calculatedSize: fileSizeInBytes,
          fileName: message.fileName
        });
      } else {
        console.log('[ChatMessage] Impossible de calculer la taille du fichier:', {
          hasFileSize: !!message.fileSize,
          hasBase64: !!message.base64,
          fileName: message.fileName,
          messageType: message.type,
          allProps: message
        });
      }

      const formattedSize = formatFileSize(fileSizeInBytes, {
        startWithBytes: false,
        precision: 1,
        defaultUnit: 'Ko'
      });

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
              (isPDF || isCSV) && styles.darkContainer,
              (isPDF || isCSV) && !message.text && styles.standaloneFileContainer,
              (isPDF || isCSV) && isOwnMessage && styles.ownDarkContainer,
              (isPDF || isCSV) && !isOwnMessage && styles.otherDarkContainer
            ]}
          >
            {(isPDF || isCSV) && (
              <View style={[
                styles.pdfPreviewContainer,
                message.text && message.text !== message.fileName && styles.pdfPreviewWithText,
                !message.text && styles.standaloneFilePreview
              ]}>
                <View style={styles.fileHeader}>
                  <Ionicons name="document-outline" size={isSmartphone ? 20 : 30} color={COLORS.white} />
                  <View>
                    <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="tail">
                      {message.fileName || (isPDF ? 'PDF' : 'CSV')}
                    </Text>
                    <Text style={styles.fileSize}>
                    {displayFileType} • {formattedSize}
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
                    {displayFileType} • {formattedSize}
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
        <View style={[
          styles.messageWrapper(isOwnMessage),
          isSmartphone && styles.messageWrapperSmartphone
        ]}>
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

          <View style={[
            styles.messageContentWrapper,
            isSmartphone && styles.messageContentWrapperSmartphone
          ]}>
            {messageContent}
          </View>
        </View>
      );
    } else {
      // For text messages
      const messageText = message.details || message.text || message.message || '';

      return (
        <View style={[
          styles.messageWrapper(isOwnMessage),
          isSmartphone && styles.messageWrapperSmartphone
        ]}>
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

          <View style={[
            styles.messageContentWrapper,
            isSmartphone && styles.messageContentWrapperSmartphone
          ]}>
            <TouchableOpacity
              onLongPress={handleLongPress}
              delayLongPress={500}
              style={[
                styles.messageContainer,
                isOwnMessage ? styles.ownMessage : styles.otherMessage,
              ]}
              testID={testID}
            >
              <Text style={[styles.messageText, isSmartphone && styles.messageTextSmartphone]}>
                {messageText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
  } catch (error) {
    console.error('[ChatMessage] Error rendering message:', error);
    return null;
  }
}

const styles = StyleSheet.create({
  messageWrapper: (isOwnMessage) => ({
    marginVertical: 3,
    maxWidth: '70%',
    alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
  }),
  messageWrapperSmartphone: {
    maxWidth: '80%',
  },
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
    maxWidth: 180,
  },
  pictureName: {
    color: COLORS.white,
    fontSize: SIZES.fonts.textSmartphone,
    fontWeight: SIZES.fontWeight.medium,
    maxWidth: 120,
  },
  pictureNameLowResTablet: {
    maxWidth: 140,
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
    width: 180,
    borderRadius: SIZES.borderRadius.medium,
    overflow: 'hidden',
    position: 'relative',
    alignSelf: 'center',
    display: 'flex',
    flexDirection: 'column',
  },
  imagePreviewContainerLowResTablet: {
    width: 160,
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
    maxWidth: 210,
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
  otherDarkContainer: {
    backgroundColor: COLORS.gray900,
  },
  standaloneFileContainer: {
    backgroundColor: COLORS.darkOrange,
    borderRadius: SIZES.borderRadius.medium,
    padding: 12,
    marginBottom: 0,
    marginHorizontal: 0,
  },
  standaloneFilePreview: {
    // padding: 4,
  },
  messageContentWrapper: {
    position: 'relative',
    width: '100%',
  },
  messageContentWrapperSmartphone: {
    maxWidth: '100%',
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