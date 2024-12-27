import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/style';
import { useDeviceType } from '../../hooks/useDeviceType';

export default function Navbar({ currentSection, onSectionChange }) {
  const { isSmartphone } = useDeviceType();

  return (
    <View style={styles.navbar}>
      <TouchableOpacity 
        style={[styles.navItem, currentSection === 'chat' && styles.active]}
        onPress={() => onSectionChange('chat')}
      >
        <Ionicons name="chatbox-outline" size={isSmartphone ? 20 : 24} color={currentSection === 'chat' ? COLORS.orange : COLORS.lightGray} />
        <Text style={[styles.navText, isSmartphone && styles.navTextSmartphone, currentSection === 'chat' ? {color: COLORS.orange} : {color: COLORS.lightGray}]}>Chat</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.navItem, currentSection === 'settings' && styles.active]}
        onPress={() => onSectionChange('settings')}
      >
        <Ionicons name="settings-outline" size={isSmartphone ? 20 : 24} color={currentSection === 'settings' ? COLORS.orange : COLORS.lightGray} />
        <Text style={[styles.navText, isSmartphone && styles.navTextSmartphone, currentSection === 'settings' ? {color: COLORS.orange} : {color: COLORS.lightGray}]}>Settings</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.navItem, currentSection === 'account' && styles.active]}
        onPress={() => onSectionChange('account')}
      >
        <Ionicons name="person-outline" size={isSmartphone ? 20 : 24} color={currentSection === 'account' ? COLORS.orange : COLORS.lightGray} />
        <Text style={[styles.navText, isSmartphone && styles.navTextSmartphone, currentSection === 'account' ? {color: COLORS.orange} : {color: COLORS.lightGray}]}>Account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: COLORS.buttonGray,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray,
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    color: COLORS.lightGray,
    marginTop: 5,
    fontSize: SIZES.fonts.textTablet,
  },
  navTextSmartphone: {
    fontSize: SIZES.fonts.textSmartphone,
    marginTop: 3,
  },
  active: {
    color: COLORS.orange,
  },
});