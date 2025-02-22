import React, { useState } from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import Button from '../../buttons/Button';
import InputModal from '../../inputs/InputModal';
import TitleModal from '../../text/TitleModal';
import CustomAlert from './CustomAlert';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { COLORS, MODAL_STYLES } from '../../../constants/style';
import { Ionicons } from '@expo/vector-icons';

/**
 * @component PasswordCheckModal
 * @description A component that renders a modal for checking the password
 *
 * @param {Object} props - The properties of the component
 * @param {boolean} props.visible - Whether the modal is visible
 * @param {Function} props.onClose - The function to call when the modal is closed
 * @param {Function} props.onSubmit - The function to call when the password is submitted
 * @param {boolean} props.isFocused - Whether the input is focused
 *
 * @example
 * <PasswordCheckModal visible={visible} onClose={() => console.log('Modal closed')} onSubmit={() => console.log('Password submitted')} isFocused={true} />
 */
export default function PasswordCheckModal({ visible, onClose, onSubmit, isFocused }) {

  // Customized hook to determine the device type and orientation
  const { isSmartphone, isSmartphoneLandscape, isTabletPortrait } = useDeviceType();

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
        title: 'Error',
        message: 'Please enter a password',
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
            isTabletPortrait && styles.modalContentTabletPortrait,
          ]}>
            <TitleModal title="Enter password" />
            <InputModal
              placeholder="Enter your password"
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
                title="Cancel"
                backgroundColor={COLORS.gray650}
                color={COLORS.white}
                onPress={handleClose}
                width="22%"
              />
              <Button
                title="Ok"
                backgroundColor={COLORS.orange}
                color={COLORS.white}
                onPress={handleSubmit}
                width="22%"
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
});
