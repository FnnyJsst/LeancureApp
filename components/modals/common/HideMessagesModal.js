import React from 'react';
import { View, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import Button from '../../buttons/Button';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { SIZES, COLORS } from '../../../constants/style';
import { Text } from '../../text/CustomText';

/**
 * @component HideMessagesModal
 * @description A component that renders a modal for hiding the messages section from the app menu
 * 
 * @param {Object} props - The properties of the component
 * @param {boolean} props.visible - Whether the modal is visible
 * @param {Function} props.onClose - The function to call when the modal is closed
 * @param {Function} props.onToggleHideMessages - The function to call when the hide messages mode is toggled
 * 
 * @example
 * <HideMessagesModal visible={visible} onClose={() => console.log('Modal closed')} onToggleHideMessages={() => console.log('Hide messages mode toggled')} />
 */
export default function HideMessagesModal({ visible, onClose, onToggleHideMessages }) {

  // Customized hook to determine the device type and orientation
  const { isSmartphone, isSmartphonePortrait, isSmartphoneLandscape, isTabletPortrait } = useDeviceType();

  /**
   * @function handleResponse
   * @description A function to handle the response to the hide messages question
   * @param {boolean} response - The response to the question
   */
  const handleResponse = (response) => {
    onToggleHideMessages(response);
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalText}>
            Voulez-vous masquer la section Messages ?
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.buttonNo]}
              onPress={() => handleResponse(false)}
            >
              <Text style={styles.buttonText}>Non</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonYes]}
              onPress={() => handleResponse(true)}
            >
              <Text style={styles.buttonText}>Oui</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  //Container styles
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundModal,
  },
  modalView: {
    width: '40%',
    padding: 20,
    backgroundColor: COLORS.gray850,
    borderRadius: SIZES.borderRadius.xxLarge,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  modalText: {
    fontSize: SIZES.fonts.subtitleTablet,
    fontWeight: SIZES.fontWeight.semibold,
    marginBottom: 20,
    color: COLORS.gray300,
  },

  //Button styles
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 20,
    width: '100%',
  },
  buttonNo: {
    backgroundColor: COLORS.gray950,
    padding: 10,
    borderRadius: SIZES.borderRadius.small,
  },
  buttonYes: {
    backgroundColor: COLORS.orange,
    padding: 10,
    borderRadius: SIZES.borderRadius.small,
  },
  buttonText: {
    fontSize: SIZES.fonts.biggerTextSmartphone,
    fontWeight: SIZES.fontWeight.semibold,
    color: COLORS.gray300,
  },
});