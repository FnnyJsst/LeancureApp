import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import ScreenSaver from './screens/common/ScreenSaver';
import SettingsWebviews from './screens/webviews/SettingsWebviews';
import NoUrlScreen from './screens/webviews/NoUrlScreen';
import WebviewsManagementScreen from './screens/webviews/WebviewsManagementScreen';
import WebviewsListScreen from './screens/webviews/WebviewsListScreen';
import WebViewScreen from './screens/webviews/WebViewScreen';
import PasswordDefineModal from './components/modals/webviews/PasswordDefineModal';
import PasswordCheckModal from './components/modals/webviews/PasswordCheckModal';
import { SCREENS } from './constants/screens';
import { COLORS } from './constants/style';
import { useNavigation } from './hooks/useNavigation';
import { useWebviews } from './hooks/useWebviews';
import { useWebviewsPassword } from './hooks/useWebViewsPassword';
import { useFonts } from 'expo-font';
import ErrorBoundary from './components/ErrorBoundary';
import { Ionicons } from '@expo/vector-icons';
import { initI18n } from './i18n';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useTranslation } from 'react-i18next';

/**
 * @component App
 * @description The main component of the app
 */
export default function App({ testID }) {

  const [isLoading, setIsLoading] = useState(true);
  const [isI18nInitialized, setIsI18nInitialized] = useState(false);
  const [currentScreen, setCurrentScreen] = useState(SCREENS.NO_URL);
  const [showSplash, setShowSplash] = useState(true);
  const [appInitialized, setAppInitialized] = useState(false);

  // Loading of fonts used in the app
  const [fontsLoaded] = useFonts({
    'Raleway-Thin': require('./assets/fonts/raleway.thin.ttf'),
    'Raleway-Light': require('./assets/fonts/raleway.light.ttf'),
    'Raleway-Regular': require('./assets/fonts/raleway.regular.ttf'),
    'Raleway-Medium': require('./assets/fonts/raleway.medium.ttf'),
    'Raleway-SemiBold': require('./assets/fonts/raleway.semibold.ttf'),
    'Raleway-Bold': require('./assets/fonts/raleway.bold.ttf'),
    'Raleway-ExtraBold': require('./assets/fonts/raleway.extrabold.ttf'),
  });

  // Custom hooks
  const { navigate } = useNavigation(setCurrentScreen);
  const { t } = useTranslation();

  const {
    channels: webviewChannels,
    selectedWebviews,
    webViewUrl,
    refreshInterval,
    refreshOption,
    isReadOnly,
    toggleReadOnly,
    handleSelectChannels,
    saveSelectedWebviews,
    loadSelectedChannels,
    getIntervalInMilliseconds,
    saveRefreshOption,
    handleSelectOption,
    navigateToChannelsList,
    navigateToWebview,
    clearSecureStore,
  } = useWebviews(setCurrentScreen);

  const {
    password,
    isPasswordRequired,
    isPasswordDefineModalVisible,
    passwordCheckModalVisible,
    setPasswordCheckModalVisible,
    handlePasswordSubmit,
    handlePasswordCheck,
    disablePassword,
    openPasswordDefineModal,
    closePasswordDefineModal,
  } = useWebviewsPassword(navigate);

  /**
   * @function handleSettingsAccess
   * @description Handles the access to the settings screen with a password check if needed
   */
  const handleSettingsAccess = useCallback(() => {
    if (isPasswordRequired) {
      setPasswordCheckModalVisible(true);
    } else {
      navigate(SCREENS.SETTINGS);
    }
  }, [isPasswordRequired, setPasswordCheckModalVisible, navigate]);

  /**
   * @function handleImportWebviews
   * @description Handles the import of webviews
   * @param {Array} newWebviews - The new webviews to import
   */
  const handleImportWebviews = useCallback((newWebviews) => {
    if (newWebviews && newWebviews.length > 0) {
      handleSelectChannels(newWebviews);
    }
  }, [handleSelectChannels]);

  /**
   * @function useEffect
   * @description Handles the screen saver when the app is loading
   */
  useEffect(() => {
    const timer = setTimeout(() => {

      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  /**
   * @function useEffect
   * @description Initializes the app
   */
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // On verrouille d'abord l'orientation en mode paysage
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.LANDSCAPE
        );

        // We initialize the translations
        await initI18n();
        setIsI18nInitialized(true);

        // We load the webviews
        const loadedWebviews = await loadSelectedChannels();

        // We set the loading to false
        setIsLoading(false);

        // If there are webviews, we navigate to the webview screen, otherwise we navigate to the no url screen
        if (loadedWebviews && loadedWebviews.length > 0) {
          navigate(SCREENS.WEBVIEW);
        } else {
          navigate(SCREENS.NO_URL);
        }
      } catch (error) {
        setIsLoading(false);
        navigate(SCREENS.NO_URL);
        throw new Error(t('errors.errorInitializingApp'), error);
      }
    };

    initializeApp();

    // Nettoyage lors du démontage
    return () => {
      ScreenOrientation.unlockAsync().catch(error => {
        console.error('Erreur lors du déverrouillage de l\'orientation:', error);
      });
    };
  }, []);

  // Screen saver will render if the splash screen is visible, the app is loading, the fonts are not loaded or the translations are not initialized
  if (showSplash || isLoading || !fontsLoaded || !isI18nInitialized) {
    return <ScreenSaver testID="screen-saver" />;
  }

  // Render the screens
  const renderWebviewScreen = () => {
    switch (currentScreen) {
      case SCREENS.NO_URL:
        return (
          <NoUrlScreen
            onNavigate={navigate}
            isPasswordRequired={isPasswordRequired}
            password={password}
            setPasswordCheckModalVisible={setPasswordCheckModalVisible}
            handleSettingsAccess={handleSettingsAccess}
            testID="no-url-screen"
          />
        );

      case SCREENS.SETTINGS:
        return (
          <SettingsWebviews
            selectedWebviews={selectedWebviews}
            setRefreshInterval={refreshInterval}
            getIntervalInMilliseconds={getIntervalInMilliseconds}
            saveRefreshOption={saveRefreshOption}
            handleSelectOption={handleSelectOption}
            refreshOption={refreshOption}
            password={password}
            isPasswordRequired={isPasswordRequired}
            handlePasswordCheck={handlePasswordCheck}
            handlePasswordSubmit={handlePasswordSubmit}
            disablePassword={disablePassword}
            openPasswordDefineModal={openPasswordDefineModal}
            closePasswordDefineModal={closePasswordDefineModal}
            isPasswordDefineModalVisible={isPasswordDefineModalVisible}
            isReadOnly={isReadOnly}
            toggleReadOnly={toggleReadOnly}
            onNavigate={navigate}
            testID="settings-webviews-screen"
          />
        );

      case SCREENS.WEBVIEWS_MANAGEMENT:
        return (
          <WebviewsManagementScreen
            onImport={handleImportWebviews}
            selectedWebviews={selectedWebviews}
            setSelectedWebviews={handleSelectChannels}
            saveSelectedWebviews={saveSelectedWebviews}
            onNavigate={navigate}
            onNavigateToWebview={navigateToWebview}
            isReadOnly={isReadOnly}
          />
        );

      case SCREENS.WEBVIEWS_LIST:
        return (
          <WebviewsListScreen
            channels={channels || []}
            selectedWebviews={selectedWebviews}
            onBack={handleImportWebviews}
            onBackPress={() => navigate(SCREENS.WEBVIEWS_MANAGEMENT)}
          />
        );

      case SCREENS.WEBVIEW:
        return (
          <WebViewScreen
            url={webViewUrl}
            onNavigate={navigate}
            onSettingsAccess={handleSettingsAccess}
            refreshInterval={refreshOption}
            testID="webview-screen"
          />
        );

      default:
        return null;
    }
  };

  // Return the final component
  return (
    <ErrorBoundary>
      <View style={styles.container} testID={testID || "app-root"}>
        {renderWebviewScreen()}

        <PasswordDefineModal
          visible={isPasswordDefineModalVisible}
          onClose={closePasswordDefineModal}
          onSubmitPassword={handlePasswordSubmit}
          onDisablePassword={disablePassword}
        />

        <PasswordCheckModal
          visible={passwordCheckModalVisible}
          onClose={() => setPasswordCheckModalVisible(false)}
          onSubmit={handlePasswordCheck}
        />

        <View accessible={true} testID="settings-button">
          <Ionicons />
        </View>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray950,
    // paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight / 2 : 0,
  },
  screenSaverContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    elevation: 999,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
