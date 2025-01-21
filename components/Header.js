import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, Entypo } from '@expo/vector-icons';
import { useDeviceType } from '../hooks/useDeviceType';
import { COLORS, SIZES } from '../constants/style';
import AccountImage from './AccountImage';

export default function Header({ 
  title, 
  onBackPress, 
  rightIcon,
  onRightIconPress,
  showAccountImage,
  onNavigate,
  showIcons = true,
  showMenuIcon,
  showBackButton = true,
  toggleMenu,
  noBorder,
  transparent
}) {
  const { isSmartphone } = useDeviceType();
  const iconSize = isSmartphone ? 30 : 40;

  const renderLeftSection = () => (
    <View style={styles.leftSection}>
      {showBackButton && (
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
      )}
      {showMenuIcon && (
        <TouchableOpacity 
          style={[styles.iconButton, !showBackButton && styles.menuButtonLeft]} 
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
      return <AccountImage onNavigate={onNavigate} width={isSmartphone ? 42 : 50} height={isSmartphone ? 42 : 50} />;
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
    <View style={transparent && styles.transparentContainer}>
      <View style={[
        styles.headerContainer,
        isSmartphone && styles.headerContainerSmartphone,
        noBorder && styles.noBorder,
        transparent && styles.transparent
      ]}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  transparentContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1
  },
  headerContainer: {
    width: '100%',
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray600,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  headerContainerSmartphone: {
    height: 55
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
  },
  menuButtonLeft: {
    marginLeft: 0,
  }
});