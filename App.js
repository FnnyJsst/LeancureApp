import React, { useState, useEffect, useCallback } from 'react';
import { View } from 'react-native';
import ScreenSaver from './screens/common/ScreenSaver';
import SettingsWebviews from './screens/webviews/SettingsWebviews';
import NoUrlScreen from './screens/webviews/NoUrlScreen';
import WebviewsManagementScreen from './screens/webviews/WebviewsManagementScreen';
import WebviewsListScreen from './screens/webviews/WebviewsListScreen';
import WebViewScreen from './screens/webviews/WebViewScreen';
import Login from './screens/messages/login/Login';
import PasswordDefineModal from './components/modals/webviews/PasswordDefineModal';
import PasswordCheckModal from './components/modals/webviews/PasswordCheckModal';
import AppMenu from './screens/common/AppMenu';
import ChatScreen from './screens/messages/ChatScreen';
import SettingsMessage from './components/modals/chat/SettingsMessage';
import AccountScreen from './screens/messages/AccountScreen';
import { SCREENS } from './constants/screens';
import { COLORS } from './constants/style';
import { useNavigation } from './hooks/useNavigation';
import * as SecureStore from 'expo-secure-store';
import Sidebar from './components/navigation/Sidebar';
import { useWebViews } from './hooks/useWebviews';
import { useWebViewsPassword } from './hooks/useWebViewsPassword';
import { LogBox } from 'react-native';
import { useFonts } from 'expo-font';
import { useDeviceType } from './hooks/useDeviceType';
import CommonSettings from './screens/common/CommonSettings';
// import { usePushNotifications } from './services/notifications/notificationService';


LogBox.ignoreLogs(['[expo-notifications]']);

/**
 * @component App
 * @description The main component of the app
 */
