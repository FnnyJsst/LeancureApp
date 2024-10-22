import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import Header from '../components/Header'; // Assurez-vous que ce composant existe

export default function WebViewScreen({ url, onBackPress }) {
  return (
    <View style={styles.container}>
      {/* <Header
        title="Web View"
        onBackPress={onBackPress} // Ajoutez une fonction de retour si nécessaire
        showIcons={false}
      /> */}
      <WebView
        source={{ uri: url }}
        style={styles.webview}
      />
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