import React, { useState, useEffect } from 'react';
import { Modal, View, StyleSheet, Text } from 'react-native';
import Button from '../../buttons/Button';
import TitleModal from '../../text/TitleModal';
import InputModal from '../../inputs/InputModal';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { SIZES, COLORS, MODAL_STYLES } from '../../../constants/style';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
/**
 * @component EditWebviewModal
 * @description A component that renders a modal for editing a channel
 * @param {Object} props - The properties of the component
 * @param {boolean} props.visible - Whether the modal is visible
 * @param {Function} props.onClose - The function to call when the modal is closed
 * @param {Function} props.onSave - The function to call when the channel is saved
 * @param {string} props.initialUrl - The initial URL of the channel
 * @param {string} props.initialTitle - The initial title of the channel
 */
export default function EditWebviewModal({ visible, onClose, onSave, initialUrl, initialTitle, testID }) {

  //
  const { t } = useTranslation();
  // We create a hook to determine the device type and orientation
  const { isSmartphone, isTabletLandscape, isSmartphonePortrait, isSmartphoneLandscape, isLowResTablet, isLowResTabletPortrait, isLowResTabletLandscape } = useDeviceType();

  // State management for form inputs
  const [url, setUrl] = useState(initialUrl || '');
  const [title, setTitle] = useState(initialTitle || '');
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const [isUrlFocused, setIsUrlFocused] = useState(false);
  const [error, setError] = useState('');

  /**
   * @function useEffect
   * @description A function to reset the form inputs when the modal is opened
   */
  useEffect(() => {
    if (visible) {
      setUrl(initialUrl || '');
      setTitle(initialTitle || '');
      setError('');
    }
  }, [initialUrl, initialTitle, visible]);

  const validateUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  /**
   * @function handleOk
   * @description A function to handle the form submission
   */
  const handleOk = () => {
    if (!title.trim()) {
      setError(t('errors.titleRequired'));
      return;
    }
    if (!validateUrl(url)) {
      setError(t('errors.invalidUrl'));
      return;
    }
    setError('');
    onSave(url, title);
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
      testID="edit-modal"
    >
      <View style={[
        MODAL_STYLES.modalContainer,
        isSmartphoneLandscape && styles.modalContainerSmartphoneLandscape]}>
        <View style={[
          styles.modalContent,
          isSmartphonePortrait && styles.modalContentSmartphonePortrait,
          isSmartphoneLandscape && styles.modalContentSmartphoneLandscape,
          isTabletLandscape && styles.modalContentTabletLandscape,
          isLowResTabletPortrait && styles.modalContentLowResTabletPortrait,
          isLowResTabletLandscape && styles.modalContentLowResTabletLandscape,
        ]}>
          <TitleModal title={t('modals.webview.edit.editChannel')} />
          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
          <View style={[
            styles.inputContainer,
          ]}>
            <InputModal
              value={title}
              // We update the title state
              onChangeText={setTitle}
              placeholder={t('modals.webview.edit.editTitle')}
              //No need to secure the title
              secureTextEntry={false}
              style={isSmartphone && styles.inputSmartphone}
              onFocus={() => setIsTitleFocused(true)}
              onBlur={() => setIsTitleFocused(false)}
              icon={
                <Ionicons
                  name="text-outline"
                  size={20}
                  color={isTitleFocused ? COLORS.orange : COLORS.gray300}
                />
              }
            />
          </View>
          <View style={[
            styles.inputContainer,
          ]}>
            <InputModal
              value={url}
              // We update the URL state
              onChangeText={setUrl}
              placeholder={t('modals.webview.edit.editUrl')}
              //No need to secure the URL
              secureTextEntry={false}
              style={isSmartphone && styles.inputSmartphone}
              onFocus={() => setIsUrlFocused(true)}
              onBlur={() => setIsUrlFocused(false)}
              icon={
                <Ionicons
                  name="link-outline"
                  size={20}
                  color={isUrlFocused ? COLORS.orange : COLORS.gray300}
                />
              }
            />
          </View>
          <View style={MODAL_STYLES.buttonContainer}>
            <Button
              title={t('buttons.cancel')}
              backgroundColor={COLORS.gray950}
              color={COLORS.gray300}
              width={isSmartphone ? '23%' : isLowResTablet ? '36%' : '30%'}
              onPress={onClose}
              testID="cancel-button"
            />
            <Button
              title={t('buttons.save')}
              backgroundColor={COLORS.orange}
              color={COLORS.white}
              width={isSmartphone ? '23%' : isLowResTablet ? '36%' : '30%'}
              onPress={handleOk}
              testID="save-edit-button"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainerSmartphoneLandscape: {
    paddingTop: '10%',
  },
  modalContent: {
    width: '60%',
    padding: 20,
    backgroundColor: COLORS.gray850,
    borderRadius: SIZES.borderRadius.xxLarge,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  modalContentLowResTabletPortrait: {
    width: '80%',
  },
  modalContentLowResTabletLandscape: {
    width: '50%',
  },
  modalContentTabletLandscape: {
    width: '40%',
  },
  modalContentSmartphonePortrait: {
    width: '95%',
  },
  modalContentSmartphoneLandscape: {
    width: '60%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 15,
  },
  inputSmartphone: {
    marginBottom: 10,
  },
  text: {
    fontSize: SIZES.fonts.subtitleTablet,
    marginBottom: 20,
    color: COLORS.gray600,
  },
  textSmartphone: {
    fontSize: SIZES.fonts.subtitleSmartphone,
    marginBottom: 10,
  },
  errorText: {
    color: COLORS.error,
    marginBottom: 10,
    textAlign: 'center',
  }
});
