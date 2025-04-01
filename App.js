import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { useTranslation } from 'react-i18next';
import { handleError, ErrorType } from './utils/errorHandling';
import { WebView } from 'react-native-webview';

LogBox.ignoreLogs(['[expo-notifications]']);

console.log = (...args) => {
  if (__DEV__) {
    console.info(...args);
  }
};

/**
 * @function handleAppError
 * @description Handle application-related errors
 */
const handleAppError = (error, source) => {
  return handleError(error, `app.${source}`, {
    type: ErrorType.SYSTEM,
    silent: false
  });
};

/**
 * @component App
 * @description The main component of the app
 */
export default function App({ testID, initialScreen }) {

  // Fonts
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
  const isMessagesHiddenRef = useRef(false);

  // Hooks
  const { navigate } = useNavigation(setCurrentScreen);
  const { t } = useTranslation();
  const { timeoutInterval, handleTimeoutSelection, loadTimeoutInterval } = useTimeout();

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
   * @description Handles the settings access with or without password
   */
  const handleSettingsAccess = useCallback(() => {
    if (isPasswordRequired) {
      setPasswordCheckModalVisible(true);
    } else {
      navigate(SCREENS.SETTINGS);
    }
  }, [isPasswordRequired, setPasswordCheckModalVisible, navigate]);

  /**
   * @function hideMessages
   * @description Hides the messages section or the app
   * @param {boolean} shouldHide - Whether to hide the messages
   */
  const hideMessages = useCallback(async (shouldHide) => {
    try {
      // We save the messages hidden state
      await SecureStore.setItemAsync('isMessagesHidden', JSON.stringify(shouldHide));
      setIsMessagesHidden(shouldHide);

      // If the messages are hidden, we navigate to the webview or the no url screen
      if (shouldHide) {
        setIsLoading(true);
        setTimeout(() => {
          setIsLoading(false);
          navigate(selectedWebviews?.length > 0 ? SCREENS.WEBVIEW : SCREENS.NO_URL);
        }, 3000);
      }
    } catch (error) {
      handleAppError(error, 'hideMessages');
    }
  }, [navigate, selectedWebviews]);

  /**
   * @description Initializes the app
   */
  useEffect(() => {
    const initializeApp = async () => {
      console.log('[App] Début de l\'initialisation');
      const startTime = Date.now();

      if (appInitialized) {
        console.log('[App] L\'application est déjà initialisée');
        return;
      }

      try {
        // We initialize the translations
        console.log('[App] Début de l\'initialisation des traductions');
        const i18nStartTime = Date.now();
        await initI18n();
        setIsI18nInitialized(true);
        console.log(`[App] Initialisation des traductions terminée en ${Date.now() - i18nStartTime}ms`);

        // We load the selected channels and timeout interval
        console.log('[App] Début du chargement des données');
        const dataStartTime = Date.now();
        await Promise.all([
          loadSelectedChannels(),
          loadTimeoutInterval()
        ]);
        console.log(`[App] Chargement des données terminé en ${Date.now() - dataStartTime}ms`);

        // List of screens where we don't want automatic redirection
        const intentionalScreens = [
          SCREENS.COMMON_SETTINGS,
          SCREENS.LOGIN,
          SCREENS.WEBVIEW,
          SCREENS.NO_URL,
          SCREENS.CHAT,
          SCREENS.WEBVIEWS_MANAGEMENT,
          SCREENS.WEBVIEWS_LIST,
          SCREENS.SETTINGS
        ];

        if (!intentionalScreens.includes(currentScreen)) {
          try {
            console.log('[App] Début du chargement de l\'état des messages');
            const messagesStartTime = Date.now();
            const storedMessagesHidden = await SecureStore.getItemAsync('isMessagesHidden');
            const isHidden = storedMessagesHidden ? JSON.parse(storedMessagesHidden) : false;

            if (storedMessagesHidden === null) {
              await SecureStore.setItemAsync('isMessagesHidden', JSON.stringify(false));
            }

            setIsMessagesHidden(isHidden);
            setIsLoading(false);
            console.log(`[App] Chargement de l'état des messages terminé en ${Date.now() - messagesStartTime}ms`);

            // Only navigate if we're not already on the correct screen
            if (isHidden && currentScreen !== SCREENS.WEBVIEW && currentScreen !== SCREENS.NO_URL) {
              console.log('[App] Navigation vers WebView/NoUrl');
              navigate(selectedWebviews?.length > 0 ? SCREENS.WEBVIEW : SCREENS.NO_URL);
            } else if (!isHidden && currentScreen !== SCREENS.APP_MENU) {
              console.log('[App] Navigation vers AppMenu');
              navigate(SCREENS.APP_MENU);
            }
          } catch (error) {
            console.error('[App] Erreur lors du chargement de l\'état des messages:', error);
            handleAppError(error, 'secureStore');
            setIsMessagesHidden(false);
            setIsLoading(false);
            if (currentScreen !== SCREENS.APP_MENU) {
              navigate(SCREENS.APP_MENU);
            }
          }
        } else {
          setIsLoading(false);
        }

      } catch (error) {
        if (error.message.includes('Could not decrypt')) {
          console.error('[App] Erreur de décryptage:', error);
          handleAppError(error, 'decryption');
          await clearSecureStore();
          setIsMessagesHidden(false);
          setIsLoading(false);
          if (currentScreen !== SCREENS.APP_MENU) {
            navigate(SCREENS.APP_MENU);
          }
        }
      } finally {
        setAppInitialized(true);
        console.log(`[App] Initialisation totale terminée en ${Date.now() - startTime}ms`);
      }
    };

    initializeApp();
  }, [appInitialized]);

  // Effet pour gérer les changements d'état de isMessagesHidden
  useEffect(() => {
    if (!appInitialized) return;

    const handleMessagesHiddenChange = async () => {
      // Vérifier si la valeur a réellement changé
      if (isMessagesHiddenRef.current === isMessagesHidden) return;

      console.log('[App] Changement de l\'état isMessagesHidden:', isMessagesHidden);
      const startTime = Date.now();

      try {
        await SecureStore.setItemAsync('isMessagesHidden', JSON.stringify(isMessagesHidden));
        console.log(`[App] Sauvegarde de l'état isMessagesHidden terminée en ${Date.now() - startTime}ms`);

        // Mettre à jour la ref
        isMessagesHiddenRef.current = isMessagesHidden;

        // Si les messages sont cachés et qu'on est sur l'AppMenu, on navigue vers la WebView
        if (isMessagesHidden && currentScreen === SCREENS.APP_MENU) {
          console.log('[App] Navigation vers WebView/NoUrl (messages cachés)');
          navigate(selectedWebviews?.length > 0 ? SCREENS.WEBVIEW : SCREENS.NO_URL);
        }
        // Si les messages ne sont plus cachés et qu'on est sur la WebView, on navigue vers l'AppMenu
        else if (!isMessagesHidden && currentScreen === SCREENS.WEBVIEW) {
          console.log('[App] Navigation vers AppMenu (messages visibles)');
          navigate(SCREENS.APP_MENU);
        }
      } catch (error) {
        console.error('[App] Erreur lors de la mise à jour de isMessagesHidden:', error);
        handleAppError(error, 'updateMessagesHidden');
      }
    };

    handleMessagesHiddenChange();
  }, [isMessagesHidden, appInitialized, currentScreen, navigate, selectedWebviews]);

  /**
   * @function handleChatLogout
   * @description Handles the logout process inthe chat section
   */
  const handleChatLogout = async () => {
    try {
      await SecureStore.deleteItemAsync('savedLoginInfo');
      navigate(SCREENS.LOGIN);
    } catch (error) {
      handleAppError(error, 'logout');
      throw error;
    }
  };

  // If the fonts are not loaded, the translations are not initialized or the isLoading is true, we return the ScreenSaver
  if (!fontsLoaded || !isI18nInitialized || isLoading) {
    return <ScreenSaver testID="screen-saver" />;
  }

  /**
   * @function handleImportWebviews
   * @description Handles the import of channels
   * @param {Array} newWebviews - The selected channels
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
                if (selectedWebviews?.length > 0) {
                  navigate(SCREENS.WEBVIEW);
                } else {
                  navigate(SCREENS.NO_URL);
                }
              } else if (screen === SCREENS.SETTINGS) {
                handleSettingsAccess();
              } else {
                navigate(screen);
              }
            }}
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
  },
});