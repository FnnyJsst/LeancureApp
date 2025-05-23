import React, { useState } from 'react';
import { View, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import Button from '../../buttons/Button';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { SIZES, COLORS } from '../../../constants/style';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../text/CustomText';
import { useTranslation } from 'react-i18next';
import TooltipModal from './TooltipModal';
import CustomAlert from './CustomAlert';

/**
 * @component ReadOnly
 * @description A component that renders a modal for setting the read-only mode
 * @param {boolean} props.visible - Whether the modal is visible
 * @param {Function} props.onClose - The function to call when the modal is closed
 * @param {Function} props.onToggleReadOnly - The function to call when the read-only mode is toggled
 */
export default function ReadOnly({ visible, onClose, onToggleReadOnly, testID }) {

  // Translation
  const { t } = useTranslation();
  // Customized hook to determine the device type and orientation
  const { isSmartphone, isSmartphonePortrait, isSmartphoneLandscape, isTabletPortrait, isLowResTabletPortrait, isLowResTabletLandscape } = useDeviceType();
  const [showTooltip, setShowTooltip] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  /**
   * @function handleYes
   * @description A function to handle the "Yes" button to set the read-only mode
   */
  const handleYes = () => {
    onToggleReadOnly(true);
    setShowAlert(true);
  };

  /**
   * @function handleNo
   * @description A function to handle the "No" button to set the read-only mode
   */
  const handleNo = () => {
    onToggleReadOnly(false);
    setShowAlert(true);
  };

  const handleAlertClose = () => {
    setShowAlert(false);
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
        testID="read-only-modal"
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
            <View style={styles.titleContainer}>
              <Text style={[
                styles.titleText,
                isSmartphone && styles.titleTextSmartphone,
              ]}>{t('modals.webview.readOnly.readOnly')}</Text>
              <TouchableOpacity
                onPress={() => setShowTooltip(true)}
                style={styles.tooltipButton}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={isSmartphone ? 16 : 18}
                  color={COLORS.gray300}
                />
              </TouchableOpacity>
            </View>
            <View style={[
              styles.buttonContainer,
              isSmartphone && styles.buttonContainerSmartphone,
            ]}>
              <Button
                title={t('buttons.yes')}
                backgroundColor={COLORS.orange}
                width={isSmartphone ? '23%' : '26%'}
                onPress={handleYes}
              />
              <Button
                title={t('buttons.no')}
                backgroundColor={COLORS.gray950}
                color={COLORS.gray300}
                width={isSmartphone ? '23%' : '26%'}
                onPress={handleNo}
              />
            </View>
          </View>
        </View>
      </Modal>
      <TooltipModal
        visible={showTooltip}
        onClose={() => setShowTooltip(false)}
        message={t('tooltips.readOnly.message')}
      />
      <CustomAlert
        visible={showAlert}
        message={t('modals.webview.readOnly.settingsSaved')}
        onClose={handleAlertClose}
        onConfirm={handleAlertClose}
        type="success"
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
  modalContentLowResTabletPortrait: {
    width: '80%',
  },
  modalContentLowResTabletLandscape: {
    width: '50%',
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
    width: '60%',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginHorizontal: '3%',
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
  buttonContainerSmartphone: {
    gap: 10,
  },
  tooltipButton: {
    marginLeft: 10,
    marginTop: -20,
  },
});