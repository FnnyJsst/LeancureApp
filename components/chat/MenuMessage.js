import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SIZES } from '../../constants/style';
import { Ionicons } from '@expo/vector-icons';
import { useDeviceType } from '../../hooks/useDeviceType';
import { useTranslation } from 'react-i18next';

/**
 * MenuMessage component
 * @param {Object} props - Props
 * @param {Function} props.onDelete - Fonction de suppression
 * @param {Object} props.style - Style
 */
const MenuMessage = ({ onDelete, style }) => {
  const { isSmartphone } = useDeviceType();
  const { t } = useTranslation();
  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[styles.menuItem, isSmartphone && styles.menuItemSmartphone]}
        onPress={onDelete}
      >
        <Ionicons name="trash-outline" size={isSmartphone ? 20 : 24} color={COLORS.white} />
        <Text style={isSmartphone ? styles.menuTextSmartphone : styles.menuText}>{t('buttons.delete')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: COLORS.gray650,
    borderRadius: SIZES.borderRadius.medium,
    padding: 8,
    zIndex: 1000,
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


