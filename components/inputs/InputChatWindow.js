import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../assets/styles/constants';
import { useDeviceType } from '../../hooks/useDeviceType';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

export default function InputChatWindow({ onSendMessage, onFocusChange }) {
  const [message, setMessage] = useState('');
  const { isSmartphone } = useDeviceType();

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // const pickDocument = async () => {
  //   try {
  //     const result = await DocumentPicker.getDocumentAsync({
  //       type: '*/*',
  //       multiple: false,
  //     });
  
  //     if (result.assets && result.assets.length > 0) {
  //       const file = result.assets[0];
  //       const fileSize = formatFileSize(file.size);
        
  //       // Créer un message de type fichier
  //       const fileMessage = {
  //         type: 'file',Name: file.name,
  //         fileSize: fileSize,
  //         fileType: file.mimeType,
  //         uri: file.uri
  //       };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: false,
      });
  
      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const fileSize = formatFileSize(file.size);
        
        // Convertir le fichier en base64
        const base64 = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        const fileMessage = {
          type: 'file',
          fileName: file.name,
          fileSize: fileSize,
          fileType: file.mimeType,
          uri: file.uri,
          base64: base64
        };
        
        
        onSendMessage(fileMessage);
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
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <View style={[styles.container, isSmartphone && styles.smartphoneContainer]}>
      <TouchableOpacity onPress={pickDocument}>
        <Ionicons 
          name="attach-outline" 
          size={isSmartphone ? 24 : 30} 
          color={COLORS.lightGray} 
          style={styles.attachIcon}
        />
      </TouchableOpacity>
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
      <TouchableOpacity 
        style={[styles.sendButton, isSmartphone && styles.smartphoneSendButton]}
        onPress={handleSend}
      >
        <Ionicons name="send" size={isSmartphone ? 20 : 24} color={'white'} />
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
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: SIZES.borderRadius.small,
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
    backgroundColor: COLORS.orange,
    borderRadius: SIZES.borderRadius.small,
  },
  smartphoneSendButton: {
    padding: 5,
  },
});