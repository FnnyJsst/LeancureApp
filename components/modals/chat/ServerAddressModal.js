import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import Button from '../../buttons/Button';
import TitleModal from '../../text/TitleModal';
import InputModal from '../../inputs/InputModal';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { SIZES, COLORS, MODAL_STYLES } from '../../../constants/style';
import { Ionicons } from '@expo/vector-icons';

/**
 * @component ServerAddressModal
 * @description A component that renders a modal for setting the server address
 * 
 * @param {Object} props - The properties of the component
 * @param {boolean} props.visible - Whether the modal is visible
 * @param {Function} props.onClose - The function to call when the modal is closed
 * @param {Function} props.onImport - The function to call when the channels are imported

 * @example
 * <ServerAddressModal visible={visible} onClose={() => console.log('Modal closed')} onImport={() => console.log('Channels imported')} />
 */

const ServerAddressModal = ({ visible, onClose, onImport }) => {
  

  // State management for the URL, error and channels
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Customized hook to determine the device type and orientation
  const { isSmartphone, isSmartphoneLandscape, isTabletPortrait } = useDeviceType();

  // L'utilisateur rentre une URL dans l'input
  const handleUrlChange = (newUrl) => {
    setUrl(newUrl);
    setError(''); // Reset error when user types
  };

// On vérifie si l'URL est valide
/**
 * @function validateUrl
 * @description A function to validate the URL
 * @param {string} url - The URL to validate
 * @returns {boolean} - Whether the URL is valid
 */
const validateUrl = (url) => {
const pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
  '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|'+ // domain name
  '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
  '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
  '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
  '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
return !!pattern.test(url);
};

 // Si l'URL est valide, on enregistre l'URL dans le state
//  if (!validateUrl(url)) {
//   setError('Invalid URL.');
//   return;
// } else {

// }
 // Si l'URL n'est pas valide, on affiche une erreur




  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      // onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <View style={MODAL_STYLES.modalContainer}>
        <View style={[
            MODAL_STYLES.content,
            isSmartphone && styles.modalContentSmartphone,
            isSmartphoneLandscape && styles.modalContentSmartphoneLandscape,
            isTabletPortrait && styles.modalContentTabletPortrait
          ]}>
          <TitleModal title="Enter the address of the server"/>
          <InputModal
            placeholder="Enter the URL address of the server"
            value={url}

            onChangeText={handleUrlChange}
            secureTextEntry={false}
            icon={
              <Ionicons 
                name="link-outline" 
                size={20} 
                color={isFocused ? COLORS.orange : COLORS.gray300}
              />
            }
          />
          {error ? (
            <View style={[
              styles.errorContainer
            ]}>
              <Text style={[
                styles.errorText,
                isSmartphone && styles.smallTextSmartphone
              ]}>{error}</Text>
            </View>
          ) : null}
          <View style={[
            MODAL_STYLES.buttonContainer,
          ]}>
            <Button 
              title="Cancel" 
              // onPress={handleClose}
              backgroundColor={COLORS.gray950}
              textColor={COLORS.gray300}
              width={isSmartphone ? '22%' : '25%'}
            />
            <Button 
              title="Save" 
              // onPress={handleDownload}
              backgroundColor={COLORS.orange}
              width={isSmartphone ? '22%' : '25%'}

            />
          </View>
        </View>
      </View>
    </Modal>
  );
};


const styles = StyleSheet.create({
  //Content styles
  modalContentSmartphone: {
    width: '95%',
  },
  modalContentSmartphoneLandscape: {
    width: '50%',
  },
  modalContentTabletPortrait: {
    width: '60%',
  },

  //Error styles
  errorContainer: {
    alignItems: 'flex-start',
    paddingHorizontal: '5%',
    marginTop: 10,
  },
  errorText: {
    color: COLORS.red,
    fontSize: SIZES.fonts.errorText,
  },
  smallTextSmartphone: {
    fontSize: SIZES.fonts.errorText,
  },
});

export default ServerAddressModal;