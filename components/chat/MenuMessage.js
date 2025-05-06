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
 * @param {Function} props.onEdit - Fonction d'édition
 * @param {Object} props.style - Style
 */
const MenuMessage = ({ onDelete, onEdit, style }) => {

  const { isSmartphone } = useDeviceType();
  const { t } = useTranslation();

  return (
    <View style={[styles.container, style]}>
      {onEdit && (
        <>
          <TouchableOpacity
            style={[styles.menuItem, isSmartphone && styles.menuItemSmartphone]}
            onPress={onEdit}
          >
            <Ionicons name="pencil-outline" size={isSmartphone ? 20 : 22} color={COLORS.white} />
            <Text style={[styles.menuText, isSmartphone && styles.menuTextSmartphone]}>
              {t('buttons.edit')}
            </Text>
          </TouchableOpacity>
          <View style={styles.separator} />
        </>
      )}
      <TouchableOpacity
        style={[styles.menuItem, isSmartphone && styles.menuItemSmartphone]}
        onPress={onDelete}
      >
        <Ionicons name="trash-outline" size={isSmartphone ? 20 : 22} color={COLORS.red} />
        <Text style={[styles.deleteText, isSmartphone && styles.deleteTextSmartphone]}>
          {t('buttons.delete')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: COLORS.gray650,
    borderRadius: SIZES.borderRadius.large,
    zIndex: 1000,
  },
  _menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
    paddingHorizontal: 4,
    margin: 6,
  },
  get menuItem() {
    return this._menuItem;
  },
  set menuItem(value) {
    this._menuItem = value;
  },
  menuText: {
    color: COLORS.white,
    fontSize: SIZES.fonts.textTablet,
    fontWeight: SIZES.fontWeight.light,
  },
  menuTextSmartphone: {
    fontSize: SIZES.fonts.textSmartphone,
  },
  deleteText: {
    color: COLORS.red,
    fontSize: SIZES.fonts.textTablet,
    fontWeight: SIZES.fontWeight.light,
  },
  deleteTextSmartphone: {
    fontSize: SIZES.fonts.textSmartphone,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.gray600,
    width: '100%',
  },
});

export default MenuMessage;
