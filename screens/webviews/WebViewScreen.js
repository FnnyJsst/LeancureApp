import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
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
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Gestionnaire d'erreurs
  const handleError = useCallback(() => {
    console.error('WebView error:', url);
    setHasError(true);
    setIsLoading(false);
  }, [url]);

  // Gestionnaire de chargement
  const handleLoadEnd = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Gestionnaire de crash
  const handleWebViewCrash = useCallback(() => {
    console.error('WebView crashed:', url);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  }, [url]);

  // Configuration de la WebView
  const webViewConfig = {
    javaScriptEnabled: true,
    domStorageEnabled: true,
    cacheEnabled: true,
    mediaPlaybackRequiresUserAction: false,
    allowsInlineMediaPlayback: true,
    scalesPageToFit: true,
    mixedContentMode: 'compatibility',
  };

  useEffect(() => {
    // Lock orientation to landscape when entering WebviewScreen
    const lockLandscape = async () => {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    };
    lockLandscape();

    // Unlock orientation when leaving WebviewScreen
    return () => {
      // Nettoyage de la WebView
      if (webViewRef.current) {
        webViewRef.current.stopLoading();
      }
      ScreenOrientation.unlockAsync();
    };
  }, []);

  // Injection de JavaScript pour optimiser le rendu
  const injectedJavaScript = `
    window.addEventListener('load', function() {
      window.ReactNativeWebView.postMessage('loaded');
    });
    true;
  `;

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        style={styles.webview}
        {...webViewConfig}
        onError={handleError}
        onLoadEnd={handleLoadEnd}
        onRenderProcessGone={handleWebViewCrash}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.orange} />
          </View>
        )}
        injectedJavaScript={injectedJavaScript}
        onMessage={(event) => {
          if (event.nativeEvent.data === 'loaded') {
            handleLoadEnd();
          }
        }}
      />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.orange} />
        </View>
      )}

      {hasError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Une erreur est survenue lors du chargement de la page
          </Text>
        </View>
      )}

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gray900,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.gray900 + '80',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gray900,
    zIndex: 2,
  },
  errorText: {
    color: COLORS.red,
    textAlign: 'center',
    padding: 20,
  },
});
