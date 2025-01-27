import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/style';
import { useDeviceType } from '../../hooks/useDeviceType';

export default function CheckBox({ 
  checked, 
  onPress, 
  label,
  disabled = false,
  style 
}) {

  const { isSmartphone } = useDeviceType();

  return (
    <TouchableOpacity 
      onPress={onPress}
      disabled={disabled}
      style={[styles.container, style]}
    >
      <View style={[
        styles.checkbox,
        checked && styles.checked,
        disabled && styles.disabled
      ]}>
        {checked && (
          <Ionicons 
            name="checkmark" 
            size={16} 
            color={disabled ? COLORS.gray300 : COLORS.orange} 
          />
        )}
      </View>
      {label && (
        <Text style={[
          styles.label,
          isSmartphone && styles.labelSmartphone,
          disabled && styles.labelDisabled
        ]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checked: {
    color: COLORS.orange,
  },
  disabled: {
    borderColor: COLORS.gray300,
    backgroundColor: 'transparent',
  },
  label: {
    color: COLORS.gray300,
    fontSize: SIZES.fonts.subtitleTablet,
  },
  labelSmartphone: {
    fontSize: SIZES.fonts.textSmartphone,
  },
  labelDisabled: {
    color: COLORS.gray300,
  }
});