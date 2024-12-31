import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useDeviceType } from '../../hooks/useDeviceType';
import AccountImage from '../AccountImage';
import { SCREENS } from '../../constants/screens';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../constants/style';

export default function ChatHeader({ onNavigate, toggleMenu }) {
  const { isTablet, isSmartphone } = useDeviceType();
  
  return (
    <View>
      <View style={[styles.container, isTablet ? styles.containerTablet : styles.containerSmartphone]}>
        <View style={styles.leftSection}>
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={() => onNavigate(SCREENS.APP_MENU)}
          >
            <Ionicons 
              name="chevron-back-outline" 
              size={isSmartphone ? 25 : 30} 
              color={COLORS.lightGray} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={toggleMenu}
          >
            <Ionicons 
              name="menu-outline" 
              size={isSmartphone ? 25 : 30} 
              color={COLORS.lightGray} 
            />
          </TouchableOpacity>
        </View>
        <AccountImage onNavigate={onNavigate} width={55} height={55} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 15,
    top: 0,
    paddingTop: 6,
    paddingBottom: 34,
  },
  containerSmartphone: {
    paddingTop: 0,
    paddingBottom: 35,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  iconButton: {
    padding: 5,
    
  },
  logo: {
    objectFit: 'contain',
  },
  logoTablet: {
    width: 120,
    height: 50,
  },
  logoSmartphone: {
    width: 90,
    height: 60,
  },
});
