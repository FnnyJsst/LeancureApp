import { View, Text, StyleSheet } from 'react-native';

export default function TitleModal({ title }) {
  return (
    <View>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Montserrat',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});