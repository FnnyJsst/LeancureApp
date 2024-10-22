import { TouchableOpacity, View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function ParameterButton({ onPress }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onPress}>
        <Ionicons name="settings-outline" color="#ebebeb" size={30} style={styles.icon} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 25,
    left: 25,
    backgroundColor: 'transparent',
    borderColor: '#ebebeb',
    borderWidth: 2,
    borderRadius: 10,
  },
  icon: {
    padding: 8,
  },
});