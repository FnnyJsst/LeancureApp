import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useDeviceType } from '../../hooks/useDeviceType';
import { COLORS, SIZES } from '../../constants/style';
import { Text } from '../text/CustomText';

/**
 * @component AppMenuCard
 * @description A component that renders the cards used in the app menu
 * @param {string} props.title - The title of the card
 * @param {ReactNode} props.icon - The icon of the card
 * @param {Function} props.onPress - The function to call when the card is pressed
 */

const AppMenuCard = ({ title, icon, onPress }) => {

  const { isSmartphone } = useDeviceType();

  return (
    <TouchableOpacity
      style={[styles.card, isSmartphone && styles.cardSmartphone]}
      onPress={onPress}
    >
      <View style={styles.iconContainer}>
        {icon}
        <Text style={[styles.title, isSmartphone && styles.titleSmartphone]}>
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.charcoal,
    borderRadius: SIZES.borderRadius.large,
    padding: 20,
    alignItems: 'center',
    margin: 10,
    width: 350,
    height: 150,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderColor,
  },
  cardSmartphone: {
    width: 250,
    height: 100,
    padding: 15,
  },
  iconContainer: {
    flexDirection: 'row',
    gap: 30,
  },
  title: {
    color: COLORS.white,
    fontSize: SIZES.fonts.titleTablet,
    fontWeight: SIZES.fontWeight.medium,
    textAlign: 'center',
  },
  titleSmartphone: {
    fontSize: SIZES.fonts.titleSmartphone,
  },
});

export default AppMenuCard;
