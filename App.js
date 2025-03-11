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
  // 1. Tous les useState au début
  const [isLoading, setIsLoading] = useState(true);
  const [isI18nInitialized, setIsI18nInitialized] = useState(false);
  const [currentScreen, setCurrentScreen] = useState(SCREENS.NO_URL);
  const [showSplash, setShowSplash] = useState(true);

  // 2. Chargement des polices
  const [fontsLoaded] = useFonts({
    'Raleway-Thin': require('./assets/fonts/raleway.thin.ttf'),
    'Raleway-Light': require('./assets/fonts/raleway.light.ttf'),
    'Raleway-Regular': require('./assets/fonts/raleway.regular.ttf'),
    'Raleway-Medium': require('./assets/fonts/raleway.medium.ttf'),
    'Raleway-SemiBold': require('./assets/fonts/raleway.semibold.ttf'),
    'Raleway-Bold': require('./assets/fonts/raleway.bold.ttf'),
    'Raleway-ExtraBold': require('./assets/fonts/raleway.extrabold.ttf'),
  });

  // 3. Hooks personnalisés
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

  // 4. Tous les useCallback
  const handleSettingsAccess = useCallback(() => {
    if (isPasswordRequired) {
      setPasswordCheckModalVisible(true);
    } else {
      navigate(SCREENS.SETTINGS);
    }
  }, [isPasswordRequired, setPasswordCheckModalVisible, navigate]);

  const handleImportWebviews = useCallback((newWebviews) => {
    if (newWebviews && newWebviews.length > 0) {
      handleSelectChannels(newWebviews);
    }
  }, [handleSelectChannels]);

  // 5. Tous les useEffect
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initI18n();
        setIsI18nInitialized(true);

        const loadedChannels = await loadSelectedChannels();
        if (Array.isArray(loadedChannels)) {
          navigate(loadedChannels.length > 0 ? SCREENS.WEBVIEW : SCREENS.NO_URL);
        } else {
          navigate(SCREENS.NO_URL);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Erreur d\'initialisation:', error);
        setIsI18nInitialized(true);
        setIsLoading(false);
        navigate(SCREENS.NO_URL);
      }
    };

    initializeApp();
  }, [loadSelectedChannels, navigate]);

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
    return () => {
      ScreenOrientation.unlockAsync().catch(error => {
        console.error('Erreur lors du déverrouillage de l\'orientation:', error);
      });
    };
  }, []);

  // 6. Condition de rendu du ScreenSaver
  if (showSplash || isLoading || !fontsLoaded || !isI18nInitialized) {
    return <ScreenSaver testID="screen-saver" />;
  }

  // 7. Fonction de rendu des écrans (déplacée avant le return final)
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

  // 8. Return final
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
