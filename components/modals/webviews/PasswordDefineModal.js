import React, { useState } from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import Button from '../../buttons/Button';
import TitleModal from '../../text/TitleModal';
import InputModal from '../../inputs/InputModal';
import CustomAlert from './CustomAlert';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { COLORS, MODAL_STYLES } from '../../../constants/style';
import { Ionicons } from '@expo/vector-icons';

/**
 * @component PasswordDefineModal
 * @description A component that renders a modal for setting a password
 *
 * @param {Object} props - The properties of the component
 * @param {boolean} props.visible - Whether the modal is visible
 * @param {Function} props.onClose - The function to call when the modal is closed
 * @param {Function} props.onSubmitPassword - The function to call when the password is submitted
 * @param {Function} props.onDisablePassword - The function to call when the password is disabled
 *
 * @example
 * <PasswordDefineModal visible={visible} onClose={() => console.log('Modal closed')} onSubmitPassword={() => console.log('Password submitted')} onDisablePassword={() => console.log('Password disabled')} />
 */
export default function PasswordDefineModal({ visible, onClose, onSubmitPassword, onDisablePassword, testID  }) {

  // Customized hook to determine the device type and orientation
  const { isSmartphone, isSmartphoneLandscape, isTabletPortrait } = useDeviceType();

  // State management for the password and the alert
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'error',
  });
  const [isFocused, setIsFocused] = useState(false);

  /**
   * @function showAlert
   * @description A function to show the custom alert
   * @param {string} title - The title of the alert
   * @param {string} message - The message of the alert
   * @param {string} type - The type of the alert
   */
  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ title, message, type });
    setAlertVisible(true);
  };

  /**
   * @function handleOkPress
   * @description A function to handle the password validation and submission
   */
  const handleOkPress = () => {
    //Check if password is at least 6 characters
    if (password.length < 6) {
      showAlert('Error', 'Password must contain at least 6 characters');
      return;
    }

    //Check if passwords match
    if (password === confirmPassword) {
      showAlert('Success', 'Password has been set successfully', 'success');
    } else {
      showAlert('Error', 'Passwords do not match');
    }
  };

  /**
   * @function handleAlertConfirm
   * @description A function to handle the alert confirmation
   */
  const handleAlertConfirm = () => {
    if (alertConfig.type === 'success') {
      onSubmitPassword(password);
      onClose();
      setPassword('');
      setConfirmPassword('');
    }
    setAlertVisible(false);
  };

  /**
   * @function handleClose
   * @description A function to handle the modal close, reset the password
   */
  const handleClose = () => {
    onClose();
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <>
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={handleClose}
        statusBarTranslucent={true}
        testID="password-define-modal"
      >
        <View style={[
          MODAL_STYLES.modalContainer,
          isSmartphone && MODAL_STYLES.modalContainerSmartphone,
          isSmartphoneLandscape && MODAL_STYLES.modalContainerSmartphoneLandscape,
        ]}>
          <View style={[
              MODAL_STYLES.content,
              isSmartphone && styles.modalContentSmartphone,
              isSmartphoneLandscape && styles.modalContentSmartphoneLandscape,
              isTabletPortrait && styles.modalContentTabletPortrait,
            ]}>
            <TitleModal title="Enter password" />
            <View style={[
              styles.inputContainer,
              isSmartphone && styles.inputContainerSmartphone,
            ]}>
              <InputModal
                placeholder="Enter a password (6+ chars)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                testID="password-input"
                icon={
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={isFocused ? COLORS.orange : COLORS.gray300}
                    style={styles.icon}
                  />
                }
              />
              <InputModal
                placeholder="Re-enter password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
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
            </View>
            <View style={MODAL_STYLES.buttonContainer}>
              <Button
                title="Do not use"
                backgroundColor={COLORS.gray650}
                color={COLORS.white}
                onPress={() => {
                  onDisablePassword();
                  handleClose();
                }}
                width={isSmartphone ? '28%' : '32%'}
                testID="disable-password-button"
              />
              <Button
                title="Ok"
                backgroundColor={COLORS.orange}
                color={COLORS.white}
                onPress={handleOkPress}
                width={isSmartphone ? '20%' : '22%'}
              />
              <Button
                title="Close"
                backgroundColor={COLORS.gray650}
                color={COLORS.white}
                onPress={handleClose}
                width={isSmartphone ? '20%' : '22%'}
                testID="close-password-button"
              />
            </View>
          </View>
        </View>
      </Modal>
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertVisible(false)}
        onConfirm={handleAlertConfirm}
        testID={testID}
      />
    </>
  );
}

const styles = StyleSheet.create({
  //Container styles
  modalContainerSmartphone: {
    paddingBottom: 'auto',
  },

  //Content styles
  modalContentSmartphone: {
    width: '95%',
    padding: 15,
  },
  modalContentSmartphoneLandscape: {
    width: '50%',
  },
  modalContentTabletPortrait: {
    width: '60%',
    padding: 20,
  },

  //Input styles
  inputContainer: {
    gap: 15,
  },
  inputContainerSmartphone: {
    marginTop: 10,
},
  icon: {
    marginRight: 10,
  },
});
