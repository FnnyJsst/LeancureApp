import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { COLORS, SIZES } from '../../constants/style'; 
import Card from '../../components/Card';
import Navbar from '../../components/navigation/Navbar';
import { useDeviceType } from '../../hooks/useDeviceType';
import ChatHeader from '../../components/chat/ChatHeader';

export default function SettingsMessage({ onNavigate }) {

  const { isSmartphone } = useDeviceType();

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
      <View style={styles.container}>
        <ChatHeader onNavigate={onNavigate} showMenuIcon={false} />
          
            <View style={styles.headerContainer}>
              <Text style={[
                styles.header,
                isSmartphone && styles.headerSmartphone
              ]}>Settings</Text>
            </View>
            <View style={styles.content}>
            <Card backgroundColor={COLORS.gray800} />
            <Card backgroundColor={COLORS.gray800} />
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
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  headerContainer: {
    marginBottom: 20,
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
  }
});