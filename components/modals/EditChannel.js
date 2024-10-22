import { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TextInput } from 'react-native';
import Button from '../buttons/Button';
import TitleModal from '../text/TitleModal';

export default function EditChannel({ visible, onClose, onSave, initialUrl, initialTitle }) {
  const [url, setUrl] = useState(initialUrl || '');
  const [title, setTitle] = useState(initialTitle || '');

  // Met à jour les états lorsque les valeurs initiales changent
  useEffect(() => {
    if (visible) {
      setUrl(initialUrl || '');
      setTitle(initialTitle || '');
    }
  }, [initialUrl, initialTitle, visible]);

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
            <TextInput value={title} onChangeText={setTitle} style={styles.titleInput} />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.text}>URL</Text>
            <TextInput value={url} onChangeText={setUrl} style={styles.urlInput} />
          </View>
          <View style={styles.buttonContainer}>
            <Button title="Ok" backgroundColor="#FF4500" color="white" width="25%" onPress={handleOk} />
            <Button title="Cancel" backgroundColor="#d9d9d9" color="black" width="25%" onPress={onClose} />
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
    width: '50%',
    padding: 20,
    backgroundColor: '#f4f4f4',
    borderRadius: 10,
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '80%',
    marginTop: 15,
  },
  titleInput: {
    height: 40,
    width: "80%",
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    marginRight: 20,
    backgroundColor: "white",
  },
  urlInput: {
    height: 40,
    width: "80%",
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    marginRight: 20,
    backgroundColor: "white",
  },
  text: {
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginTop: 20,
  },
});