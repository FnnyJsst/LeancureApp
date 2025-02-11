import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../../constants/style';
import { useDeviceType } from '../../hooks/useDeviceType';
import { Text } from '../text/CustomText';

/**
 * @component DateBanner
 * @description A component that renders a date banner in the chat screen
 * 
 * @param {Object} props - The properties of the component
 * @param {string} props.date - The date to display
 * 
 * @example
 * <DateBanner date="2024-01-01" />
 */
export default function DateBanner({ date }) {

  // Hook to determine the device type
  const { isSmartphone } = useDeviceType();

  return (
    <View style={[styles.container, isSmartphone && styles.smartphoneContainer]}>

      <Text style={[styles.text, isSmartphone && styles.textSmartphone]}>{date}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    backgroundColor: '#271E1E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginVertical: 10,
  },
  smartphoneContainer: {
    marginVertical: 5,
  },
  text: {
    color: COLORS.gray300,
    fontSize: SIZES.fonts.smallTextTablet,
    fontWeight: SIZES.fontWeight.medium,
  },
  textSmartphone: {
    fontSize: SIZES.fonts.smallTextSmartphone,
  }

}); 