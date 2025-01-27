import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useDeviceType } from '../../hooks/useDeviceType';
import { SIZES, COLORS } from '../../constants/style';

// SettingsCard is used in the different settings screens
export default function SettingsCard({ icon, title, description, onPress }) {

  // Customized hook to determine the device type and orientation
  const { isSmartphone } = useDeviceType();

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
    >
      <View style={styles.content}>
        <View style={[
          styles.iconContainer,
          isSmartphone && styles.iconContainerSmartphone
        ]}>
          {icon}
        </View>
        <View style={styles.textContainer}>
          <Text style={[
            styles.title,
            isSmartphone && styles.titleSmartphone
          ]}>{title}</Text>
          <Text style={[
            styles.description,
            isSmartphone && styles.descriptionSmartphone
          ]}>{description}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center'
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: SIZES.borderRadius.small,
    backgroundColor: '#403430',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  iconContainerSmartphone: {
    width: 40,
    height: 40,
  },
  textContainer: {
    flex: 1
  },
  title: {
    fontSize: SIZES.fonts.subtitleTablet,
    color: "#d1d1d1",
    fontWeight: SIZES.fontWeight.regular
  },
  titleSmartphone: {
    fontSize: 15,
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