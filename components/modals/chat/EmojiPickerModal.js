import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity } from 'react-native';
import EmojiSelector from 'react-native-emoji-selector';
import { COLORS } from '../../../constants/style';
import { Ionicons } from '@expo/vector-icons';

export default function EmojiPickerModal({ visible, onClose, onEmojiSelect }) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onClose}
          >
            <Ionicons 
              name="close-circle" 
              size={24} 
              color={COLORS.gray300} 
            />
          </TouchableOpacity>
          <EmojiSelector
            onEmojiSelected={emoji => onEmojiSelect(emoji)}
            theme={COLORS.gray800}
            showSearchBar={false}
            columns={8}
            showHistory={true}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    backgroundColor: COLORS.gray800,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 40,
    height: '50%',
  },
  closeButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    zIndex: 1,
  },
}); 