import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function SettingsButton({ icon, title, onPress }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={onPress}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <Text style={styles.text}>{title}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 30,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    color: "black",
  },
  iconContainer: {
    marginRight: 10,
  },
  text: {
    fontWeight: 'normal', 
    fontSize: 18,
  },
});