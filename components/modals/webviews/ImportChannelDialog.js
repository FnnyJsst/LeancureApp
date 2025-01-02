import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import Button from '../../buttons/Button';
import TitleModal from '../../text/TitleModal';
import InputModal from '../../inputs/InputModal';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { SIZES, COLORS, MODAL_STYLES } from '../../../constants/style';

const ImportChannelDialog = ({ visible, onClose, onImport }) => {
  // State management
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [channels, setChannels] = useState([]);

    const { 
      isTablet,
      isSmartphone,
      isSmartphoneLandscape,
      isTabletPortrait 
    } = useDeviceType();

  // URL validation using regex
  const validateUrl = (url) => {
    const pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|'+ // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
      '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return !!pattern.test(url);
  };

  // Handle URL input change
  const handleUrlChange = (newUrl) => {
    setUrl(newUrl);
    setError(''); // Reset error when user types
  };

  // Parse HTML to extract channels links and titles
  const parseHtml = (html) => {
    const regex = /<a[^>]+class="view"[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
    let match;
    const links = [];

    // Extract the links and titles from the HTML
    while ((match = regex.exec(html)) !== null) {
      links.push({ href: match[1], title: match[2] });
    }

    // Return the links and titles
    return links;
  };


  // Handle download of channels from URL
  const handleDownload = () => {
    if (!url) {
      setError('Please enter an URL');
      return;
    }

    // Validate the URL
    if (!validateUrl(url)) {
      setError('Invalid URL.');
      return;
    }

    // Build the full URL
    const fullUrl = `${url}/p/mes_getchannelsxml/action/display`;
    fetch(fullUrl)
      .then(response => {
        // Get the content type
        const contentType = response.headers.get('content-type');
        // If the content type is JSON, return the JSON
        if (contentType && contentType.includes('application/json')) {
          return response.json();
        // If the content type is HTML, return the HTML
        } else if (contentType && contentType.includes('text/html')) {
          return response.text();
        } else {
          throw new Error(`Invalid content type: ${contentType}`);
        }
      })
      .then(data => {
        // If the data is a string, extract the channels links and titles
        if (typeof data === 'string') {
          const extractedChannels = parseHtml(data);
          setChannels(extractedChannels);
          // If no channels are found, set the error message
          if (extractedChannels.length === 0) {
            setError('No channels found at this URL');
            return;
          }
          // Import the channels
          onImport(extractedChannels);
          onClose();
        } else {
          setError('Invalid response format');
        }
      })
      .catch(error => {
        console.error(error);
        setError(`Error during the download of channels: ${error.message}`);
      });
  };

  // Handle modal close
  const handleClose = () => {
    setUrl('');
    setError('');
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <View style={MODAL_STYLES.modalContainer}>
        <View style={[
            MODAL_STYLES.content,
            isSmartphone && styles.modalContentSmartphone,
            isSmartphoneLandscape && styles.modalContentSmartphoneLandscape,
            isTabletPortrait && styles.modalContentTabletPortrait
          ]}>
          <TitleModal title="Import channels"/>
          <InputModal
            placeholder="Enter an URL to import channels"
            value={url}
            onChangeText={handleUrlChange}
            secureTextEntry={false}
          />
          {error ? (
            <View style={[
              styles.errorContainer
            ]}>
              <Text style={[
                styles.errorText,
                isSmartphone && styles.errorTextSmartphone
              ]}>{error}</Text>
            </View>
          ) : null}
          <View style={[
            MODAL_STYLES.buttonContainer,
            isSmartphone && styles.buttonContainerSmartphone,
          ]}>
            <Button 
              title="Cancel" 
              onPress={handleClose}
              backgroundColor={COLORS.gray650}
              color={COLORS.white}
              width="20%"
            />
            <Button 
              title="Import" 
              onPress={handleDownload}
              backgroundColor={COLORS.orange}
              color={COLORS.white}
              width="20%"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};


const styles = StyleSheet.create({
  //Content styles
  modalContentSmartphone: {
    width: '95%',
  },
  modalContentSmartphoneLandscape: {
    width: '50%',
  },
  modalContentTabletPortrait: {
    width: '60%',
  },

  //Error styles
  errorContainer: {
    alignItems: 'flex-start',
    paddingHorizontal: '5%',
    marginTop: 10,
  },
  errorText: {
    color: COLORS.error,
    fontSize: SIZES.fonts.errorText,
  },
  errorTextSmartphone: {
    fontSize: SIZES.fonts.errorText,
  },
});

export default ImportChannelDialog;