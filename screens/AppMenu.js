import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MenuButton from '../components/buttons/ButtonMenu';
import { COLORS, SIZES } from '../constants/style';
import { useDeviceType } from '../hooks/useDeviceType';
import { SCREENS } from '../constants/screens';

export default function AppMenu({ onNavigate }) {

  const { isLandscape, isSmartphone } = useDeviceType();

  return (
    <View style={styles.container}>
      <Text style={[
        styles.title,
        isSmartphone && styles.titleSmartphone
      ]}>Welcome</Text>
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
    backgroundColor: COLORS.gray900,
    gap: 20,
  },
  title: {
    color: COLORS.white,
    fontSize: SIZES.fonts.headerTablet,
    paddingVertical: 20,
  },
  titleSmartphone: {
    fontSize: SIZES.fonts.headerSmartphone,
  },
});
