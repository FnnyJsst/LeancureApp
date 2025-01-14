import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useDeviceType } from '../../hooks/useDeviceType';
import { COLORS, SIZES } from '../../constants/style';

const AppMenuCard = ({ title, icon, onPress, unreadCount }) => {
  const { isSmartphone } = useDeviceType();

  return (
    <TouchableOpacity 
      style={[styles.card, isSmartphone && styles.cardSmartphone]} 
      onPress={onPress}
    >
      <View style={styles.iconContainer}>
        {icon}
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.title, isSmartphone && styles.titleSmartphone]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.gray800,
    borderRadius: SIZES.borderRadius.medium,
    padding: 20,
    alignItems: 'center',
    margin: 10,
    width: 200,
    height: 200,
  },
  cardSmartphone: {
    width: 150,
    height: 150,
    padding: 15,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  title: {
    color: COLORS.white,
    fontSize: SIZES.fonts.subtitleTablet,
    textAlign: 'center',
  },
  titleSmartphone: {
    fontSize: SIZES.fonts.subtitleSmartphone,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.orange,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  }
});

export default AppMenuCard;