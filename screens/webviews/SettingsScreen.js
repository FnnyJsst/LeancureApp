import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, BackHandler, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import TitleSettings from '../../components/text/TitleSettings';
import SettingsCard from '../../components/cards/SettingsCard';
import AutoRefreshModal from '../../components/modals/webviews/AutoRefreshModal';
import ReadOnly from '../../components/modals/webviews/ReadOnly';
import PasswordModal from '../../components/modals/webviews/PasswordModal';
import { useDeviceType } from '../../hooks/useDeviceType';
import { SIZES, COLORS } from '../../constants/style';
import { SCREENS } from '../../constants/screens';
/**
 * Settings Screen Component
 * Displays the settings for the webviews
 **/
export default function SettingsScreen({ 
  onNavigate, 
  onSettingsAccess, 
  selectedChannels, 
  refreshOption,
  handlePasswordSubmit,  
  isPasswordRequired, 
  disablePassword, 
  isReadOnly,
  toggleReadOnly,
  handleSelectOption
}) {

  // Device type variables
  const { isTablet, isSmartphone, isLandscape, isSmartphoneLandscape, isSmartphonePortrait } = useDeviceType();
  
  // State management
  const [modalVisible, setModalVisible] = useState(false);
  const [isPasswordModalVisible, setPasswordModalVisible] = useState(false);
  const [isReadOnlyModalVisible, setReadOnlyModalVisible] = useState(false);

  // Handle quit app
  const handleQuitApp = () => {
    BackHandler.exitApp();
  };

  // Handlers to open and close modals
  const openModal = () => setModalVisible(true);
  const openPasswordModal = () => setPasswordModalVisible(true);
  const closePasswordModal = () => setPasswordModalVisible(false);
  const openReadOnlyModal = () => setReadOnlyModalVisible(true);
  const closeReadOnlyModal = () => setReadOnlyModalVisible(false);

  // Function to handle the arrow back button
  const handleBackPress = () => {
    if (selectedChannels && selectedChannels.length > 0) {
      onNavigate(SCREENS.WEBVIEW);
    } else {
      onNavigate(SCREENS.NO_URL);
    }
  };

  // Function to access the messages section
  const accessMessages = () => {
    onNavigate(SCREENS.LOGIN);
  };

  // Function to format the refresh option and display it in a readable format
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
              icon={<Ionicons name="exit-outline" size={isSmartphone ? 22 : 28} color={COLORS.orange} />}
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
              onPress={() => onNavigate(SCREENS.CHANNELS_MANAGEMENT)}
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
                  {/* Display the formatted refresh option */}
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
                  //
                  onPress={openReadOnlyModal}
                />
              </View>
              <TouchableOpacity 
                style={styles.baseToggle} 
                // Open the read only modal
                onPress={openReadOnlyModal}
              >
                  <Text style={[
                    styles.text,
                    isSmartphone && styles.textSmartphone 
                  ]}>
                  {/* Display if the user is read only mode is active or not */}
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
                  onPress={openPasswordModal}
                />
              </View>
              <TouchableOpacity 
                style={styles.baseToggle} 
                onPress={openPasswordModal}
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
          <View style={styles.separatorContainer}>
          </View>
          <TitleSettings title="Informations" />
          <Text style={[
            styles.text,
            isTablet ? styles.versionTextTablet : styles.versionTextSmartphone,
            isSmartphoneLandscape && styles.versionTextSmartphoneLandscape
          ]}>
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>
  
      <AutoRefreshModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelectOption={handleSelectOption}
      />
      <ReadOnly
        visible={isReadOnlyModalVisible}
        onClose={closeReadOnlyModal}
        onToggleReadOnly={toggleReadOnly}
      />
      <PasswordModal 
        visible={isPasswordModalVisible}
        onClose={closePasswordModal} 
        onSubmitPassword={handlePasswordSubmit}
        onDisablePassword={disablePassword}
      />
    </View>
  );
}

const styles = StyleSheet.create({

  //MAIN CONTAINER
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

  // CONFIG CONTAINER
  configContainer: {
    backgroundColor: COLORS.gray800,
    borderRadius: SIZES.borderRadius.large,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginHorizontal: 15,
    alignSelf: 'center',
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#403430',
  },
  configContainerTablet: {
    // minHeight: 58,
    width: '95%',
  },
  configContainerSmartphone: {
    // minHeight: 45,
    width: '95%',
  },
  configContainerLandscape: {
    marginHorizontal: 50,
  },

  // ROW CONTAINER
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftContent: {
    flex: 1,
  },

  // TEXT
  text: {
    color: COLORS.gray600,
    fontSize: SIZES.fonts.textTablet,
    fontWeight: SIZES.fontWeight.regular,
  },
  textSmartphone: {
    fontSize: SIZES.fonts.textSmartphone, 
  },

  // TOGGLE BUTTON
  baseToggle: {
    backgroundColor: COLORS.gray650,
    borderRadius: SIZES.borderRadius.small,
    padding: 8,
    minWidth: 40,
    alignItems: 'center',
  },

  // VERSION TEXT
  versionTextTablet: {
    fontSize: SIZES.fonts.textTablet,
    marginLeft: 50,
    fontWeight: SIZES.fontWeight.light,
  },
  versionTextSmartphone: {
    fontSize: SIZES.fonts.textSmartphone,
    marginLeft: 30,
    marginTop: -5
  },
  versionTextSmartphoneLandscape: {
    marginBottom: 40,
  },

  customHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 5,
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
});