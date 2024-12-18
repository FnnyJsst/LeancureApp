import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenSaver from './screens/ScreenSaver';
import SettingsScreen from './screens/webviews/SettingsScreen';
import NoUrlScreen from './screens/webviews/NoUrlScreen';
import ChannelsManagementScreen from './screens/webviews/ChannelsManagementScreen';
import ChannelsListScreen from './screens/webviews/ChannelsListScreen';
import WebViewScreen from './screens/webviews/WebViewScreen';
import Login from './screens/messages/Login';
import PasswordModal from './components/modals/webviews/PasswordModal';
import PasswordCheckModal from './components/modals/webviews/PasswordCheckModal';
import AppMenu from './screens/AppMenu';
import ChatScreen from './screens/messages/ChatScreen';
import SettingsMessage from './screens/messages/SettingsMessage';
import AccountScreen from './screens/messages/AccountScreen';

export default function App() {

  //States related to the webviews
  const [currentScreen, setCurrentScreen] = useState('NoUrlScreen');
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
    setCurrentScreen('ChannelsManagementScreen');
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
          setCurrentScreen('WebViewScreen');
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
    if (isPasswordRequired && password) {
      setPasswordCheckModalVisible(true);
    } else {
      navigateToSettings();
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
    return password === enteredPassword;
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
  // Navigate to the settings screen
  const navigateToSettings = () => {
    setCurrentScreen('SettingsScreen');
  };

  // Navigate to the channels list screen
  const navigateToChannelsList = (channels) => {
    setChannels(channels);
    setCurrentScreen('ChannelsListScreen');
  };

  // Navigate to the web view screen
  const navigateToWebView = (url) => {
    setWebViewUrl(url);
    setCurrentScreen('WebViewScreen');
  };

  const handleBackPress = () => {
    if (currentScreen === 'ChannelsManagementScreen') {
      setCurrentScreen('SettingsScreen');
    } else if (currentScreen === 'ChannelsListScreen') {
      setCurrentScreen('NoUrlScreen');
    } else if (['NoUrlScreen', 'WebViewScreen', 'Login'].includes(currentScreen)) {
      setCurrentScreen('AppMenu');
    }
  };

  ///// USE EFFECTS/////
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setCurrentScreen('AppMenu');
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
        console.log('Rafraîchissement des WebViews à', new Date().toLocaleTimeString());
      }, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  // If the app is loading, show the loading screen
  if (isLoading) {
    return <ScreenSaver />;
  }

  const handleBackToChat = () => {
    setCurrentScreen('Chat');
  };

  const navigateToAccount = () => {
    setCurrentScreen('AccountScreen');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#1E1E1E' }}>
      {currentScreen === 'AppMenu' && (
        <AppMenu 
          onNavigate={(screen) => {
            if (screen === 'WebViewsSection') {
              // If URLs are already configured, go directly to WebViewScreen
              if (selectedChannels && selectedChannels.length > 0) {
                setCurrentScreen('WebViewScreen');
              } else {
                // Otherwise, go to NoUrlScreen
                setCurrentScreen('NoUrlScreen');
              }
            } else if (screen === 'Login') {
              setCurrentScreen('Login');
            }
          }} 
        />
      )}

      {/* Screen related to the webviews */}
      {currentScreen === 'NoUrlScreen' && 
      <NoUrlScreen 
        onNavigate={handleSettingsAccess}
        setCurrentScreen={setCurrentScreen}  
      />
    }
      
      {currentScreen === 'SettingsScreen' && (
        <SettingsScreen
          onNavigate={setCurrentScreen}
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
        />
      )}
  
      {currentScreen === 'ChannelsManagementScreen' && (
        <ChannelsManagementScreen
          onImport={navigateToChannelsList}
          selectedChannels={selectedChannels}
          setSelectedChannels={setSelectedChannels}
          saveSelectedChannels={saveSelectedChannels}
          onBackPress={handleBackPress}
          onNavigateToWebView={navigateToWebView}
          isReadOnly={isReadOnly}
        />
      )}
  
      {currentScreen === 'ChannelsListScreen' && (
        <ChannelsListScreen
          channels={channels}
          selectedChannels={selectedChannels}
          onBack={handleSelectChannels}
          onBackPress={handleBackPress}
        />
      )}
  
      {currentScreen === 'WebViewScreen' && 
        <WebViewScreen 
          url={webViewUrl} 
          onNavigate={handleSettingsAccess}
        />
      }
      
      <PasswordModal
        visible={isPasswordModalVisible}
        onClose={closePasswordModal}
        onSubmitPassword={handlePasswordSubmit}
        onDisablePassword={disablePassword}
      />
  
      <PasswordCheckModal
        visible={passwordCheckModalVisible}
        onClose={() => setPasswordCheckModalVisible(false)}
        onSubmit={(enteredPassword, callback) => {
          handlePasswordCheck(enteredPassword, callback);
        }}
      />

      {/* Screen related to the chat */}
      {currentScreen === 'Login' && (
        <Login 
          onBackPress={() => setCurrentScreen('AppMenu')}
          setCurrentScreen={setCurrentScreen}  
        />
      )}
      {currentScreen === 'AccountScreen' && (
        <AccountScreen 
          onBackPress={() => setCurrentScreen('Chat')}
          setCurrentScreen={setCurrentScreen}
        />
      )}
            {currentScreen === 'Chat' && (
        <ChatScreen 
          onBackPress={() => setCurrentScreen('AppMenu')}
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
          setCurrentScreen={setCurrentScreen}
          onNavigate={navigateToAccount}
        />
      )}

      {currentScreen === 'SettingsMessage' && (
        <SettingsMessage 
          onBackPress={handleBackToChat}
          setCurrentScreen={setCurrentScreen}
        />
      )}
    </View>
  );
}