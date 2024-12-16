import { View, TextInput, StyleSheet } from "react-native";
import { useState } from "react";
import { useDeviceType } from '../hooks/useDeviceType'; 
import { SIZES,COLORS } from '../assets/styles/constants';

export default function InputModal({
  placeholder, 
  value, 
  onChangeText, 
  style, 
  secureTextEntry = true
}) {
  const { isTablet, isSmartphonePortrait } = useDeviceType(); 

  const [isFocused, setIsFocused] = useState(false); 

  return (
    <View style={styles.inputContainer}>
      <TextInput 
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        placeholderTextColor={COLORS.gray}
        value={value}
        onChangeText={onChangeText}
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          style,
          isTablet && styles.inputTablet, 
          isSmartphonePortrait && styles.inputSmartphonePortrait
        ]}
        //Focus and blur events
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    width: "100%",
  },
  input: {
    height: 40,
    marginHorizontal: "auto",
    width: "90%",
    borderRadius: SIZES.borderRadius.small,
    padding: 10,
    backgroundColor: COLORS.buttonGray,
    borderWidth: 0.5,
    borderColor: COLORS.gray,
    color: COLORS.gray,
  },
  inputFocused: {
    borderColor: COLORS.orange,
    borderWidth: 1,
  },
  inputSmartphonePortrait: {
    width: "95%",
  },
});