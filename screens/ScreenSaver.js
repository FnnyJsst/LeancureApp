import React from 'react';
import { View, Image, StyleSheet, StatusBar } from 'react-native';
import { COLORS } from '../constants/style';  

/**
 * Screen displayed when the app is launched
 **/
export default function ScreenSaver() {
  return (
    <View style={styles.splashContainer}>
      <StatusBar hidden={true} />
      <Image source={require('../assets/images/screensaver_anim.png')} style={styles.splashImage} />
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gray900,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  splashImage: {
    width: '50%',
    height: '25%',
    resizeMode: 'contain',
  },
});