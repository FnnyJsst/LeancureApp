import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import ScreenSaver from './screens/common/ScreenSaver';
import SettingsWebviews from './screens/webviews/SettingsWebviews';
import NoUrlScreen from './screens/webviews/NoUrlScreen';
import WebviewsManagementScreen from './screens/webviews/WebviewsManagementScreen';
import WebviewsListScreen from './screens/webviews/WebviewsListScreen';
import WebviewScreen from './screens/webviews/WebviewScreen';
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
import { useWebviewsPassword } from './hooks/useWebviewsPassword';
import { LogBox } from 'react-native';
import { useFonts } from 'expo-font';
import CommonSettings from './screens/common/CommonSettings';
import { useTimeout } from './hooks/useTimeout';
import ErrorBoundary from './components/ErrorBoundary';
import { Ionicons } from '@expo/vector-icons';
// import { usePushNotifications } from './services/notifications/notificationService';

LogBox.ignoreLogs(['[expo-notifications]']);

/**
 * @component App
 * @description The main component of the app
 */
export default function App({ testID, initialScreen = SCREENS.LOGIN }) {
  // 1. Tous les hooks au début
  const [fontsLoaded] = useFonts({
    'Raleway-Thin': require('./assets/fonts/raleway.thin.ttf'),         // 100
    'Raleway-Light': require('./assets/fonts/raleway.light.ttf'),       // 300
    'Raleway-Regular': require('./assets/fonts/raleway.regular.ttf'),   // 400
    'Raleway-Medium': require('./assets/fonts/raleway.medium.ttf'),     // 500
    'Raleway-SemiBold': require('./assets/fonts/raleway.semibold.ttf'), // 600
    'Raleway-Bold': require('./assets/fonts/raleway.bold.ttf'),         // 700
    'Raleway-ExtraBold': require('./assets/fonts/raleway.extrabold.ttf'),// 800
  });

  const [currentScreen, setCurrentScreen] = useState(initialScreen);
  const [isLoading, setIsLoading] = useState(true);
  const [globalMessages, setGlobalMessages] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMessagesHidden, setIsMessagesHidden] = useState(true);

  const { navigate } = useNavigation(setCurrentScreen);
  const { timeoutInterval, handleTimeoutSelection, loadTimeoutInterval } = useTimeout();

  // const expoPushToken = usePushNotifications();

  // Webviews hooks
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

  // Password hooks
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

  const handleSettingsAccess = useCallback(() => {
    if (isPasswordRequired) {
      setPasswordCheckModalVisible(true);
    } else {
      navigate(SCREENS.SETTINGS);
    }
  }, [isPasswordRequired, setPasswordCheckModalVisible, navigate]);

  //THIS NEEDS TO BE UNCOMMENTED FOR V2
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

  //This piece of code is only here for the V1 of the App to hide the messages section by default AND TO BE REMOVED FOR V2
  // useEffect(() => {
  //   const initializeApp = async () => {
  //     try {
  //       // Créons une promesse pour le temps minimum d'affichage du ScreenSaver
  //       const minimumLoadingTime = new Promise(resolve => setTimeout(resolve, 3000));

  //       // Exécutons toutes nos initialisations en parallèle
  //       await Promise.all([
  //         minimumLoadingTime,
  //         (async () => {
  //           // Load the timeout interval
  //           await loadTimeoutInterval();

  //           // Par défaut, on cache les messages
  //           await SecureStore.setItemAsync('isMessagesHidden', JSON.stringify(true));
  //           setIsMessagesHidden(true);

  //           // Load the selected channels
  //           await loadSelectedChannels();
  //         })()
  //       ]);

  //       // Une fois que tout est chargé ET que le temps minimum est écoulé
  //       setIsLoading(false);

  //       // Navigation directe vers l'écran approprié
  //       navigate(selectedWebviews?.length > 0 ? SCREENS.WEBVIEW : SCREENS.NO_URL);

  //     } catch (error) {
  //       console.error('Error during app initialization:', error);
  //       setIsLoading(false); // Important de gérer le loading même en cas d'erreur
  //     }
  //   };

  //   initializeApp();
  // }, []);


  /**
   * @function initializeApp
   * @description Initializes the app when the component is mounted
   */
  useEffect(() => {
    const initializeApp = async () => {
        try {
            // Load the timeout interval
            await loadTimeoutInterval();
            // Get the isMessagesHidden value to hide or show the messages
            const savedValue = await SecureStore.getItemAsync('isMessagesHidden');
            const isHidden = savedValue ? JSON.parse(savedValue) : false;
            setIsMessagesHidden(isHidden);
            // Load the selected channels
            await loadSelectedChannels();
            setIsLoading(false);
            // If the messages are hidden, navigate to the webview or the no url screen
            if (isHidden) {
                navigate(selectedWebviews?.length > 0 ? SCREENS.WEBVIEW : SCREENS.NO_URL);
            // If the messages are not hidden, navigate to the app menu
            } else {
                navigate(SCREENS.APP_MENU);
            }
        } catch (error) {
            console.error('Error initializing app:', error);
            setIsLoading(false);
        }
    };

    initializeApp();
  }, [loadSelectedChannels, loadTimeoutInterval, navigate, selectedWebviews?.length]);

  /**
   * @function handleTimeout
   * @description Handles the timeout
   */
  useEffect(() => {
    let timer;
    if (timeoutInterval && currentScreen !== SCREENS.APP_MENU && currentScreen !== SCREENS.LOGIN) {
      timer = setTimeout(() => {
        setCurrentScreen(SCREENS.APP_MENU);
        setGlobalMessages([]);
        setIsExpanded(false);
      }, timeoutInterval);
    }
    return () => clearTimeout(timer);
  }, [timeoutInterval, currentScreen]);

  if (!fontsLoaded) {
    return null;
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

  // If the app is loading, show the loading screen
  if (isLoading) {
    return <ScreenSaver testID="screen-saver" />;
  }

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
  },
});
