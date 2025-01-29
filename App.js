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
  
  const toggleReadOnly = (value) => {
    setIsReadOnly(value !== undefined ? value : !isReadOnly);
  };
  

  /////FUNCTIONS RELATED TO CHANNELS MANAGEMENT/////
  // Handle the selection of channels
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

  // Save changes made in the ChannelsManagementScreen in AsyncStorage
  const saveSelectedChannels = async (channels) => {
    try {
      await AsyncStorage.setItem('selectedChannels', JSON.stringify(channels));
    } catch (error) {
      console.error('Failed to save channels', error);
    }
  };

  // Load the channels saved in AsyncStorage
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
  // Get the interval in milliseconds
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

  // Save the refresh option in AsyncStorage
  const saveRefreshOption = async (option) => {
    try {
      await AsyncStorage.setItem('refreshOption', option);
    } catch (error) {
      console.error('Failed to save refresh option', error);
    }
  };

  // Load the refresh option from AsyncStorage
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

  const handleSelectOption = (option) => {
    console.log('handleSelectOption appelé avec:', option);
    setRefreshOption(option);
    setRefreshInterval(getIntervalInMilliseconds(option));
    saveRefreshOption(option);
  };

  /////FUNCTIONS RELATED TO PASSWORD/////
  // Check if the password is required to access the settings
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

  // Handle the submission of the password
  const handlePasswordSubmit = (enteredPassword) => {
    setPassword(enteredPassword);
    setIsPasswordRequired(true);
    savePassword({
      password: enteredPassword,
      isRequired: true
    });
    closePasswordModal();
  };

  // Save the password in AsyncStorage
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
  
  // Check if the password is correct
  const handlePasswordCheck = (enteredPassword) => {
    if (enteredPassword === password) {
      setPasswordCheckModalVisible(false);
      navigate(SCREENS.SETTINGS);
    } else {
      Alert.alert('Incorrect password');
    }
  };

  // Disable the password
  const disablePassword = () => {
    setPassword(null);
    setIsPasswordRequired(false);
    savePassword({
      password: null,
      isRequired: false
    });
  };

  // Open the password modal
  const openPasswordModal = () => setPasswordModalVisible(true);
  // Close the password modal
  const closePasswordModal = () => setPasswordModalVisible(false);

  /////FUNCTIONS RELATED TO NAVIGATION/////
  // Navigate to the channels list screen
  const navigateToChannelsList = (extractedChannels) => {
    setChannels(extractedChannels);
    navigate(SCREENS.CHANNELS_LIST);
  };

  // Navigate to the web view screen
  const navigateToWebView = (url) => {
    setWebViewUrl(url);
    navigate('WEBVIEW');
  };

  ///// USE EFFECTS/////
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      navigate('APP_MENU');
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Load the selected channels, the password and the refresh option from AsyncStorage
  useEffect(() => {
    loadSelectedChannels();
    loadPassword();
    loadRefreshOption();
  }, []);

  // Set the interval to refresh the WebViews
  useEffect(() => {
    if (refreshInterval) {
      const interval = setInterval(() => {
        // console.log('Refresh interval:', new Date().toLocaleTimeString());
      }, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  const handleImportChannels = (selectedChannels) => {
    // console.log('Channels to import:', selectedChannels);
    if (selectedChannels && selectedChannels.length > 0) {
      handleSelectChannels(selectedChannels);
    }
  };

  useEffect(() => {
    // Register the app for notifications
    registerForPushNotificationsAsync();

    // Handle the notification when the app is in the foreground
    const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in the foreground:', notification);
    });

    // Handle the notification click
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