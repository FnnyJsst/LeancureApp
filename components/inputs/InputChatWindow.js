import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/style';
import { useDeviceType } from '../../hooks/useDeviceType';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

// FilePreview is used to display the file information in the input of the chat
const  FilePreview = ({ file, onRemove }) => {
  return (
    <View style={styles.previewContainer}>
      <View style={styles.fileInfo}>
        <Ionicons 
          name="document-outline" 
          size={24} 
          color={COLORS.gray300} 
        />
        <View style={styles.fileDetails}>
          <Text style={styles.fileName} numberOfLines={1}>
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

// InputChatWindow is used to send a message in the chat
export default function InputChatWindow({ onSendMessage, onFocusChange }) {

  // State to store the message
  const [message, setMessage] = useState('');
  // State to store the selected file
  const [selectedFile, setSelectedFile] = useState(null);
  // Hook to determine the device type
  const { isSmartphone } = useDeviceType();
  const [isFocused, setIsFocused] = useState(false);

  // Function to format the file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Function to pick a document
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
          base64: base64
        });
      }
    } catch (error) {
      console.error('Error when picking the document:', error);
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

  // Function to handle the send of the message
  const handleSend = () => {
    // Si on a un fichier sélectionné, on l'envoie même si le message est vide
    if (selectedFile) {
      onSendMessage(selectedFile);
      setSelectedFile(null);
      return;
    }

    // If a message is empty, we don't send it
    if (!message.trim()) {
      return;
    }

    onSendMessage(message);
    setMessage('');
  };

  // Function to handle the removal of the file
  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  return (
    <>
      <View style={[styles.container, isSmartphone && styles.smartphoneContainer]}>
        {/* We display the attach icon */}
        <TouchableOpacity 
          onPress={pickDocument}
          style={[
            styles.attachButton,
            isSmartphone && styles.attachButtonSmartphone
          ]}
        >
          <Ionicons 
            name="add-outline" 
            size={isSmartphone ? 24 : 30} 
            color={COLORS.gray300} 
          />
        </TouchableOpacity>
        {/* If we have a selected file, we display the file preview */}
        {selectedFile ? (
          <FilePreview 
            file={selectedFile} 
            onRemove={handleRemoveFile}
          />
        ) : (
          // If we don't have a selected file, we display the input for the message
          <TextInput
            style={[
              styles.input,
              isSmartphone && styles.smartphoneInput,
              isFocused && styles.inputFocused
            ]}
            placeholder="Type your message here..."
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
            keyboardType="default"
          />
        )}

        <TouchableOpacity 
          style={[
            styles.sendButton, 
            isSmartphone && styles.smartphoneSendButton,
            message.trim() && styles.sendButtonActive
          ]}
          onPress={handleSend}
        >
          <Ionicons 
            name="send-outline" 
            size={isSmartphone ? 18 : 25} 
            color={message.trim() ? COLORS.orange : COLORS.white}
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
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#111111',
    marginBottom: 0,
    marginTop: -10,
    borderRadius: 0,
    borderTopWidth: 0.5,
    borderTopColor: '#403430',
  },
  smartphoneContainer: {
    height: 60,
    padding: 10,
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
    flex: 1,
    fontSize: SIZES.fonts.textTablet,
    marginRight: 10,
    color: COLORS.gray300,
    backgroundColor: COLORS.gray900,
    borderRadius: SIZES.borderRadius.small,
    paddingHorizontal: 12,
    paddingVertical: 8,
    height: 36,
    // borderWidth: 0.5,
    // borderColor: '#403430',
  },
  // inputFocused: {
  //   borderColor: COLORS.orange + '50',
  //   shadowColor: COLORS.orange,
  //   shadowOffset: { width: 0, height: 0 },
  //   shadowOpacity: 0.5,
  //   shadowRadius: 6,
  // },
  smartphoneInput: {
    fontSize: SIZES.fonts.textSmartphone,
  },
  sendButton: {
    width: 36,
    height: 36,
    backgroundColor: COLORS.gray900,
    borderRadius: SIZES.borderRadius.small,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  sendButtonActive: {
    backgroundColor: "#271E1E",
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginRight: 10,
    justifyContent: 'space-between',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileDetails: {
    marginLeft: 8,
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
});