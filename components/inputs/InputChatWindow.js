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
    // Inform parent that the input is focused
    onFocusChange(true);
  };

  // Function to handle the blur of the input
  const handleBlur = () => {
    // Inform parent that the input is not focused
    onFocusChange(false);
  };

  // Function to handle the send of the message
  const handleSend = () => {
    if (selectedFile) {
      onSendMessage(selectedFile);
      setSelectedFile(null);
      // If we have a selected file, we send the file
    } else if (message.trim()) {
      onSendMessage(message);
      setMessage('');
      // If we have a message, we send the message
    }
  };

  // Function to handle the removal of the file
  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  return (
    <View style={[styles.container, isSmartphone && styles.smartphoneContainer]}>
      {/* We display the attach icon */}
      <TouchableOpacity onPress={pickDocument}>
        <Ionicons 
          name="attach-outline" 
          size={isSmartphone ? 24 : 30} 
          color={COLORS.gray300} 
          style={styles.attachIcon}
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
          style={[styles.input, isSmartphone && styles.smartphoneInput]}
          placeholder="Type a message..."
          placeholderTextColor={COLORS.white}
          value={message}
          onChangeText={setMessage}
          multiline
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      )}

      <TouchableOpacity 
        style={[
          styles.sendButton, 
          isSmartphone && styles.smartphoneSendButton,
          // We add the active style if we have a message or a selected file
          (message.trim() || selectedFile) && styles.sendButtonActive
        ]}
        onPress={handleSend}
      >
        <Ionicons 
          name="send" 
          size={isSmartphone ? 20 : 24} 
          color={COLORS.white} 
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: COLORS.gray650,
    marginHorizontal: 10,
    marginBottom: 20,
    borderRadius: SIZES.borderRadius.small,
  },
  smartphoneContainer: {
    height: 60,
  },
  attachIcon: {
    transform: [{rotate: '45deg'}],
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: SIZES.fonts.subtitleTablet,
    marginRight: 10,
  },
  smartphoneInput: {
    fontSize: SIZES.fonts.subtitleSmartphone,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    backgroundColor: COLORS.gray600,
    borderRadius: SIZES.borderRadius.small,
  },
  smartphoneSendButton: {
    padding: 5,
  },
  sendButtonActive: {
    backgroundColor: COLORS.orange,
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