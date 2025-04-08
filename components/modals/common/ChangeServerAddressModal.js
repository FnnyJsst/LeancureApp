import React, { useState, useEffect } from 'react';
import { View, Modal, StyleSheet } from 'react-native';
import Button from '../../buttons/Button';
import InputModal from '../../inputs/InputModal';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { SIZES, COLORS } from '../../../constants/style';
import { Text } from '../../text/CustomText';
import { Ionicons } from '@expo/vector-icons';
import { ENV } from '../../../config/env';
import { useTranslation } from 'react-i18next';

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
  const [success, setSuccess] = useState('');

  // Translation and device type hooks
  const { isSmartphone, isSmartphonePortrait, isSmartphoneLandscape, isTabletLandscape } = useDeviceType();
  const { t } = useTranslation();

  /**
   * @function loadCurrentServerAddress
   * @description This function loads the current server address to display it in the input
   */
  useEffect(() => {
    const loadCurrentServerAddress = async () => {
      try {
        // We get the current server address from the storage
        const currentUrl = await ENV.API_URL();
        // We remove the /ic.php from the URL for display
        const baseUrl = currentUrl.replace('/ic.php', '');
        setServerAddress(baseUrl);
      } catch (error) {
        console.error('Erreur lors du chargement de l\'adresse du serveur:', error);
      }
    };

    if (visible) {
      loadCurrentServerAddress();
      // Réinitialisation des messages
      setError('');
      setSuccess('');
    }
  }, [visible]);

  /**
   * @function handleSave
   * @description This function handles the save button press
   */
  const handleSave = async () => {
    try {
      // Réinitialisation des messages
      setError('');
      setSuccess('');

      //If the server address is empty, set the error
      if (!serverAddress.trim()) {
        setError(t('error.addressCannotBeEmpty'));
        return;
      }

      // Validate the URL
      try {
        const url = new URL(serverAddress.trim());
        //If the URL is invalid, set the error
        if (!url.protocol || !url.host) {
          setError(t('error.invalidUrlFormat'));
          return;
        }
        if (!['http:', 'https:'].includes(url.protocol)) {
          setError(t('error.invalidProtocol'));
          return;
        }

        //We clean the URL to keep only the protocol and the host
        const baseUrl = `${url.protocol}//${url.host}`;
        //We add /ic.php to the end
        const finalUrl = `${baseUrl}/ic.php`;

        //We save the URL
        await ENV.setCustomApiUrl(finalUrl);

        // Affichage d'un message de succès
        setSuccess(t('success.serverAddressChanged'));

        // Fermeture de la modal après 1.5 secondes
        setTimeout(() => {
          onClose();
        }, 1500);
      } catch (storageError) {
        setError('Error saving the data in the storage');
      }
    } catch (saveServerAddressError) {
      setError(t('error.saveServerAddressError'));
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
              {t('modals.server.change')}
            </Text>
            {error ? <Text style={[styles.errorText, isSmartphone && styles.errorTextSmartphone]}>{error}</Text> : null}
            {success ? <Text style={[styles.successText, isSmartphone && styles.successTextSmartphone]}>{success}</Text> : null}
          </View>
          <InputModal
            placeholder={t('settings.common.changeServer')}
            icon={<Ionicons name="server-outline" size={24} color={COLORS.orange} />}
            onChangeText={setServerAddress}
            value={serverAddress}
            secureTextEntry={false}
          />
          <View style={[styles.buttonContainer]}>
            <Button
              title={t('buttons.cancel')}
              backgroundColor={COLORS.gray950}
              width="28%"
              onPress={onClose}
            />
            <Button
              title={t('buttons.save')}
              backgroundColor={COLORS.orange}
              width="28%"
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
    color: COLORS.red,
    fontSize: SIZES.fonts.smallTextTablet,
    marginTop: 8,
    textAlign: 'center',
  },
  errorTextSmartphone: {
    fontSize: SIZES.fonts.smallTextSmartphone,
  },
  successText: {
    color: COLORS.green,
    fontSize: SIZES.fonts.smallTextTablet,
    marginTop: 8,
    textAlign: 'center',
  },
  errorTextSmartphone: {
    fontSize: SIZES.fonts.smallTextSmartphone,
  },
  successTextSmartphone: {
    fontSize: SIZES.fonts.smallTextSmartphone,
  },
});
