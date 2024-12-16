import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../../assets/styles/constants';
import Header from '../../components/Header';

export default function SettingsMessage({ onBackPress }) {
  return (
    <View style={styles.container}>
      <Header 
        title="SETTINGS" 
        onBackPress={onBackPress}
      />
      <ScrollView>
        {/* Ajoutez ici les paramètres spécifiques aux messages */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkGray,
  }
});