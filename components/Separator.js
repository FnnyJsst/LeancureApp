import { View, StyleSheet } from "react-native";

export default function Separator({ width, marginTop, marginBottom }) {
  return (
    <View style={styles.separatorContainer}>
      <View style={[styles.separator, {width, marginTop, marginBottom}]} />
    </View>
  );
}

const styles = StyleSheet.create({
  separatorContainer: {
    alignItems: 'center',
  },
  separator: {
    height: 0.75,
    backgroundColor: 'rgba(229, 229, 229, 0.2)',
  },
});

