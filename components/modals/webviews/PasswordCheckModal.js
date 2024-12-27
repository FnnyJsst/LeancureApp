import React, { useState } from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import Button from '../../buttons/Button';
import InputModal from '../../inputs/InputModal';
import TitleModal from '../../text/TitleModal';
import CustomAlert from '../../CustomAlert';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { SIZES, COLORS, MODAL_STYLES } from '../../../constants/style';

export default function PasswordCheckModal({ visible, onClose, onSubmit }) {
  const { isSmartphone, isSmartphoneLandscape, isTabletPortrait } = useDeviceType(); 

  // State for the password and the alert
  const [password, setPassword] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'error'
  });

  // Show the alert
  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ title, message, type });
    setAlertVisible(true);
  };

  // Handle the submit button
  const handleSubmit = () => {
    if (!password) {
      setAlertConfig({
        title: 'Error',
        message: 'Please enter a password',
        type: 'error'
      });
      setAlertVisible(true);
      return;
    }

    onSubmit(password, (isValid) => {
      if (isValid) {
        setPassword('');
        onClose();
      } else {
        setAlertConfig({
          title: 'Error',
          message: 'Invalid password',
          type: 'error'
        });
        setAlertVisible(true);
      }
    });
  };

  // Handle the close button
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
            isTabletPortrait && styles.modalContentTabletPortrait
          ]}>
            <TitleModal title="Enter password" />
            <InputModal
              placeholder="Enter your password to access settings"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={true}
            />
            <View style={MODAL_STYLES.buttonContainer}>
              <Button
                title="Cancel"
                backgroundColor={COLORS.buttonGray}
                color="white"
                onPress={handleClose}
                width="20%"
              />
              <Button
                title="Ok"
                backgroundColor={COLORS.orange}
                color="white"
                onPress={handleSubmit}
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
    width: '60%',
  },
});