import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Webview } from 'react-native-webview';
import ParameterButton from '../../components/buttons/ParameterButton';
import { SCREENS } from '../../constants/screens';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/style';
import { useDeviceType } from '../../hooks/useDeviceType';

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
      {/* If messages are not hidden, display the back button so we can go back to the app menu */}
      {!isMessagesHidden && (
        <View style={styles.customHeaderContainer}>
          <TouchableOpacity
            style={[styles.backButton, isSmartphone && styles.backButtonSmartphone]}
            onPress={() => onNavigate(SCREENS.APP_MENU)}
          >
            <Ionicons
              name="close-outline"
              size={isSmartphone ? 20 : 24}
              color={COLORS.white}
            />
          </TouchableOpacity>
        </View>
      )}
      <Webview
        ref={webViewRef}
        source={{ uri: url }}
        style={styles.webview}
      />
      <View style={styles.buttonContainer}>
        <ParameterButton onPress={onSettingsAccess} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
    backgroundColor: COLORS.charcoal,
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    marginTop: 10,
  },
  backButtonSmartphone: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: SIZES.fonts.subtitleTablet,
    fontWeight: SIZES.fontWeight.bold,
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
    padding: 15,
  },
});
