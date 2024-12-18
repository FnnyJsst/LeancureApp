import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../assets/styles/constants';
import { useDeviceType } from '../../hooks/useDeviceType';
import * as DocumentPicker from 'expo-document-picker';

export default function InputChatWindow() {
  
  const { isSmartphone, isTablet } = useDeviceType();

  const [message, setMessage] = useState('');

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
      });

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        console.log('Fichier sélectionné:', file);
        //UPLOAD FILE LOGIC : 
      }
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <View style={[
      styles.container, 
      isSmartphone && styles.smartphoneContainer, 
      isTablet && styles.tabletContainer
    ]}>
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
      />
      <TouchableOpacity style={[styles.sendButton, isSmartphone && styles.smartphoneSendButton]}>
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