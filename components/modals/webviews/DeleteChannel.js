import React from 'react';
import { View, Modal, Text,StyleSheet } from 'react-native';
import Button from '../../buttons/Button';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { COLORS, MODAL_STYLES, SIZES } from '../../../constants/style';

export default function DeleteChannel({ visible, onClose, handleDelete }) {
  const { isTablet, isPortrait, isSmartphonePortrait, isSmartphoneLandscape, isSmartphone } = useDeviceType(); 

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
          isTablet && isPortrait && styles.modalContentTabletPortrait
        ]}>
          <View style={[
            styles.titleContainer,
            !isTablet && styles.titleContainerSmartphone,
            isTablet && isPortrait && styles.titleContainerTabletPortrait
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
              width="20%" 
              onPress={onClose} 
            />
            <Button 
              title="Delete" 
              backgroundColor={COLORS.orange}
              color={COLORS.white} 
              width="20%" 
              onPress={() => handleDelete()} 
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  //Content styles
  modalContentSmartphonePortrait: {
    width: '95%',
  },
  modalContentSmartphoneLandscape: {
    width: '55%',
  },
  modalContentTabletPortrait: {
    width: '60%',
  },

  //Title styles
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
    fontSize: SIZES.fonts.subtitleSmartphone,
  },
});