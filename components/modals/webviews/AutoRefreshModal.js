import { useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Button from '../../buttons/Button';
import TitleModal from '../../text/TitleModal';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { SIZES, COLORS, MODAL_STYLES } from '../../../constants/style';

const autoRefreshModal = ({ visible, onClose, onSelectOption }) => {
  const { 
    isSmartphone,
    isSmartphoneLandscape, 
    isTabletLandscape
  } = useDeviceType();

  const [selectedOption, setSelectedOption] = useState('never');

  // Options for the auto-refresh modal
  const options = [
    { label: 'Never', value: 'never' },
    { label: 'Every minute', value: 'every minute' },
    { label: 'Every 2 minutes', value: 'every 2 minutes' },
    { label: 'Every 5 minutes', value: 'every 5 minutes' },
    { label: 'Every 15 minutes', value: 'every 15 minutes' },
    { label: 'Every 30 minutes', value: 'every 30 minutes' },
    { label: 'Every hour', value: 'every hour' },
    { label: 'Every 2 hours', value: 'every 2 hours' },
    { label: 'Every 3 hours', value: 'every 3 hours' },
    { label: 'Every 6 hours', value: 'every 6 hours' },
    { label: 'Every day', value: 'every day' },
  ];

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true} 
    >
      <View style={[
        styles.modalContainer,
        isSmartphone && styles.modalContainerSmartphone
      ]}>
        <View style={[
            styles.modalContent,
            isSmartphone && styles.modalContentSmartphone,
            isTabletLandscape && styles.modalContentTabletLandscape,
            isSmartphoneLandscape && styles.modalContentSmartphoneLandscape,
          ]}>
          <ScrollView>
            <TitleModal title="Refresh view"/>
            <View style={[
              styles.optionsContainer,
              isSmartphone && styles.optionsContainerSmartphone
            ]}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.radioContainer,
                  isSmartphone && styles.radioContainerSmartphone
                ]}
                onPress={() => setSelectedOption(option.value)}
              >
                <View 
                  style={[
                    styles.radioCircle,
                    isSmartphone && styles.radioCircleSmartphone,
                    selectedOption === option.value && { borderColor: COLORS.orange }  
                  ]}
                >
                  {selectedOption === option.value && <View style={styles.selectedRb} />}
                </View>
                <Text style={[
                  styles.radioText,
                  isSmartphone && styles.radioTextSmartphone]}>{option.label}</Text>
              </TouchableOpacity>
            ))}
            </View>
            <View style={MODAL_STYLES.buttonContainer}>
            <Button 
              title="Close" 
              backgroundColor={COLORS.buttonGray}
              color="white" 
              width="20%"
              onPress={onClose} />
            <Button 
              title="Set" 
              backgroundColor={COLORS.orange}
              color="white" 
              width="20%"
              onPress={() => {
                console.log('Option à envoyer:', selectedOption);
                onSelectOption(selectedOption);
                onClose();
              }}
            />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  //Container styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundModal,
    paddingBottom: '10%',
  },
  modalContainerSmartphone: {
    paddingBottom: 0,
  },

  //Content styles
  modalContent: {
    width: "55%",
    padding: 20,
    backgroundColor: COLORS.darkGray,
    borderRadius: SIZES.borderRadius.xLarge,
  },
  modalContentSmartphone: {
    width: '90%',
  },
  modalContentTabletLandscape: {
    width: '40%',
  },
  modalContentSmartphoneLandscape: {
    width: '45%',
  },

  //Options container styles
  optionsContainer: {
    marginTop: 15,
    gap: 6,
  },
  optionsContainerSmartphone: {
    marginTop: 0,
    gap: 2,
  },

  //Radio styles
  radioContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    marginLeft: 25,
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 1.58,
    borderColor: COLORS.gray,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  selectedRb: {
    width: 12,
    height: 12,
    borderRadius: SIZES.borderRadius.xSmall,
    backgroundColor: COLORS.orange,
  },
  radioContainerSmartphone: {
    marginBottom: 8,
    marginLeft: 20,
  },
  radioCircleSmartphone: {
    height: 16,
    width: 16,
    borderRadius: SIZES.borderRadius.small,
    borderWidth: 1.5,
    marginRight: 8,
  },
  radioText: {
    fontSize: SIZES.fonts.textTablet,
    color: COLORS.lightGray,
  },
  radioTextSmartphone: {
    fontSize: SIZES.fonts.textSmartphone,
  },
});

export default autoRefreshModal;