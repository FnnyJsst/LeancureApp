import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import Button from './buttons/Button';
import TitleModal from './text/TitleModal';
import { useDeviceType } from '../hooks/useDeviceType';
import { SIZES,COLORS } from '../constants/style';

export default function CustomAlert({ visible, title, message, onClose, onConfirm, type = 'error' }) {
  const { isSmartphonePortrait, isSmartphoneLandscape, isTabletPortrait } = useDeviceType();

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      statusBarTranslucent={true}
    >
      <View style={styles.modalContainer}>
        <View style={[
          styles.modalContent,
          isSmartphonePortrait && styles.modalContentSmartphonePortrait,
          isSmartphoneLandscape && styles.modalContentSmartphoneLandscape,
          isTabletPortrait && styles.modalContentTabletPortrait
        ]}>
          <TitleModal title={title} />
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonContainer}>
            {type === 'success' ? (
              <Button
                title="OK"
                backgroundColor={COLORS.orange}
                color={COLORS.white}
                width="20%"
                onPress={onConfirm}
              />
            ) : (
              <Button
                title="Close"
                backgroundColor={COLORS.buttonGray}
                color={COLORS.white}
                width="20%"
                onPress={onClose}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 1)',
  },
  modalContent: {
    width: '30%',
    padding: 20,
    backgroundColor: COLORS.gray900,
    borderRadius: SIZES.borderRadius.xLarge,
  },
  modalContentSmartphoneLandscape: {
    width: '40%',
  },
  modalContentSmartphonePortrait: {
    width: '80%',
  },
  modalContentTabletPortrait: {
    width: '50%',
  },
  message: {
    color: COLORS.gray300,
    fontSize: SIZES.fonts.small,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
});