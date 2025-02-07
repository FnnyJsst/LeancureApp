import React from 'react';
import { View, Modal, Text,StyleSheet } from 'react-native';
import Button from '../../buttons/Button';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { COLORS, MODAL_STYLES, SIZES } from '../../../constants/style';

/**
 * @component DeleteWebviewModal
 * @description A component that renders a modal for deleting a webview
 * 
 * @param {Object} props - The properties of the component
 * @param {boolean} props.visible - Whether the modal is visible
 * @param {Function} props.onClose - The function to call when the modal is closed
 * @param {Function} props.handleDelete - The function to call when the webview is deleted
 * @example
 * <DeleteWebviewModal visible={visible} onClose={() => console.log('Modal closed')} handleDelete={() => console.log('Webview deleted')} />
 */
export default function DeleteWebviewModal({ visible, onClose, handleDelete }) {

  // Hook to determine the device type and orientation
  const { isSmartphonePortrait, isSmartphoneLandscape, isSmartphone, isTabletPortrait } = useDeviceType(); 

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true} 
    >
      <View style={MODAL_STYLES.modalContainer}>
        <View style={[
          MODAL_STYLES.content,
          isSmartphonePortrait && styles.modalContentSmartphonePortrait,
          isSmartphoneLandscape && styles.modalContentSmartphoneLandscape,
          isTabletPortrait && styles.modalContentTabletPortrait
        ]}>
          <View style={[
            styles.titleContainer,
            isSmartphone && styles.titleContainerSmartphone,
            isTabletPortrait && styles.titleContainerTabletPortrait
          ]}>
            <Text style={[
              styles.title,
              isSmartphone && styles.titleSmartphone
            ]}>Are you sure you want to delete this channel?</Text>
          </View>
          <View style={MODAL_STYLES.buttonContainer}>
            <Button 
              title="Cancel" 
              backgroundColor={COLORS.gray650}
              color={COLORS.white}
              width="22%" 
              onPress={onClose} 
            />
            <Button 
              title="Delete" 
              backgroundColor={COLORS.orange}
              color={COLORS.white} 
              width="22%" 
              onPress={() => handleDelete()} 
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContentSmartphonePortrait: {
    width: '95%',
  },
  modalContentSmartphoneLandscape: {
    width: '55%',
  },
  modalContentTabletPortrait: {
    width: '60%',
  },
  titleContainerSmartphone: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: SIZES.fonts.subtitleTablet,
    fontWeight: SIZES.fontWeight.bold,
    color: COLORS.white,
  },
  titleSmartphone: {
    fontSize: SIZES.fonts.biggerTextSmartphone,
  },
});