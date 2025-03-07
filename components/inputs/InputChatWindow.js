import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../../constants/style';
import { useDeviceType } from '../../hooks/useDeviceType';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Text } from '../text/CustomText';
import { useTranslation } from 'react-i18next';

/**
 * @component FilePreview
 * @description A component that renders the file information in the input of the chat
 * @param {Object} props.file - The file to display
 * @param {Function} props.onRemove - The function to call when the file is removed
 */
const  FilePreview = ({ file, onRemove }) => {

  const { isSmartphone, isLandscape } = useDeviceType();

  return (
    <View style={[styles.previewContainer, isSmartphone && styles.previewContainerSmartphone]}>
      <View style={styles.fileInfo}>
        <Ionicons
          name="document-outline"
          size={24}
          color={COLORS.gray300}
        />
        <View style={styles.fileDetails}>
          <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="tail">
            {file.fileName}
          </Text>
          <Text style={styles.fileSize}>
            {file.fileSize}
          </Text>
        </View>
      </View>
      <TouchableOpacity onPress={onRemove}>
        <Ionicons
          name="close-circle"
          size={24}
          color={COLORS.gray600}
        />
      </TouchableOpacity>
    </View>
  );
};

/**
 * @component InputChatWindow
 * @description A component that renders the input of the chat
 *
 * @param {Object} props - The properties of the component
 * @param {Function} props.onFocusChange - The function to call when the input is focused
 *
 * @example
 * <InputChatWindow onSendMessage={() => console.log('Message sent')} onFocusChange={() => console.log('Input focused')} />
 */
