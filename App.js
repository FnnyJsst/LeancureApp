import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, StatusBar, Platform } from 'react-native';
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
import { useWebviewsPassword } from './hooks/useWebviewsPassword';
import { useFonts } from 'expo-font';
import ErrorBoundary from './components/ErrorBoundary';
import { Ionicons } from '@expo/vector-icons';
import { initI18n } from './i18n';
import * as ScreenOrientation from 'expo-screen-orientation';

/**
 * @component App
 * @description The main component of the app
 */
export default function App({ testID }) {

  const [isLoading, setIsLoading] = useState(true);
  const [isI18nInitialized, setIsI18nInitialized] = useState(false);
  const [currentScreen, setCurrentScreen] = useState(SCREENS.NO_URL);
  const [showSplash, setShowSplash] = useState(true);

  // Loading of fonts
  const [fontsLoaded] = useFonts({
    'Raleway-Thin': require('./assets/fonts/raleway.thin.ttf'),
    'Raleway-Light': require('./assets/fonts/raleway.light.ttf'),
    'Raleway-Regular': require('./assets/fonts/raleway.regular.ttf'),
    'Raleway-Medium': require('./assets/fonts/raleway.medium.ttf'),
    'Raleway-SemiBold': require('./assets/fonts/raleway.semibold.ttf'),
    'Raleway-Bold': require('./assets/fonts/raleway.bold.ttf'),
    'Raleway-ExtraBold': require('./assets/fonts/raleway.extrabold.ttf'),
  });

  // Personalized hooks
  const { navigate } = useNavigation(setCurrentScreen);
  const {
    channels,
    selectedWebviews,
    setSelectedWebviews,
    webViewUrl,
    setRefreshInterval,
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
   * @description Handles the access to the settings with or without password
   */
  const handleSettingsAccess = useCallback(() => {
    if (isPasswordRequired) {
      setPasswordCheckModalVisible(true);
    } else {
      navigate(SCREENS.SETTINGS);
    }
  }, [isPasswordRequired, setPasswordCheckModalVisible, navigate]);

  /**
   * @function handleSplashScreen
   * @description Handles the splash screen
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  /**
   * @function initializeApp
   * @description Initializes the app
   */
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initI18n();
        // Set the i18n initialization to use translations
        setIsI18nInitialized(true);

        // Load the channels of the user
        await loadSelectedChannels();

        // Navigate to the webview screen if there are channels, otherwise to the no url screen
        navigate(selectedWebviews?.length > 0 ? SCREENS.WEBVIEW : SCREENS.NO_URL);
        setIsLoading(false);
      } catch (error) {
        setIsI18nInitialized(true);
        setIsLoading(false);
        navigate(SCREENS.NO_URL);
        throw new Error(`Error while initializing the app: ${error}`);
      }
    };

    initializeApp();
  }, []);

  // Ajouter un useEffect pour verrouiller l'orientation
  useEffect(() => {
    const lockOrientation = async () => {
      try {
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.LANDSCAPE
        );
      } catch (error) {
        console.error('Erreur lors du verrouillage de l\'orientation:', error);
      }
    };

    lockOrientation();

    // Optionnel : déverrouiller lors du nettoyage
    return () => {
      ScreenOrientation.unlockAsync().catch(error => {
        console.error('Erreur lors du déverrouillage de l\'orientation:', error);
      });
    };
  }, []);

  // Condition to render the ScreenSaver
  if (showSplash || isLoading || !fontsLoaded || !isI18nInitialized) {
    return <ScreenSaver testID="screen-saver" />;
  }


  /**
   * @function handleImportWebviews
   * @description Handles the import of channels
   * @param {Array} newWebviews - The selected channels
   * @returns {void}
   */
  const handleImportWebviews = (newWebviews) => {
    if (newWebviews && newWebviews.length > 0) {
      handleSelectChannels(newWebviews);
    }
  };

  /**
   * @function renderWebviewScreen
   * @description Renders the screens in the webviews section
   * @returns {JSX.Element} - The screen
   */
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
            setRefreshInterval={setRefreshInterval}
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
            onImport={navigateToChannelsList}
            selectedWebviews={selectedWebviews}
            setSelectedWebviews={setSelectedWebviews}
            saveSelectedWebviews={saveSelectedWebviews}
            onNavigate={navigate}
            onNavigateToWebview={navigateToWebview}
            isReadOnly={isReadOnly}
          />
        );

      case SCREENS.WEBVIEWS_LIST:
        return (
          <WebviewsListScreen
            channels={channels}
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
            testID="webview-screen"
          />
        );

      default:
        return null;
    }
  };


  return (
    // {/* Error boundary is used to catch errors in the app */}
    <ErrorBoundary>
      <View style={styles.container} testID={testID || "app-root"}>
        {renderWebviewScreen()}

        {(showSplash || isLoading || !fontsLoaded || !isI18nInitialized) && (
          <ScreenSaver testID="screen-saver" />
        )}

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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight / 2 : 0,
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
