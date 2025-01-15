import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, BackHandler, TouchableOpacity } from 'react-native';
import Header from '../../components/Header';
import TitleSettings from '../../components/text/TitleSettings';
import SettingsButton from '../../components/buttons/SettingsButton';

import Ionicons from '@expo/vector-icons/Ionicons';
import AutoRefreshModal from '../../components/modals/webviews/AutoRefreshModal';
import ReadOnly from '../../components/modals/webviews/ReadOnly';
import PasswordModal from '../../components/modals/webviews/PasswordModal';
import { useDeviceType } from '../../hooks/useDeviceType';
import { SIZES, COLORS } from '../../constants/style';
import { SCREENS } from '../../constants/screens';
/**
 * Settings Screen Component
 * Displays the settings page
 **/
export default function SettingsScreen({ 
  onNavigate, 
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

  const accessMessages = () => {
    onNavigate(SCREENS.LOGIN);
  };

  const formatRefreshOption = (option) => {
    if (!option || option === 'never') return 'never';
    
    // Extraire le nombre et l'unité
    const match = option.match(/every (\d+) (\w+)/i);
    if (!match) {
      if (option === 'every hour') return '1h';
      if (option === 'every day') return '24h';
      if (option === 'every minute') return '1min';
      return option;
    }

    const [_, number, unit] = match;
    
    // Formater selon l'unité
    if (unit.includes('hour')) {
      return `${number}h`;
    } else if (unit.includes('minute')) {
      return `${number}min`;
    }
    
    return option;
  };

  return (
    <View>
      <ScrollView 
        showsVerticalScrollIndicator={true}
      >
        <Header 
          onBackPress={handleBackPress} 
        />
        <View style={[
          styles.pageContainer,
          isSmartphonePortrait && styles.pageContainerSmartphonePortrait
        ]}>
          <View style={styles.headerContainer}>
            <Text style={[
              styles.header,
              isSmartphone && styles.headerSmartphone
            ]}>Settings</Text>
          </View>
          <View style={[
            styles.configContainer,
            styles.configContainerTablet,
            isSmartphone && styles.configContainerSmartphone,
            isLandscape && styles.configContainerLandscape
          ]}>
            <SettingsButton
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
            <SettingsButton
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
                <SettingsButton
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
                <SettingsButton
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
                <SettingsButton
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
            <SettingsButton
              title="Access messages"
              icon={<Ionicons name="mail-outline" size={isSmartphone ? 22 : 28} color={COLORS.orange} />}
              description="Access to the messages section"
              onPress={accessMessages}
            />
          </View>
          <View style={styles.separatorContainer}>
          </View>
          <TitleSettings title="Information" />
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

  // HEADER CONTAINER
  headerContainer: {
    marginBottom: 20,
    marginTop: 20,
    marginLeft: 30,
    alignItems: 'flex-start',
  },
  header: {
    color: COLORS.white,
    fontSize: SIZES.fonts.headerTablet,
    fontWeight: SIZES.fontWeight.bold,
  },
  headerSmartphone: {
    fontSize: SIZES.fonts.headerSmartphone,
  },

  // CONFIG CONTAINER
  configContainer: {
    backgroundColor: COLORS.gray800,
    borderRadius: SIZES.borderRadius.small,
    paddingVertical: 20,
    paddingHorizontal: 15,
    marginHorizontal: 15,
    alignSelf: 'center',
    marginVertical: 8,
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
  },
  versionTextSmartphoneLandscape: {
    marginBottom: 40,
  },
});