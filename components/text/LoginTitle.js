import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../../constants/style';
import { useDeviceType } from '../../hooks/useDeviceType';

export default function LoginTitle() {
  const { isSmartphone } = useDeviceType();

  return (
    <View style={styles.titleContainer}>
      <Image 
        source={require('../../assets/images/logo.png')}
        style={styles.logo}
      />
      <Text style={[
        styles.title,
        isSmartphone && styles.titleSmartphone
      ]}>Sign in to your account</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: -25,
  },
  title: {
    color: COLORS.white,
    fontSize: SIZES.fonts.subtitleTablet,
    fontWeight: SIZES.fontWeight.regular,
  },
  titleSmartphone: {
    fontSize: SIZES.fonts.subtitleSmartphone,
  },
}); 