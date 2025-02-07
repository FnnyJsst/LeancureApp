import React, { useState, useEffect } from 'react';
import { View, Alert } from 'react-native';
import ScreenSaver from './screens/common/ScreenSaver';
import SettingsScreen from './screens/webviews/SettingsScreen';
import NoUrlScreen from './screens/webviews/NoUrlScreen';
import ChannelsManagementScreen from './screens/webviews/ChannelsManagementScreen';
import ChannelsListScreen from './screens/webviews/ChannelsListScreen';
import WebViewScreen from './screens/webviews/WebViewScreen';
import Login from './screens/messages/login/Login';
import PasswordModal from './components/modals/webviews/PasswordModal';
import PasswordCheckModal from './components/modals/webviews/PasswordCheckModal';
import AppMenu from './screens/common/AppMenu';
import ChatScreen from './screens/messages/ChatScreen';
import SettingsMessage from './screens/messages/SettingsMessage';
import AccountScreen from './screens/messages/AccountScreen';
import { SCREENS } from './constants/screens';
import { useNavigation } from './hooks/useNavigation';
import * as SecureStore from 'expo-secure-store';
import Sidebar from './components/navigation/Sidebar';
import usePushNotifications from './services/notifications/notificationService';
import { useWebViews } from './hooks/useWebviews';
import { useWebViewsPassword } from './hooks/useWebViewsPassword';

/**
 * @component App
 * @description The main component of the app
 * @returns {JSX.Element} - The main component
 */
export default function App() {

  //States related to the webviews
  const [isLoading, setIsLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState(SCREENS.APP_MENU);
  const [globalMessages, setGlobalMessages] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

  const { navigate } = useNavigation(setCurrentScreen);
  const expoPushToken = usePushNotifications();

  // Importation of the webviews hooks
  const {     
    channels,
    setChannels,
    selectedChannels,
    setSelectedChannels,
    webViewUrl,
    setWebViewUrl,
    refreshInterval,
    setRefreshInterval,
    refreshOption,
    setRefreshOption,
    isReadOnly,
    toggleReadOnly,
    handleSelectChannels,
    saveSelectedChannels,
    loadSelectedChannels,
    getIntervalInMilliseconds,
    saveRefreshOption,
    handleSelectOption,
    navigateToChannelsList,
    navigateToWebView,
  } = useWebViews();

  // Importation of the webviews password hooks
    const {
      password,
      setPassword,
      isPasswordRequired,
      setIsPasswordRequired,
      isPasswordModalVisible,
      setPasswordModalVisible,
      passwordCheckModalVisible,
      setPasswordCheckModalVisible,
      handlePasswordSubmit,
      handlePasswordCheck,
      disablePassword,
      openPasswordModal,
      closePasswordModal,
    } = useWebViewsPassword(navigate);


  /**
   * @function useEffect
   * @description Allows to display the push token in the console, used for notifications
   * @returns {void}
   */
  useEffect(() => {
    if (expoPushToken) {
      // console.log('📲 Token dans App:', expoPushToken);
    }
  }, [expoPushToken]);


  /**
   * @function handleSettingsAccess
   * @description Handles the access to the settings screen in the webviews with or without password
   * @returns {void}
   */
  const handleSettingsAccess = () => {
    if (isPasswordRequired) {
      setPasswordCheckModalVisible(true);

    } else {
      navigate(SCREENS.SETTINGS);
    }
  };


  /**
   * @function useEffect
   * @description Handles the loading of the app
   * @returns {void}
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      navigate('APP_MENU');
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // /**
  //  * @function useEffect
  //  * @description Loads the selected channels, the password and the refresh option from AsyncStorage
  //  * @returns {void}
  //  */
  // useEffect(() => {
  //   loadSelectedChannels();
  //   loadPassword();
  //   loadRefreshOption();
  // }, []);

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
   * @function handleImportChannels
   * @description Handles the import of channels
   * @param {Array} selectedChannels - The selected channels
   * @returns {void}
   */
  const handleImportChannels = (selectedChannels) => {
    // console.log('Channels to import:', selectedChannels);
    if (selectedChannels && selectedChannels.length > 0) {
      handleSelectChannels(selectedChannels);
    }
  };

  // If the app is loading, show the loading screen
  if (isLoading) {
    return <ScreenSaver />;
  }

  /**
   * @function renderScreen
   * @description Renders the screen
   * @returns {JSX.Element} - The screen
   */
  const renderScreen = () => {
    switch (currentScreen) {
      case SCREENS.APP_MENU:
        return (
          <AppMenu 
            onNavigate={(screen) => {
              if (screen === SCREENS.WEBVIEW) {
                navigate(selectedChannels?.length > 0 ? SCREENS.WEBVIEW : SCREENS.NO_URL);
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
          <SettingsScreen
            selectedChannels={selectedChannels}
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
            openPasswordModal={openPasswordModal}
            closePasswordModal={closePasswordModal}
            isPasswordModalVisible={isPasswordModalVisible}
            isReadOnly={isReadOnly}
            toggleReadOnly={toggleReadOnly}
            onNavigate={navigate}
            

            // onSettingsAccess={handleSettingsAccess}
          />
        );

      case SCREENS.CHANNELS_MANAGEMENT:
        return (
          <ChannelsManagementScreen
            onImport={navigateToChannelsList}
            selectedChannels={selectedChannels}
            setSelectedChannels={setSelectedChannels}
            saveSelectedChannels={saveSelectedChannels}
            onNavigate={navigate}
            onNavigateToWebView={navigateToWebView}
            isReadOnly={isReadOnly}
          />
        );

      case SCREENS.CHANNELS_LIST:
        return (
          <ChannelsListScreen
            channels={channels}
            selectedChannels={selectedChannels}
            onBack={handleImportChannels}
            onBackPress={() => navigate(SCREENS.CHANNELS_MANAGEMENT)}
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
            handleLogout={handleLogout}
            globalMessages={globalMessages}
          />
        );

      case SCREENS.SETTINGS_MESSAGE:
        return (
          <SettingsMessage 
            onNavigate={navigate}
            isExpanded={isExpanded}
            setIsExpanded={setIsExpanded}
            handleLogout={handleLogout}
          />
        );

      default:
        return null;
    }
  };

  /**
   * @function handleLogout
   * @description Handles the logout process
   * @returns {void}
   */
  const handleLogout = async () => {
    try {
        await SecureStore.deleteItemAsync('savedLoginInfo');
        navigate(SCREENS.LOGIN);
    } catch (error) {
        throw new Error('Error during logout:', error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#111111" }}>
      {renderScreen()}
      
      <PasswordModal
        visible={isPasswordModalVisible}
        onClose={closePasswordModal}
        onSubmitPassword={handlePasswordSubmit}
        onDisablePassword={disablePassword}
      />
  
      <PasswordCheckModal
        visible={passwordCheckModalVisible}
        onClose={() => setPasswordCheckModalVisible(false)}
        onSubmit={handlePasswordCheck}
      />

      <Sidebar 
        onLogout={handleLogout}
      />
    </View>
  );
}