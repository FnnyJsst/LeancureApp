import { useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import Button from '../buttons/Button';
import TitleModal from '../text/TitleModal';

const TimerModal = ({ visible, onClose }) => {
  const [selectedOption, setSelectedOption] = useState(null);

  // Options for the timer modal
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
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <TitleModal title="AUTO-RELOAD VIEW" />
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={styles.radioContainer}
              onPress={() => setSelectedOption(option.value)}
            >
              <View style={styles.radioCircle}>
                {selectedOption === option.value && <View style={styles.selectedRb} />}
              </View>
              <Text style={styles.radioText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
          <Button title="Close" backgroundColor="#FF4500" color="white" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: "30%",
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#f4f4f4',
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  selectedRb: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#000',
  },
  radioText: {
    fontSize: 16,
  },
});

export default TimerModal;