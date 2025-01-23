import React, { useEffect } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import ParameterButton from '../../components/buttons/ParameterButton';
import Header from '../../components/Header';
import { SCREENS } from '../../constants/screens';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/style';

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
        <Text style={styles.headerTitle}>WebViews</Text>
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
    //Delete the top horizontal gray bar on Android
    // marginTop: Platform.OS === 'ios' ? 0 : -10,
  },
  customHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 5,
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