import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useDeviceType } from '../../hooks/useDeviceType';
import { SIZES, COLORS, FONTS } from '../../constants/style';
import { Ionicons } from '@expo/vector-icons';

/**
 * @component InputModal
 * @description A component that renders an input used in all the modals
 * @param {string} props.placeholder - The placeholder of the input
 * @param {string} props.value - The value of the input
 * @param {Function} props.onChangeText - The function to call when the input is changed
 * @param {Object} props.style - The style of the input
 * @param {boolean} props.secureTextEntry - Whether the input is secure
 * @param {ReactNode} props.icon - The icon of the input
 */
export default function InputModal({
  placeholder,
  value,
  onChangeText,
  style,
  secureTextEntry = true,
  icon,
}) {

  const { isSmartphone } = useDeviceType();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.inputContainer}>
      <View style={[
        styles.inputWrapper,
        isFocused && styles.inputFocused,
        style,
        isSmartphone && styles.inputSmartphone,
      ]}>
        {icon && React.cloneElement(icon, {
          color: isFocused ? COLORS.orange : COLORS.gray300,
        })}
        <TextInput
          placeholder={placeholder}
          secureTextEntry={secureTextEntry && !showPassword}
          placeholderTextColor={COLORS.gray600}
          value={value}
          onChangeText={onChangeText}
          style={[styles.input, isSmartphone && styles.inputSmartphone]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={COLORS.gray600}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    width: '100%',
  },
  inputWrapper: {
    height: 50,
    marginHorizontal: 'auto',
    paddingHorizontal: 10,
    width: '100%',
    backgroundColor: COLORS.gray950,
    borderRadius: SIZES.borderRadius.medium,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  input: {
    flex: 1,
    color: COLORS.white,
    fontFamily: FONTS.regular,
    fontSize: SIZES.fonts.biggerTextTablet,
    marginLeft: 10,
  },
  icon: {
    marginLeft: 5,
  },
  inputSmartphone: {
    fontSize: SIZES.fonts.textSmartphone,
    height: 45,
  },
  inputFocused: {
    borderColor: COLORS.orange + '50',
    shadowColor: COLORS.orange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    elevation: 1,
  },
  eyeIcon: {
    marginRight: 10,
  },
});
