import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useDeviceType } from '../../hooks/useDeviceType';
import { COLORS, SIZES } from '../../constants/style';
import { Text } from '../text/CustomText';

/**
 * @component Button
 * @description A component that renders a button for the app
 *
 * @param {Object} props - The properties of the component
 * @param {string} props.title - The title of the button
 * @param {string} [props.backgroundColor = COLORS.orange] - The background color of the button
 * @param {string} [props.textColor = COLORS.white] - The text color of the button
 * @param {Function} props.onPress - The function to call when the button is pressed
 * @param {number} [props.width] - The width of the button
 * @param {string} [props.variant = 'default'] - The variant of the button - "large" for a large button, "default" for a small one
 *
 * @example
 * <Button title="Click me" onPress={() => console.log('Button pressed')} />
 */
export default function Button({
  title,
  backgroundColor = COLORS.orange,
  textColor = COLORS.white,
  onPress,
  width,
  variant = 'default', // 'default' for a small button, 'large' for a large one
  style,
  testID,
}) {

  // Customized hook to determine the device type and orientation
  const { isSmartphone, isSmartphoneLandscape } = useDeviceType();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        // If the button is large, we use the buttonLarge style
        variant === 'large' && styles.buttonLarge,
        variant === 'largeTablet' && styles.buttonLargeTablet,
        { backgroundColor, width },
        isSmartphone && styles.buttonSmartphone,
        isSmartphoneLandscape && styles.buttonSmartphoneLandscape,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      testID={testID}
    >
      <Text style={[
        styles.buttonText,
        isSmartphone && styles.buttonTextSmartphone,
        { color: textColor },
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: SIZES.borderRadius.medium,
  },
  buttonLarge: {
    height: 60,
    paddingVertical: 15,
    paddingHorizontal: 24,
    marginVertical: 10,
    backgroundColor: 'transparent',
    borderRadius: SIZES.borderRadius.xLarge,
  },
  buttonLargeTablet: {
    height: 60,
    paddingVertical: 12,
  },
  buttonSmartphone: {
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  buttonSmartphoneLandscape: {
    marginTop: 8,
  },
  buttonText: {
    fontSize: SIZES.fonts.textTablet,
    textAlign: 'center',
    fontWeight: SIZES.fontWeight.medium,
  },
  buttonTextSmartphone: {
    fontSize: SIZES.fonts.textSmartphone,
  },
});
