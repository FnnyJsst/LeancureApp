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

/**
 * @component ImportFullUrlModal
 * @description A component that renders a modal for importing a full URL
 * @param {Object} props - The properties of the component
 * @param {boolean} props.visible - Whether the modal is visible
 * @param {Function} props.onClose - The function to call when the modal is closed
 * @param {Function} props.onImport - The function to call when the URL is imported
 */
const ImportFullUrlModal = ({ visible, onClose, onImport, testID }) => {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const { isSmartphone, isSmartphoneLandscape, isTabletPortrait, isLowResTabletPortrait } = useDeviceType();

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
   * @function handleImport
   * @description A function to handle the import of the URL
   */
  const handleImport = async () => {
    console.log('[ImportFullUrlModal] Début de l\'importation avec URL:', url);

    if (!url) {
      console.log('[ImportFullUrlModal] Erreur: URL vide');
      setError(t('errors.enterUrl'));
      return;
    }

    if (!validateUrl(url)) {
      console.log('[ImportFullUrlModal] Erreur: URL invalide');
      setError(t('errors.invalidUrl'));
      return;
    }

    setIsImporting(true);
    setError('');

    try {
      console.log('[ImportFullUrlModal] Tentative d\'importation...');
      await onImport(url);
      console.log('[ImportFullUrlModal] Import réussi');
      handleClose();
    } catch (error) {
      console.error('[ImportFullUrlModal] Erreur détaillée:', error);
      console.error('[ImportFullUrlModal] Stack trace:', error.stack);
      setError(t('errors.errorDuringImport'));
    } finally {
      setIsImporting(false);
    }
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
            isLowResTabletPortrait && styles.modalContentLowResTabletPortrait,
            isSmartphone && styles.modalContentSmartphone,
            isSmartphoneLandscape && styles.modalContentSmartphoneLandscape,
            isTabletPortrait && styles.modalContentTabletPortrait,
          ]}>
          <TitleModal title={t('modals.webview.import.importFullUrl')}/>
          <InputModal
            placeholder={t('modals.webview.import.importUrl')}
            value={url}
            onChangeText={handleUrlChange}
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
            <View style={styles.errorContainer}>
              <Text style={[
                styles.errorText,
                isSmartphone && styles.smallTextSmartphone,
              ]}>{error}</Text>
            </View>
          ) : null}
          <View style={MODAL_STYLES.buttonContainer}>
            <Button
              title={t('buttons.cancel')}
              onPress={handleClose}
              backgroundColor={COLORS.gray950}
              textColor={COLORS.gray300}
              width={isSmartphone ? '23%' : '26%'}
              testID="cancel-import-button"
            />
            <Button
              title={isImporting ? t('buttons.importing') : t('buttons.import')}
              onPress={handleImport}
              backgroundColor={COLORS.orange}
              width={isSmartphone ? '27%' : '29%'}
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
  );
};

const styles = StyleSheet.create({
  modalContentSmartphone: {
    width: '95%',
  },
  modalContentLowResTabletPortrait: {
    width: '30%',
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

export default ImportFullUrlModal;