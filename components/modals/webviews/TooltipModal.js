import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { COLORS, SIZES } from '../../../constants/style';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../text/CustomText';
import { useTranslation } from 'react-i18next';
import { useDeviceType } from '../../../hooks/useDeviceType';

/**
 * @component TooltipModal
 * @description A modal that displays a tooltip with instructions in form of a speech bubble
 * @param {boolean} visible - Whether the modal is visible
 * @param {Function} onClose - Function to call when the modal is closed
 * @param {string} title - The title of the tooltip
 * @param {string} message - The message to display in the tooltip
 * @param {Object} position - Position of the tooltip relative to the element it explains
 */
export default function TooltipModal({ visible, onClose, title, message, position = { top: '45%', left: '50%' } }) {
  const { t } = useTranslation();
  const { isSmartphone } = useDeviceType();

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View
          style={[
            styles.tooltipContainer,
            isSmartphone && styles.tooltipContainerSmartphone,
            { top: position.top, left: position.left }
          ]}
        >
          {/* Flèche pointant vers l'élément */}
          <View style={styles.tooltipArrow} />

          {/* Bulle principale */}
          <View style={[styles.modalView, isSmartphone && styles.modalViewSmartphone]}>
            <View style={styles.contentContainer}>
              <Text style={[styles.message, isSmartphone && styles.messageSmartphone]}>
                {message || t('tooltips.defaultMessage')}
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.button}
                onPress={onClose}
              >
                <Text style={[styles.buttonText, isSmartphone && styles.buttonTextSmartphone]}>
                  {t('buttons.gotIt')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    backgroundColor: COLORS.backgroundModal,
  },
  tooltipContainer: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -300 }],  // Ajustement pour un meilleur centrage
  },
  tooltipContainerSmartphone: {
    width: '85%',
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 15,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: COLORS.orange,
    marginBottom: -1,
  },
  modalView: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.orange,
    borderRadius: SIZES.borderRadius.xLarge,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalViewSmartphone: {
    padding: 16,
  },
  contentContainer: {
    marginBottom: 20,
  },
  message: {
    color: COLORS.white,
    fontSize: SIZES.fonts.textTablet,
    lineHeight: 24,
    textAlign: 'center',
  },
  messageSmartphone: {
    fontSize: SIZES.fonts.textSmartphone,
    lineHeight: 22,
  },
  buttonContainer: {
    alignItems: 'flex-end',
  },
  button: {
    paddingBottom: 4,
    paddingHorizontal: 16,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: SIZES.fonts.smallTextTablet,
  },
  buttonTextSmartphone: {
    fontSize: SIZES.fonts.textSmartphone,
    fontWeight: SIZES.fontWeight.semiBold
  },
});