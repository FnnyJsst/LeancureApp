import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenSaver from './screens/ScreenSaver';
import SettingsScreen from './screens/SettingsScreen';
import NoUrlScreen from './screens/NoUrlScreen';
import ChannelsManagementScreen from './screens/ChannelsManagementScreen';
import ChannelsListScreen from './screens/ChannelsListScreen';
import WebViewScreen from './screens/WebViewScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('NoUrlScreen');
  const [isLoading, setIsLoading] = useState(true);
  const [channels, setChannels] = useState([]);
  const [selectedChannels, setSelectedChannels] = useState([]);
  const [webViewUrl, setWebViewUrl] = useState('');
  const [refreshInterval, setRefreshInterval] = useState(null);

  const saveSelectedChannels = async (channels) => {
    try {
      await AsyncStorage.setItem('selectedChannels', JSON.stringify(channels));
    } catch (error) {
      console.error('Failed to save channels', error);
    }
  };

  const loadSelectedChannels = async () => {
    try {
      const storedChannels = await AsyncStorage.getItem('selectedChannels');
      if (storedChannels) {
        const parsedChannels = JSON.parse(storedChannels);
        setSelectedChannels(parsedChannels);
        if (parsedChannels.length > 0) {
          setWebViewUrl(parsedChannels[0].href); // Assurez-vous que chaque channel a une propriété href
          setCurrentScreen('WebViewScreen');
        }
      }
    } catch (error) {
      console.error('Failed to load channels', error);
    }
  };

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

  const navigateToSettings = () => {
    setCurrentScreen('SettingsScreen');
  };

  const navigateToChannelsList = (channels) => {
    setChannels(channels);
    setCurrentScreen('ChannelsListScreen');
  };

  const handleSelectChannels = (selected) => {
    console.log('Updating selected channels:', selected); 
    setSelectedChannels(selected);
    saveSelectedChannels(selected);
    setCurrentScreen('ChannelsManagementScreen');
  };

  const navigateToWebView = (url) => {
    setWebViewUrl(url);
    setCurrentScreen('WebViewScreen');
  };

  const handleBackPress = () => {
    if (currentScreen === 'ChannelsManagementScreen') {
      setCurrentScreen('ChannelsListScreen');
    } else if (currentScreen === 'ChannelsListScreen') {
      setCurrentScreen('NoUrlScreen');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    loadSelectedChannels();
  }, []);

  useEffect(() => {
    if (refreshInterval) {
      const interval = setInterval(() => {
        console.log('Rafraîchissement des WebViews à', new Date().toLocaleTimeString());
        // Logique pour rafraîchir les WebViews
      }, refreshInterval);
  
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  if (isLoading) {
    return <ScreenSaver />;
  }

  return (
    <View style={{ flex: 1 }}>
      {currentScreen === 'NoUrlScreen' && <NoUrlScreen onNavigate={navigateToSettings} />}
      {currentScreen === 'SettingsScreen' && (
        <SettingsScreen
          onNavigate={setCurrentScreen}
          selectedChannels={selectedChannels}
          setRefreshInterval={setRefreshInterval}
          getIntervalInMilliseconds={getIntervalInMilliseconds}
        />
      )}
      {currentScreen === 'ChannelsManagementScreen' && (
        <ChannelsManagementScreen
          onImport={navigateToChannelsList}
          selectedChannels={selectedChannels}
          setSelectedChannels={setSelectedChannels}
          onBackPress={handleBackPress}
          onNavigateToWebView={navigateToWebView} 
        />
      )}
      {currentScreen === 'ChannelsListScreen' && (
        <ChannelsListScreen
          channels={channels}
          onBack={handleSelectChannels}
          onBackPress={handleBackPress}
        />
      )}
      {currentScreen === 'WebViewScreen' && <WebViewScreen url={webViewUrl} onNavigate={navigateToSettings} />} 
    </View>
  );
}