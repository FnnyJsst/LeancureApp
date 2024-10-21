import { StyleSheet, TouchableOpacity, Text } from 'react-native';

export default function Button({ title, backgroundColor, color, onPress, width, style }) {
  return (
    <TouchableOpacity 
      style={[styles.button, { backgroundColor, width }, style]} 
      onPress={onPress}
      activeOpacity={0.8} // Réduit l'opacité lors de la pression pour un effet visuel
    >
      <Text style={[styles.buttonText, { color }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 15,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10, 
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2, 
  },
  buttonText: {
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600', 
  },
});