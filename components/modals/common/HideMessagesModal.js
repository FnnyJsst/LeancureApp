import React, { useState } from 'react';
import { View, Modal, StyleSheet } from 'react-native';
import Button from '../../buttons/Button';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { SIZES, COLORS } from '../../../constants/style';
import { Text } from '../../text/CustomText';
import { useTranslation } from 'react-i18next';
import CustomAlert from '../webviews/CustomAlert';

/**
 * @component HideMessagesModal
 * @description A component that renders a modal for hiding the messages section from the app menu
 * @param {boolean} props.visible - Whether the modal is visible
 * @param {Function} props.onClose - The function to call when the modal is closed
 * @param {Function} props.onToggleHideMessages - The function to call when the hide messages mode is toggled
 */
export default function HideMessagesModal({ visible, onClose, onToggleHideMessages, testID }) {

  // Ajout du state pour l'alerte
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const { isSmartphone, isSmartphonePortrait, isSmartphoneLandscape, isTabletPortrait, isLowResTabletPortrait, isLowResTabletLandscape } = useDeviceType();
  const { t } = useTranslation();

  /**
   * @function handleResponse
   * @description A function to handle the response to the hide messages question
   * @param {boolean} response - The response to the question
   */
  const handleResponse = (response) => {

    onToggleHideMessages(response);

    if (!response) {
      setAlertMessage(t('success.messagesShown'));
      setShowSuccessAlert(true);
    } else {
      onClose();
    }
  };

  // Function to handle the alert confirmation
  const handleAlertConfirm = () => {
    setShowSuccessAlert(false);
    onClose();
  };

  return (
    <>
      <Modal
        animationType="fade"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
        statusBarTranslucent={true}
        testID="hide-messages-modal"
      >
        <View style={styles.modalContainer}>
          <View style={[
            styles.modalContent,
            isSmartphonePortrait && styles.modalContentSmartphonePortrait,
            isSmartphoneLandscape && styles.modalContentSmartphoneLandscape,
            isTabletPortrait && styles.modalContentTabletPortrait,
            isLowResTabletPortrait && styles.modalContentLowResTabletPortrait,
            isLowResTabletLandscape && styles.modalContentLowResTabletLandscape,
          ]}>
            <View style={[
              styles.titleContainer,
            ]}>
              <Text style={[
                styles.titleText,
                isSmartphone && styles.titleTextSmartphone,
              ]}>{t('settings.common.showHideMessages')}</Text>
            </View>
            <View style={[
              styles.buttonContainer,
              isSmartphone && styles.buttonContainerSmartphone]}>
              <Button
                title={t('buttons.hide')}
                backgroundColor={COLORS.gray950}
                width={isSmartphone ? '23%' : '28%'}
                onPress={() => handleResponse(true)}
                testID="hide-button"
              />
              <Button
                title={t('buttons.show')}
                backgroundColor={COLORS.orange}
                width={isSmartphone ? '23%' : '28%'}
                onPress={() => handleResponse(false)}
                testID="show-button"
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Déplacer CustomAlert en dehors de la Modal principale */}
      <CustomAlert
        visible={showSuccessAlert}
        message={alertMessage}
        type="success"
        onConfirm={handleAlertConfirm}
        onClose={handleAlertConfirm}
        testID="success-alert"
      />
    </>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundModal,
    paddingBottom: '20%',
  },
  modalContent: {
    width: '40%',
    padding: 20,
    backgroundColor: COLORS.gray850,
    borderRadius: SIZES.borderRadius.xxLarge,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
    modalContentSmartphonePortrait: {
    width: '95%',
  },
  modalContentSmartphoneLandscape: {
    width: '50%',
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
  titleContainer: {
    marginBottom: 20,
  },
  titleText: {
    fontSize: SIZES.fonts.subtitleTablet,
    fontWeight: SIZES.fontWeight.semibold,
    marginHorizontal: '2%',
    width: '100%',
    color: COLORS.gray300,
  },
  titleTextSmartphone: {
    fontSize: SIZES.fonts.biggerTextSmartphone,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 20,
    width: '100%',
  },
});
