import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../assets/styles/constants';

export default function Navbar({ currentSection, onSectionChange }) {
  return (
    <View style={styles.navbar}>
      <TouchableOpacity 
        style={[styles.navItem, currentSection === 'chat' && styles.active]}
        onPress={() => onSectionChange('chat')}
      >
        <Ionicons name="chatbox-outline" size={24} color={currentSection === 'chat' ? COLORS.orange : COLORS.lightGray} />
        <Text style={[styles.navText, currentSection === 'chat' ? {color: COLORS.orange} : {color: COLORS.lightGray}]}>Chat</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.navItem, currentSection === 'settings' && styles.active]}
        onPress={() => onSectionChange('settings')}
      >
        <Ionicons name="settings-outline" size={24} color={COLORS.lightGray} />
        <Text style={styles.navText}>Settings</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.navItem, currentSection === 'account' && styles.active]}
        onPress={() => onSectionChange('account')}
      >
        <Ionicons name="person-outline" size={24} color={COLORS.lightGray} />
        <Text style={styles.navText}>Account</Text>
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
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray,
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    color: COLORS.lightGray,
    marginTop: 5,
    fontSize: SIZES.fonts.small,
  },
  active: {
    color: COLORS.orange,
  },
});