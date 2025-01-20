import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import ParameterButton from '../../components/buttons/ParameterButton';
import Header from '../../components/Header';
import { SCREENS } from '../../constants/screens';
import * as ScreenOrientation from 'expo-screen-orientation';

/**
 * WebView Screen Component
 * Displays a web page when the user has imported a channel
 **/
const WebViewScreen = ({ url, onNavigate, onSettingsAccess }) => {
  useEffect(() => {
    // Lock orientation to landscape when entering WebViewScreen
    const lockLandscape = async () => {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    };
    lockLandscape();

    // Unlock orientation when leaving WebViewScreen
    return () => {
      ScreenOrientation.unlockAsync();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Header 
        noBorder
        onBackPress={() => onNavigate(SCREENS.APP_MENU)}
        showIcons={true}
      />
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