import React, { useState, useEffect } from 'react';
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
import usePushNotifications from './services/notifications/notificationService';
import { useWebViews } from './hooks/useWebviews';
import { useWebViewsPassword } from './hooks/useWebViewsPassword';

/**
 * @component App
 * @description The main component of the app
 */
export default function App() {

  //States related to the webviews
  const [isLoading, setIsLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState(SCREENS.APP_MENU);
  const [globalMessages, setGlobalMessages] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [timeoutInterval, setTimeoutInterval] = useState(null);

  const { navigate } = useNavigation(setCurrentScreen);
  const expoPushToken = usePushNotifications();

  // Importation of the webviews hooks
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

  // Importation of the webviews password hooks
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


  /**
   * @function useEffect
   * @description Allows to display the push token in the console, used for notifications
   */
  useEffect(() => {
    if (expoPushToken) {
      // console.log('📲 Token dans App:', expoPushToken);
    }
  }, [expoPushToken]);


  /**
   * @function handleSettingsAccess
   * @description Handles the access to the settings screen in the webviews with or without password
   */
  const handleSettingsAccess = () => {
    if (isPasswordRequired) {
      setPasswordCheckModalVisible(true);

    } else {
      navigate(SCREENS.SETTINGS);
    }
  };

  /**
   * @function loadTimeoutInterval
   * @description Loads the timeout interval from secure storage
   */
  const loadTimeoutInterval = async () => {
    try {
      const storedTimeout = await SecureStore.getItemAsync('timeoutInterval');
      if (storedTimeout) {
        setTimeoutInterval(Number(storedTimeout) * 1000);
      }
    } catch (error) {
      console.error('Error during the loading of the timeout:', error);
    }
  };

  /**
   * @function useEffect
   * @description Handles the loading of the app to display the loading screen for 3 seconds
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      navigate('APP_MENU');
      loadTimeoutInterval();
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  /**
   * @function useEffect
   * @description Sets the interval to refresh the WebViews
   * @returns {void}
   */
  useEffect(() => {
    if (refreshInterval) {
      const interval = setInterval(() => {
        // console.log('Refresh interval:', new Date().toLocaleTimeString());
      }, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);


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

    /**
     * @function useEffect
     * @description Handles the timeout in the chat section
     * @returns {void}
     */
    useEffect(() => {
      let timer;

      if (timeoutInterval && currentScreen !== SCREENS.APP_MENU && currentScreen !== SCREENS.LOGIN) {
        console.log(`⏰ Disconnection scheduled in ${timeoutInterval/1000} seconds`);
        
        timer = setTimeout(() => {
          console.log('⏰ Automatic disconnection');
          
          // Reset the necessary states
          setCurrentScreen(SCREENS.APP_MENU);
          setGlobalMessages([]);
          setIsExpanded(false);
          
          if (handleChatLogout) {
            handleChatLogout();
          }
        }, timeoutInterval);
      }
    
      return () => {
        if (timer) {
          clearTimeout(timer);
        }
      };
    }, [timeoutInterval, currentScreen]);


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