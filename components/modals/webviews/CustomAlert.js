import React from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import Button from '../../../components/buttons/Button';
import TitleModal from '../../../components/text/TitleModal';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { SIZES,COLORS } from '../../../constants/style';
import { Text } from '../../text/CustomText';

/**
 * @component CustomAlert
 * @description A component that renders a custom alert
 *
 * @param {Object} props - The properties of the component
 * @param {boolean} props.visible - Whether the alert is visible
 * @param {string} props.title - The title of the alert
 * @param {string} props.message - The message of the alert
 * @param {Function} props.onClose - The function to call when the alert is closed
 * @param {Function} props.onConfirm - The function to call when the alert is confirmed
 * @param {string} props.type - The type of the alert
 *
 * @example
 * <CustomAlert visible={true} title="Alert" message="This is an alert" onClose={() => console.log('Alert closed')} onConfirm={() => console.log('Alert confirmed')} type="error" />
 */
export default function CustomAlert({ visible, title, message, onClose, onConfirm, type = 'error' }) {
  const { isSmartphone, isSmartphonePortrait, isLandscape, isTabletPortrait } = useDeviceType();

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
          isLandscape && styles.modalContentLandscape,
          isTabletPortrait && styles.modalContentTabletPortrait,
        ]}>
          <TitleModal title={title} />
          <Text style={[styles.message, isSmartphone && styles.messageSmartphone]}>{message}</Text>
          <View style={styles.buttonContainer}>
            {type === 'success' ? (
              <Button
                title="OK"
                backgroundColor={COLORS.orange}
                color={COLORS.white}
                width="22%"
                onPress={onConfirm}
              />
            ) : (
              <Button
                title="Close"
                backgroundColor={COLORS.buttonGray}
                color={COLORS.white}
                width="22%"
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
    width: '60%',
    padding: 20,
    backgroundColor: COLORS.gray850,
    borderRadius: SIZES.borderRadius.xLarge,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  modalContentLandscape: {
    width: '40%',
  },
  modalContentSmartphonePortrait: {
    width: '80%',
  },
  message: {
    color: COLORS.gray300,
    fontSize: SIZES.fonts.textTablet,
    textAlign: 'center',
  },
  messageSmartphone: {
    fontSize: SIZES.fonts.textSmartphone,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
});