export default function App() {
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

  const [currentScreen, setCurrentScreen] = useState(SCREENS.LOGIN);
  const [isLoading, setIsLoading] = useState(true);
  const [userCredentials, setUserCredentials] = useState(null);
  const [globalMessages, setGlobalMessages] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [timeoutInterval, setTimeoutInterval] = useState(null);
  const [isMessagesHidden, setIsMessagesHidden] = useState(false);

  // 2. Hooks personnalisés
  const { navigate } = useNavigation(setCurrentScreen);
  const { isSmartphone } = useDeviceType();
  // const expoPushToken = usePushNotifications();

  // 3. Hooks des webviews
  const {     
    channels,
    setChannels,
    selectedWebviews,
    setSelectedWebviews,
    webViewUrl,
    setWebViewUrl,
    refreshInterval,
    setRefreshInterval,
    refreshOption,
    setRefreshOption,
    isReadOnly,
    toggleReadOnly,
    handleSelectChannels,
    saveSelectedWebviews,
    loadSelectedChannels,
    getIntervalInMilliseconds,
    saveRefreshOption,
    handleSelectOption,
    navigateToChannelsList,
    navigateToWebView,
  } = useWebViews(setCurrentScreen);

  // 4. Hooks du mot de passe
  const {
    password,
    setPassword,
    isPasswordRequired,
    setIsPasswordRequired,
    isPasswordDefineModalVisible,
    setPasswordDefineModalVisible,
    passwordCheckModalVisible,
    setPasswordCheckModalVisible,
    handlePasswordSubmit,
    handlePasswordCheck,
    disablePassword,
    openPasswordDefineModal,
    closePasswordDefineModal,
  } = useWebViewsPassword(navigate);

  // // 5. Fonctions avec useCallback
  // const handleHideMessages = useCallback(async (shouldHide) => {
  //   try {
  //     await SecureStore.setItemAsync('isMessagesHidden', JSON.stringify(shouldHide));
  //     setIsMessagesHidden(shouldHide);
  //   } catch (error) {
  //     console.error('Erreur lors de la sauvegarde du paramètre:', error);
  //   }
  // }, []);

  const loadTimeoutInterval = useCallback(async () => {
    try {
      const storedTimeout = await SecureStore.getItemAsync('timeoutInterval');
      if (storedTimeout) {
        setTimeoutInterval(Number(storedTimeout) * 1000);
      }
    } catch (error) {
      console.error('Error during the loading of the timeout:', error);
    }
  }, []);

  const handleSettingsAccess = useCallback(() => {
    if (isPasswordRequired) {
      setPasswordCheckModalVisible(true);
    } else {
      navigate(SCREENS.SETTINGS);
    }
  }, [isPasswordRequired, setPasswordCheckModalVisible, navigate]);

  const hideMessages = useCallback(async (shouldHide) => {
    try {
      await SecureStore.setItemAsync('hideMessages', JSON.stringify(shouldHide));
      setIsMessagesHidden(shouldHide);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du paramètre hideMessages:', error);
    }
  }, []);

  // 6. Tous les useEffect
  useEffect(() => {
    const loadMessagesVisibility = async () => {
      try {
        const savedValue = await SecureStore.getItemAsync('isMessagesHidden');
        if (savedValue !== null) {
          setIsMessagesHidden(JSON.parse(savedValue));
        }
      } catch (error) {
        console.error('Erreur lors du chargement du paramètre:', error);
      }
    };
    loadMessagesVisibility();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      navigate('APP_MENU');
      loadTimeoutInterval();
    }, 3000);
    return () => clearTimeout(timer);
  }, [loadTimeoutInterval, navigate]);

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

  useEffect(() => {
    const loadHideMessagesState = async () => {
      try {
        const savedValue = await SecureStore.getItemAsync('hideMessages');
        if (savedValue !== null) {
          setIsMessagesHidden(JSON.parse(savedValue));
        }
      } catch (error) {
        console.error('Erreur lors du chargement du paramètre hideMessages:', error);
      }
    };
    
    loadHideMessagesState();
  }, []);

  // 7. Condition de retour
  if (!fontsLoaded) {
    return null;
  }

  /**
   * @function handleImportWebviews
   * @description Handles the import of channels
   * @param {Array} selectedWebviews - The selected channels
   * @returns {void}
   */
  const handleImportWebviews = (selectedWebviews) => {
    // console.log('Channels to import:', selectedWebviews);
    if (selectedWebviews && selectedWebviews.length > 0) {
      handleSelectChannels(selectedWebviews);
    }
  };

  /**
   * @function gettimeoutInSeconds
   * @description Gets the timeout in seconds
   * @param {string} value - The value to get
   * @returns {number} - The timeout in seconds
   */
  const getTimeoutInSeconds = (value) => {
    switch (value) {
      case 'after 2 hours': return 7200;
      case 'after 6 hours': return 21600;
      case 'after 12 hours': return 43200;
      case 'after 24 hours': return 86400;
      case 'never': return null;
      default: return null;
    }
  }

    /**
   * @function handleTimeoutSelection 
   * @description Handles the selection of the timeout
   * @param {string} value - The value to handle
   * @returns {void}
   */
    const handleTimeoutSelection = (value) => {
      const timeoutInSeconds = getTimeoutInSeconds(value);
      
      if (value === 'never') {
        setTimeoutInterval(null);
        try {
          SecureStore.deleteItemAsync('timeoutInterval');
        } catch (error) {
          console.error('Error during the deletion of the timeout:', error);
        }
      } else {
        setTimeoutInterval(timeoutInSeconds * 1000);
        try {
          SecureStore.setItemAsync('timeoutInterval', String(timeoutInSeconds));
        } catch (error) {
          console.error('Error during the saving of the timeout:', error);
        }
      }
    };

  // If the app is loading, show the loading screen
  if (isLoading) {
    return <ScreenSaver />;
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
            onNavigateToWebView={navigateToWebView}
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
          />
        );

      case SCREENS.LOGIN:
        return (
          <Login 
            onNavigate={navigate}
          />
        );

      case SCREENS.ACCOUNT:
        return (
          <AccountScreen 
            onNavigate={navigate}
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
    <View style={{ flex: 1, backgroundColor: COLORS.gray950 }}>
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
    </View>
  );
}