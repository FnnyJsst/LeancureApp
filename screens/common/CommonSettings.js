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
import TooltipModal from '../../components/modals/webviews/TooltipModal';
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
    const [tooltipVisible, setTooltipVisible] = useState(false);
    const [activeTooltip, setActiveTooltip] = useState(null);

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

    const handleShowTooltip = (tooltipKey) => {
        setActiveTooltip(tooltipKey);
        setTooltipVisible(true);
    };

    return (
        <>
            <Header
                showBackButton={true}
                onBackPress={onBackPress}
            />
            <View style={styles.titleContainer}>
                <Text style={[styles.title, isSmartphone && styles.titleSmartphone]}>{t('titles.messages')}</Text>
                <TouchableOpacity
                    onPress={() => handleShowTooltip('hideMessages')}
                    style={styles.infoIcon}
                >
                    <Ionicons name="information-circle-outline" size={isSmartphone ? 16 : 18} color={COLORS.gray300} />
                </TouchableOpacity>
            </View>
            <View style={[
                styles.configContainer,
                isSmartphone && styles.configContainerSmartphone,
                isLandscape && styles.configContainerLandscape,
            ]}>
                <View style={styles.rowContainer}>
                    <View style={styles.leftContent}>
                        <SettingsCard
                            title={t('settings.common.showHide')}
                            iconBackgroundColor={COLORS.borderColor}
                            icon={
                                <Ionicons
                                    name="mail-outline"
                                    size={isSmartphone ? 22 : 28}
                                    color={COLORS.orange}
                                />
                            }
                            description={t('settings.common.showHideDescription')}
                            onPress={() => setHideMessagesModalVisible(true)}
                        />
                    </View>
                    <TouchableOpacity
                        style={styles.baseToggle}
                        onPress={() => setHideMessagesModalVisible(true)}
                    >
                        <Text style={[styles.text, isSmartphone && styles.textSmartphone]}>
                            {isMessagesHidden ? t('buttons.hide') : t('buttons.show')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.titleContainer}>
                <Text style={[styles.title, isSmartphone && styles.titleSmartphone]}>{t('titles.server')}</Text>
                <TouchableOpacity
                    onPress={() => handleShowTooltip('server')}
                    style={styles.infoIcon}
                >
                    <Ionicons name="information-circle-outline" size={isSmartphone ? 16 : 18} color={COLORS.gray300} />
                </TouchableOpacity>
            </View>
            <View style={[
                styles.configContainer,
                isSmartphone && styles.configContainerSmartphone,
                isLandscape && styles.configContainerLandscape,
            ]}>
                <View style={styles.rowContainer}>
                    <View style={styles.leftContent}>
                        <SettingsCard
                            title={t('settings.common.changeServer')}
                            iconBackgroundColor={COLORS.borderColor}
                            icon={
                                <Ionicons
                                    name="server-outline"
                                    size={isSmartphone ? 22 : 28}
                                    color={COLORS.orange}
                                />
                            }
                            description={t('settings.common.changeServerDescription')}
                            onPress={openChangeServerAddressModal}
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
            <TooltipModal
                visible={tooltipVisible}
                onClose={() => setTooltipVisible(false)}
                message={activeTooltip ? t(`tooltips.${activeTooltip}.message`) : ''}
            />
        </>
    );
};

const styles = StyleSheet.create({
  titleContainer: {
    marginHorizontal: 35,
    marginTop: 12,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  infoIcon: {
    padding: 4,
  },
});

export default CommonSettings;
