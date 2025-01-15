import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useDeviceType } from '../../hooks/useDeviceType';
import { SIZES, COLORS } from '../../constants/style';

// SettingsCard is used in the different settings screens
export default function SettingsCard({ icon, title, description, onPress }) {

  // Customized hook to determine the device type and orientation
  const { isSmartphone } = useDeviceType();

  return (
      <TouchableOpacity 
        style={[
          styles.button,
          isSmartphone && styles.buttonSmartphone
        ]} 
        onPress={onPress}
      >
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <View style={styles.textContainer}>
          <Text style={[
            styles.text,
            isSmartphone && styles.textSmartphone
          ]}>
            {title}
          </Text>
          {description && (
            <Text style={[
              styles.description,
              isSmartphone && styles.descriptionSmartphone
            ]}>
              {description}
            </Text>
          )}
        </View>
      </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center'
  },
  buttonSmartphone: {
    paddingVertical: 2
  },
  iconContainer: {
    marginRight: 10
  },
  textContainer: {
    flex: 1
  },
  text: {
    fontSize: SIZES.fonts.subtitleTablet,
    color: COLORS.white,
    fontWeight: SIZES.fontWeight.regular
  },
  textSmartphone: {
    fontSize: SIZES.fonts.subtitleSmartphone,
    fontWeight: SIZES.fontWeight.medium
  },
  description: {
    fontSize: SIZES.fonts.textTablet,
    color: COLORS.gray600,
    marginTop: 2
  },
  descriptionSmartphone: {
    fontSize: SIZES.fonts.textSmartphone
  }
});