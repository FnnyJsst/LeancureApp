import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MenuButton from '../components/buttons/ButtonMenu';
import { COLORS, SIZES } from '../assets/styles/constants';
import { useDeviceType } from '../hooks/useDeviceType';
import { SCREENS } from '../constants/screens';

export default function AppMenu({ onNavigate }) {

  const { isLandscape } = useDeviceType();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome</Text>
      <MenuButton 
        icon="mail-outline"   
        text="Messages" 
        onPress={() => onNavigate(SCREENS.LOGIN)} 
        isLandscape={isLandscape}
      />  
      <MenuButton 
        icon="tv-outline" 
        text="WebViews" 
        onPress={() => onNavigate(SCREENS.WEBVIEW)} 
        isLandscape={isLandscape}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.darkGray,
    gap: 20,
  },
  title: {
    color: "white",
    fontSize: SIZES.fonts.xXLarge,
    fontWeight: SIZES.fontWeight.medium,
    paddingVertical: 20, 
  },
});