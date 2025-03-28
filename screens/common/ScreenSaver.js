import React, { useEffect } from 'react';
import { View, Image, StyleSheet, StatusBar, Animated } from 'react-native';
import { COLORS } from '../../constants/style';

/**
 * @component ScreenSaver
 * @description Displays the screen saver
 */
export default function ScreenSaver() {
  // Create an animation value for the opacity
  const fadeAnim = new Animated.Value(0);

  /**
   * @description Entry animation in fade
   */
  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      // Keep the image visible for 4 seconds
      Animated.delay(4000),
    ]).start();
  }, []);

  return (
    <View style={styles.splashContainer}>
      <StatusBar hidden={true} />
      <Animated.View style={[styles.imageContainer, { opacity: fadeAnim }]}>
        <Image
          source={require('../../assets/images/screensaver_anim.png')}
          style={styles.splashImage}
        />
      </Animated.View>
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
    zIndex: 999,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  splashImage: {
    width: '50%',
    height: '25%',
    resizeMode: 'contain',
  },
});
