import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import WebView from 'react-native-webview';
import ParameterButton from '../../components/buttons/ParameterButton';
import { SCREENS } from '../../constants/screens';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/style';
import { useDeviceType } from '../../hooks/useDeviceType';
import Header from '../../components/Header';

/**
 * @component WebviewScreen
 * @description Displays a web page when the user has imported a channel
 * @param {string} url - The url of the web page
 * @param {Function} onNavigate - A function to navigate to a screen
 * @param {Function} onSettingsAccess - A function to handle the settings access
 * @param {boolean} isMessagesHidden - A boolean to hide the header
 */
export default function WebviewScreen({
  url,
  onNavigate,
  onSettingsAccess,
  isMessagesHidden,
  testID,
}) {
  const { isSmartphone } = useDeviceType();
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
      {!isMessagesHidden && (
        <Header
          title=""
          showBackButton={true}
          onBackPress={() => onNavigate(SCREENS.APP_MENU)}
          showMenuIcon={false}
          transparent={true}
        />
      )}
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
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
    bottom: 20,
    right: 20,
  },
});
