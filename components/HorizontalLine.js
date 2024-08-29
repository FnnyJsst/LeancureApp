import { View, StyleSheet } from 'react-native';

export default function HorizontalLine() {
  return (
    <View style={styles.horizontalLineContainer}>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  horizontalLineContainer: {
    marginHorizontal: 45,
  },
  line: {
    width: '100%',
    height: 2,
    backgroundColor: '#23262F',
    marginTop: 20,
  },
});