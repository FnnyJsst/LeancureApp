import React, { useState } from 'react';
import { Modal, View, Text, TextInput, StyleSheet, Alert, Animated } from 'react-native';
import TitleModal from '../text/TitleModal';
import Button from '../buttons/Button';
import HTMLParser from 'react-native-html-parser';

const ImportChannelDialog = ({ visible, onClose }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const shakeAnimation = new Animated.Value(0);

  const validateUrl = (url) => {
    const pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|'+ // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
      '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return !!pattern.test(url);
  };

  const handleDownload = () => {
    if (url && validateUrl(url)) {
      const fullUrl = `${url}/p/mes_getchannelsxml/action/display`;
      fetch(fullUrl)
        .then(response => {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            return response.json();
          } else if (contentType && contentType.includes('text/html')) {
            return response.text();
          } else {
            throw new Error(`Invalid content type: ${contentType}`);
          }
        })
        .then(data => {
          if (typeof data === 'string') {
            // Traitez les données HTML ici
            console.log('HTML Response:', data);
            const channels = parseHtml(data);
            console.log('Parsed Channels:', channels);
            // Vous pouvez utiliser un parseur HTML pour extraire les informations nécessaires
          } else {
            // Traitez les données JSON ici
            console.log('JSON Response:', data);
          }
          onClose();
        })
        .catch(error => {
          console.error(error);
          setError(`Erreur lors du téléchargement des channels: ${error.message}`);
        });
    } else {
      setError('URL invalide.');
      Animated.sequence([
        Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: -10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start();
    }
  };

  const parseHtml = (html) => {
    const channels = [];
    const parser = new HTMLParser.DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const links = doc.getElementsByTagName('a');
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const title = link.getAttribute('titre');
      const href = link.getAttribute('href');
      if (title && href) {
        channels.push({ title, href });
      }
    }
    return channels;
  };

  return (
    <Modal 
      visible={visible} 
      transparent={true} 
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <TitleModal title="IMPORT CHANNELS" />
          <TextInput
            style={styles.input}
            placeholder="Paste URL or IP here"
            value={url}
            onChangeText={setUrl}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.buttonContainer}>
            <Animated.View style={{ transform: [{ translateX: shakeAnimation }] }}>
            <Button title="Import" backgroundColor="#FF4500" color="white" onPress={onClose} style={styles.importButton} />
            </Animated.View>
            <Button title="Cancel" backgroundColor="#d9d9d9" color="black" onPress={onClose} style={styles.cancelButton} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 400,
    padding: 20,
    backgroundColor: '#f4f4f4',
    borderRadius: 10,
    alignItems: 'center',
  },
  input: {
    width: '100%',
    padding: 10,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
  },
  importButton: {
    width: '50%', // Largeur de 40% pour le bouton "Import"
    marginVertical: 10,
  },
  cancelButton: {
    width: '50%', // Largeur de 40% pour le bouton "Cancel"
    marginVertical: 10,
  },
});

export default ImportChannelDialog;