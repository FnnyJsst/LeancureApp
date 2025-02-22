import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, Entypo } from '@expo/vector-icons';
import { useDeviceType } from '../hooks/useDeviceType';
import { COLORS, SIZES } from '../constants/style';
import { Text } from './text/CustomText';

/**
 * @component Header
 * @description A component that renders a header
 *
 * @param {Object} props - The properties of the component
 * @param {string} props.title - The title of the header
 * @param {Function} props.onBackPress - The function to call when the back button is pressed
 * @param {string} props.rightIcon - The icon to display on the right side of the header
 * @param {Function} props.onRightIconPress - The function to call when the right icon is pressed
 * @param {boolean} props.showIcons - Whether to show the icons
 * @param {boolean} props.showMenuIcon - Whether to show the menu icon
 * @param {boolean} props.showBackButton - Whether to show the back button
 * @param {Function} props.toggleMenu - The function to call when the menu is toggled
 * @param {boolean} props.transparent - Whether to make the header transparent
 * @param {string} props.currentSection - The current section of the app
 * @param {boolean} props.showBell - Whether to show the bell icon
 * @param {Function} props.onBellPress - The function to call when the bell icon is pressed
 *
 * @example
 * <Header title="Title" onBackPress={() => console.log('Back button pressed')} rightIcon="bell" onRightIconPress={() => console.log('Right icon pressed')} showIcons={true} showMenuIcon={true} showBackButton={true} toggleMenu={() => console.log('Menu toggled')} transparent={false} currentSection="chat" showBell={false} onBellPress={() => console.log('Bell pressed')} />
 */
export default function Header({
  title,
  onBackPress,
  rightIcon,
  onRightIconPress,
  showIcons = true,
  showMenuIcon,
  showBackButton = false,
  toggleMenu,
  transparent,
  currentSection,
  showBell = false,
  onBellPress,
}) {
  const { isSmartphone } = useDeviceType();
  const iconSize = isSmartphone ? 20 : 30;

  const renderLeftSection = () => (
    <View style={styles.leftSection}>
      {showBackButton && (
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onBackPress}
        >
          <Ionicons
            name="close-outline"
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
    if (!showIcons) {return null;}

    return (
      <View style={styles.rightIconsContainer}>
        {showBell && (
          <TouchableOpacity
            style={styles.bellIconButton}
            onPress={onBellPress}
          >
            <Ionicons
              name="notifications-outline"
              size={iconSize - 5}
              color={COLORS.gray300}
            />
          </TouchableOpacity>
        )}
        {rightIcon && (
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
        )}
      </View>
    );
  };

  return (
    <View style={transparent && styles.transparentContainer}>
      <View style={[
        styles.headerContainer,
        isSmartphone && styles.headerContainerSmartphone,
        transparent && styles.transparent,
        currentSection !== 'chat' && styles.noBorder,
      ]}>
        {renderLeftSection()}

        {title && (
          <View style={styles.titleSection}>
            <Text style={[
              styles.headerText,
              isSmartphone && styles.headerTextSmartphone,
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
    zIndex: 1,
  },
  headerContainer: {
    width: '100%',
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.borderColor,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  headerContainerSmartphone: {
    height: 55,
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
    color: COLORS.white,
    fontWeight: SIZES.fontWeight.medium,
  },
  headerTextSmartphone: {
    fontSize: SIZES.fonts.biggerTextSmartphone,
  },
  iconButton: {
    padding: 5,
  },
  bellIconButton: {
    padding: 5,
    backgroundColor: COLORS.charcoal,
    borderRadius: SIZES.borderRadius.small,
    borderWidth: 0.5,
    borderColor: COLORS.borderColor,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButtonLeft: {
    marginLeft: 0,
  },
  rightIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
