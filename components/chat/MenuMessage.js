import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SIZES } from '../../constants/style';
import { Ionicons } from '@expo/vector-icons';
import { useDeviceType } from '../../hooks/useDeviceType';

const MenuMessage = ({ onDelete, onClose }) => {
  const { isSmartphone } = useDeviceType();
  return (
    <View style={styles.menuContainer}>
      <TouchableOpacity
        style={[styles.menuItem, isSmartphone && styles.menuItemSmartphone]}
        onPress={onDelete}
      >
        <Ionicons name="trash-outline" size={isSmartphone ? 20 : 24} color={COLORS.white} />
        <Text style={isSmartphone ? styles.menuTextSmartphone : styles.menuText}>Supprimer</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  menuContainer: {
    position: 'absolute',
    top: '100%',
    right: 20,
    backgroundColor: COLORS.gray650,
    padding: 6,
    borderRadius: SIZES.borderRadius.large,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
    minWidth: 100,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  menuText: {
    color: COLORS.white,
    fontSize: SIZES.fonts.textTablet,
    fontWeight: SIZES.fontWeight.light,
  },
  menuTextSmartphone: {
    color: COLORS.white,
    fontSize: SIZES.fonts.textSmartphone,
  },
});

export default MenuMessage;


