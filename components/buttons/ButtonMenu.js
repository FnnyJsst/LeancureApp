import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/style';  
import { useDeviceType } from '../../hooks/useDeviceType';

export default function MenuButton({ icon, text, onPress, isLandscape }) {

  const { isSmartphone } = useDeviceType();

  return (
    <TouchableOpacity 
      style={[styles.menuItem, isLandscape && styles.menuItemLandscape]} 
    onPress={onPress}
  >
    <View style={styles.iconContainer}>
      <Ionicons name={icon} style={styles.icon}/>
      <Text style={[
        styles.menuText,
        isSmartphone && styles.menuTextSmartphone
      ]}>{text}</Text>
    </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  menuItem: {
    backgroundColor: COLORS.gray750,
    padding: 25,
    borderRadius: SIZES.borderRadius.large,
    width: '60%',
    alignItems: 'center',
  },
  menuText: {
    color: COLORS.white,
    fontSize: SIZES.fonts.subtitleTablet,
    fontWeight: SIZES.fontWeight.medium,
  },
  menuTextSmartphone: {
    fontSize: SIZES.fonts.subtitleSmartphone,
  },
  menuItemLandscape: {
    width: '40%',
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 25,
  },
  icon: {
    color: COLORS.orange,
    fontSize: SIZES.fonts.titleSmartphone,
  },
});