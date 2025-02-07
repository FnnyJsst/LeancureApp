import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, BackHandler, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SettingsCard from '../../components/cards/SettingsCard';
import AutoRefreshModal from '../../components/modals/webviews/AutoRefreshModal';
import ReadOnlyModal from '../../components/modals/webviews/ReadOnlyModal';
import PasswordDefineModal from '../../components/modals/webviews/PasswordDefineModal';
import { useDeviceType } from '../../hooks/useDeviceType';
import { SIZES, COLORS } from '../../constants/style';
import { SCREENS } from '../../constants/screens';


/**
 * @component SettingsWebviews
 * @description Displays the settings for the webviews
 * @param {Function} onNavigate - A function to navigate to a screen
 * @param {Function} onSettingsAccess - A function to handle the settings access
 * @param {Array} selectedWebviews - The list of selected channels
 * @param {string} refreshOption - The refresh option
 * @param {Function} handlePasswordSubmit - A function to handle the password submit
 * @param {boolean} isPasswordRequired - A boolean to indicate if the password is required
 * @param {Function} disablePassword - A function to disable the password
 * @param {boolean} isReadOnly - A boolean to indicate if the user is read only
 * @param {Function} toggleReadOnly - A function to toggle the read only mode
 * @param {Function} handleSelectOption - A function to handle the select option
 * @example
 * <SettingsWebviews onNavigate={(screen) => navigate(screen)} onSettingsAccess={onSettingsAccess} selectedWebviews={selectedWebviews} refreshOption={refreshOption} handlePasswordSubmit={handlePasswordSubmit} isPasswordRequired={isPasswordRequired} disablePassword={disablePassword} isReadOnly={isReadOnly} toggleReadOnly={toggleReadOnly} handleSelectOption={handleSelectOption} />
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
  handleSelectOption
}) {

  // Device type variables
  const { isTablet, isSmartphone, isLandscape, isSmartphonePortrait } = useDeviceType();
  
  // State management
  const [modalVisible, setModalVisible] = useState(false);
  const [isPasswordDefineModalVisible, setPasswordDefineModalVisible] = useState(false);
  const [isReadOnlyModalVisible, setReadOnlyModalVisible] = useState(false);

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
   * @function accessMessages
   * @description Accesses the messages section
   */
  const accessMessages = () => {
    onNavigate(SCREENS.LOGIN);
  };

  /**
   * @function formatRefreshOption
   * @description Formats the refresh option and displays it in a readable format
   * @param {string} option - The refresh option
   * @returns {string} - The formatted refresh option
   */
  const formatRefreshOption = (option) => {
    // Check if the option is not null and is not 'never' 
    if (!option || option === 'never') return 'never';
    // Extract the number and the unit
    const match = option.match(/every (\d+) (\w+)/i);
    // Check if the match is not null
    if (!match) {
      if (option === 'every hour') return '1h';
      if (option === 'every day') return '24h';
      if (option === 'every minute') return '1min';
      return option;
    }

    const [_, number, unit] = match;
    
    // Format the option depending on the unit
    if (unit.includes('hour')) {
      return `${number}h`;
    } else if (unit.includes('minute')) {
      return `${number}min`;
    }
    
    return option;
  };

  return (
    <View>
      <ScrollView showsVerticalScrollIndicator={true}>
        <View style={styles.customHeaderContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <Ionicons 
              name="chevron-back-outline" 
              size={isSmartphone ? 24 : 28} 
              color={COLORS.white} 
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
        <View style={[
          styles.pageContainer,
          isSmartphonePortrait && styles.pageContainerSmartphonePortrait
        ]}>
          <View style={[
            styles.configContainer,
            styles.configContainerTablet,
            isSmartphone && styles.configContainerSmartphone,
            isLandscape && styles.configContainerLandscape
          ]}>
            <SettingsCard
              title="Quit app"
              icon={
                <View style={styles.quitIconBackground}>
                  <Ionicons 
                    name="exit-outline" 
                    size={isSmartphone ? 22 : 28} 
                    color={COLORS.red} 
                  />
                </View>
              }
              description="Quit the app and go back to the home screen"
              onPress={handleQuitApp}
            />
          </View>
          <View style={[
            styles.configContainer,
            styles.configContainerTablet,
            isSmartphone && styles.configContainerSmartphone,
            isLandscape && styles.configContainerLandscape
          ]}>
            <SettingsCard
              title="Channels Management"
              description="Access to imported webviews"
              icon={<Ionicons name="build-outline" size={isSmartphone ? 22 : 28} color={COLORS.orange} />}
              onPress={() => onNavigate(SCREENS.WEBWIEWS_MANAGEMENT)}
            />
          </View>
          <View style={[
            styles.configContainer,
            styles.configContainerTablet,
            isSmartphone && styles.configContainerSmartphone,
            isLandscape && styles.configContainerLandscape
          ]}>
            <View style={styles.rowContainer}>
              <View style={styles.leftContent}>
                <SettingsCard
                  title="Auto-refresh"
                  description="Define the auto-refresh interval for the webviews"
                  icon={<Ionicons name="reload-outline" size={isSmartphone ? 22 : 28} color={COLORS.orange} />}
                  onPress={openModal}
                />
              </View>
              <TouchableOpacity 
                style={styles.baseToggle} 
                onPress={openModal}
              >
                <Text style={[
                  styles.text,
                  isSmartphone && styles.textSmartphone 
                ]}>
                  {formatRefreshOption(refreshOption)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={[
            styles.configContainer,
            styles.configContainerTablet,
            isSmartphone && styles.configContainerSmartphone,
            isLandscape && styles.configContainerLandscape
          ]}>
            <View style={styles.rowContainer}>
              <View style={styles.leftContent}>
                <SettingsCard
                  title="Read-only access"
                  description="Access to webviews without the ability to modify them"
                  icon={<Ionicons name="eye-outline" size={isSmartphone ? 22 : 28} color={COLORS.orange} />}
                  onPress={openReadOnlyModal}
                />
              </View>
              <TouchableOpacity 
                style={styles.baseToggle} 
                onPress={openReadOnlyModal}
              >
                  <Text style={[
                    styles.text,
                    isSmartphone && styles.textSmartphone 
                  ]}>
                  {isReadOnly ? 'Yes' : 'No'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={[styles.configContainer,
            isTablet && styles.configContainerTablet,
            isSmartphone && styles.configContainerSmartphone,
            isLandscape && styles.configContainerLandscape
          ]}>
            <View style={styles.rowContainer}>
              <View style={styles.leftContent}>
                <SettingsCard
                  title="Password"
                  description="Define a password to access the settings"
                  icon={<Ionicons name="lock-closed-outline" size={isSmartphone ? 22 : 28} color={COLORS.orange} />}
                  onPress={openPasswordDefineModal}
                />
              </View>
              <TouchableOpacity 
                style={styles.baseToggle} 
                onPress={openPasswordDefineModal}
              >
                <Text style={[
                  styles.text,
                  isSmartphone && styles.textSmartphone 
                ]}>
                  {isPasswordRequired ? 'Yes' : 'No'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={[
            styles.configContainer,
            styles.configContainerTablet,
            isSmartphone && styles.configContainerSmartphone,
            isLandscape && styles.configContainerLandscape
          ]}>
            <SettingsCard
              title="Access messages"
              icon={<Ionicons name="mail-outline" size={isSmartphone ? 22 : 28} color={COLORS.orange} />}
              description="Access to the messages section"
              onPress={accessMessages}
            />
          </View>
        </View>
      </ScrollView>
      {/* Modals */}
      <AutoRefreshModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelectOption={handleSelectOption}
      />
      <ReadOnlyModal
        visible={isReadOnlyModalVisible}
        onClose={closeReadOnlyModal}
        onToggleReadOnly={toggleReadOnly}
      />
      <PasswordDefineModal 
        visible={isPasswordDefineModalVisible}
        onClose={closePasswordDefineModal} 
        onSubmitPassword={handlePasswordSubmit}
        onDisablePassword={disablePassword}
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
    paddingTop: '3%',
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
    borderColor: COLORS.gray650,
  },
  configContainerTablet: {
    width: '95%',
  },
  configContainerSmartphone: {
    width: '95%',
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
  customHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#271E1E',
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: SIZES.fonts.subtitleTablet,
    fontWeight: SIZES.fontWeight.bold,
  },
  quitIconBackground: {
    backgroundColor: '#502e2e',
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});