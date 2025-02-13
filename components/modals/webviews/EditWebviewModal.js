import { useState, useEffect } from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import Button from '../../buttons/Button';
import TitleModal from '../../text/TitleModal';
import InputModal from '../../inputs/InputModal';
import { useDeviceType } from '../../../hooks/useDeviceType'; 
import { SIZES, COLORS, MODAL_STYLES } from '../../../constants/style'; 
import { Ionicons } from '@expo/vector-icons';
/**
 * @component EditWebviewModal
 * @description A component that renders a modal for editing a channel
 * 
 * @param {Object} props - The properties of the component
 * @param {boolean} props.visible - Whether the modal is visible
 * @param {Function} props.onClose - The function to call when the modal is closed
 * @param {Function} props.onSave - The function to call when the channel is saved
 * @param {string} props.initialUrl - The initial URL of the channel
 * @param {string} props.initialTitle - The initial title of the channel
 * 
 * @example
 * <EditWebviewModal visible={visible} onClose={() => console.log('Modal closed')} onSave={() => console.log('Channel saved')} initialUrl="https://www.google.com" initialTitle="Google" />
 */
export default function EditWebviewModal({ visible, onClose, onSave, initialUrl, initialTitle }) {

  // We create a hook to determine the device type and orientation
  const { isSmartphone, isTabletLandscape, isSmartphonePortrait, isSmartphoneLandscape } = useDeviceType(); 

  // State management for form inputs
  const [url, setUrl] = useState(initialUrl || '');
  const [title, setTitle] = useState(initialTitle || '');
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const [isUrlFocused, setIsUrlFocused] = useState(false);

  /**
   * @function useEffect
   * @description A function to reset the form inputs when the modal is opened
   */
  useEffect(() => {
    if (visible) {
      setUrl(initialUrl || '');
      setTitle(initialTitle || '');
    }
  }, [initialUrl, initialTitle, visible]);

  /**
   * @function handleOk
   * @description A function to handle the form submission
   */
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
              backgroundColor={COLORS.gray950} 
              color={COLORS.gray300} 
              width="22%"
              onPress={onClose} 
            />
            <Button 
              title="Ok" 
              backgroundColor={COLORS.orange} 
              color={COLORS.white} 
              width="22%"
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
    width: '100%',
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