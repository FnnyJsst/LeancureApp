import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from './useNavigation';
import { useWebViewsPassword } from './useWebViewsPassword';
import { SCREENS } from '../constants/screens';

/**
 * @function useWebViews
 * @description This hook is used to manage the webviews
 * @returns {Object} - The webviews state
 */
export function useWebViews(setCurrentScreen) {
  const [channels, setChannels] = useState([]);
  const [selectedWebviews, setSelectedWebviews] = useState([]);
  const [webViewUrl, setWebViewUrl] = useState('');
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [refreshOption, setRefreshOption] = useState('never');
  const [isReadOnly, setIsReadOnly] = useState(false);

  const { navigate } = useNavigation(setCurrentScreen);

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
    loadPasswordFromSecureStore,
    savePasswordInSecureStore,
    openPasswordDefineModal,
    closePasswordDefineModal
  } = useWebViewsPassword(navigate);

  

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
   * @function handleSelectOption
   * @description Handles the selection of the refresh option
   * @param {string} option - The option to select
   * @returns {void}
   */
  const handleSelectOption = (option) => {
    setRefreshOption(option);
    setRefreshInterval(getIntervalInMilliseconds(option));
    saveRefreshOption(option);
  };

  
  /**
   * @function saveRefreshOption
   * @description Saves the refresh option in AsyncStorage
   * @param {string} option - The option to save
   * @returns {void}
   */
  const saveRefreshOption = async (option) => {
    try {
      await SecureStore.setItemAsync('refreshOption', option);
    } catch (error) {
      console.error('Failed to save refresh option', error);
    }
  };

    /**
   * @function handleSelectChannels
   * @description Handles the selection of channels
   * @param {Array} selected - The selected channels
   * @returns {void}
   */
  const handleSelectChannels = (selected) => {
    const updatedWebviews = [...selectedWebviews];
    //For each new channel, check if it is already in the list
    selected.forEach(newChannel => {
      const isDuplicate = selectedWebviews.some(
        existingChannel => existingChannel.href === newChannel.href
      );
      //If the channel is not already in the list, add it
      if (!isDuplicate) {
        updatedWebviews.push(newChannel);
      }
    });
  
    setSelectedWebviews(updatedWebviews);
    saveSelectedWebviews(updatedWebviews);
    navigate(SCREENS.WEBVIEWS_MANAGEMENT);
  };

    /**
   * @function saveSelectedWebviews
   * @description Saves the channels selected by the user in AsyncStorage
   * @param {Array} channels - The channels to save
   * @returns {void}
   */
  const saveSelectedWebviews = async (channels) => {
    try {
      //Save the channels in AsyncStorage
      await SecureStore.setItemAsync('selectedWebviews', JSON.stringify(channels));
    } catch (error) {
      console.error('Failed to save channels', error);
    }
  };

  /**
   * @function loadSelectedChannels
   * @description Loads the selected channels from the SecureStore
   * @returns {void}
   */
  const loadSelectedChannels = async () => {
    try {
      const storedChannels = await SecureStore.getItemAsync('selectedWebviews');

      if (storedChannels) {
        const parsedChannels = JSON.parse(storedChannels);
        setSelectedWebviews(parsedChannels);
        //If there are channels, set the first one as the current channel
        if (parsedChannels.length > 0) {
          setWebViewUrl(parsedChannels[0].href);
          navigate(SCREENS.WEBVIEW);
        }

      }
    } catch (error) {
      console.error('Failed to load channels', error);
    }
  };

    /**
   * @function toggleReadOnly
   * @description Toggles the read-only mode in webviews settings
   * @param {boolean} value - The value to set
   * @returns {void}
   */

  const toggleReadOnly = (value) => {
    setIsReadOnly(value !== undefined ? value : !isReadOnly);
  };

  /**
   * @function useEffect
   * @description Loads the selected channels, the password and the refresh option from AsyncStorage
   * @returns {void}
   */
  useEffect(() => {
    loadSelectedChannels();
    loadPasswordFromSecureStore();
    loadRefreshOption();
  }, []);

    /**
   * @function loadRefreshOption
   * @description Loads the refresh option from AsyncStorage
   * @returns {void}
   */
  const loadRefreshOption = async () => {
    try {
      const storedOption = await SecureStore.getItemAsync('refreshOption');
      if (storedOption) {
        setRefreshOption(storedOption); 
        setRefreshInterval(getIntervalInMilliseconds(storedOption));
      }
    } catch (error) {
      console.error('Failed to load refresh option', error);
    }
  };

  /**
   * @function navigateToChannelsList
   * @description Navigates to the channels list screen
   * @param {Array} extractedChannels - The extracted channels
   * @returns {void}
   */
  const navigateToChannelsList = (extractedChannels) => {
    console.log('🔄 Navigation vers la liste des canaux');
    setChannels(extractedChannels);
    // if (SCREENS.WEBVIEWS_LIST) {
    navigate(SCREENS.WEBVIEWS_LIST);
    // } else {
    //     console.error('❌ Screen WEBVIEWS_LIST non défini');
    // }
  };

  /**
   * @function navigateToWebView
   * @description Navigates to the web view screen
   * @param {string} url - The URL to navigate to
   * @returns {void}
   */
  const navigateToWebView = (url) => {
    console.log('🔄 Navigation vers la webview:', url);
    setWebViewUrl(url);
    if (SCREENS.WEBVIEW) {
        navigate(SCREENS.WEBVIEW);
    } else {
        console.error('❌ Screen WEBVIEW non défini');
    }
  };



  /**
   * @function useEffect
   * @description Loads the selected channels from the SecureStore when user opens the app
   * @returns {void}
   */
  useEffect(() => {
    loadSelectedChannels();
  }, []);

  /**
   * @function useEffect
   * @description Loads the interval chosen by the user in the settings to refresh the webviews
   * @returns {void}
   */
  useEffect(() => {
    if (refreshInterval) {
      const interval = setInterval(() => {

      }, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  return {
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
  };
}