import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, Entypo } from '@expo/vector-icons';
import { useDeviceType } from '../hooks/useDeviceType';
import { COLORS, SIZES } from '../constants/style';
import AccountImage from './AccountImage';
import Separator from './Separator';

export default function Header({ 
  title, 
  onBackPress, 
  rightIcon,
  onRightIconPress,
  showAccountImage,
  onNavigate,
  showIcons = true,
  showMenuIcon,
  toggleMenu
}) {
  const { isSmartphone } = useDeviceType();
  const iconSize = isSmartphone ? 25 : 40;

  const renderLeftSection = () => (
    <View style={styles.leftSection}>
      <TouchableOpacity 
        style={styles.iconButton} 
        onPress={onBackPress}
      >
        <Ionicons 
          name="chevron-back-outline" 
          size={iconSize}
          color={COLORS.gray300} 
        />
      </TouchableOpacity>
      {showMenuIcon && (
        <TouchableOpacity 
          style={styles.iconButton} 
          onPress={toggleMenu}
        >
          <Ionicons 
            name="menu-outline" 
            size={iconSize}
            color={COLORS.gray300} 
          />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderRightSection = () => {
    if (!showIcons) return null;
    
    if (showAccountImage) {
      return <AccountImage onNavigate={onNavigate} width={55} height={55} />;
    }
    
    if (rightIcon) {
      return (
        <TouchableOpacity 
          style={styles.iconButton} 
          onPress={onRightIconPress}
        >
          <Entypo 
            name={rightIcon}
            size={iconSize}
            color={COLORS.gray300}
          />
        </TouchableOpacity>
      );
    }
    
    return null;
  };

  return (
    <View>
      <View style={styles.headerContainer}>
        {renderLeftSection()}

        {title && (
          <View style={styles.titleSection}>
            <Text style={[
              styles.headerText, 
              isSmartphone && styles.headerTextSmartphone
            ]}>
              {title}
            </Text>
          </View>
        )}

        <View style={styles.rightSection}>
          {renderRightSection()}
        </View>
      </View>
      <Separator width="150%" />
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  titleSection: {
    flex: 1,
    alignItems: 'center',
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 55,
  },
  headerText: {
    fontSize: SIZES.fonts.subtitleTablet,
    color: COLORS.gray300,
  },
  headerTextSmartphone: {
    fontSize: SIZES.fonts.subtitleSmartphone,
  },
  iconButton: {
    padding: 5,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  }
});