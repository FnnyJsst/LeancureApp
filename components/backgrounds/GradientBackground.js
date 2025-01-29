import { StyleSheet, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 *@component GradientBackground
 *@description A component that renders a gradient background for the app
 *
 *@param {ReactNode} props.children - The children to render inside the gradient background
 *@param {boolean} [props.withStatusBar = false] - Whether to include a status bar in the background
 *@param {StyleSheet.NamedStyles<any>} [props.style] - The style to apply to the gradient background
 *@param {Object} [props.style] - Additional styles to apply to the gradient background
 *
 *@example
 *<GradientBackground>
 *  <Text>Welcome to the app</Text>
 *</GradientBackground>
 */

export default function GradientBackground({ children, withStatusBar = false, style }) {
  return (
    <LinearGradient
      colors={[
        '#2a1c15',  // Very dark brown (almost black)
        '#1a1614',  // Very subtle transition
        '#121212',  // Very dark gray
        '#121212', 
      ]}
      locations={[0, 0.15, 0.3, 1]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[styles.container, withStatusBar && styles.withStatusBar, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  withStatusBar: {
    paddingTop: StatusBar.currentHeight,
  },
}); 