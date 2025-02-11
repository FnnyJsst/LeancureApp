import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import ParameterButton from '../../components/buttons/ParameterButton';
import { SCREENS } from '../../constants/screens';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/style';

/**
 * @component WebViewScreen
 * @description Displays a web page when the user has imported a channel
 * @param {string} url - The url of the web page
 * @param {Function} onNavigate - A function to navigate to a screen
 * @param {Function} onSettingsAccess - A function to handle the settings access
 * @returns {JSX.Element} - A JSX element
 * @example
 * <WebViewScreen url={url} onNavigate={(screen) => navigate(screen)} onSettingsAccess={onSettingsAccess} />
 */
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
    <View style={styles.pageContainer}>
      <View style={styles.customHeaderContainer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => onNavigate(SCREENS.APP_MENU)}
        >
          <Ionicons 
            name="chevron-back-outline" 
            size={SIZES.isSmartphone ? 24 : 28} 
            color={COLORS.gray300} 
          />
        </TouchableOpacity>
      </View>
      <WebView
        source={{ uri: url }}
        style={styles.webview}
      />
      <ParameterButton onPress={() => onSettingsAccess()} />
    </View>
  );
};

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: COLORS.gray900,
  },
  customHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  backButton: {
    backgroundColor: '#271E1E',
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: SIZES.fonts.subtitleTablet,
    fontWeight: SIZES.fontWeight.bold,
  },
  webview: {
    flex: 1,
  },
});

export default WebViewScreen;