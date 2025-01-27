import { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import Button from '../../buttons/Button';
import TitleModal from '../../text/TitleModal';
import InputModal from '../../inputs/InputModal';
import { useDeviceType } from '../../../hooks/useDeviceType'; 
import { SIZES, COLORS, MODAL_STYLES } from '../../../constants/style'; 
import { Ionicons } from '@expo/vector-icons';
export default function EditChannel({ visible, onClose, onSave, initialUrl, initialTitle }) {

  // We create a hook to determine the device type and orientation
  const { isTablet, isSmartphone, isTabletLandscape, isSmartphonePortrait, isSmartphoneLandscape } = useDeviceType(); 

  // State management for form inputs
  const [url, setUrl] = useState(initialUrl || '');
  const [title, setTitle] = useState(initialTitle || '');
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const [isUrlFocused, setIsUrlFocused] = useState(false);

  // Reset form 
  useEffect(() => {
    if (visible) {
      setUrl(initialUrl || '');
      setTitle(initialTitle || '');
    }
  }, [initialUrl, initialTitle, visible]);

  // Handle form submission
  const handleOk = () => {
    // We send the URL and title to the parent component
    onSave(url, title);
    // We reset the URL and title
    setUrl('');
    setTitle('');
    // We close the modal
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
      <View style={MODAL_STYLES.modalContainer}>
        <View style={[
          styles.modalContent,
          isSmartphonePortrait && styles.modalContentSmartphonePortrait,
          isSmartphoneLandscape && styles.modalContentSmartphoneLandscape,
          isTabletLandscape && styles.modalContentTabletLandscape
        ]}>
          <TitleModal title="Edit a channel" />
          <View style={[
            styles.inputContainer,
          ]}>
            <Text style={[
              styles.text,
              isSmartphone && styles.textSmartphone
            ]}>Title</Text>
            <InputModal 
              value={title} 
              // We update the title state
              onChangeText={setTitle} 
              placeholder="Enter channel title"
              //No need to secure the title
              secureTextEntry={false}
              style={isSmartphone && styles.inputSmartphone}
              onFocus={() => setIsTitleFocused(true)}
              onBlur={() => setIsTitleFocused(false)}
              icon={
                <Ionicons 
                  name="text-outline" 
                  size={20} 
                  color={isTitleFocused ? COLORS.orange : COLORS.gray300}
                />
              }
            />
          </View>
          <View style={[
            styles.inputContainer,
          ]}>
            <Text style={[
              styles.text,
              isSmartphone && styles.textSmartphone
            ]}>URL</Text>
            <InputModal 
              value={url} 
              // We update the URL state
              onChangeText={setUrl} 
              placeholder="Enter channel URL"
              //No need to secure the URL
              secureTextEntry={false}
              style={isSmartphone && styles.inputSmartphone}
              onFocus={() => setIsUrlFocused(true)}
              onBlur={() => setIsUrlFocused(false)}
              icon={
                <Ionicons 
                  name="link-outline" 
                  size={20} 
                  color={isUrlFocused ? COLORS.orange : COLORS.gray300}
                />
              }
            />
          </View>
          <View style={MODAL_STYLES.buttonContainer}>
            <Button 
              title="Cancel" 
              backgroundColor={COLORS.gray650} 
              color={COLORS.white} 
              width="22%"
              // We close the modal
              onPress={onClose} 
            />
            <Button 
              title="Ok" 
              backgroundColor={COLORS.orange} 
              color={COLORS.white} 
              width="22%"
              // We send the URL and title to the parent component
              onPress={handleOk} 
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainerSmartphoneLandscape: {
    paddingTop: '10%'
  },
  modalContent: {
    width: '60%',
    padding: 20,
    backgroundColor: COLORS.gray850,
    borderRadius: SIZES.borderRadius.xxLarge,
    borderWidth: 1,
    borderColor: '#403430',
  },
  modalContentTabletLandscape: {
    width: '40%'
  },
  modalContentSmartphonePortrait: {
    width: '95%'
  },
  modalContentSmartphoneLandscape: {
    width: '60%'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '90%',
    marginTop: 15
  },
  inputSmartphone: {
    marginBottom: 10
  },
  text: {
    fontSize: SIZES.fonts.subtitleTablet,
    marginBottom: 20,
    color: COLORS.gray600
  },
  textSmartphone: {
    fontSize: SIZES.fonts.subtitleSmartphone,
    marginBottom: 10
  },
});