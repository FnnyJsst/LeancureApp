import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import ParameterButton from '../../components/buttons/ParameterButton';
import Header from '../../components/Header';
import { SCREENS } from '../../constants/screens';
/**
 * WebView Screen Component
 * Displays a web page when the user has imported a channel
 **/
const WebViewScreen = ({ url, onNavigate, onSettingsAccess }) => {

  const handleBackPress = () => {
    onNavigate(SCREENS.APP_MENU);
  };

  return (
    <View style={styles.container}>
      <Header  onBackPress={() => onNavigate(SCREENS.APP_MENU)} />
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
    //Delete the top horizontal gray bar on Android
    marginTop: Platform.OS === 'ios' ? 0 : -10,
  },
  webview: {
    flex: 1,
  },
});

export default WebViewScreen;