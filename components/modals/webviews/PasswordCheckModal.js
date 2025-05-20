import React, { useState } from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import Button from '../../buttons/Button';
import InputModal from '../../inputs/InputModal';
import TitleModal from '../../text/TitleModal';
import CustomAlert from './CustomAlert';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { COLORS, MODAL_STYLES } from '../../../constants/style';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

/**
 * @component PasswordCheckModal
 * @description A component that renders a modal for checking the password
 * @param {boolean} props.visible - Whether the modal is visible
 * @param {Function} props.onClose - The function to call when the modal is closed
 * @param {Function} props.onSubmit - The function to call when the password is submitted
 * @param {boolean} props.isFocused - Whether the input is focused
 */
export default function PasswordCheckModal({ visible, onClose, onSubmit, isFocused }) {

  // Translation
  const { t } = useTranslation();
  // Customized hook to determine the device type and orientation
  const { isSmartphone, isSmartphoneLandscape, isTabletPortrait, isLowResTablet, isLowResTabletPortrait, isLowResTabletLandscape } = useDeviceType();

  // State for the password and the alert
  const [password, setPassword] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'error',
  });

  /**
   * @function handleSubmit
   * @description A function to handle the submit button
   */
  const handleSubmit = () => {
    // If the password is empty, we show an error message
    if (!password) {
      setAlertConfig({
        message: t('errors.enterPassword'),
        type: 'error',
      });
      setAlertVisible(true);
      return;
    }
    onSubmit(password);
  };

  /**
   * @function handleClose
   * @description A function to handle the close button
   */
  const handleClose = () => {
    setPassword('');
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
      >
        <View style={MODAL_STYLES.modalContainer}>
          <View style={[
            MODAL_STYLES.content,
            isSmartphone && styles.modalContentSmartphone,
            isSmartphoneLandscape && styles.modalContentSmartphoneLandscape,
            isTabletPortrait && styles.modalContentTabletPortrait,
            isLowResTabletPortrait && styles.modalContentLowResTabletPortrait,
            isLowResTabletLandscape && styles.modalContentLowResTabletLandscape,
          ]}>
            <TitleModal title={t('modals.webview.password.enterPassword')} />
            <InputModal
              placeholder={t('modals.webview.password.enterYourPassword')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={true}
              icon={
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={isFocused ? COLORS.orange : COLORS.gray300}
                  style={styles.icon}
                />
              }
            />
            <View style={MODAL_STYLES.buttonContainer}>
              <Button
                title={t('buttons.close')}
                backgroundColor={COLORS.gray650}
                color={COLORS.white}
                onPress={handleClose}
                width={isSmartphone ? '23%' : '26%'}
              />
              <Button
                title="Ok"
                backgroundColor={COLORS.orange}
                color={COLORS.white}
                onPress={handleSubmit}
                width={isSmartphone ? '23%' : '26%'}
              />
            </View>
          </View>
        </View>
      </Modal>
      <CustomAlert
        visible={alertVisible}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertVisible(false)}
        onConfirm={() => setAlertVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  //Content styles
  modalContentSmartphone: {
    width: '95%',
  },
  modalContentSmartphoneLandscape: {
    width: '45%',
  },
  modalContentTabletPortrait: {
    width: '65%',
  },
  modalContentLowResTabletPortrait: {
    width: '80%',
  },
  modalContentLowResTabletLandscape: {
    width: '50%',
  },
});
