import { useState } from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import ModalInput from '../inputs/ModalInput';
import Button from '../buttons/Button';
import TitleModal from '../text/TitleModal';

export default function EditChannel({ visible, onClose, onSave, initialUrl, initialTitle }) {
  const [url, setUrl] = useState(initialUrl || '');
  const [title, setTitle] = useState(initialTitle || '');

  // Function to handle the "Ok" button
  const handleOk = () => {
    onSave(url, title);
    setUrl('');
    setTitle('');
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <TitleModal title="EDIT A CHANNEL" />
          <View style={styles.inputContainer}>
            <Text style={styles.text}>Name</Text>
            <ModalInput value={title} onChangeText={setTitle} />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.text}>URL</Text>
            <ModalInput value={url} onChangeText={setUrl} />
          </View>
          <View style={styles.buttonContainer}>
            <Button title="Ok" backgroundColor="#FF4500" color="white" onPress={handleOk} />
            <Button title="Cancel" backgroundColor="#d9d9d9" color="black" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: 400,
    padding: 20,
    backgroundColor: '#f4f4f4',
    borderRadius: 10,
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
  },
  text: {
    fontSize: 16,
    marginRight: 10,
    marginTop: 8,
    marginLeft: 0,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
  },
});