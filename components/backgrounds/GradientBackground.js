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
        '#1a1614',  // Très foncé
        '#1a1614',  // Même couleur pour éviter les lignes
        '#191515',  // Transition très subtile
        '#181515',  // Légèrement plus clair
        '#171414',  // Transition très subtile
        '#161414',  // Encore plus clair
        '#151313',  // Transition très subtile
        '#141212',  // Presque noir
        '#131212',  // Transition très subtile
        '#121212',  // Noir final
      ]}
      locations={[0, 0.05, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.6, 1]}
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
