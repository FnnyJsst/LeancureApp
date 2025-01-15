import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { COLORS, SIZES } from '../../constants/style'; 
import Card from '../../components/Card';
import Navbar from '../../components/navigation/Navbar';
import { useDeviceType } from '../../hooks/useDeviceType';
import Header from '../../components/Header';
import SettingsButton from '../../components/buttons/SettingsButton';
import { Ionicons } from '@expo/vector-icons';
import { SCREENS } from '../../constants/screens';

export default function SettingsMessage({ onNavigate }) {

  const { isSmartphone, isLandscape } = useDeviceType();

  const handleSectionChange = (section) => {
    if (section === 'chat') {
      onNavigate('CHAT');
    } else if (section === 'account') {
      onNavigate('ACCOUNT');
    } else if (section === 'settings') {
      onNavigate('SETTINGS_MESSAGE');
    }
  };

  return (
    <>
      <Header showMenuIcon={false} showAccountImage={true} onNavigate={onNavigate} onBackPress={() => onNavigate(SCREENS.CHAT)} />
      <View style={styles.container}>
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
            title="Logout"
            description="Logout and go back to login screen"
            icon={<Ionicons name="log-out-outline" size={isSmartphone ? 22 : 28} color={COLORS.orange} />}
            onPress={() => {
              onNavigate('LOGIN');
            }}
          />
        </View>
      </View>
      <Navbar 
        currentSection="settings" 
        onSectionChange={handleSectionChange}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray900,
    paddingHorizontal: 15,
  },
  content: {
    flex: 1,
    alignItems: 'center',
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
});