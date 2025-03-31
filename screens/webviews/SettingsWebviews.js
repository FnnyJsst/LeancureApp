import React from 'react';
import { useState } from 'react';
import { ScrollView, View, StyleSheet, BackHandler, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SettingsCard from '../../components/cards/SettingsCard';
import AutoRefreshModal from '../../components/modals/webviews/AutoRefreshModal';
import ReadOnlyModal from '../../components/modals/webviews/ReadOnlyModal';
import PasswordDefineModal from '../../components/modals/webviews/PasswordDefineModal';
import HideMessagesModal from '../../components/modals/common/HideMessagesModal';
import { useDeviceType } from '../../hooks/useDeviceType';
import { SIZES, COLORS, FONTS } from '../../constants/style';
import { SCREENS } from '../../constants/screens';
import { Text } from '../../components/text/CustomText';
import { useTranslation } from 'react-i18next';



/**
 * @component SettingsWebviews
 * @description Displays the settings for the webviews
 * @param {Function} onNavigate - A function to navigate to a screen
 * @param {Array} selectedWebviews - The list of selected channels
 * @param {string} refreshOption - The refresh option
 * @param {Function} handlePasswordSubmit - A function to handle the password submit
 * @param {boolean} isPasswordRequired - A boolean to indicate if the password is required
 * @param {Function} disablePassword - A function to disable the password
 * @param {boolean} isReadOnly - A boolean to indicate if the user is read only
 * @param {Function} toggleReadOnly - A function to toggle the read only mode
 * @param {Function} handleSelectOption - A function to handle the select option
 * @param {boolean} isMessagesHidden - A boolean to indicate if messages are hidden
 * @param {Function} onToggleHideMessages - A function to toggle the hide messages mode
 */
export default function SettingsWebviews({
  onNavigate,
  selectedWebviews,
  refreshOption,
  handlePasswordSubmit,
  isPasswordRequired,
  disablePassword,
  isReadOnly,
  toggleReadOnly,
  handleSelectOption,
  isMessagesHidden,
  onToggleHideMessages,
  testID,
}) {

  // Device type variables
  const { isSmartphone, isLandscape, isSmartphonePortrait } = useDeviceType();

  const [modalVisible, setModalVisible] = useState(false);
  const [isPasswordDefineModalVisible, setPasswordDefineModalVisible] = useState(false);
  const [isReadOnlyModalVisible, setReadOnlyModalVisible] = useState(false);
  const [hideMessagesModalVisible, setHideMessagesModalVisible] = useState(false);

  const { t } = useTranslation();

  /**
   * @function handleQuitApp
   * @description Handles the quit app action
   */
  const handleQuitApp = () => {
    BackHandler.exitApp();
  };

  /**
   * @functions
   * @description Open and close the different modals
   */
  const openModal = () => setModalVisible(true);

  const openPasswordDefineModal = () => setPasswordDefineModalVisible(true);

  const closePasswordDefineModal = () => setPasswordDefineModalVisible(false);

  const openReadOnlyModal = () => setReadOnlyModalVisible(true);

  const closeReadOnlyModal = () => setReadOnlyModalVisible(false);

  /**
   * @function handleBackPress
   * @description Handles the arrow back button
   */
  const handleBackPress = () => {
    if (selectedWebviews && selectedWebviews.length > 0) {
      onNavigate(SCREENS.WEBVIEW);
    } else {
      onNavigate(SCREENS.NO_URL);
    }
  };

  /**
   * @function formatRefreshOption
   * @description Formats the refresh option and displays it in a readable format
   * @param {string} option - The refresh option
   * @returns {string} - The formatted refresh option
   */
  const formatRefreshOption = (option) => {
    if (!option || option === 'never') {
      return t('modals.webview.refresh.never');
    }

    const match = option.match(/every (\d+) (\w+)/i);
    if (!match) {
      if (option === 'every hour') return t('modals.webview.refresh.every1h');
      if (option === 'every day') return t('modals.webview.refresh.everyDay');
      if (option === 'every minute') return t('modals.webview.refresh.every1min');
      return option;
    }

    const [_, number, unit] = match;
    const key = unit.includes('hour')
      ? `every${number}h`
      : `every${number}min`;

    return t(`modals.webview.refresh.${key}`);
  };

  /**
   * @function handleToggleHideMessages
   * @description Handles the toggle hide messages action
   * @param {boolean} value - The value to toggle
   */
  const handleToggleHideMessages = async (value) => {
    try {
      setHideMessagesModalVisible(false);
      await onToggleHideMessages(value);
    } catch (error) {
      throw error;
    }
  };

  return (
    <View testID={testID}>
      <ScrollView showsVerticalScrollIndicator={true}>
        <View style={styles.customHeaderContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
            testID="back-button"
          >
            <Ionicons
              name="close-outline"
              size={isSmartphone ? 24 : 28}
              color={COLORS.white}
            />
          </TouchableOpacity>
        </View>

        <View
          testID={testID}
          style={[
          styles.pageContainer,
          isSmartphonePortrait && styles.pageContainerSmartphonePortrait,
        ]}>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, isSmartphone && styles.titleSmartphone]}>
              {t('titles.app')}
            </Text>
          </View>
          <View style={[
            styles.configContainer,
            isSmartphone && styles.configContainerSmartphone,
            isLandscape && styles.configContainerLandscape,
          ]}>
            <SettingsCard
              title={t('settings.webview.quit')}
              iconBackgroundColor={COLORS.burgundy}
              icon={
                <Ionicons
                  name="exit-outline"
                  size={isSmartphone ? 22 : 28}
                  color={COLORS.red}
                />
              }
              description={t('settings.webview.quitDescription')}
              onPress={handleQuitApp}
              testID="quit-button"
            />
          </View>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, isSmartphone && styles.titleSmartphone]}>
              {t('titles.channels')}
            </Text>
          </View>
          <View style={[
            styles.configContainer,
            isSmartphone && styles.configContainerSmartphone,
            isLandscape && styles.configContainerLandscape,
          ]}>
            <SettingsCard
              title={t('settings.webview.management')}
              description={t('settings.webview.managementDescription')}
              icon={<Ionicons name="build-outline" size={isSmartphone ? 22 : 28} color={COLORS.orange} />}
              onPress={() => onNavigate(SCREENS.WEBVIEWS_MANAGEMENT)}
            />
            <View style={styles.separator} />
            <View style={styles.rowContainer}>
              <View style={styles.leftContent}>
                <SettingsCard
                  title={t('settings.webview.autoRefresh')}
                  description={t('settings.webview.autoRefreshDescription')}
                  icon={<Ionicons name="reload-outline" size={isSmartphone ? 22 : 28} color={COLORS.orange} />}
                  onPress={openModal}
                  testID="open-auto-refresh-button"
                />
              </View>
              <TouchableOpacity
                style={styles.baseToggle}
                onPress={openModal}
              >
                <Text style={[
                  styles.text,
                  isSmartphone && styles.textSmartphone,
                ]}>
                  {formatRefreshOption(refreshOption)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, isSmartphone && styles.titleSmartphone]}>
              {t('titles.security')}
            </Text>
          </View>
          <View style={[
            styles.configContainer,
            isSmartphone && styles.configContainerSmartphone,
            isLandscape && styles.configContainerLandscape,
          ]}>
            <View style={styles.rowContainer}>
              <View style={styles.leftContent}>
                <SettingsCard
                  title={t('settings.webview.readOnly')}
                  description={t('settings.webview.readOnlyDescription')}
                  icon={<Ionicons name="eye-outline" size={isSmartphone ? 22 : 28} color={COLORS.orange} />}
                  onPress={openReadOnlyModal}
                  testID="open-read-only-button"
                />
              </View>
              <TouchableOpacity
                style={styles.baseToggle}
                onPress={openReadOnlyModal}
              >
                <Text style={[
                  styles.text,
                  isSmartphone && styles.textSmartphone,
                ]}>
                  {isReadOnly ? t('buttons.yes') : t('buttons.no')}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.separator} />
            <View style={styles.rowContainer}>
              <View style={styles.leftContent}>
                <SettingsCard
                  title={t('settings.webview.password')}
                  description={t('settings.webview.passwordDescription')}
                  icon={<Ionicons name="lock-closed-outline" size={isSmartphone ? 22 : 28} color={COLORS.orange} />}
                  onPress={openPasswordDefineModal}
                  testID="open-password-button"
                />
              </View>
              <TouchableOpacity
                style={styles.baseToggle}
                onPress={openPasswordDefineModal}
              >
                <Text style={[
                  styles.text,
                  isSmartphone && styles.textSmartphone,
                ]}>
                  {isPasswordRequired ? t('buttons.yes') : t('buttons.no')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{t('titles.messages')}</Text>
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
                      name="remove-circle-outline"
                      size={isSmartphone ? 22 : 28}
                      color={COLORS.red}
                    />
                  }
                  description={t('settings.common.showHideDescription')}
                  onPress={() => setHideMessagesModalVisible(true)}
                  testID="open-hide-messages-button"
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
        </View>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, isSmartphone && styles.titleSmartphone]}>
            {t('titles.version') + ' 1.0.0'}
          </Text>
        </View>
      </ScrollView>
      {/* Modals */}
      <AutoRefreshModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelectOption={handleSelectOption}
        testID={testID}
      />
      <ReadOnlyModal
        visible={isReadOnlyModalVisible}
        onClose={closeReadOnlyModal}
        onToggleReadOnly={toggleReadOnly}
        testID={testID}
      />
      <PasswordDefineModal
        visible={isPasswordDefineModalVisible}
        onClose={closePasswordDefineModal}
        onSubmitPassword={handlePasswordSubmit}
        onDisablePassword={disablePassword}
        testID="password-define-modal"
      />
        <HideMessagesModal
          visible={hideMessagesModalVisible}
          onClose={() => setHideMessagesModalVisible(false)}
          onToggleHideMessages={handleToggleHideMessages}
        />
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  pageContainerSmartphonePortrait: {
    paddingHorizontal: 4,
  },
  settingsContentContainer: {
    flex: 1,
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
    paddingHorizontal: 14,
    paddingVertical: 10,
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
  customHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  backButton: {
    marginRight: 15,
    marginTop: 10,
  },
  titleContainer: {
    marginHorizontal: 35,
    marginTop: 12,
  },
  title: {
    color: COLORS.gray300,
    fontFamily: FONTS.medium,
    fontSize: SIZES.fonts.smallTextTablet,
  },
  titleSmartphone: {
    fontSize: SIZES.fonts.smallTextSmartphone,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.gray700,
    marginVertical: 12,
  },
});
