import { TouchableOpacity, View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

export default function ParameterButton() {
  const navigation = useNavigation();

  const handlePress = () => {
    navigation.navigate('SettingsScreen');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePress}>
        <Ionicons name="settings-outline" size={30} style={styles.icon} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    backgroundColor: '#23262f',
    borderRadius: 10,
  },
  icon: {
    padding: 8,
    color: '#FF4500',
  },
});