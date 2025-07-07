import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, AppState } from 'react-native';
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
import { SCREENS } from './constants/screens';
import { COLORS } from './constants/style';
import { useNavigation } from './hooks/useNavigation';
import * as SecureStore from 'expo-secure-store';
import { useWebviews } from './hooks/useWebviews';
import { useWebviewsPassword } from './hooks/useWebViewsPassword';
import { useFonts } from 'expo-font';
import CommonSettings from './screens/common/CommonSettings';
import { useTimeout } from './hooks/useTimeout';
import ErrorBoundary from './components/ErrorBoundary';
import { initI18n } from './i18n';
import { registerForPushNotificationsAsync, shouldDisplayNotification, removeNotificationToken, setupConnectionMonitor } from './services/notification/notificationService';
import * as Notifications from 'expo-notifications';
import { cleanSecureStoreKeys } from './utils/secureStore';
import './config/firebase';
import { NotificationProvider } from './services/notification/notificationContext';

export default function App({ testID, initialScreen }) {

  // Fonts
  const [fontsLoaded] = useFonts({
    'Raleway-Regular': require('./assets/fonts/raleway.regular.ttf'),
    'Raleway-Medium': require('./assets/fonts/raleway.medium.ttf'),
    'Raleway-SemiBold': require('./assets/fonts/raleway.semibold.ttf'),
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
  const { loadTimeoutInterval } = useTimeout();

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
    // If the password is required, we show the password check modal, else we navigate to the settings screen
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
      // If the error is a decryption error, we clean the secure store
      if (error.message && (
        error.message.includes('decrypt') ||
        error.message.includes('decryption')
      )) {

        try {
          await cleanSecureStoreKeys();
          // We try to save again after cleaning
          await SecureStore.setItemAsync('isMessagesHidden', JSON.stringify(shouldHide));
          setIsMessagesHidden(shouldHide);

          if (shouldHide) {
            setIsLoading(true);
            setTimeout(() => {
              setIsLoading(false);
              navigate(selectedWebviews?.length > 0 ? SCREENS.WEBVIEW : SCREENS.NO_URL);
            }, 3000);
          }
        } catch (cleanError) {
          console.error('[App] Error while cleaning the SecureStore:', cleanError);
        }
      } else {
        console.error('[App] Error while hiding the messages:', error);
      }
    }
  }, [navigate, selectedWebviews]);

  /**
   * @description Initializes the app
   */
  useEffect(() => {
    const initializeApp = async () => {
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
          SCREENS.SETTINGS,
          SCREENS.APP_MENU
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
            console.error('[App] Error while initializing the app:', error);
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
        if (error.message && (
            error.message.includes('Could not decrypt') ||
            error.message.includes('decrypt') ||
            error.message.includes('decipher') ||
            error.message.includes('decryption'))
        ) {
          console.error('[App] Error while decrypting the SecureStore:', error);
          try {

            await cleanSecureStoreKeys();
          } catch (cleanError) {
            console.error('[App] Error while cleaning the SecureStore:', cleanError);
          }
          // We reset the states after cleaning
          setIsMessagesHidden(false);
          setIsLoading(false);
          if (currentScreen !== SCREENS.APP_MENU) {
            navigate(SCREENS.APP_MENU);
          }
        } else {
          // Other types of errors
          console.error('[App] Error while initializing the app:', error);
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

    /**
     * @function handleMessagesHiddenChange
     * @description Handles the change of the messages hidden state
     */
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

        // Check if it's a decryption error
        if (error.message && (
          error.message.includes('decrypt') ||
          error.message.includes('decipher') ||
          error.message.includes('decryption')
        )) {
          try {

            await cleanSecureStoreKeys();

            // We try to save again after cleaning
            await SecureStore.setItemAsync('isMessagesHidden', JSON.stringify(isMessagesHidden));
            isMessagesHiddenRef.current = isMessagesHidden;
          } catch (cleanError) {
            console.error('[App] Error while cleaning the SecureStore:', cleanError);
          }
        } else {
          console.error('[App] Error while updating the messages hidden state:', error);
        }
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
      // First, we delete the notification token
      const tokenRemoved = await removeNotificationToken();
      console.log('✅ Token de notification supprimé:', tokenRemoved);

      // Then, we delete the connection information
      await SecureStore.deleteItemAsync('savedLoginInfo');

      // Finally, we redirect to the login screen
      navigate(SCREENS.LOGIN);
    } catch (error) {
      console.error('[App] Error while logging out:', error);
      return;
    }
  };

  /**
   * @function handleAppStateChange
   * @description Handles the app state change
   */
  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      if (nextAppState === 'active') {
        try {
          // Check if the credentials exist
          const savedCredentials = await SecureStore.getItemAsync('savedLoginInfo');
          if (savedCredentials) {
            // If we are on the login screen but have credentials, we redirect to the app menu
            if (currentScreen === SCREENS.LOGIN) {
              navigate(SCREENS.APP_MENU);
            }
          } else {
            if (currentScreen !== SCREENS.LOGIN) {
              navigate(SCREENS.LOGIN);
            }
          }
        } catch (error) {
          console.error('[App] Error while changing the app state:', error);
        }
      }
    };

    // Subscribe to the app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [currentScreen, navigate]);

  useEffect(() => {
    let subscription = null;
    // Configuration of notifications
    const setupNotifications = async () => {
      try {
        await registerForPushNotificationsAsync();
        // Get the permissions status
        await Notifications.getPermissionsAsync();
      } catch (error) {
        console.error('[App] Error while setting up notifications:', error);
      }
    };

    setupNotifications();

    subscription = Notifications.addNotificationReceivedListener(async notification => {
      // Extract the notification data
      const notificationData = {
        title: notification.request.content.title,
        body: notification.request.content.body,
        data: notification.request.content.data
      };

      try {
        // Try to extract information from the message for our filtering logic
        // We search for indices in the message body to determine if it's a clean message
        const notificationBody = notificationData.body || '';
        const channelInfo = notificationBody.includes('channel') ? notificationBody.split('channel ')[1] : null;

        // Build a formatted notification object for our filtering function
        const formattedData = {
          // Try to determine if it's our own message
          // If a recent authentication is available, retrieve it for comparison
          channelId: channelInfo,
        };

        // Check if the notification should be displayed
        const shouldDisplay = await shouldDisplayNotification(formattedData);

        // If the notification should not be displayed, intercept it
        if (!shouldDisplay) {
          // Dismiss the notification using its identifier
          if (notification.request && notification.request.identifier) {
            await Notifications.dismissNotificationAsync(notification.request.identifier);
          }
        }
      } catch (error) {
        console.error('❌ Erreur lors du filtrage de la notification:', error);
      }
    });

    // Cleanup function that depends only on variables defined in this scope
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  // Nettoyage préventif du SecureStore au démarrage de l'application
  useEffect(() => {
    const preventDecryptionErrors = async () => {
      try {
        // On vérifie d'abord si on peut accéder à une clé sensible
        try {
          await SecureStore.getItemAsync('isMessagesHidden');
        } catch (checkError) {
          // If a decryption error is detected, we clean
          if (checkError.message && (
            checkError.message.includes('decrypt') ||
            checkError.message.includes('decipher') ||
            checkError.message.includes('decryption')
          )) {
            await cleanSecureStoreKeys();
          }
        }
      } catch (error) {
        console.error('❌ [App] Erreur lors du nettoyage préventif:', error);
      }
    };

    preventDecryptionErrors();
  }, []);

  useEffect(() => {
    // Configuration du moniteur de connexion
    const cleanup = setupConnectionMonitor();

    // Nettoyage lors du démontage du composant
    return () => {
      cleanup();
    };
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

    if (typeof newWebviews === 'string') {
      // If it's a unique URL, create a webview object and add it directly
      const newWebview = {
        href: newWebviews,
        title: newWebviews // We use the URL as the default title
      };
      handleSelectChannels([newWebview]);
      // We stay on the webviews management screen
      navigate(SCREENS.WEBVIEWS_MANAGEMENT);
    } else if (Array.isArray(newWebviews) && newWebviews.length > 0) {
      // If it's an array of webviews, add them to the selected webviews list
      handleSelectChannels([...selectedWebviews, ...newWebviews]);
      setChannels([]);
      // We return to the webviews management screen
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
            refreshInterval={refreshOption}
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

      case SCREENS.COMMON_SETTINGS:
        return (
          <CommonSettings
            onBackPress={() => navigate(SCREENS.APP_MENU)}
            onHideMessages={hideMessages}
            hideMessages={isMessagesHidden}
            isMessagesHidden={isMessagesHidden}
            onNavigate={navigate}
          />
        );

      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      <NotificationProvider>
        <View style={styles.container} testID={testID || "app-root"}>
          {renderWebviewScreen()}
          {PasswordDefineModal &&
            <PasswordDefineModal
              visible={isPasswordDefineModalVisible}
              onClose={closePasswordDefineModal}
              onSubmitPassword={handlePasswordSubmit}
              onDisablePassword={disablePassword}
            />
          }
          {PasswordCheckModal &&
            <PasswordCheckModal
              visible={passwordCheckModalVisible}
              onClose={() => setPasswordCheckModalVisible(false)}
              onSubmit={handlePasswordCheck}
            />
          }
        </View>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray950,
  },
});
