import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * @component GradientBackground
 * @description A component that renders a gradient background for the app
 * @param {React.ReactNode} props.children - The content to render inside the gradient
 */
export default function GradientBackground({ children }) {
  return (
    <LinearGradient
      colors={[
        '#1a1614',  // Very dark
        '#1a1614',  // Same color to avoid lines
        '#191515',  // Very subtle transition
        '#181515',  // Slightly lighter
        '#171414',  // Very subtle transition
        '#151313',  // Very subtle transition
        '#131212',  // Very subtle transition
      ]}
      locations={[0, 0.1, 0.2, 0.3, 0.5, 0.7, 1]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1.2 }}
      style={styles.container}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
