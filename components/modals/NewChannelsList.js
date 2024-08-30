import React from 'react';
import { Modal, View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import Button from '../buttons/Button';
import TitleModal from '../text/TitleModal';

const NewChannelsList = ({ visible, onClose, channels, onSelectChannel }) => {
  return (
    <Modal
      transparent={true}
      animationType='slide'
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TitleModal title="NEW CHANNEL LIST" />
          <FlatList
            data={channels}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => onSelectChannel(item)}>
                <Text style={styles.channelName}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
          <Button title="Close" backgroundColor="#d9d9d9" color="black" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#f4f4f4',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  channelName: {
    fontSize: 16,
    marginVertical: 5,
  },
});

export default NewChannelsList;