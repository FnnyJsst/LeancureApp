import { useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Button from '../../buttons/Button';
import TitleModal from '../../text/TitleModal';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { SIZES, COLORS, MODAL_STYLES } from '../../../constants/style';
import { Ionicons } from '@expo/vector-icons';

/**
 * @component AutoRefreshModal
 * @description A component that renders a modal for auto-refresh options
 * 
 * @param {Object} props - The properties of the component
 * @param {boolean} props.visible - Whether the modal is visible
 * @param {Function} props.onClose - The function to call when the modal is closed
 * @param {Function} props.onSelectOption - The function to call when the option is selected
 * 
 * @example
 * <AutoRefreshModal visible={visible} onClose={() => console.log('Modal closed')} onSelectOption={() => console.log('Option selected')} />
 */
const autoRefreshModal = ({ visible, onClose, onSelectOption }) => {

  // We create a hook to determine the device type and orientation
  const { isSmartphone, isSmartphoneLandscape, isTabletLandscape } = useDeviceType();

  // State used to store the selected option
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
                <Ionicons 
                  name={selectedOption === option.value ? "radio-button-on-outline" : "radio-button-off-outline"}
                  size={isSmartphone ? 20 : 24}
                  color={selectedOption === option.value ? COLORS.orange : COLORS.gray600}
                  style={styles.radioIcon}
                />
                <Text style={[
                  styles.radioText,
                  isSmartphone && styles.radioTextSmartphone]}>{option.label}</Text>
              </TouchableOpacity>
            ))}
            </View>
            <View style={MODAL_STYLES.buttonContainer}>
              <Button 
                title="Close" 
                backgroundColor={COLORS.gray950}
                textColor={COLORS.gray300} 
                width={isSmartphone ? '22%' : '25%'}
                onPress={onClose} />
              <Button 
                title="Set" 
                backgroundColor={COLORS.orange}
                color={COLORS.white} 
                width={isSmartphone ? '22%' : '25%'}
                onPress={() => {
                  // We send the selected option to the parent component
                  onSelectOption(selectedOption);
                  // We close the modal
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
    backgroundColor: COLORS.gray850,
    borderRadius: SIZES.borderRadius.xxLarge,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
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
    alignItems: 'center',
  },
  radioContainerSmartphone: {
    marginBottom: 8,
    marginLeft: 20,
  },
  radioIcon: {
    marginRight: 10,
  },
  radioText: {
    fontSize: SIZES.fonts.textTablet,
    color: COLORS.gray300,
  },
  radioTextSmartphone: {
    fontSize: SIZES.fonts.textSmartphone,
    fontWeight: SIZES.fontWeight.medium,
  },
});

export default autoRefreshModal;