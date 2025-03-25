import React, { useState} from 'react';
import { View, TouchableOpacity, StyleSheet, Image, Platform } from 'react-native';
import { COLORS, SIZES } from '../../constants/style';
import { Ionicons } from '@expo/vector-icons';
import { useDeviceType } from '../../hooks/useDeviceType';
import { Text } from '../text/CustomText';
import MenuMessage from './MenuMessage';

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
  console.log('🔍 DEBUG_FILESIZE - Valeur reçue bytes:', bytes, 'Type:', typeof bytes);

  // Si la valeur est une chaîne, essayer de la convertir en nombre
  if (typeof bytes === 'string') {
    bytes = parseFloat(bytes);
    console.log('🔍 DEBUG_FILESIZE - Après conversion de string:', bytes);
  }

  if (!bytes || isNaN(bytes)) {
    console.log('🔍 DEBUG_FILESIZE - Valeur invalide, retourne 0 Ko');
    return '0.1 Ko'; // Retourner une taille minimale même si invalide
  }
  if (bytes === 0) {
    console.log('🔍 DEBUG_FILESIZE - Valeur zéro, retourne 0 Ko');
    return '0.1 Ko'; // Retourner une taille minimale même si zéro
  }

  const k = 1024;
  const sizes = ['Ko', 'Mo', 'Go'];

  // Si la taille est très petite (< 100 octets) pour un vrai fichier,
  // supposons qu'elle est déjà en Ko et non en octets
  if (bytes < 100) {
    console.log('🔍 DEBUG_FILESIZE - Taille suspicieusement petite, interprétée comme déjà en Ko:', bytes);
    // La taille est déjà en Ko, pas besoin de division initiale
    let size = bytes;
    let unitIndex = 0;

    // Pour les petites tailles (< 10), afficher une décimale pour plus de précision
    if (size < 10) {
      const result = `${size.toFixed(1)} ${sizes[unitIndex]}`;
      console.log('🔍 DEBUG_FILESIZE - Résultat formaté (déjà en Ko):', result);
      return result;
    }

    // Pour les tailles plus grandes, arrondir à l'entier
    const result = `${Math.round(size)} ${sizes[unitIndex]}`;
    console.log('🔍 DEBUG_FILESIZE - Résultat formaté (déjà en Ko):', result);
    return result;
  }

  // Conversion normale en Ko comme base de départ
  let size = bytes / 1024;
  let unitIndex = 0;

  console.log('🔍 DEBUG_FILESIZE - Taille initiale en Ko:', size);

  // Pour les très petits fichiers (moins de 0.1 Ko), afficher au moins 0.1 Ko
  if (size < 0.1) {
    return '0.1 Ko';
  }

  // Conversion en unités supérieures si nécessaire
  while (size >= 1024 && unitIndex < sizes.length - 1) {
    size /= 1024;
    unitIndex++;
    console.log('🔍 DEBUG_FILESIZE - Passage à unité supérieure:', size, sizes[unitIndex]);
  }

  // Pour les petites tailles (< 10), afficher une décimale pour plus de précision
  if (size < 10) {
    const result = `${size.toFixed(1)} ${sizes[unitIndex]}`;
    console.log('🔍 DEBUG_FILESIZE - Résultat formaté (petit):', result);
    return result;
  }

  // Pour les tailles plus grandes, arrondir à l'entier
  const result = `${Math.round(size)} ${sizes[unitIndex]}`;
  console.log('🔍 DEBUG_FILESIZE - Résultat formaté (grand):', result);
  return result;
};

/**
 * @component ChatMessage
 * @description A component that renders a message in the chat screen
 *
 * @param {Object} props - The properties of the component
 * @param {Object} props.message - The message to display
 * @param {boolean} props.isOwnMessage - Whether the message is own
 * @param {Function} props.onFileClick - The function to call when the file is clicked
 * @param {Function} props.onDeleteMessage - The function to call when the message is deleted
 * @param {string} props.userRights - The user rights for the message
 *
 * @example
 * <ChatMessage message={message} isOwnMessage={isOwnMessage} onFileClick={() => console.log('File clicked')} onDeleteMessage={() => console.log('Message deleted')} canDelete={true} userRights="3" />
 */
