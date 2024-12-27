import React from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { COLORS, SIZES } from '../../constants/style'; 
import Card from '../../components/Card';
import Navbar from '../../components/navigation/Navbar';
import { useDeviceType } from '../../hooks/useDeviceType';

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
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.content}>
            <Text style={[
              styles.title,
              isSmartphone && styles.titleSmartphone
            ]}>Settings</Text>
            <Card />
            <Card />
          </View>
        </ScrollView>
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
    backgroundColor: COLORS.darkGray,
  },
  scrollViewContent: {
    flexGrow: 1,
    minHeight: '100%',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  title: {
    color: 'white',
    fontSize: SIZES.fonts.titleTablet,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  titleSmartphone: {
    fontSize: SIZES.fonts.titleSmartphone,
  }
});