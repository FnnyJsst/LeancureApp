import React, { useState } from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import Button from '../../buttons/Button';
import TitleModal from '../../text/TitleModal';
import InputModal from '../../inputs/InputModal';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { SIZES, COLORS, MODAL_STYLES } from '../../../constants/style';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../text/CustomText';
import { useTranslation } from 'react-i18next';

/**
 * @component ImportWebviewModal
 * @description A component that renders a modal for importing channels
 *
 * @param {Object} props - The properties of the component
 * @param {boolean} props.visible - Whether the modal is visible
 * @param {Function} props.onClose - The function to call when the modal is closed
 * @param {Function} props.onImport - The function to call when the channels are imported
 *
 * @example
 * <ImportWebviewModal visible={visible} onClose={() => console.log('Modal closed')} onImport={() => console.log('Channels imported')} />
 */
const ImportWebviewModal = ({ visible, onClose, onImport, testID }) => {
  const { t } = useTranslation();
  // State management for the URL, error and channels
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Customized hook to determine the device type and orientation
  const { isSmartphone, isSmartphoneLandscape, isTabletPortrait } = useDeviceType();

  /**
   * @function validateUrl
   * @description A function to validate the URL
   * @param {string} urlToValidate - The URL to validate
   * @returns {boolean} - Whether the URL is valid
   */
  const validateUrl = (urlToValidate) => {
    const pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|' + // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return !!pattern.test(urlToValidate);
  };

  /**
   * @function handleUrlChange
   * @description A function to handle the URL input change
   * @param {string} newUrl - The new URL
   */
  const handleUrlChange = (newUrl) => {
    setUrl(newUrl);
    setError(''); // Reset error when user types
  };

  /**
   * @function parseHtml
   * @description A function to parse the HTML to extract channels links and titles
   * @param {string} html - The HTML to parse
   * @returns {Array} - The links and titles
   */
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

  /**
   * @function handleDownload
   * @description A function to handle the download of channels from URL
   */
  const handleDownload = () => {
    if (!url) {
      setError('Please enter an URL');
      return;
    }

    // Validate the URL
    if (!validateUrl(url)) {
      setError('Invalid URL');
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
      .catch(fetchError => {
        setError(`Error during the download of channels: ${fetchError.message}`);
      });
  };

  /**
   * @function handleClose
   * @description A function to handle the modal close
   */
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
      testID="import-modal"
    >
      <View style={MODAL_STYLES.modalContainer}>
        <View style={[
            MODAL_STYLES.content,
            isSmartphone && styles.modalContentSmartphone,
            isSmartphoneLandscape && styles.modalContentSmartphoneLandscape,
            isTabletPortrait && styles.modalContentTabletPortrait,
          ]}>
          <TitleModal title={t('modals.webview.import.importChannels')}/>
          <InputModal
            placeholder={t('modals.webview.import.importUrl')}
            value={url}
            onChangeText={handleUrlChange}
            // We set the secureTextEntry to false so the user can see the URL
            secureTextEntry={false}
            icon={
              <Ionicons
                name="link-outline"
                size={20}
                color={isFocused ? COLORS.orange : COLORS.gray300}
              />
            }
          />
          {error ? (
            <View style={[
              styles.errorContainer,
            ]}>
              <Text style={[
                styles.errorText,
                isSmartphone && styles.smallTextSmartphone,
              ]}>{error}</Text>
            </View>
          ) : null}
          <View style={[
            MODAL_STYLES.buttonContainer,
          ]}>
            <Button
              title={t('buttons.cancel')}
              onPress={handleClose}
              backgroundColor={COLORS.gray950}
              textColor={COLORS.gray300}
              width={isSmartphone ? '23%' : '26%'}
              testID="cancel-import-button"
            />
            <Button
              title={t('buttons.import')}
              onPress={handleDownload}
              backgroundColor={COLORS.orange}
              width={isSmartphone ? '23%' : '26%'}
              testID="save-import-button"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};


const styles = StyleSheet.create({
  modalContentSmartphone: {
    width: '95%',
  },
  modalContentSmartphoneLandscape: {
    width: '50%',
  },
  modalContentTabletPortrait: {
    width: '60%',
  },

  errorContainer: {
    alignItems: 'flex-start',
    paddingHorizontal: '5%',
    marginTop: 10,
  },
  errorText: {
    color: COLORS.red,
    fontSize: SIZES.fonts.errorText,
  },
  smallTextSmartphone: {
    fontSize: SIZES.fonts.errorText,
  },
});

export default ImportWebviewModal;
