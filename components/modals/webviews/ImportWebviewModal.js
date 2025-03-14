import React, { useState } from 'react';
import { Modal, View, StyleSheet, ActivityIndicator } from 'react-native';
import Button from '../../buttons/Button';
import TitleModal from '../../text/TitleModal';
import InputModal from '../../inputs/InputModal';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { SIZES, COLORS, MODAL_STYLES } from '../../../constants/style';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../text/CustomText';
import { useTranslation } from 'react-i18next';
import CustomAlert from './CustomAlert';

/**
 * @component ImportWebviewModal
 * @description A component that renders a modal for importing channels
 *
 * @param {boolean} props.visible - Whether the modal is visible
 * @param {Function} props.onClose - The function to call when the modal is closed
 * @param {Function} props.onImport - The function to call when the channels are imported
 */
const ImportWebviewModal = ({ visible, onClose, onImport, selectedWebviews = [] }) => {

  const { t } = useTranslation();
  // State management for the URL, error and channels
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Customized hook to determine the device type and orientation
  const { isSmartphone, isLowResTablet } = useDeviceType();

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
  const handleDownload = async () => {
    if (!url) {
      setError(t('errors.enterUrl'));
      return;
    }

    if (!validateUrl(url)) {
      setError(t('errors.invalidUrl'));
      return;
    }

    setIsImporting(true);
    setError(''); // Réinitialiser les erreurs précédentes

    try {
      const fullUrl = `${url}/p/mes_getchannelsxml/action/display`;
      const response = await fetch(fullUrl);

      const contentType = response.headers.get('content-type');
      if (!contentType) {
        throw new Error('Content type non défini');
      }

      let data;
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else if (contentType.includes('text/html')) {
        data = await response.text();
      } else {
        throw new Error(`Type de contenu invalide: ${contentType}`);
      }

      if (typeof data === 'string') {
        const extractedChannels = parseHtml(data);

        if (extractedChannels.length === 0) {
          setError(t('errors.noChannelsFound'));
          return;
        }

        const newChannels = extractedChannels.filter(newChannel =>
          !selectedWebviews.some(existingChannel =>
            existingChannel.href === newChannel.href
          )
        );

        if (newChannels.length === 0) {
          setShowAlert(true);
        } else {
          await onImport(newChannels); // Attendre que l'import soit terminé
          onClose();
        }
      } else {
        setError(t('errors.invalidResponseFormat'));
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      setError(t('errors.errorDuringDownload'));
    } finally {
      setIsImporting(false);
    }
  };

  const handleCloseAlert = () => {
    setShowAlert(false);
    handleClose();
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
    <>
      <Modal
        animationType="fade"
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
              isLowResTablet && styles.modalContentLowResTablet,
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
                width={isSmartphone ? '26%' : '29%'}
                disabled={isImporting}
                testID="cancel-import-button"
              />
              <Button
                title={isImporting ? t('buttons.importing') : t('buttons.import')}
                onPress={handleDownload}
                backgroundColor={COLORS.orange}
                width={isSmartphone ? '26%' : '29%'}
                disabled={isImporting}
                icon={isImporting ?
                  <ActivityIndicator size="small" color={COLORS.white} /> :
                  null
                }
                testID="save-import-button"
              />
            </View>
          </View>
        </View>
      </Modal>

      <CustomAlert
        visible={showAlert}
        title={t('alerts.information')}
        message={t('alerts.allChannelsAlreadyImported')}
        onClose={handleCloseAlert}
        onConfirm={handleCloseAlert}
        type="success"
      />
    </>
  );
};


const styles = StyleSheet.create({
  modalContentSmartphone: {
    width: '60%',
  },
  modalContentLowResTablet: {
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
