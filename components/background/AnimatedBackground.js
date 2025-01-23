import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS } from '../../constants/style';

export default function AnimatedBackground() {
  const pulseAnim1 = new Animated.Value(0.3);
  const pulseAnim2 = new Animated.Value(0.3);
  const pulseAnim3 = new Animated.Value(0.3);

  useEffect(() => {
    const pulse = (anim, delay = 0) => {
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 0.8,
          duration: 2000,
          useNativeDriver: true,
          delay,
        }),
        Animated.timing(anim, {
          toValue: 0.3,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]).start(() => pulse(anim, delay));
    };

    pulse(pulseAnim1);
    pulse(pulseAnim2, 700);
    pulse(pulseAnim3, 1000);
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a1a', '#0f0f0f']}
        style={styles.gradient}
      >
        <View style={styles.overlay}>
          <BlurView intensity={100} style={styles.blurContainer}>
            <Animated.View 
              style={[
                styles.circle1,
                {
                  opacity: pulseAnim1,
                  transform: [{scale: pulseAnim1}],
                }
              ]} 
            />
            <Animated.View 
              style={[
                styles.circle2,
                {
                  opacity: pulseAnim2,
                  transform: [{scale: pulseAnim2}],
                }
              ]} 
            />
            <Animated.View 
              style={[
                styles.circle3,
                {
                  opacity: pulseAnim3,
                  transform: [{scale: pulseAnim3}],
                }
              ]} 
            />
          </BlurView>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0f0f0f',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  circle1: {
    position: 'absolute',
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: COLORS.orange,
    opacity: 0.3,
    top: '50%',
    left: '50%',
    marginLeft: -250,
    marginTop: -250,
    filter: 'blur(100px)',
  },
  circle2: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#A855F7', // Purple
    opacity: 0.2,
    top: 0,
    right: 0,
    filter: 'blur(100px)',
  },
  circle3: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: '#3B82F6', // Blue
    opacity: 0.2,
    bottom: 0,
    left: 0,
    filter: 'blur(100px)',
  },
}); 