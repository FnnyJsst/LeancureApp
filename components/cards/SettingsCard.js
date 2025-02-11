import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useDeviceType } from '../../hooks/useDeviceType';
import { SIZES, COLORS } from '../../constants/style';
import { Text } from '../text/CustomText';

/**
 * @component SettingsCard
 * @description A component that renders the cards used in the settings screen
 * 
 * @param {Object} props - The properties of the component
 * @param {ReactNode} props.icon - The icon of the card
 * @param {string} props.title - The title of the card
 * @param {string} props.description - The description of the card
 * @param {Function} props.onPress - The function to call when the card is pressed
 * 
 * @example
 * <SettingsCard icon={<Ionicons name="home" size={24} color="white" />} title="Home" description="Home description" onPress={() => console.log('Card pressed')} />
 */
export default function SettingsCard({ icon, title, description, onPress, iconBackgroundColor=COLORS.borderColor }) {

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
          isSmartphone && styles.iconContainerSmartphone,
          iconBackgroundColor && { backgroundColor: iconBackgroundColor }
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
    borderRadius: SIZES.borderRadius.medium,
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
    color: COLORS.gray300,
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