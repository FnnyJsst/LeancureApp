import { StyleSheet, TouchableOpacity, Text } from 'react-native';

export default function Button({ title, backgroundColor, color, onPress, width, style }) {
  return (
    <TouchableOpacity style={[styles.button, { backgroundColor, width }, style]} onPress={onPress}>
      <Text style={[styles.buttonText, { color }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 15,
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});