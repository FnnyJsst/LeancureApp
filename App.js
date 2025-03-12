import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, StatusBar, Platform, ActivityIndicator } from 'react-native';
import ScreenSaver from './screens/common/ScreenSaver';
import SettingsWebviews from './screens/webviews/SettingsWebviews';
import NoUrlScreen from './screens/webviews/NoUrlScreen';
import WebviewsManagementScreen from './screens/webviews/WebviewsManagementScreen';
import WebviewsListScreen from './screens/webviews/WebviewsListScreen';
import WebviewScreen from './screens/webviews/WebViewScreen';
import Login from './screens/messages/login/Login';
import PasswordDefineModal from './components/modals/webviews/PasswordDefineModal';
import PasswordCheckModal from './components/modals/webviews/PasswordCheckModal';
import AppMenu from './screens/common/AppMenu';
import ChatScreen from './screens/messages/ChatScreen';
import SettingsMessage from './components/modals/chat/SettingsMessage';
import { SCREENS } from './constants/screens';
import { COLORS } from './constants/style';
import { useNavigation } from './hooks/useNavigation';
import * as SecureStore from 'expo-secure-store';
import Sidebar from './components/navigation/Sidebar';
import { useWebviews } from './hooks/useWebviews';
import { useWebviewsPassword } from './hooks/useWebViewsPassword';
import { LogBox } from 'react-native';
import { useFonts } from 'expo-font';
import CommonSettings from './screens/common/CommonSettings';
import { useTimeout } from './hooks/useTimeout';
import ErrorBoundary from './components/ErrorBoundary';
import { Ionicons } from '@expo/vector-icons';
import { initI18n } from './i18n';
// import { VERSION } from './config/versioning/version';
// import { V1_CONFIG } from './config/versioning/v1.config';
// import { V2_CONFIG } from './config/versioning/v2.config';
// import { usePushNotifications } from './services/notifications/notificationService';

LogBox.ignoreLogs(['[expo-notifications]']);

console.log = (...args) => {
  if (__DEV__) {
    console.info(...args);
  }
};

// const CONFIG = VERSION === 'v1' ? V1_CONFIG : V2_CONFIG;


/**
 * @component App
 * @description The main component of the app
 */
