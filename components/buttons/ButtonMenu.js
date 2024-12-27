import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/style';  

export default MenuButton = ({ icon, text, onPress, isLandscape }) => (
  <TouchableOpacity 
    style={[styles.menuItem, isLandscape && styles.menuItemLandscape]} 
    onPress={onPress}
  >
    <View style={styles.iconContainer}>
      <Ionicons name={icon} style={styles.icon}/>
      <Text style={styles.menuText}>{text}</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  menuItem: {
    backgroundColor: COLORS.buttonGray,
    padding: 25,
    borderRadius: SIZES.borderRadius.large,
    width: '60%',
    alignItems: 'center',
  },
  menuText: {
    color: "white",
    fontSize: SIZES.fonts.subtitleSmartphone,
    fontWeight: SIZES.fontWeight.medium,
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