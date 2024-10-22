import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import ParameterButton from '../components/buttons/ParameterButton';

export default function WebViewScreen({ url, onNavigate }) {
  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: url }}
        style={styles.webview}
      />
      <ParameterButton onPress={onNavigate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 30,
  },
  webview: {
    flex: 1,
  },
});