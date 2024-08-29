import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import ModalInput from '../inputs/ModalInput';
import Button from '../buttons/Button';
import { useUrls } from '../../context/UrlContext';
import TitleModal from '../text/TitleModal';

export default function AddChannels({ visible, onClose }) {
  const [url, setUrl] = useState('');
  const { addUrl } = useUrls();

  // Function to check if the URL is valid
  const isValidUrl = (string) => {
    try {
      const url = new URL(string);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (_) {
      return false;
    }
  };
  
  // Function to handle the "Ok" button
  const handleOk = () => {
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }
    
    // If the URL is valid, we add it to the URLs
    if (isValidUrl(formattedUrl)) {
      addUrl(formattedUrl);
      setUrl('');
      onClose();
    } else {
      alert("Veuillez entrer une URL valide");
    }
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
          <TitleModal title="CREATE A NEW CHANNEL" />
          <View style={styles.inputContainer}>
            <Text style={styles.text}>Name</Text>
            <ModalInput placeholder={"Name of the channel"}/>
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.text}>URL</Text>
            <ModalInput 
              value={url} 
              onChangeText={setUrl}
              placeholder={"URL of the channel"}/>
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