import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useDeviceType } from '../../hooks/useDeviceType';
import { SIZES, COLORS } from '../../constants/style';

export default function SettingsButton({ icon, title, description, onPress }) {
  const { isSmartphone } = useDeviceType();

  return (
    <View style={styles.container}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  // Tablet styles
  button: {
    flexDirection: 'row',
    width: '100%',
    
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  text: {
    fontSize: SIZES.fonts.subtitleTablet,
    color: COLORS.white,
    fontWeight: SIZES.fontWeight.regular,
  },
  description: {
    fontSize: SIZES.fonts.textTablet,
    color: COLORS.gray600,
    marginTop: 2,
  },

  // Smartphone styles
  buttonSmartphone: {
    paddingVertical: 2,
  },
  textSmartphone: {
    fontSize: SIZES.fonts.subtitleSmartphone,
    fontWeight: SIZES.fontWeight.medium,
  },
  descriptionSmartphone: {
    fontSize: SIZES.fonts.textSmartphone,
  },
});