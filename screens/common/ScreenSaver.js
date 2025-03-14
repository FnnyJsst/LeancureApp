import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, StatusBar, Animated } from 'react-native';
import { COLORS } from '../../constants/style';

/**
 * @component ScreenSaver
 * @description Displays the screen saver when the app is loading
 */
export default function ScreenSaver() {

  // Use ref to avoid recreating the animation on each render
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start the animation of the ScreenSaver
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    return () => {
      fadeAnim.setValue(0);
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            backgroundColor: COLORS.gray900,
          }
        ]}
      >
        <Image
          source={require('../../assets/images/screensaver_anim.png')}
          style={styles.image}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray900,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    elevation: 999, // For Android
    zIndex: 999, // For iOS
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '35%',
    height: '35%',
  },
});
