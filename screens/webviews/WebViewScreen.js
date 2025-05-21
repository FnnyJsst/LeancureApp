import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import WebView from 'react-native-webview';
import ParameterButton from '../../components/buttons/ParameterButton';
import { SCREENS } from '../../constants/screens';
import * as ScreenOrientation from 'expo-screen-orientation';
import { COLORS } from '../../constants/style';
import Header from '../../components/Header';

/**
 * @component WebviewScreen
 * @description Displays a web page when the user has imported a channel
 * @param {string} url - The url of the web page
 * @param {Function} onNavigate - A function to navigate to a screen
 * @param {Function} onSettingsAccess - A function to handle the settings access
 * @param {boolean} isMessagesHidden - A boolean to hide the header
 * @param {string} refreshInterval - The interval for automatic refresh
 */
export default function WebviewScreen({
  url,
  onNavigate,
  onSettingsAccess,
  isMessagesHidden,
  refreshInterval,
}) {

  const webViewRef = useRef(null);
  const intervalRef = useRef(null);

  const refreshWebView = () => {
    console.log('[WebViewScreen] Déclenchement du rafraîchissement automatique pour:', url);
    webViewRef.current?.reload();
  };

  // Automatic refresh management
  useEffect(() => {
    console.log('[WebViewScreen] Mise à jour de l\'intervalle de rafraîchissement:', refreshInterval);

    // Clean the previous interval if it exists
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Convert the interval to milliseconds
    const getIntervalInMs = (interval) => {
      switch (interval) {
        case 'every minute':
          return 60000;
        case 'every 5 minutes':
          return 300000;
        case 'every 15 minutes':
          return 900000;
        case 'every 30 minutes':
          return 1800000;
        case 'every hour':
          return 3600000;
        case 'every 2 hours':
          return 7200000;
        case 'every 6 hours':
          return 21600000;
        default:
          console.error('[WebViewScreen] Aucun intervalle défini ou intervalle non reconnu');
          return null;
      }
    };

    const intervalMs = getIntervalInMs(refreshInterval);

    if (intervalMs) {
      intervalRef.current = setInterval(refreshWebView, intervalMs);
    }

    // Clean when the component is unmounted
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refreshInterval, url]);

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
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('[WebViewScreen] Erreur de chargement:', nativeEvent);
        }}
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
    left: 20,
    zIndex: 1000,
  },
});
