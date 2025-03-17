import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import ParameterButton from '../../components/buttons/ParameterButton';
import { COLORS, SIZES } from '../../constants/style';
import { useWebviews } from '../../hooks/useWebviews';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  // We check if the url is valid
  if (!url) {
    return (
      <View style={styles.container}>
        <Text>{t('errors.urlNotDefined')}</Text>
      </View>
    );
  }

  const webViewRef = useRef(null);
  const { refreshKey } = useWebviews();

  /**
   * @function useEffect
   * @description Reloads the webview if the refresh key is greater than 0
   */
  useEffect(() => {
    // We reload the webview if the refresh key is greater than 0
    if (webViewRef.current && refreshKey > 0) {
      webViewRef.current.reload();
    }
  }, [refreshKey, url]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        key={`${url}-${refreshKey}`}
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
        // onLoadStart={() => console.log('📱 Début du chargement de la WebView:', url)}
        // onLoadEnd={() => console.log('✅ Fin du chargement de la WebView:', url)}
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
