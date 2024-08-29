import { TextInput, StyleSheet } from "react-native";

export default function ModalInput({ value, onChangeText, placeholder }) {
  return (
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}/>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 40,
    width: "85%",
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    backgroundColor: "white",
  },
});