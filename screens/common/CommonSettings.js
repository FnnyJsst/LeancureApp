import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text } from '../../components/text/CustomText';
import { FONTS } from '../../constants/style';
import Header from '../../components/Header';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/style';
import { useDeviceType } from '../../hooks/useDeviceType';
import SettingsCard from '../../components/cards/SettingsCard';
import HideMessagesModal from '../../components/modals/common/HideMessagesModal';
import ChangeServerAddressModal from '../../components/modals/common/ChangeServerAddressModal';
import { cleanSecureStore } from '../../services/api/authApi';
import { SCREENS } from '../../constants/screens';
import { useTranslation } from 'react-i18next';

/**
 * @component CommonSettings
 * @description A component that renders the common settings of the app
 * @param {Function} onBackPress - The function to call when the back button is pressed
 * @param {Function} onHideMessages - The function to call when the hide messages action is performed
 * @param {boolean} isMessagesHidden - Whether the messages are hidden
 * @param {Function} onNavigate - The function to navigate to other screens
 */
const CommonSettings = ({ onBackPress, onHideMessages, isMessagesHidden, onNavigate }) => {

    // Device type detection
    const { isSmartphone, isLandscape } = useDeviceType();
    const { t } = useTranslation();

    const [hideMessagesModalVisible, setHideMessagesModalVisible] = useState(false);
    const [changeServerAddressModalVisible, setChangeServerAddressModalVisible] = useState(false);

    /**
     * @function handleToggleHideMessages
     * @description Handles the toggle hide messages action
     * @param {boolean} value - The value to set the hide messages parameter to
     */
    const handleToggleHideMessages = async (value) => {
        try {
            setHideMessagesModalVisible(false);
            await onHideMessages(value);
        } catch (error) {
            console.error('Error while changing the hide messages parameter:', error);
        }
    };

    /**
     * @description Functions to open and close the change server address modal
     */
    const openChangeServerAddressModal = () => {
        setChangeServerAddressModalVisible(true);
    };

    const closeChangeServerAddressModal = () => {
        setChangeServerAddressModalVisible(false);
    };

    /**
     * @function handleCleanStorage
     * @description Handles the clean storage action
     */
    const handleCleanStorage = async () => {
        Alert.alert(
            t('titles.confirm'),
            t('messages.confirmCleanStorage'),
            [
                {
                    text: t('buttons.cancel'),
                    style: 'cancel'
                },
                {
                    text: t('buttons.confirm'),
                    onPress: async () => {
                        try {
                            console.log('🧹 Nettoyage du stockage sécurisé...');
                            const result = await cleanSecureStore();
                            if (result) {
                                Alert.alert(
                                    t('titles.success'),
                                    t('messages.storageCleanedSuccess'),
                                    [
                                        {
                                            text: 'OK',
                                            onPress: () => onNavigate && onNavigate(SCREENS.LOGIN)
                                        }
                                    ]
                                );
                            } else {
                                Alert.alert(t('titles.error'), t('messages.storageCleanedError'));
                            }
                        } catch (error) {
                            console.error('❌ Erreur lors du nettoyage du stockage:', error);
                            Alert.alert(t('titles.error'), t('messages.storageCleanedError'));
                        }
                    }
                }
            ]
        );
    };

    return (
        <>
            <Header
                showBackButton={true}
                onBackPress={onBackPress}
            />
            <View style={styles.titleContainer}>
                <Text style={[styles.title, isSmartphone && styles.titleSmartphone]}>Messages</Text>
            </View>
            <View style={[
                styles.configContainer,
                isSmartphone && styles.configContainerSmartphone,
                isLandscape && styles.configContainerLandscape,
            ]}>
                <View style={styles.rowContainer}>
                    <View style={styles.leftContent}>
                        <SettingsCard
                            title="Show/hide messages"
                            iconBackgroundColor={COLORS.burgundy}
                            icon={
                                <Ionicons
                                    name="remove-circle-outline"
                                    size={isSmartphone ? 22 : 28}
                                    color={COLORS.red}
                                />
                            }
                            description="Show or hide the message section of the app"
                            onPress={() => setHideMessagesModalVisible(true)}
                        />
                    </View>
                    <TouchableOpacity
                        style={styles.baseToggle}
                        onPress={() => setHideMessagesModalVisible(true)}
                    >
                        <Text style={[styles.text, isSmartphone && styles.textSmartphone]}>
                            {isMessagesHidden ? 'Hide' : 'Show'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
            <View style={[
                styles.configContainer,
                isSmartphone && styles.configContainerSmartphone,
                isLandscape && styles.configContainerLandscape,
            ]}>
                <View style={styles.rowContainer}>
                    <View style={styles.leftContent}>
                        <SettingsCard
                            title="Change server address"
                            iconBackgroundColor={COLORS.borderColor}
                            icon={
                                <Ionicons
                                    name="server-outline"
                                    size={isSmartphone ? 22 : 28}
                                    color={COLORS.orange}
                                />
                            }
                            description="Change the server address of the app"
                            onPress={openChangeServerAddressModal}
                        />
                    </View>
                </View>
            </View>
            <View style={styles.titleContainer}>
                <Text style={[styles.title, isSmartphone && styles.titleSmartphone]}>Dépannage</Text>
            </View>
            <View style={[
                styles.configContainer,
                isSmartphone && styles.configContainerSmartphone,
                isLandscape && styles.configContainerLandscape,
            ]}>
                <View style={styles.rowContainer}>
                    <View style={styles.leftContent}>
                        <SettingsCard
                            title="Réinitialiser le stockage sécurisé"
                            iconBackgroundColor={COLORS.burgundy}
                            icon={
                                <Ionicons
                                    name="refresh-outline"
                                    size={isSmartphone ? 22 : 28}
                                    color={COLORS.red}
                                />
                            }
                            description="Nettoyer le stockage en cas d'erreurs de déchiffrement"
                            onPress={handleCleanStorage}
                        />
                    </View>
                </View>
            </View>
            <HideMessagesModal
                visible={hideMessagesModalVisible}
                onClose={() => setHideMessagesModalVisible(false)}
                onToggleHideMessages={handleToggleHideMessages}
            />
            <ChangeServerAddressModal
                visible={changeServerAddressModalVisible}
                onClose={closeChangeServerAddressModal}
            />
        </>
    );
};

const styles = StyleSheet.create({
  titleContainer: {
    marginHorizontal: 35,
    marginTop: 12,
  },
  title: {
    color: COLORS.gray300,
    fontFamily: FONTS.medium,
    fontSize: SIZES.fonts.smallTextTabletTablet,
  },
  titleSmartphone: {
    fontSize: SIZES.fonts.smallTextSmartphone,
  },
  configContainer: {
    backgroundColor: COLORS.gray850,
    borderRadius: SIZES.borderRadius.xLarge,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginHorizontal: 15,
    alignSelf: 'center',
    marginVertical: 12,
    borderWidth: 1,
    width: '95%',
  },
  configContainerSmartphone: {
    marginVertical: 8,
  },
  configContainerLandscape: {
    marginHorizontal: 50,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftContent: {
    flex: 1,
  },
  text: {
    color: COLORS.gray600,
    fontSize: SIZES.fonts.textTablet,
    fontWeight: SIZES.fontWeight.regular,
  },
  textSmartphone: {
    fontSize: SIZES.fonts.textSmartphone,
  },
  baseToggle: {
    backgroundColor: COLORS.gray650,
    borderRadius: SIZES.borderRadius.small,
    padding: 8,
    minWidth: 40,
    alignItems: 'center',
  },
});

export default CommonSettings;
