import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useDeviceType } from '../../hooks/useDeviceType';
import { COLORS, SIZES } from '../../constants/style';

/**
 * @component AppMenuCard
 * @description A component that renders the cards used in the app menu
 * 
 * @param {Object} props - The properties of the component
 * @param {string} props.title - The title of the card
 * @param {ReactNode} props.icon - The icon of the card
 * @param {Function} props.onPress - The function to call when the card is pressed
 * @param {number} props.unreadCount - The number of unread messages
 * 
 * @example
 * <AppMenuCard title="Home" icon={<Ionicons name="home" size={24} color="white" />} onPress={() => console.log('Card pressed')} unreadCount={10} />

 */

const AppMenuCard = ({ title, icon, onPress, unreadCount }) => {

  // Customized hook to determine the device type and orientation
  const { isSmartphone } = useDeviceType();

  return (
    <TouchableOpacity 
      style={[styles.card, isSmartphone && styles.cardSmartphone]} 
      onPress={onPress}
    >
      {/* If there are unread messages, we display a badge with the number of unread messages */}
      {unreadCount > 0 && (
        <View style={[styles.badge, isSmartphone && styles.badgeSmartphone]}>
          <Text style={[styles.badgeText, isSmartphone && styles.badgeTextSmartphone]}>{unreadCount}</Text>
        </View>
      )}
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
    width: 400,
    height: 150,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#403430',
  },
  cardSmartphone: {
    width: 250,
    height: 100,
    padding: 15
  },
  iconContainer: {
    flexDirection: 'row',
    gap: 30

  },
  title: {
    color: COLORS.white,
    fontSize: SIZES.fonts.titleTablet,
    textAlign: 'center',
  },
  titleSmartphone: {
    fontSize: SIZES.fonts.titleSmartphone,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.orange,
    borderRadius: 30,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4
  },
  badgeSmartphone: {
    width: 35,
    height: 35,
    top: -5,
    right: -5
  },
  badgeText: {
    color: COLORS.white,
    fontSize: SIZES.fonts.subtitleTablet,
    fontWeight: 'bold'
  }, 
  badgeTextSmartphone: {
    fontSize: SIZES.fonts.subtitleSmartphone
  }
});

export default AppMenuCard;