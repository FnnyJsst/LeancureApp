import React from 'react';
import { View, Modal, StyleSheet } from 'react-native';
import TitleModal from '../../text/TitleModal';
import Button from '../../buttons/Button';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { SIZES, COLORS, MODAL_STYLES } from '../../../assets/styles/constants';

export default function DeleteChannel({ visible, onClose, handleDelete }) {
  const { isTablet, isPortrait, isSmartphonePortrait, isSmartphoneLandscape } = useDeviceType(); 

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
            <TitleModal title="Are you sure you want to delete this channel?" />
          </View>
          <View style={MODAL_STYLES.buttonContainer}>
            <Button 
              title="Cancel" 
              backgroundColor={COLORS.buttonGray}
              color="white" 
              width="18%" 
              onPress={onClose} 
            />
            <Button 
              title="Delete" 
              backgroundColor={COLORS.orange}
              color="white" 
              width="18%" 
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
});