export default function App({ testID, initialScreen }) {
  // 1. TOUS les états d'abord, regroupés
  const [fontsLoaded] = useFonts({
    'Raleway-Thin': require('./assets/fonts/raleway.thin.ttf'),
    'Raleway-Light': require('./assets/fonts/raleway.light.ttf'),
    'Raleway-Regular': require('./assets/fonts/raleway.regular.ttf'),
    'Raleway-Medium': require('./assets/fonts/raleway.medium.ttf'),
    'Raleway-SemiBold': require('./assets/fonts/raleway.semibold.ttf'),
    'Raleway-Bold': require('./assets/fonts/raleway.bold.ttf'),
    'Raleway-ExtraBold': require('./assets/fonts/raleway.extrabold.ttf'),
  });
  const [isI18nInitialized, setIsI18nInitialized] = useState(false);
  const [currentScreen, setCurrentScreen] = useState(initialScreen);
  const [isLoading, setIsLoading] = useState(true);
  const [globalMessages, setGlobalMessages] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMessagesHidden, setIsMessagesHidden] = useState(false);
  const [appInitialized, setAppInitialized] = useState(false);

  // 2. Navigation hook
  const { navigate } = useNavigation(setCurrentScreen);

  // 3. Timeout hook
  const { timeoutInterval, handleTimeoutSelection, loadTimeoutInterval } = useTimeout();

  // 4. Webviews hook
  const {
    channels,
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
  } = useWebviews(setCurrentScreen);

  // 5. Password hook
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

  // 6. Callbacks
  const handleSettingsAccess = useCallback(() => {
    if (isPasswordRequired) {
      setPasswordCheckModalVisible(true);
    } else {
      navigate(SCREENS.SETTINGS);
    }
  }, [isPasswordRequired, setPasswordCheckModalVisible, navigate]);

  const hideMessages = useCallback(async (shouldHide) => {
    try {
      await SecureStore.setItemAsync('isMessagesHidden', JSON.stringify(shouldHide));
      setIsMessagesHidden(shouldHide);
      if (shouldHide) {
        setIsLoading(true);
        setTimeout(() => {
          setIsLoading(false);
          navigate(selectedWebviews?.length > 0 ? SCREENS.WEBVIEW : SCREENS.NO_URL);
        }, 3000);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du paramètre hideMessages:', error);
    }
  }, [navigate, selectedWebviews]);

  // 7. Effet d'initialisation principal
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 1. Initialiser i18n
        await initI18n();
        console.log('i18n initialized');
        setIsI18nInitialized(true);

        // 2. Charger les données du SecureStore
        try {
          await loadSelectedChannels();
          await loadTimeoutInterval();

          // Vérifier la valeur de isMessagesHidden dans le SecureStore
          const storedMessagesHidden = await SecureStore.getItemAsync('isMessagesHidden');

          if (storedMessagesHidden === null) {
            // Première utilisation : messages visibles par défaut
            await SecureStore.setItemAsync('isMessagesHidden', JSON.stringify(false));
            setIsMessagesHidden(false);
            setIsLoading(false);
            navigate(SCREENS.APP_MENU);
          } else {
            // Valeur existante
            const isHidden = JSON.parse(storedMessagesHidden);
            setIsMessagesHidden(isHidden);
            setIsLoading(false);

            if (isHidden) {
              // Si messages cachés, diriger vers WEBVIEW ou NO_URL
              navigate(selectedWebviews?.length > 0 ? SCREENS.WEBVIEW : SCREENS.NO_URL);
            } else {
              // Si messages visibles, diriger vers APP_MENU
              navigate(SCREENS.APP_MENU);
            }
          }

        } catch (error) {
          if (error.message.includes('Could not decrypt')) {
            await SecureStore.deleteItemAsync('selectedWebviews');
            await SecureStore.deleteItemAsync('password');
            await SecureStore.deleteItemAsync('isPasswordRequired');
            await SecureStore.deleteItemAsync('refreshOption');
            await SecureStore.deleteItemAsync('isReadOnly');
            await SecureStore.deleteItemAsync('isMessagesHidden');

            // En cas d'erreur de décryptage, réinitialiser à l'état par défaut
            setIsMessagesHidden(false);
            navigate(SCREENS.APP_MENU);
          }
          console.error('Erreur de chargement des données:', error);
        }

      } catch (error) {
        console.error('Erreur d\'initialisation:', error);
        setIsI18nInitialized(true);
        setIsLoading(false);
        // En cas d'erreur générale, aller vers APP_MENU avec messages visibles
        setIsMessagesHidden(false);
        navigate(SCREENS.APP_MENU);
      }
    };

    initializeApp();
  }, [loadSelectedChannels, loadTimeoutInterval, navigate, selectedWebviews]);

  // 8. Rendu conditionnel pour le ScreenSaver
  if (!fontsLoaded || !isI18nInitialized || isLoading) {
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
      case SCREENS.APP_MENU:
        return (
          <AppMenu
            onNavigate={(screen) => {
              if (screen === SCREENS.WEBVIEW) {
                navigate(selectedWebviews?.length > 0 ? SCREENS.WEBVIEW : SCREENS.NO_URL);
              } else if (screen === SCREENS.SETTINGS) {
                handleSettingsAccess();
              } else {
                navigate(screen);
              }
            }}
            // isV2={VERSION === 'v2'}
            testID="app-menu"
          />
        );

      case SCREENS.NO_URL:
        return (
          <NoUrlScreen
            onNavigate={navigate}
            isPasswordRequired={isPasswordRequired}
            password={password}
            setPasswordCheckModalVisible={setPasswordCheckModalVisible}
            handleSettingsAccess={handleSettingsAccess}
            isMessagesHidden={isMessagesHidden}
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
            onHideMessages={hideMessages}
            isMessagesHidden={isMessagesHidden}
            onToggleHideMessages={hideMessages}
            testID="settings-webviews-screen"
          />
        );

      case SCREENS.WEBVIEWS_MANAGEMENT:
        return (
          <WebviewsManagementScreen
            onImport={navigateToChannelsList}
            selectedWebviews={selectedWebviews}
            setSelectedWebviews={selectedWebviews}
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
          <WebviewScreen
            url={webViewUrl}
            onNavigate={navigate}
            onSettingsAccess={handleSettingsAccess}
            isMessagesHidden={isMessagesHidden}
            testID="webview-screen"
          />
        );

      case SCREENS.LOGIN:
        return (
          <Login
            onNavigate={navigate}
            testID="login-screen"
          />
        );

      case SCREENS.CHAT:
        return (
          <ChatScreen
            onNavigate={navigate}
            isExpanded={isExpanded}
            setIsExpanded={setIsExpanded}
            handleChatLogout={handleChatLogout}
            globalMessages={globalMessages}
            testID="chat-container"
          />
        );

      case SCREENS.SETTINGS_MESSAGE:
        return (
          <SettingsMessage
            onNavigate={navigate}
            isExpanded={isExpanded}
            setIsExpanded={setIsExpanded}
            handleChatLogout={handleChatLogout}
            onSelectOption={handleTimeoutSelection}
          />
        );

      case SCREENS.COMMON_SETTINGS:
        return (
          <CommonSettings
            onBackPress={() => navigate(SCREENS.APP_MENU)}
            onHideMessages={hideMessages}
            hideMessages={isMessagesHidden}
            isMessagesHidden={isMessagesHidden}
          />
        );

      default:
        return null;
    }
  };

  /**
   * @function handleChatLogout
   * @description Handles the logout process inthe chat section
   * @returns {void}
   */
  const handleChatLogout = async () => {
    try {
        await SecureStore.deleteItemAsync('savedLoginInfo');
        navigate(SCREENS.LOGIN);
    } catch (error) {
        throw new Error('Error during logout:', error);
    }
  };

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

        <Sidebar
          onLogout={handleChatLogout}
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
    // paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
