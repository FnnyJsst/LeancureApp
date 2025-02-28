import React, { useEffect } from 'react';
import { View, Image, StyleSheet, StatusBar, Animated } from 'react-native';
import { COLORS } from '../../constants/style';

/**
 * @component ScreenSaver
 * @description Displays the screen saver
 *
 * @returns {JSX.Element} - A JSX element
 *
 * @example
 * <ScreenSaver />
 */
export default function ScreenSaver() {
  // Créer une valeur d'animation pour l'opacité
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    // Animation d'entrée en fondu
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      // Maintenir l'image visible pendant 4 secondes
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
    zIndex: 999, // S'assurer qu'il est au-dessus de tout
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
