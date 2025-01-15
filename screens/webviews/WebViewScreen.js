import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import ParameterButton from '../../components/buttons/ParameterButton';
import { SCREENS, SETTINGS } from '../../constants/screens';
/**
 * WebView Screen Component
 * Displays a web page
 **/
const WebViewScreen = ({ url, onNavigate, onSettingsAccess }) => {
  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: url }}
        style={styles.webview}
      />
      <ParameterButton onPress={() => onSettingsAccess()} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    //Delete the top horizontal gray850 bar on Android
    marginTop: Platform.OS === 'ios' ? 0 : -10,
  },
  webview: {
    flex: 1,
  },
});

export default WebViewScreen;