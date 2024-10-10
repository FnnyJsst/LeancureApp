import { View, Text, StyleSheet } from 'react-native';
import ParameterButton from '../components/buttons/ParameterButton';

export default function NoUrlScreen({ onNavigate }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Please enter settings to add an URL</Text>
      <ParameterButton onPress={onNavigate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  text: {
    fontSize: 20,
    color: 'black',
    textAlign: 'center',
  },
});