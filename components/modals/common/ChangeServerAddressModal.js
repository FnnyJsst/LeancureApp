import React from 'react';
import { View, Modal, StyleSheet } from 'react-native';
import Button from '../../buttons/Button';
import InputModal from '../../inputs/InputModal';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { SIZES, COLORS } from '../../../constants/style';
import { Text } from '../../text/CustomText';


export default function ChangeServerAddressModal({ visible, onClose}) {

  // Customized hook to determine the device type and orientation
  const { isSmartphone, isSmartphonePortrait, isSmartphoneLandscape, isTabletPortrait } = useDeviceType();



  return (
    <Modal
      animationType="fade"
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
            ]}>Change server address</Text>
          </View>
          <InputModal
            placeholder="Enter the new server address"
            // onChangeText={setServerAddress}
            // value={serverAddress}
          />
          <View style={[
          styles.buttonContainer, 
          isSmartphone && styles.buttonContainerSmartphone]}>
          <Button
            title="Cancel"
            backgroundColor={COLORS.gray950}
            width={isSmartphone ? '20%' : '22%'}
            // onPress={() => handleResponse(true)}
          />
          <Button
            title="Save"
            backgroundColor={COLORS.orange}
            width={isSmartphone ? '20%' : '22%'}
            // onPress={() => handleResponse(false)}
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

  //Button styles
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 20,
    width: '100%',
  }
});