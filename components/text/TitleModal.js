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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    width: '100%',
    // marginLeft: 20,
  },
});