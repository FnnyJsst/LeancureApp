import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import WebView from 'react-native-webview';
import ParameterButton from '../../components/buttons/ParameterButton';
import * as ScreenOrientation from 'expo-screen-orientation';
import { COLORS } from '../../constants/style';

/**
 * @component WebviewScreen
 * @description Displays a web page when the user has imported a channel
 * @param {string} url - The url of the web page
 * @param {Function} onNavigate - A function to navigate to a screen
 * @param {Function} onSettingsAccess - A function to handle the settings access
 */
export default function WebviewScreen({
  url,
  onNavigate,
  onSettingsAccess,
  refreshInterval,
  testID,
}) {

  const webViewRef = useRef(null);
  const intervalRef = useRef(null);

  const refreshWebView = () => {
    console.log('[WebViewScreen] Déclenchement du rafraîchissement automatique pour:', url);
    console.log('[WebViewScreen] Intervalle actuel:', refreshInterval);
    webViewRef.current?.reload();
  };

    // Refresh the webview when the interval is changed
    useEffect(() => {
      console.log('[WebViewScreen] Mise à jour de l\'intervalle de rafraîchissement:', refreshInterval);

      // Clean the previous interval if it exists
      if (intervalRef.current) {
        console.log('[WebViewScreen] Nettoyage de l\'ancien intervalle');
        clearInterval(intervalRef.current);
      }

      // Convert the interval to milliseconds
      const getIntervalInMs = (interval) => {
        console.log('[WebViewScreen] Conversion de l\'intervalle:', interval);
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
            console.log('[WebViewScreen] Aucun intervalle défini ou intervalle non reconnu');
            return null;
        }
      };

      const intervalMs = getIntervalInMs(refreshInterval);

      if (intervalMs) {
        console.log('[WebViewScreen] Configuration du nouveau rafraîchissement automatique:', {
          interval: refreshInterval,
          milliseconds: intervalMs
        });
        intervalRef.current = setInterval(refreshWebView, intervalMs);
      }

      // Clean when the component is unmounted
      return () => {
        if (intervalRef.current) {
          console.log('[WebViewScreen] Nettoyage de l\'intervalle lors du démontage');
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
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        onLoadStart={() => console.log('[WebViewScreen] Chargement de la page démarré:', url)}
        onLoadEnd={() => console.log('[WebViewScreen] Chargement de la page terminé:', url)}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.log('[WebViewScreen] Erreur de chargement:', nativeEvent);
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