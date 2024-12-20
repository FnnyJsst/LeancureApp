import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../assets/styles/constants';
import { useDeviceType } from '../../hooks/useDeviceType';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

const FilePreview = ({ file, onRemove }) => {
  return (
    <View style={styles.previewContainer}>
      <View style={styles.fileInfo}>
        <Ionicons 
          name="document-outline" 
          size={24} 
          color={COLORS.orange} 
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
          color={COLORS.gray} 
        />
      </TouchableOpacity>
    </View>
  );
};

export default function InputChatWindow({ onSendMessage, onFocusChange }) {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const { isSmartphone } = useDeviceType();

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: false,
      });
  
      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const fileSize = formatFileSize(file.size);
        
        // Au lieu d'envoyer directement, on stocke le fichier
        const base64 = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
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
      console.error('Erreur lors de la sélection du document:', error);
    }
  };

  const handleFocus = () => {
    // Inform parent that the input is focused
    onFocusChange(true);
  };
   const handleBlur = () => {
    // Inform parent that the input is not focused
    onFocusChange(false);
  };

  const handleSend = () => {
    if (selectedFile) {
      onSendMessage(selectedFile);
      setSelectedFile(null);
    } else if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  return (
    <View style={[styles.container, isSmartphone && styles.smartphoneContainer]}>
      <TouchableOpacity onPress={pickDocument}>
        <Ionicons 
          name="attach-outline" 
          size={isSmartphone ? 24 : 30} 
          color={selectedFile ? COLORS.orange : COLORS.lightGray} 
          style={styles.attachIcon}
        />
      </TouchableOpacity>
      
      {selectedFile ? (
        <FilePreview 
          file={selectedFile} 
          onRemove={handleRemoveFile}
        />
      ) : (
        <TextInput
          style={[styles.input, isSmartphone && styles.smartphoneInput]}
          placeholder="Type a message..."
          placeholderTextColor={COLORS.gray}
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
          (message.trim() || selectedFile) && styles.sendButtonActive
        ]}
        onPress={handleSend}
      >
        <Ionicons 
          name="send" 
          size={isSmartphone ? 20 : 24} 
          color={(message.trim() || selectedFile) ? 'white' : COLORS.gray} 
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
    backgroundColor: COLORS.sidebarGray,
    marginHorizontal: 10,
    marginBottom: 20,
    borderRadius: SIZES.borderRadius.small,
  },
  containerTabletLandscape: {
    marginHorizontal: 20,
  },
  smartphoneContainer: {
    height: 50,
  },
  tabletContainer: {
    height: 70,
  },
  attachIcon: {
    transform: [{rotate: '45deg'}],
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: COLORS.lightGray,
    fontSize: SIZES.fonts.medium,
    marginRight: 10,
  },
  smartphoneInput: {
    fontSize: SIZES.fonts.small,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: COLORS.gray,
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
    backgroundColor: COLORS.sidebarGray,
    borderRadius: SIZES.borderRadius.small,
    padding: 8,
    marginRight: 10,
    justifyContent: 'space-between',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileDetails: {
    marginLeft: 8,
    flex: 1,
  },
  fileName: {
    color: COLORS.lightGray,
    fontSize: SIZES.fonts.small,
    fontWeight: SIZES.fontWeight.medium,
  },
  fileSize: {
    color: COLORS.gray,
    fontSize: SIZES.fonts.xSmall,
  },
});