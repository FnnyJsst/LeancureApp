import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { COLORS, SIZES } from '../../constants/style'; 
import { useDeviceType } from '../../hooks/useDeviceType';
import Header from '../../components/Header';
import SettingsCard from '../../components/cards/SettingsCard';
import { Ionicons } from '@expo/vector-icons';
import { SCREENS } from '../../constants/screens';
import Sidebar from '../../components/navigation/Sidebar';

//This screen displays the settings related to the messages
export default function SettingsMessage({ onNavigate, isExpanded, setIsExpanded }) {
  const { isSmartphone, isLandscape } = useDeviceType();
  const [currentSection, setCurrentSection] = useState('settings');

  const toggleMenu = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      <Header 
        showMenuIcon={true} 
        // showAccountImage={true} 
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
          isLandscape && styles.configContainerLandscape
        ]}>
          <SettingsCard
            title="Logout"
            description="Logout and go back to login screen"
            icon={<Ionicons name="log-out-outline" size={isSmartphone ? 22 : 28} color={COLORS.orange} />}
            onPress={() => {
              onNavigate('LOGIN');
            }}
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: COLORS.gray900,
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
  // CONFIG CONTAINER
  configContainer: {
    backgroundColor: COLORS.gray800,
    borderRadius: SIZES.borderRadius.small,
    paddingVertical: 20,
    paddingHorizontal: 15,
    marginHorizontal: 15,
    alignSelf: 'center',
    marginVertical: 8,
    width: '95%'
  },
  configContainerLandscape: {
    marginHorizontal: 50,
  },
});