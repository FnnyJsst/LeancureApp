import React, { useState } from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import Button from '../../buttons/Button';
import InputModal from '../../inputs/InputModal';
import TitleModal from '../../text/TitleModal';
import CustomAlert from '../../CustomAlert';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { COLORS, MODAL_STYLES } from '../../../constants/style';

export default function PasswordCheckModal({ visible, onClose, onSubmit }) {

  // Customized hook to determine the device type and orientation
  const { isSmartphone, isSmartphoneLandscape, isTabletPortrait } = useDeviceType(); 

  // State for the password and the alert
  const [password, setPassword] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'error'
  });

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
    onSubmit(password);
  };

  // Function to close the modal, reset the password and call the onClose function
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
                backgroundColor={COLORS.gray650}
                color={COLORS.white}
                // We close the modal
                onPress={handleClose}
                width="20%"
              />
              <Button
                title="Ok"
                backgroundColor={COLORS.orange}
                color={COLORS.white}
                // We send the password to the parent component
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