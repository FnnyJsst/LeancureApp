import { StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useDeviceType } from '../../hooks/useDeviceType';
import { COLORS, SIZES } from '../../constants/style'; 

export default function Button({ 
  title, 
  backgroundColor = COLORS.orange,
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
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 15,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: SIZES.borderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  buttonLarge: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    marginVertical: 10,
  },
  buttonSmartphone: {
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: SIZES.borderRadius.small,
  },
  buttonSmartphoneLandscape: {
    marginTop: 8,
  },
  buttonText: {
    fontSize: SIZES.fonts.subtitleTablet,
    textAlign: 'center',
    fontWeight: SIZES.fontWeight.bold,
    color: COLORS.white,
  },
  buttonTextSmartphone: {
    fontSize: SIZES.fonts.subtitleSmartphone,
  }
});