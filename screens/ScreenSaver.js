import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

export default function ScreenSaver() {
  return (
    <View style={styles.splashContainer}>
      <Image source={require('../assets/images/screensaver_anim.png')} style={styles.splashImage} />
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashImage: {
    width: 500,
    height: 230,
  },
});