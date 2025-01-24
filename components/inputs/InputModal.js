import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { useDeviceType } from '../../hooks/useDeviceType'; 
import { SIZES, COLORS } from '../../constants/style'; 
import { Ionicons } from '@expo/vector-icons';

// Input used in all the modals
export default function InputModal({
  placeholder, 
  value, 
  onChangeText, 
  style, 
  secureTextEntry = true,
  icon
}) {

  // We create a hook to determine the device type
  const { isSmartphone, isSmartphonePortrait } = useDeviceType(); 

  // We create a state to store if the input is focused
  const [isFocused, setIsFocused] = useState(false); 
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.inputContainer}>
      <View style={[
        styles.inputWrapper,
        isFocused && styles.inputFocused,
        style,
        isSmartphone && styles.inputSmartphone,
        isSmartphonePortrait && styles.inputSmartphonePortrait
      ]}>
        {icon && React.cloneElement(icon, {
          color: isFocused ? COLORS.orange : COLORS.gray300
        })}
        <TextInput 
          placeholder={placeholder}
          secureTextEntry={secureTextEntry && !showPassword}
          placeholderTextColor={"#808080"}
          value={value}
          onChangeText={onChangeText}
          style={styles.input}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {secureTextEntry && (
          <TouchableOpacity 
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons 
              name={showPassword ? "eye-outline" : "eye-off-outline"} 
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
    width: "100%",
  },
  inputWrapper: {
    height: 50,
    marginHorizontal: "auto",
    padding: 10,
    width: '100%',
    backgroundColor: "#111111",
    borderRadius: SIZES.borderRadius.medium,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  input: {
    flex: 1,
    color: COLORS.white,
    marginLeft: 10,
  },
  icon: {
    marginLeft: 5,
  },
  inputSmartphone: {
    fontSize: SIZES.fonts.textSmartphone,
  },
  inputFocused: {
    borderColor: COLORS.orange + '50',
    shadowColor: COLORS.orange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    elevation: 1,
  },
  inputSmartphonePortrait: {
    width: "95%",
  },
  eyeIcon: {
    marginRight: 10,
  },
});