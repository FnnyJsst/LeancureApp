import React, { useState } from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import Button from '../../buttons/Button';
import TitleModal from '../../text/TitleModal';
import InputModal from '../../inputs/InputModal';
import CustomAlert from '../../CustomAlert';
import { useDeviceType } from '../../../hooks/useDeviceType'; 
import { COLORS, MODAL_STYLES } from '../../../constants/style';

export default function PasswordModal({ visible, onClose, onSubmitPassword, onDisablePassword }) {
  const { isSmartphone, isSmartphoneLandscape, isTabletPortrait } = useDeviceType();

  // State management
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'error'
  });

  // Show custom alert
  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ title, message, type });
    setAlertVisible(true);
  };

  // Handle password validation and submission
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

  // Handle alert confirmation
  const handleAlertConfirm = () => {
    if (alertConfig.type === 'success') {
      onSubmitPassword(password);
      onClose();
      setPassword('');
      setConfirmPassword('');
    }
    setAlertVisible(false);
  };

  // Handle modal close
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
              isTabletPortrait && styles.modalContentTabletPortrait
            ]}>
            <TitleModal title="Enter password" />
            <View style={[
              styles.inputContainer,
              isSmartphone && styles.inputContainerSmartphone
            ]}>
              <InputModal
                placeholder="Enter a password (6 or more characters)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
              />
              <InputModal
                placeholder="Re-enter password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={true}
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
                width="28%"
              />
              <Button
                title="Ok"
                backgroundColor={COLORS.orange}
                color={COLORS.white}
                onPress={handleOkPress}
                width="20%"
              />
              <Button
                title="Close"
                backgroundColor={COLORS.gray650}
                color={COLORS.white}
                onPress={handleClose}
                width="20%"
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
});