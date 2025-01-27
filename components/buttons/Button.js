import { StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useDeviceType } from '../../hooks/useDeviceType';
import { COLORS, SIZES } from '../../constants/style'; 

export default function Button({ 
  title, 
  backgroundColor = COLORS.orange,
  textColor = COLORS.white,
  onPress, 
  width,
  variant = 'default', // 'default' for a small button, 'large' for a large one
  style 
}) {

  // Customized hook to determine the device type and orientation
  const { isSmartphone, isSmartphoneLandscape } = useDeviceType();

  return (
    <TouchableOpacity 
      style={[
        styles.button,
        // If the button is large, we use the buttonLarge style
        variant === 'large' && styles.buttonLarge,
        { backgroundColor, width },
        isSmartphone && styles.buttonSmartphone,
        isSmartphoneLandscape && styles.buttonSmartphoneLandscape,
        style
      ]} 
      onPress={onPress}
      activeOpacity={0.8} 
    >
      <Text style={[
        styles.buttonText, 
        isSmartphone && styles.buttonTextSmartphone,
        { color: textColor }
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: SIZES.borderRadius.medium,
  },
  buttonLarge: {
    height: 45,
    paddingVertical: 15,
    paddingHorizontal: 24,
    marginVertical: 10,
    backgroundColor: 'transparent',
    borderRadius: SIZES.borderRadius.xLarge,
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
  }
});