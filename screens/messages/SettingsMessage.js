import React from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { COLORS, SIZES } from '../../assets/styles/constants';
import Card from '../../components/Card';
import Navbar from '../../components/navigation/Navbar';

export default function SettingsMessage({ setCurrentScreen }) {

  const handleSectionChange = (section) => {
    if (section === 'chat') {
      setCurrentScreen('Chat');
    } else if (section === 'account') {
      setCurrentScreen('AccountScreen');
    } else if (section === 'settings') {
      setCurrentScreen('SettingsMessage');
    }
  };

  return (
    <>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.content}>
            <Text style={styles.title}>Settings</Text>
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
    fontSize: SIZES.fonts.large,
    fontWeight: 'bold',
    marginBottom: 20,
  }
});