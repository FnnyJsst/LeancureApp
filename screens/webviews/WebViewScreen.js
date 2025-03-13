import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import ParameterButton from '../../components/buttons/ParameterButton';
import { COLORS, SIZES } from '../../constants/style';
import { useWebviews } from '../../hooks/useWebviews';

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
  console.log('Rendu WebViewScreen avec URL:', url);

  // Vérifier que l'URL est valide
  if (!url) {
    console.log('URL manquante');
    return (
      <View style={styles.container}>
        <Text>URL non définie</Text>
      </View>
    );
  }

  const webViewRef = useRef(null);
  const { refreshKey } = useWebviews();

  useEffect(() => {
    if (webViewRef.current && refreshKey > 0) {
      console.log('🔄 Rechargement de la WebView via refreshKey:', {
        refreshKey,
        url,
        timestamp: new Date().toLocaleTimeString()
      });
      webViewRef.current.reload();
    }
  }, [refreshKey, url]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        key={refreshKey}
        source={{ uri: url }}
        style={styles.webview}
        cacheEnabled={true}
        cacheMode="LOAD_CACHE_ELSE_NETWORK"
        domStorageEnabled={true}
        javaScriptEnabled={true}
        androidLayerType="hardware"
        renderToHardwareTextureAndroid={true}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        androidHardwareAccelerationDisabled={false}
        cameraAccessEnabled={true}
        allowsProtectedMedia={true}
        allowsFullscreenVideo={true}
        onShouldStartLoadWithRequest={(request) => {
          // Limit unnecessary loads
          return true;
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('Erreur WebView:', nativeEvent);
        }}
        onLoadStart={() => console.log('📱 Début du chargement de la WebView:', url)}
        onLoadEnd={() => console.log('✅ Fin du chargement de la WebView:', url)}
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
