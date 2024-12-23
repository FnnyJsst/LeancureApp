import { StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useDeviceType } from '../../hooks/useDeviceType';
import { SIZES } from '../../constants/style'; 

export default function Button({ title, backgroundColor, color, onPress, width, style }) {
  const { 
    isSmartphone,
    isSmartphoneLandscape
  } = useDeviceType();

  return (
    <TouchableOpacity 
      style={[
        styles.button, 
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
        { color },
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
    fontSize: SIZES.fonts.medium,
    textAlign: 'center',
    fontWeight: SIZES.fontWeight.semiBold, 
  },
  buttonTextSmartphone: {
    fontSize: SIZES.fonts.xSmall,
    fontWeight: SIZES.fontWeight.medium,
  },
});