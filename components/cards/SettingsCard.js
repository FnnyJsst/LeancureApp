import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useDeviceType } from '../../hooks/useDeviceType';
import { SIZES, COLORS, FONTS } from '../../constants/style';
import { Text } from '../text/CustomText';
/**
 * @component SettingsCard
 * @description A component that renders the cards used in the settings screen
 * @param {ReactNode} props.icon - The icon of the card
 * @param {string} props.title - The title of the card
 * @param {string} props.description - The description of the card
 * @param {Function} props.onPress - The function to call when the card is pressed
 * @param {string} props.iconBackgroundColor - The background color of the icon
 */
export default function SettingsCard({ icon, title, description, onPress, iconBackgroundColor = COLORS.borderColor, testID }) {

  const { isSmartphone } = useDeviceType();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      role="button"
      accessible={true}
      accessibilityLabel={title}
      testID="settings-card"
    >
      <View style={styles.content}>
        <View style={[
          styles.iconContainer,
          isSmartphone && styles.iconContainerSmartphone,
          iconBackgroundColor && { backgroundColor: iconBackgroundColor },
        ]}>
          {icon}
        </View>
        <View style={styles.textContainer}>
          <Text style={[
            styles.title,
            isSmartphone && styles.titleSmartphone,
          ]}>{title}</Text>
          <Text style={[
            styles.description,
            isSmartphone && styles.descriptionSmartphone,
          ]}>{description}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: SIZES.borderRadius.large,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  iconContainerSmartphone: {
    width: 40,
    height: 40,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: SIZES.fonts.subtitleTablet,
    color: COLORS.white,
    fontFamily: FONTS.medium,
  },
  titleSmartphone: {
    fontSize: SIZES.fonts.textSmartphone,
    fontWeight: SIZES.fontWeight.medium,
  },
  description: {
    fontFamily: Platform.select({
      android: 'Roboto',
      ios: 'System',
    }),
    fontSize: SIZES.fonts.textTablet,
    color: COLORS.gray300,
    marginTop: 2,
  },
  descriptionSmartphone: {
    fontSize: SIZES.fonts.textSmartphone,
  },
});