export default function ChatMessage({ message, isOwnMessage, onFileClick, onDeleteMessage, onEditMessage, userRights }) {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [menuMessageVisible, setMenuMessageVisible] = useState(false);
  const { isSmartphone } = useDeviceType();
  const messageTime = formatTimestamp(message.savedTimestamp);

  /**
   * @function handleLongPress
   * @description Handle the long press event to allow the user to delete the message
   */
  const handleLongPress = () => {
    // Allow the user to delete the message if it is own or if the user has admin rights
    if (isOwnMessage || userRights === 3) {
      setMenuMessageVisible(true);
    }
  };

  /**
   * @function handlePress
   * @description Handle the press event to allow the user to open the file
   */
  const handlePress = () => {
    if (message.type === 'file') {
      onFileClick(message);
    }
  };

  /**
   * @function handleDelete
   * @description Handle the delete event to allow the user to delete the message
   */
  const handleDelete = () => {
    if (onDeleteMessage) {
      onDeleteMessage(message.id);
    }
    setMenuMessageVisible(false);
  };

  /**
   * @function handleEdit
   * @description Handle the edit event to allow the user to edit the message
   */
  const handleEdit = () => {
    console.log('🖊️ handleEdit appelé avec:', {
      messageId: message.id,
      text: message.text,
      type: message.type,
      isOwnMessage: isOwnMessage
    });

    if (onEditMessage) {
      console.log('✅ onEditMessage est défini, appel de la fonction');
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
      console.log('❌ onEditMessage n\'est pas défini');
    }
    setMenuMessageVisible(false);
  };

  // If the message is a file, we display the file preview
  if (message.type === 'file') {
    const isPDF = message.fileType?.toLowerCase().includes('pdf');
    const isImage = message.fileType?.toLowerCase().includes('image/') ||
                message.fileType?.toLowerCase().includes('jpeg') ||
                message.fileType?.toLowerCase().includes('jpg') ||
                message.fileType?.toLowerCase().includes('png');

    console.log('🧐 DEBUG_MESSAGE - Données du fichier:', {
      fileName: message.fileName,
      fileType: message.fileType,
      fileSize: message.fileSize,
      fileSizeType: typeof message.fileSize,
      hasBase64: !!message.base64,
      base64Length: message.base64 ? message.base64.length : 0
    });

    // Estimer la taille du fichier
    let fileSizeInBytes;

    // Option 1: Utiliser la taille fournie si elle est valide
    if (message.fileSize && !isNaN(parseInt(message.fileSize, 10))) {
      fileSizeInBytes = parseInt(message.fileSize, 10);
      console.log('🔍 DEBUG_SIZE - Utilisation de la taille fournie:', fileSizeInBytes);
    }
    // Option 2: Estimer la taille à partir du base64 (environ 3/4 de la longueur)
    else if (message.base64) {
      // La taille approximative en octets est environ 3/4 de la longueur de la chaîne base64
      fileSizeInBytes = Math.ceil(message.base64.length * 0.75);
      console.log('🔍 DEBUG_SIZE - Taille estimée depuis base64:', fileSizeInBytes);
    }
    // Option 3: Utiliser une valeur par défaut selon le type
    else {
      // Valeurs par défaut plus réalistes selon le type
      if (isPDF) {
        fileSizeInBytes = 150 * 1024; // ~150 Ko pour un PDF typique
      } else if (isImage) {
        fileSizeInBytes = 350 * 1024; // ~350 Ko pour une image typique
      } else {
        fileSizeInBytes = 100 * 1024; // ~100 Ko par défaut
      }
      console.log('🔍 DEBUG_SIZE - Utilisation de la taille par défaut:', fileSizeInBytes);
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
            isPDF && message.text && message.text !== message.fileName ? [
              styles.darkContainer,
              isOwnMessage && styles.ownDarkContainer
            ] : null
          ]}
        >
          {isPDF && (
            <View style={[
              styles.pdfPreviewContainer,
              message.text && message.text !== message.fileName && styles.pdfPreviewWithText
            ]}>
              <View style={styles.fileHeader}>
                <Ionicons name="document-outline" size={isSmartphone ? 20 : 30} color={COLORS.white} />
                <View>
                  <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="tail">
                    {message.fileName || 'Document PDF'}
                  </Text>
                  <Text style={styles.fileSize}>
                    {message.fileType?.toUpperCase() || 'PDF'} • {formatFileSize(fileSizeInBytes)}
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
    // padding: 8,
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
});