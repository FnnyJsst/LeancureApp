import { View, Switch, StyleSheet } from "react-native";

export default function Toggle({ isEnabled, toggleSwitch }) {
  return (
    <View style={styles.container}>
      <Switch
        trackColor={{ false: "#d9d9d9", true: "#d9d9d9" }}
        thumbColor={isEnabled ? "#ff4500" : "#f4f3f4"}
        ios_backgroundColor="#3e3e3e"
        onValueChange={toggleSwitch}
        value={isEnabled}
        
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginLeft: "auto",
    marginRight: 15,
  },
});