export default function InputChatWindow({ onSendMessage, onFocusChange, editingMessage = null }) {

  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const { isSmartphone } = useDeviceType();
  const [isFocused, setIsFocused] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { t } = useTranslation();

  /**
   * @function formatFileSize
   * @description A function to format the file size
   * @param {number} bytes - The size of the file in bytes
   * @returns {string} The size of the file in a readable format
   */
  const formatFileSize = (bytes) => {
    if (bytes === 0) {return '0 B';}

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * @function pickDocument
   * @description A function to pick a document
   */
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        // We allow all types of files
        type: '*/*',
        // We allow only one file to be picked
        multiple: false,
      });

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const fileSize = formatFileSize(file.size);

        // We store the file in base64 format
        const base64 = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        // We store the file in the selectedFile state
        setSelectedFile({
          type: 'file',
          fileName: file.name,
          fileSize: fileSize,
          fileType: file.mimeType,
          uri: file.uri,
          base64: base64,
        });
      }
    } catch (pickDocumentError) {
      throw pickDocumentError;
    }
  };

  // Function to handle the focus of the input
  const handleFocus = () => {
    setIsFocused(true);
    onFocusChange(true);
  };

  // Function to handle the blur of the input
  const handleBlur = () => {
    setIsFocused(false);
    onFocusChange(false);
  };

  // Effet pour gérer le message en cours d'édition
  useEffect(() => {
    if (editingMessage) {
      console.log('🖊️ Message en édition:', editingMessage); // Log pour debug
      setMessage(editingMessage.text || '');
      setIsEditing(true);
      // Si c'est un message avec fichier, on garde une référence
      if (editingMessage.type === 'file' && editingMessage.fileInfo) {
        setSelectedFile({
          ...editingMessage.fileInfo,
          readOnly: true // Le fichier ne peut pas être modifié
        });
      }
    } else {
      setIsEditing(false);
      setSelectedFile(null);
    }
  }, [editingMessage]);

  /**
   * @function handleSend
   * @description A function to handle the send of the message
   */
  const handleSend = () => {
    if (!message.trim() && !selectedFile) return;

    if (isEditing && editingMessage) {
      console.log('✏️ Envoi du message modifié:', {
        text: message.trim(),
        messageId: editingMessage.id
      }); // Log pour debug

      onSendMessage({
        text: message.trim(),
        isEditing: true,
        messageId: editingMessage.id,
        type: editingMessage.type,
        fileInfo: editingMessage.fileInfo // On préserve les infos du fichier original
      });
    } else {
      // Mode création normal
      if (selectedFile && !selectedFile.readOnly) {
        onSendMessage({
          ...selectedFile,
          messageText: message.trim() || null
        });
      } else {
        onSendMessage({
          text: message.trim()
        });
      }
    }

    // Réinitialisation après envoi
    setMessage('');
    setSelectedFile(null);
    setIsEditing(false);
  };

  /**
   * @function handleRemoveFile
   * @description A function to handle the removal of the file from the input
   */
  const handleRemoveFile = () => {
    setSelectedFile(null);
  };


  return (
    <>
      <View style={[styles.container, isSmartphone && styles.smartphoneContainer]}>
        <TouchableOpacity
          onPress={pickDocument}
          style={[
            styles.attachButton,
            isSmartphone && styles.attachButtonSmartphone,
            isEditing && styles.attachButtonDisabled
          ]}
          disabled={isEditing}
        >
          <Ionicons
            name="add-outline"
            size={isSmartphone ? 24 : 30}
            color={isEditing ? COLORS.gray600 : COLORS.gray300}
          />
        </TouchableOpacity>

        <View style={styles.centerContainer}>
          {selectedFile && (
            <FilePreview
              file={selectedFile}
              onRemove={handleRemoveFile}
            />
          )}

          <View style={styles.inputWrapper}>
            <TextInput
              style={[
                styles.input,
                isSmartphone && styles.smartphoneInput,
                isFocused && styles.inputFocused,
                selectedFile && styles.inputWithFile,
                isEditing && styles.inputEditing,
              ]}
              placeholder={t('messages.typeMessage')}
              placeholderTextColor={COLORS.gray600}
              value={message}
              onChangeText={setMessage}
              multiline
              onFocus={handleFocus}
              onBlur={handleBlur}
              autoCapitalize="none"
              autoCorrect={false}
              textAlignVertical="center"
              allowFontScaling={false}
              maxFontSizeMultiplier={1}
            />
            {isEditing && (
              <TouchableOpacity
                onPress={() => {
                  setIsEditing(false);
                  setMessage('');
                  setSelectedFile(null);
                }}
                style={styles.cancelEditIcon}
              >
                <Ionicons name="close-circle" size={20} color={COLORS.gray300} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.sendButton,
            isSmartphone && styles.smartphoneSendButton,
            (message.trim() || selectedFile) && styles.sendButtonActive,
          ]}
          onPress={handleSend}
        >
          <Ionicons
            name="send-outline"
            size={isSmartphone ? 18 : 24}
            color={(message.trim() || selectedFile) ? COLORS.orange : COLORS.white}
            style={styles.sendIcon}
          />
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    backgroundColor: '#111111',
    marginBottom: -15,
    marginTop: 0,
    borderRadius: 0,
    borderTopWidth: 0.5,
    borderTopColor: '#403430',
    height: 60,
  },
  centerContainer: {
    flex: 1,
    marginRight: 10,
    flexDirection: 'column',
  },
  smartphoneContainer: {
    height: 60,
  },
  attachButton: {
    backgroundColor: '#111111',
    borderRadius: SIZES.borderRadius.small,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  attachButtonSmartphone: {
    width: 32,
    height: 32,
  },
  input: {
    fontFamily: FONTS.regular,
    fontSize: SIZES.fonts.textTablet,
    color: COLORS.gray300,
    backgroundColor: COLORS.gray900,
    borderRadius: SIZES.borderRadius.small,
    paddingHorizontal: 12,
    paddingVertical: 8,
    height: 40,
    borderWidth: 0.5,
    borderColor: '#403430',
    flex: 1,
    paddingRight: 35,
  },
  inputFocused: {
    borderColor: COLORS.orange + '50',
    shadowColor: COLORS.orange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    elevation: 1,
  },
  smartphoneInput: {
    fontSize: SIZES.fonts.textSmartphone,
    height: 36,
  },
  sendButton: {
    width: 45,
    height: 45,
    backgroundColor: COLORS.gray900,
    borderRadius: SIZES.borderRadius.small,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  sendButtonActive: {
    backgroundColor: COLORS.charcoal,
  },
  smartphoneSendButton: {
    width: 36,
    height: 36,
  },
  sendIcon: {
    transform: [{rotate: '-40deg'}],
    marginLeft: 2,
    marginBottom: 2,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '50%',
    padding: 3,
    marginBottom: 6,
    backgroundColor: COLORS.gray650,
    borderRadius: SIZES.borderRadius.small,
    justifyContent: 'space-between',
    height: 40,
  },
  previewContainerSmartphone: {
    width: '100%',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileDetails: {
    marginLeft: 8,
    maxWidth: 220,
  },
  fileName: {
    color: COLORS.gray300,
    fontSize: SIZES.fonts.small,
    fontWeight: SIZES.fontWeight.medium,

  },
  fileSize: {
    color: COLORS.gray600,
    fontSize: SIZES.fonts.xSmall,
  },
  inputContainer: {
    flex: 1,
    marginRight: 10,
    flexDirection: 'column',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fileName: {
    color: COLORS.gray300,
    fontSize: SIZES.fonts.small,
    fontWeight: SIZES.fontWeight.medium,
    flex: 1,
    marginHorizontal: 8,
  },
  removeButton: {
    padding: 2,
  },
  inputWithFile: {
    height: 36,
  },
  inputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputEditing: {
    borderColor: COLORS.orange + '30',
  },
  cancelEditIcon: {
    position: 'absolute',
    right: 8,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  attachButtonDisabled: {
    opacity: 0.5
  }
});
