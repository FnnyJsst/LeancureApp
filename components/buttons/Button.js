import { StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useDeviceType } from '../../hooks/useDeviceType';
import { COLORS, SIZES } from '../../constants/style'; 
import { LinearGradient } from 'expo-linear-gradient';

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
      {/* <LinearGradient
        colors={[
          COLORS.orange + '50',  // Très transparent
          COLORS.orange + '90',  // Plus visible au centre
          COLORS.orange + '10',  // Très transparent
        ]}
        locations={[0, 1, 1]}  // Centre la couleur la plus visible
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}    // Gradient horizontal
        style={styles.gradient}
      /> */}
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
    // backgroundColor: COLORS.gray900,
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
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 8,
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
    // color: COLORS.white,
  },
  buttonTextSmartphone: {
    fontSize: SIZES.fonts.textSmartphone,
  }
});