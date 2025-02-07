import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { COLORS, SIZES } from '../../constants/style'; 
import { useDeviceType } from '../../hooks/useDeviceType';
import Header from '../../components/Header';
import SettingsCard from '../../components/cards/SettingsCard';
import { Ionicons } from '@expo/vector-icons';
import Sidebar from '../../components/navigation/Sidebar';
import TimeOutModal from '../../components/modals/chat/TimeOutModal';

/**
 * @component SettingsMessage
 * @description This screen displays the settings related to the messages
 * @param {Function} onNavigate - A function to navigate to a screen
 * @param {boolean} isExpanded - A boolean to indicate if the menu is expanded
 * @param {Function} setIsExpanded - A function to set the isExpanded state
 * @param {Function} handleChatLogout - A function to handle logout
 * 
 * @example
 * <SettingsMessage onNavigate={(screen) => navigate(screen)} isExpanded={isExpanded} setIsExpanded={setIsExpanded} handleChatLogout={handleChatLogout} />
 */
export default function SettingsMessage({ onNavigate, isExpanded, setIsExpanded, handleChatLogout }) {
  const { isSmartphone, isLandscape } = useDeviceType();
  const [currentSection, setCurrentSection] = useState('settings');
  const [timeOutModal, setTimeOutModal] = useState(false);

  /**
   * @function toggleMenu
   * @description Toggles the menu
   */
  const toggleMenu = () => {
    setIsExpanded(!isExpanded);
  };

  const openTimeOutModal = () => {
    setTimeOutModal(true);
  };

  const closeTimeOutModal = () => {
    setTimeOutModal(false);
  };

  return (
    <>
      <Header 
        showMenuIcon={true} 
        onNavigate={onNavigate} 
        toggleMenu={toggleMenu}
      />
      <Sidebar 
        onChannelSelect={() => {}}
        selectedGroup={null}
        onGroupSelect={() => {}}
        isExpanded={isExpanded}
        toggleMenu={toggleMenu}
        onNavigate={onNavigate}
        currentSection={currentSection}
        onLogout={handleChatLogout}
      />
      <View style={styles.pageContainer}>
        <View style={styles.headerContainer}>
          <Text style={[
            styles.header,
            isSmartphone && styles.headerSmartphone
          ]}>Settings</Text>
        </View>
        <View style={[
          styles.configContainer,
          isSmartphone && styles.configContainerSmartphone,
          isLandscape && styles.configContainerLandscape
        ]}>
          <SettingsCard
            title="Session Timeout"
            icon={
              <View style={styles.quitIconBackground}>
                <Ionicons 
                  name="exit-outline" 
                  size={isSmartphone ? 22 : 28} 
                  color={COLORS.red} 
                />
              </View>
            }
            description="Define the time after which the session will be logged out"
            onPress={openTimeOutModal}
          />
        </View>
      </View>
      <TimeOutModal
        visible={timeOutModal}
        onClose={closeTimeOutModal}
      />
    </>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  headerContainer: {
    marginBottom: 0,
    marginTop: 20,
    marginLeft: 30,
    justifyContent: 'flex-start',
  }, 
  header: {
    color: COLORS.white,
    fontSize: SIZES.fonts.headerTablet,
    fontWeight: SIZES.fontWeight.bold,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  headerSmartphone: {
    fontSize: SIZES.fonts.headerSmartphone,
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
    width: '95%',
  },
  configContainerSmartphone: {
    marginVertical: 8,
  },
  configContainerLandscape: {
    marginHorizontal: 50,
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