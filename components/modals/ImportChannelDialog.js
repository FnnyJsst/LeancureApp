import React, { useState } from 'react';
import { Modal, View, Text, TextInput, StyleSheet } from 'react-native';
import Button from '../buttons/Button';
// import ChannelsListScreen from '../../screens/ChannelsListScreen';
import TitleModal from '../text/TitleModal';
import ModalInput from '../inputs/ModalInput';

const ImportChannelDialog = ({ visible, onClose, onImport }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [channels, setChannels] = useState([]);

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
            console.log('HTML Response:', data);
            const extractedChannels = parseHtml(data);
            setChannels(extractedChannels);
            console.log('Parsed Channels:', extractedChannels);
            onImport(extractedChannels); 
          } else {
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
    }
  };

  const parseHtml = (html) => {
    const regex = /<a[^>]+class="view"[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
    let match;
    const links = [];

    while ((match = regex.exec(html)) !== null) {
      links.push({ href: match[1], title: match[2] });
    }

    return links;
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
          <TitleModal title="IMPORT CHANNELS" />
          <View style={styles.inputContainer}>
            <Text style={styles.text}>URL</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter URL"
              value={url}
              onChangeText={setUrl}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <View style={styles.buttonContainer}>
            <Button 
              title="Import" 
              onPress={handleDownload} 
              backgroundColor="#FF4500"
              color="white"
              width="35%"
            />
            <Button 
              title="Cancel" 
              onPress={onClose} 
              backgroundColor="#d9d9d9"
              color="black"
              width="35%"
            />
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
    width: '40%',
    height: 240,
    backgroundColor: '#f4f4f4',
    padding: 25,
    paddingTop: 30,
    borderRadius: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 15,
  },
  input: {
    height: 40,
    marginRight: 10,
    width: "85%",
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    backgroundColor: "white",
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
});

export default ImportChannelDialog;