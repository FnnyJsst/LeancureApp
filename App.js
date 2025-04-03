import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, DeviceEventEmitter, BackHandler } from 'react-native';
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
import './config/firebase';
import { registerForPushNotificationsAsync, handleNotificationReceived, handleNotificationResponse } from './services/notificationService';


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
  const [channels, setChannels] = useState([]);

  // Hooks
  const { navigate } = useNavigation(setCurrentScreen);
  const { t } = useTranslation();
  const { timeoutInterval, handleTimeoutSelection, loadTimeoutInterval } = useTimeout();
  const { expoPushToken, channels: notificationChannels, notification, sendNotification } = useNotifications();

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
      const startTime = Date.now();

      // If the app is already initialized, we return
      if (appInitialized) {
        return;
      }

      try {
        // We initialize the translations
        await initI18n();
        setIsI18nInitialized(true);

        // We load the selected channels and timeout interval
        await Promise.all([
          loadSelectedChannels(),
          loadTimeoutInterval()
        ]);

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
            // We get the messages hidden state
            const storedMessagesHidden = await SecureStore.getItemAsync('isMessagesHidden');
            const isHidden = storedMessagesHidden ? JSON.parse(storedMessagesHidden) : false;

            // If the messages hidden state is not set, we set it to false
            if (storedMessagesHidden === null) {
              await SecureStore.setItemAsync('isMessagesHidden', JSON.stringify(false));
            }

            setIsMessagesHidden(isHidden);
            setIsLoading(false);

            // Only navigate if we're not already on the correct screen
            if (isHidden && currentScreen !== SCREENS.WEBVIEW && currentScreen !== SCREENS.NO_URL) {
              navigate(selectedWebviews?.length > 0 ? SCREENS.WEBVIEW : SCREENS.NO_URL);
            } else if (!isHidden && currentScreen !== SCREENS.APP_MENU) {
              navigate(SCREENS.APP_MENU);
            }
          } catch (error) {
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
      }
    };

    initializeApp();
  }, [appInitialized]);

  /**
   * @description Handles the change of the messages hidden state
   */
  useEffect(() => {
    if (!appInitialized) return;

    const handleMessagesHiddenChange = async () => {
      // If the value has not changed, we return
      if (isMessagesHiddenRef.current === isMessagesHidden) return;

      // We save the messages hidden state
      try {
        await SecureStore.setItemAsync('isMessagesHidden', JSON.stringify(isMessagesHidden));

        // We update the ref
        isMessagesHiddenRef.current = isMessagesHidden;

        // If the messages are hidden and we are on the AppMenu, we navigate to the WebView
        if (isMessagesHidden && currentScreen === SCREENS.APP_MENU) {
          navigate(selectedWebviews?.length > 0 ? SCREENS.WEBVIEW : SCREENS.NO_URL);
        }
        // If the messages are not hidden and we are on the WebView, we navigate to the AppMenu
        else if (!isMessagesHidden && currentScreen === SCREENS.WEBVIEW) {
          navigate(SCREENS.APP_MENU);
        }
      } catch (error) {
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

  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        console.log('🔔 Initialisation des notifications...');
        const token = await registerForPushNotificationsAsync();
        if (token) {
          console.log('✅ Token obtenu dans App.js :', token);
        }
      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        console.error('❌ Erreur lors de l\'initialisation:', error);
      }
    };

    initializeNotifications();
  }, []);

  // If the fonts are not loaded, the translations are not initialized or the isLoading is true, we return the ScreenSaver
  if (!fontsLoaded || !isI18nInitialized || isLoading) {
    return <ScreenSaver testID="screen-saver" />;
  }

  /**
   * @function handleImportWebviews
   * @description Handles the import of channels
   * @param {Array|string} newWebviews - The selected channels or a single URL
   */
  const handleImportWebviews = (newWebviews) => {
    console.log('[App] handleImportWebviews appelé avec:', newWebviews);

    if (typeof newWebviews === 'string') {
      // Si c'est une URL unique, créer un objet webview et l'ajouter directement
      const newWebview = {
        href: newWebviews,
        title: newWebviews // On utilise l'URL comme titre par défaut
      };
      console.log('[App] Création d\'un nouveau webview:', newWebview);
      handleSelectChannels([newWebview]);
      // On reste sur l'écran de gestion des webviews
      navigate(SCREENS.WEBVIEWS_MANAGEMENT);
    } else if (Array.isArray(newWebviews) && newWebviews.length > 0) {
      // Si c'est un tableau de webviews, on les ajoute à la liste des webviews sélectionnés
      console.log('[App] Ajout des nouvelles chaînes:', newWebviews);
      handleSelectChannels([...selectedWebviews, ...newWebviews]);
      // On vide le state channels
      setChannels([]);
      // On retourne à l'écran de gestion des webviews
      navigate(SCREENS.WEBVIEWS_MANAGEMENT);
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

        <View accessible={true} testID="settings-button">
          <Ionicons />
        </View>

        <NotificationTestButton />

        {/* <NotificationTestButton /> */}
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