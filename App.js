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

  if (isLoading) {
    return <ScreenSaver />;
  }

  return (
    <View style={{ flex: 1 }}>
      {currentScreen === 'NoUrlScreen' && <NoUrlScreen onNavigate={navigateToSettings} />}
      {currentScreen === 'SettingsScreen' && <SettingsScreen onNavigate={setCurrentScreen} selectedChannels={selectedChannels} />}
      {currentScreen === 'ChannelsManagementScreen' && (
        <ChannelsManagementScreen
          onImport={navigateToChannelsList}
          selectedChannels={selectedChannels}
          setSelectedChannels={setSelectedChannels} // Passez setSelectedChannels ici
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