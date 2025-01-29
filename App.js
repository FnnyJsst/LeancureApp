import React, { useState, useEffect } from 'react';
import { View, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { registerForPushNotificationsAsync } from './utils/notifications';
import * as Notifications from 'expo-notifications';
import SecureStore from 'expo-secure-store';
import Sidebar from './components/navigation/Sidebar';

/**
 * @component App
 * @description The main component of the app
 * @returns {JSX.Element} - The main component
 */
export default function App() {

  //States related to the webviews
  const [isLoading, setIsLoading] = useState(true);
  const [channels, setChannels] = useState([]);
  const [selectedChannels, setSelectedChannels] = useState([]);
  const [webViewUrl, setWebViewUrl] = useState('');
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [refreshOption, setRefreshOption] = useState('never');
  const [password, setPassword] = useState(null);
  const [isPasswordRequired, setIsPasswordRequired] = useState(false);
  const [isPasswordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordCheckModalVisible, setPasswordCheckModalVisible] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [currentScreen, setCurrentScreen] = useState(SCREENS.APP_MENU);
  const { navigate, goBack } = useNavigation(setCurrentScreen);
  
  //States related to the chat
  const [isExpanded, setIsExpanded] = useState(false);
  
  /**
   * @function toggleReadOnly
   * @description Toggles the read-only mode
   * @param {boolean} value - The value to set
   * @returns {void}
   */
  const toggleReadOnly = (value) => {
    setIsReadOnly(value !== undefined ? value : !isReadOnly);
  };
  

  /////FUNCTIONS RELATED TO CHANNELS MANAGEMENT/////
  /**
   * @function handleSelectChannels
   * @description Handles the selection of channels
   * @param {Array} selected - The selected channels
   * @returns {void}
   */
  const handleSelectChannels = (selected) => {
    const updatedChannels = [...selectedChannels];
    
    selected.forEach(newChannel => {
      const isDuplicate = selectedChannels.some(
        existingChannel => existingChannel.href === newChannel.href
      );
      
      if (!isDuplicate) {
        updatedChannels.push(newChannel);
      }
    });
  
    setSelectedChannels(updatedChannels);
    saveSelectedChannels(updatedChannels);
    navigate('CHANNELS_MANAGEMENT');
  };

  /**
   * @function saveSelectedChannels
   * @description Saves the selected channels in AsyncStorage
   * @param {Array} channels - The channels to save
   * @returns {void}
   */
  const saveSelectedChannels = async (channels) => {
    try {
      await AsyncStorage.setItem('selectedChannels', JSON.stringify(channels));
    } catch (error) {
      console.error('Failed to save channels', error);
    }
  };

  /**
   * @function loadSelectedChannels
   * @description Loads the selected channels from AsyncStorage
   * @returns {void}
   */
  const loadSelectedChannels = async () => {
    try {
      const storedChannels = await AsyncStorage.getItem('selectedChannels');
      if (storedChannels) {
        const parsedChannels = JSON.parse(storedChannels);
        setSelectedChannels(parsedChannels);
        if (parsedChannels.length > 0) {
          setWebViewUrl(parsedChannels[0].href);
          navigate('WEBVIEW');
        }
      }
    } catch (error) {
      console.error('Failed to load channels', error);
    }
  };

  /////FUNCTIONS RELATED TO REFRESH INTERVAL/////
  /**
   * @function getIntervalInMilliseconds
   * @description Gets the interval in milliseconds
   * @param {string} value - The value to get
   * @returns {number} - The interval in milliseconds
   */
  const getIntervalInMilliseconds = (value) => {
    switch (value) {
      case 'every minute': return 60000;
      case 'every 2 minutes': return 120000;
      case 'every 5 minutes': return 300000;
      case 'every 15 minutes': return 900000;
      case 'every 30 minutes': return 1800000;
      case 'every hour': return 3600000;
      case 'every 2 hours': return 7200000;
      case 'every 3 hours': return 10800000;
      case 'every 6 hours': return 21600000;
      case 'every day': return 86400000;
      default: return null;
    }
  };

  /**
   * @function saveRefreshOption
   * @description Saves the refresh option in AsyncStorage
   * @param {string} option - The option to save
   * @returns {void}
   */
  const saveRefreshOption = async (option) => {
    try {
      await AsyncStorage.setItem('refreshOption', option);
    } catch (error) {
      console.error('Failed to save refresh option', error);
    }
  };

  /**
   * @function loadRefreshOption
   * @description Loads the refresh option from AsyncStorage
   * @returns {void}
   */
  const loadRefreshOption = async () => {
    try {
      const storedOption = await AsyncStorage.getItem('refreshOption');
      if (storedOption) {
        setRefreshOption(storedOption); 
        setRefreshInterval(getIntervalInMilliseconds(storedOption));
      }
    } catch (error) {
      console.error('Failed to load refresh option', error);
    }
  };

  /**
   * @function handleSelectOption
   * @description Handles the selection of the refresh option
   * @param {string} option - The option to select
   * @returns {void}
   */
  const handleSelectOption = (option) => {
    console.log('handleSelectOption appelé avec:', option);
    setRefreshOption(option);
    setRefreshInterval(getIntervalInMilliseconds(option));
    saveRefreshOption(option);
  };

  /////FUNCTIONS RELATED TO PASSWORD/////
  /**
   * @function handleSettingsAccess
   * @description Handles the access to the settings
   * @returns {void}
   */
  const handleSettingsAccess = () => {
    console.log('handleSettingsAccess called');
    if (isPasswordRequired) {
      console.log('Password is required');
      setPasswordCheckModalVisible(true);
    } else {
      console.log('Navigating to settings');
      navigate(SCREENS.SETTINGS);
    }
  };

  /**
   * @function handlePasswordSubmit
   * @description Handles the submission of the password
   * @param {string} enteredPassword - The password to submit
   * @returns {void}
   */
  const handlePasswordSubmit = (enteredPassword) => {
    setPassword(enteredPassword);
    setIsPasswordRequired(true);
    savePassword({
      password: enteredPassword,
      isRequired: true
    });
    closePasswordModal();
  };

  /**
   * @function savePassword
   * @description Saves the password in AsyncStorage
   * @param {Object} passwordData - The password data
   * @returns {void}
   */
  const savePassword = async (passwordData) => {
    try {
      if (passwordData.password === null) {
        await AsyncStorage.removeItem('password');
        await AsyncStorage.setItem('isPasswordRequired', 'false');
      } else {
        await AsyncStorage.setItem('password', passwordData.password);
        await AsyncStorage.setItem('isPasswordRequired', JSON.stringify(passwordData.isRequired));
      }
    } catch (error) {
      console.error('Failed to save password', error);
    }
  };
  
  /**
   * @function loadPassword
   * @description Loads the password from AsyncStorage
   * @returns {void}
   */
  const loadPassword = async () => {
    try {
      const storedPassword = await AsyncStorage.getItem('password');
      const storedIsRequired = await AsyncStorage.getItem('isPasswordRequired');
      
      if (storedPassword) {
        setPassword(storedPassword);
      }
      if (storedIsRequired !== null) {  
        setIsPasswordRequired(JSON.parse(storedIsRequired));
      }
    } catch (error) {
      console.error('Failed to load password', error);
    }
  };
  
  /**
   * @function handlePasswordCheck
   * @description Checks if the password is correct
   * @param {string} enteredPassword - The password to check
   * @returns {void}
   */
  const handlePasswordCheck = (enteredPassword) => {
    if (enteredPassword === password) {
      setPasswordCheckModalVisible(false);
      navigate(SCREENS.SETTINGS);
    } else {
      Alert.alert('Incorrect password');
    }
  };

  /**
   * @function disablePassword
   * @description Disables the password
   * @returns {void}
   */
  const disablePassword = () => {
    setPassword(null);
    setIsPasswordRequired(false);
    savePassword({
      password: null,
      isRequired: false
    });
  };

  /**
   * @function openPasswordModal
   * @description Opens the password modal
   * @returns {void}
   */
  const openPasswordModal = () => setPasswordModalVisible(true);
  
  /**
   * @function closePasswordModal
   * @description Closes the password modal
   * @returns {void}
   */
  const closePasswordModal = () => setPasswordModalVisible(false);

  /////FUNCTIONS RELATED TO NAVIGATION/////
  /**
   * @function navigateToChannelsList
   * @description Navigates to the channels list screen
   * @param {Array} extractedChannels - The extracted channels
   * @returns {void}
   */
  const navigateToChannelsList = (extractedChannels) => {
    setChannels(extractedChannels);
    navigate(SCREENS.CHANNELS_LIST);
  };

  /**
   * @function navigateToWebView
   * @description Navigates to the web view screen
   * @param {string} url - The URL to navigate to
   * @returns {void}
   */
  const navigateToWebView = (url) => {
    setWebViewUrl(url);
    navigate('WEBVIEW');
  };

  ///// USE EFFECTS/////
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

  /**
   * @function useEffect
   * @description Loads the selected channels, the password and the refresh option from AsyncStorage
   * @returns {void}
   */
  useEffect(() => {
    loadSelectedChannels();
    loadPassword();
    loadRefreshOption();
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

  /**
   * @function useEffect
   * @description Registers the app for notifications
   * @returns {void}
   */
  useEffect(() => {
    // Register the app for notifications
    registerForPushNotificationsAsync();

    /**
     * @function useEffect
     * @description Handles the notification when the app is in the foreground
     * @returns {void}
     */
    const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in the foreground:', notification);
    });

    /**
     * @function useEffect
     * @description Handles the notification click
     * @returns {void}
     */
    const backgroundSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      const channelId = response.notification.request.content.data.channelId;
      // Navigation to the corresponding channel
      if (channelId) {
        navigate(SCREENS.CHAT);
      }
    });

    return () => {
      foregroundSubscription.remove();
      backgroundSubscription.remove();
    };
  }, []);

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
            onSettingsAccess={handleSettingsAccess}
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
          />
        );

      case SCREENS.SETTINGS_MESSAGE:
        return (
          <SettingsMessage 
            onNavigate={navigate}
            isExpanded={isExpanded}
            setIsExpanded={setIsExpanded}
          />
        );

      default:
        return null;
    }
  };

  const handleLogout = async () => {
    try {
        await SecureStore.deleteItemAsync('savedLoginInfo');
        // Rediriger vers login
        navigate(SCREENS.LOGIN);
    } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
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
        // ... autres props
      />
    </View>
  );
}