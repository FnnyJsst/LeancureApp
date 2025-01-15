import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/style';
import { useDeviceType } from '../../hooks/useDeviceType';

export default function Navbar({ currentSection, onSectionChange }) {

  // Customized hook to determine the device type and orientation
  const { isSmartphone } = useDeviceType();

  const getColor = (section) => (currentSection === section ? COLORS.orange : COLORS.gray300);

  return (
    <View style={styles.navbar}>
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => onSectionChange('chat')}
      >
        <Ionicons name="chatbox-outline" size={isSmartphone ? 24 : 28} color={getColor('chat')} />
        <Text style={[styles.navText, isSmartphone && styles.navTextSmartphone, { color: getColor('chat') }]}>Chat</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => onSectionChange('settings')}
      >
        <Ionicons name="settings-outline" size={isSmartphone ? 24 : 28} color={getColor('settings')} />
        <Text style={[styles.navText, isSmartphone && styles.navTextSmartphone, { color: getColor('settings') }]}>Settings</Text>
      </TouchableOpacity>

      {/* When the user clicks on the account button, we navigate to the account section */}
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => onSectionChange('account')}
      >
        <Ionicons name="person-outline" size={isSmartphone ? 24 : 28} color={getColor('account')} />
        <Text style={[styles.navText, isSmartphone && styles.navTextSmartphone, { color: getColor('account') }]}>Account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: COLORS.gray750,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray600,
    zIndex: 1,
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    marginTop: 5,
    fontSize: SIZES.fonts.subtitleTablet,
  },
  navTextSmartphone: {
    fontSize: SIZES.fonts.textSmartphone,
    marginTop: 3,
  },
  active: {
    color: COLORS.orange,
  },
});