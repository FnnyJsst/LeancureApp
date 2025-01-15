import React from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';
import Button from '../../buttons/Button';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { SIZES, COLORS } from '../../../constants/style';

export default function ReadOnly({ visible, onClose, onToggleReadOnly }) {

  // Customized hook to determine the device type and orientation
  const { isSmartphone, isSmartphonePortrait, isSmartphoneLandscape, isTabletPortrait } = useDeviceType();

  // When the user clicks on the "Yes" button, we toggle the read-only mode and close the modal
  const handleYes = () => {
    onToggleReadOnly(true); 
    onClose();
  };

  // When the user clicks on the "No" button, we close the modal
  const handleNo = () => {
    onToggleReadOnly(false);  
    onClose();
  };
  
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true} 
    >
      <View style={styles.modalContainer}>
        <View style={[
          styles.modalContent,
          isSmartphonePortrait && styles.modalContentSmartphonePortrait,
          isSmartphoneLandscape && styles.modalContentSmartphoneLandscape,
          isTabletPortrait && styles.modalContentTabletPortrait
        ]}>
          <View style={[
            styles.titleContainer,
          ]}>
            <Text style={[
              styles.titleText,
              isSmartphone && styles.titleTextSmartphone,
            ]}>Do you want to set channel management to read-only?</Text>
          </View>
          <View style={[
            styles.buttonContainer,
          ]}>
            <Button 
              title="Yes" 
              backgroundColor={COLORS.gray650}
              color={COLORS.white} 
              width="20%"
              onPress={handleYes} 
            />
            <Button 
              title="No" 
              backgroundColor={COLORS.orange}
              color={COLORS.white} 
              width="20%"
              onPress={handleNo} 
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  //Container styles
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
    backgroundColor: COLORS.gray750,
    borderRadius: SIZES.borderRadius.large,
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

  //Title styles
  titleContainer: {
    marginBottom: 20,
  },
  titleText: {
    fontSize: SIZES.fonts.subtitleTablet,
    fontWeight: SIZES.fontWeight.bold,
    marginHorizontal: '2%',
    width: '100%',
    color: COLORS.gray300,
  },
  titleTextSmartphone: {
    fontSize: SIZES.fonts.subtitleSmartphone,
    marginBottom: 5,
  },

  //Button styles
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    width: '100%',
  },
});