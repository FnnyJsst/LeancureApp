import React, { useState } from 'react';
import { View, Modal, StyleSheet } from 'react-native';
import Button from '../../buttons/Button';
import InputModal from '../../inputs/InputModal';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { SIZES, COLORS } from '../../../constants/style';
import { Text } from '../../text/CustomText';
import { Ionicons } from '@expo/vector-icons';
import { ENV } from '../../../config/env';

/**
 * @function ChangeServerAddressModal
 * @description This component allows the user to change the server address
 * @param {boolean} visible - Whether the modal is visible
 * @param {function} onClose - Function to close the modal
 * @param {function} onNavigate - Function to navigate to the login screen
 */
export default function ChangeServerAddressModal({ visible, onClose }) {
  const [serverAddress, setServerAddress] = useState('');
  const [error, setError] = useState('');

  const { isSmartphone, isSmartphonePortrait, isSmartphoneLandscape, isTabletLandscape } = useDeviceType();

  /**
   * @function handleSave
   * @description This function handles the save button press
   */
  const handleSave = async () => {
    try {
      //If the server address is empty, set the error
      if (!serverAddress.trim()) {
        setError('Address cannot be empty');
        return;
      }

      // Validate the URL
      try {
        const url = new URL(serverAddress.trim());
        //If the URL is invalid, set the error
        if (!url.protocol || !url.host) {
          setError('Invalid URL format');
          return;
        }
        if (!['http:', 'https:'].includes(url.protocol)) {
          setError('Le protocole doit être http ou https');
          return;
        }

        //We clean the URL to keep only the protocol and the host
        const baseUrl = `${url.protocol}//${url.host}`;
        //We add /ic.php to the end
        const finalUrl = `${baseUrl}/ic.php`;

        //We save the URL
        await ENV.setCustomApiUrl(finalUrl);
        onClose();
      } catch (storageError) {
        setError('Error saving the data in the storage');
      }
    } catch (saveServerAddressError) {
      setError('Error saving the server address');
    }
  };

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
          isTabletLandscape && styles.modalContentTabletLandscape,
        ]}>
          <View style={styles.titleContainer}>
            <Text style={[styles.titleText, isSmartphone && styles.titleTextSmartphone]}>
              Change the server address
            </Text>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
          <InputModal
            placeholder="Enter the new server address"
            icon={<Ionicons name="server-outline" size={24} color={COLORS.orange} />}
            onChangeText={setServerAddress}
            value={serverAddress}
            secureTextEntry={false}
          />
          <View style={[styles.buttonContainer, isSmartphone && styles.buttonContainerSmartphone]}>
            <Button
              title="Cancel"
              backgroundColor={COLORS.gray950}
              width={isSmartphone ? '20%' : '22%'}
              onPress={onClose}
            />
            <Button
              title="Save"
              backgroundColor={COLORS.orange}
              width={isSmartphone ? '20%' : '22%'}
              onPress={handleSave}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({

  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundModal,
    paddingBottom: '20%',
  },
  modalContent: {
    width: '65%',
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
  modalContentTabletLandscape: {
    width: '40%',
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 20,
    width: '100%',
  },
  errorText: {
    color: COLORS.error,
    fontSize: SIZES.fonts.smallText,
    marginTop: 8,
    textAlign: 'center',
  },
});
