import React, { useState } from 'react';
import { View, Modal, StyleSheet } from 'react-native';
import Button from '../../buttons/Button';
import InputModal from '../../inputs/InputModal';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { SIZES, COLORS } from '../../../constants/style';
import { Text } from '../../text/CustomText';
import { Ionicons } from '@expo/vector-icons';
import { ENV } from '../../../config/env';
import * as SecureStore from 'expo-secure-store';
import { SCREENS } from '../../../constants/screens';

export default function ChangeServerAddressModal({ visible, onClose, onNavigate }) {
  const [serverAddress, setServerAddress] = useState('');
  const [error, setError] = useState('');

  // Customized hook to determine the device type and orientation
  const { isSmartphone, isSmartphonePortrait, isSmartphoneLandscape, isTabletPortrait } = useDeviceType();

  const handleSave = async () => {
    try {
      console.log('💾 Début handleSave');
      console.log('📝 Adresse saisie:', serverAddress);
      
      if (!serverAddress.trim()) {
        setError('L\'adresse ne peut pas être vide');
        return;
      }

      // Validation de l'URL
      try {
        const url = new URL(serverAddress.trim());
        console.log('🔍 URL parsée:', {
          protocol: url.protocol,
          host: url.host,
          pathname: url.pathname
        });

        if (!url.protocol || !url.host) {
          setError('Format d\'URL invalide');
          return;
        }
        if (!['http:', 'https:'].includes(url.protocol)) {
          setError('Le protocole doit être http ou https');
          return;
        }

        // On nettoie l'URL pour ne garder que le protocol et le host
        const baseUrl = `${url.protocol}//${url.host}`;
        // On ajoute /ic.php à la fin
        const finalUrl = `${baseUrl}/ic.php`;
        
        console.log('🔧 URLs transformées:', {
          baseUrl,
          finalUrl
        });

        console.log('📝 Tentative de sauvegarde de l\'URL:', finalUrl);
        await ENV.setCustomApiUrl(finalUrl);
        
        console.log('🗑️ Tentative de suppression des credentials');
        const existingCredentials = await SecureStore.getItemAsync('userCredentials');
        if (existingCredentials) {
          await SecureStore.deleteItemAsync('userCredentials');
          console.log('✅ Credentials supprimés avec succès');
        } else {
          console.log('ℹ️ Pas de credentials à supprimer');
        }
        
        console.log('✅ Sauvegarde réussie, fermeture du modal');
        onClose();
        
        if (onNavigate) {
          console.log('🔄 Navigation vers LOGIN');
          onNavigate(SCREENS.LOGIN);
        }
      } catch (storageError) {
        console.error('🔴 Erreur SecureStore:', storageError);
        setError('Erreur lors de la sauvegarde des données');
      }
    } catch (error) {
      console.error('🔴 Erreur générale:', error);
      setError('Erreur lors de la sauvegarde de l\'adresse');
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
          isTabletPortrait && styles.modalContentTabletPortrait
        ]}>
          <View style={styles.titleContainer}>
            <Text style={[styles.titleText, isSmartphone && styles.titleTextSmartphone]}>
              Changer l'adresse du serveur
            </Text>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
          <InputModal
            placeholder="Entrez la nouvelle adresse du serveur"
            icon={<Ionicons name="server-outline" size={24} color={COLORS.orange} />}
            onChangeText={setServerAddress}
            value={serverAddress}
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
  },

  errorText: {
    color: COLORS.error,
    fontSize: SIZES.fonts.smallText,
    marginTop: 8,
    textAlign: 'center'
  },
});