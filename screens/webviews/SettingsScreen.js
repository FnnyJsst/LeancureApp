import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, BackHandler, TouchableOpacity } from 'react-native';
import Header from '../../components/Header';
import TitleSettings from '../../components/text/TitleSettings';
import SettingsButton from '../../components/buttons/SettingsButton';
import Separator from '../../components/Separator';
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

  return (
    <View style={[
      styles.pageContainer,
      isSmartphonePortrait && styles.pageContainerSmartphonePortrait,
      isLandscape && styles.pageContainerLandscape
    ]}>
      <ScrollView 
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.settingsContentContainer}>
          <Header 
            title="SETTINGS" 
            onBackPress={handleBackPress} 
          />
          <TitleSettings title="GENERAL" />
          <View style={[
            styles.configContainerTablet,
            isSmartphone && styles.configContainerSmartphone
          ]}>
            <SettingsButton
              title="Quit app"
              icon={<Ionicons name="exit-outline" size={isSmartphone ? 22 : 28} color={COLORS.lightGray} />}
              onPress={handleQuitApp}
            />
          </View>
          
          <TitleSettings title="CHANNELS MANAGEMENT" />
          <View style={[
            styles.configContainerTablet,
            isSmartphone && styles.configContainerSmartphone
          ]}>
            <SettingsButton
              title="Channels Management"
              icon={<Ionicons name="build-outline" size={isSmartphone ? 22 : 28} color={COLORS.lightGray} />}
              onPress={() => onNavigate('ChannelsManagementScreen')}
            />
          </View>

          <View style={[
            styles.configContainerTablet,
            isSmartphone && styles.configContainerSmartphone
          ]}>
            <View style={styles.rowContainer}>
              <View style={styles.leftContent}>
                <SettingsButton
                  title="Auto-refresh"
                  icon={<Ionicons name="reload-outline" size={isSmartphone ? 22 : 28} color={COLORS.lightGray} />}
                  onPress={openModal}
                />
              </View>
              <Text style={[
                styles.text,
                isSmartphone && styles.textSmartphone,
              ]}>
                {refreshOption || 'never'}
              </Text>
            </View>
          </View>
          <View style={[
            styles.configContainerTablet,
            isSmartphone && styles.configContainerSmartphone
          ]}>
            <View style={styles.rowContainer}>
              <View style={styles.leftContent}>
                <SettingsButton
                  title="Read-only access"
                  icon={<Ionicons name="eye-outline" size={isSmartphone ? 22 : 28} color={COLORS.lightGray} />}
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
          <TitleSettings title="SECURITY" />
          <View style={[
            isTablet && styles.configContainerTablet,
            isSmartphone && styles.configContainerSmartphone
          ]}>
            <View style={styles.rowContainer}>
              <View style={styles.leftContent}>
                <SettingsButton
                  title="Password"
                  icon={<Ionicons name="lock-closed-outline" size={isSmartphone ? 22 : 28} color={COLORS.lightGray} />}
                  onPress={openPasswordModal}
                />
              </View>
              <View>
                <Text style={[
                  styles.text,
                  isSmartphone && styles.textSmartphone,
                ]}>
                  {isPasswordRequired ? "A password has been defined" : "No password has been defined"}
                </Text>
              </View>
            </View>
          </View>
              
          <View style={styles.separatorContainer}>
            <Separator width={isSmartphone ? "95%" : "91%"} />
          </View>
          
          <TitleSettings title="INFORMATION" />
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
    paddingHorizontal: 10,
  },
  pageContainerSmartphonePortrait: {
    paddingHorizontal: 4,
  },
  pageContainerLandscape: {
    paddingHorizontal: 25,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  settingsContentContainer: {
    flex: 1,
    paddingTop: '3%',
  },

  // CONFIG CONTAINER
  configContainerTablet: {
    minHeight: 58,
  },
  configContainerSmartphone: {
    minHeight: 45,
    marginVertical: 5,
  },

  // ROW CONTAINER
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: '3%',
  },
  leftContent: {
    flex: 1,
  },

  // TEXT
  text: {
    color: COLORS.gray,
    fontSize: SIZES.fonts.medium,
    fontWeight: SIZES.fontWeight.regular,
  },
  textSmartphone: {
    fontSize: SIZES.fonts.small, 
  },

  // TOGGLE BUTTON
  baseToggle: {
    backgroundColor: COLORS.buttonGray,
    borderRadius: 6,
    padding: 8,
    minWidth: 50,
    alignItems: 'center',
  },

  // VERSION TEXT
  versionTextTablet: {
    fontSize: SIZES.fonts.medium,
    marginLeft: 50,
    fontWeight: SIZES.fontWeight.light,
  },
  versionTextSmartphone: {
    fontSize: SIZES.fonts.xSmall,
    marginLeft: 20,
  },
  versionTextSmartphoneLandscape: {
    marginBottom: 40,
  },

  // SEPARATOR
  separatorContainer: {
    marginTop: 8,
    width: '105%',
    alignSelf: 'center',
  },
});