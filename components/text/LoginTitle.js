import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../../constants/style';
import { useDeviceType } from '../../hooks/useDeviceType';

export default function LoginTitle() {
  const { isSmartphone } = useDeviceType();

  return (
    <View style={styles.container}>
      <Text style={[
        styles.welcomeTitle,
        isSmartphone && styles.welcomeTitleSmartphone
      ]}>
        Welcome
      </Text>
      <Text style={[
        styles.subtitle,
        isSmartphone && styles.subtitleSmartphone
      ]}>
        Sign in to your account
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  welcomeTitle: {
    fontSize: 42,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 8,
    letterSpacing: 0.5,
    // Effet de dégradé subtil
    textShadowColor: COLORS.orange + '20',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    // Effet de dégradé sur le texte
    opacity: 0.95,
  },
  welcomeTitleSmartphone: {
    fontSize: 35,
  },
  subtitle: {
    fontSize: SIZES.fonts.subtitleTablet,
    color: COLORS.gray400,
    fontWeight: '400',
    letterSpacing: 0.4,
  },
  subtitleSmartphone: {
    fontSize: 15,
    color: COLORS.gray300,
  }
}); 