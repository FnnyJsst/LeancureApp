import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import ParameterButton from '../../components/buttons/ParameterButton';
import * as ScreenOrientation from 'expo-screen-orientation';
import { COLORS, SIZES } from '../../constants/style';

/**
 * @component WebviewScreen
 * @description Displays a web page when the user has imported a channel
 * @param {string} url - The url of the web page
 * @param {Function} onSettingsAccess - A function to handle the settings access
 */
export default function WebviewScreen({
  url,
  onSettingsAccess,
}) {

  const webViewRef = useRef(null);

  useEffect(() => {
    // Lock orientation to landscape when entering WebviewScreen
    const lockLandscape = async () => {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    };
    lockLandscape();

    // Unlock orientation when leaving WebviewScreen
    return () => {
      ScreenOrientation.unlockAsync();
    };
  }, []);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        style={styles.webview}
      />
      <View style={styles.buttonContainer}>
        <ParameterButton onPress={onSettingsAccess} testID="settings-button" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray900,
  },
  webview: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
});
