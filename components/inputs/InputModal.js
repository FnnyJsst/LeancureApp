import { View, TextInput, StyleSheet } from "react-native";
import { useState } from "react";
import { useDeviceType } from '../../hooks/useDeviceType'; 
import { SIZES,COLORS } from '../../constants/style'; 

// Input used in all the modals
export default function InputModal({
  placeholder, 
  value, 
  onChangeText, 
  style, 
  secureTextEntry = true
}) {

  // We create a hook to determine the device type
  const { isSmartphone, isSmartphonePortrait } = useDeviceType(); 

  // We create a state to store if the input is focused
  const [isFocused, setIsFocused] = useState(false); 

  return (
    <View style={styles.inputContainer}>
      <TextInput 
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        placeholderTextColor={COLORS.gray600}
        value={value}
        onChangeText={onChangeText}
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          style,
          isSmartphone && styles.inputSmartphone, 
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
    backgroundColor: COLORS.gray850,
    color: COLORS.white,
    fontSize: SIZES.fonts.textTablet,
  },
  inputSmartphone: {
    fontSize: SIZES.fonts.textSmartphone,
  },
  inputFocused: {
    borderColor: COLORS.orange,
    borderWidth: 1,
  },
  inputSmartphonePortrait: {
    width: "95%",
  },
});