import { useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from './useNavigation';
import { useWebviewsPassword } from './useWebViewsPassword';
import { SCREENS } from '../constants/screens';

/**
 * @function useWebviews
 * @description This hook is used to manage the webviews
 * @returns {Object} - The webviews state
 */
export function useWebviews(setCurrentScreen) {
  const [channels, setChannels] = useState([]);
  const [selectedWebviews, setSelectedWebviews] = useState([]);
  const [webViewUrl, setWebviewUrl] = useState('');
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
    closePasswordDefineModal,
  } = useWebviewsPassword(navigate);

  const toggleReadOnly = useCallback((value) => {
    setIsReadOnly(value !== undefined ? value : !isReadOnly);
  }, [isReadOnly]);

  const handleSelectChannels = async (selectedChannels) => {
    try {
      const updatedWebviews = [...(selectedWebviews || []), ...(selectedChannels || [])];
      setSelectedWebviews(updatedWebviews);
      await saveSelectedWebviews(updatedWebviews);
    } catch (error) {
      console.error('Error while selecting channels:', error);
    }
  };

  /**
   * @function getIntervalInMilliseconds
   * @description Gets the interval in milliseconds
   * @param {string} value - The value to get
   * @returns {number} - The interval in milliseconds
   */
  const getIntervalInMilliseconds = useCallback((value) => {
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
  }, []);

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
      // Supprimons d'abord l'ancienne valeur
      await SecureStore.deleteItemAsync('refreshOption');

      // Sauvegardons la nouvelle valeur
      await SecureStore.setItemAsync('refreshOption', option, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED
      });
    } catch (error) {
      console.error('Failed to save refresh option', error);
    }
  };

  /**
   * @function saveSelectedWebviews
   * @description Saves the channels selected by the user in AsyncStorage
   * @param {Array} channels - The channels to save
   * @returns {void}
   */
  const saveSelectedWebviews = async (webviews) => {
    try {
      const webviewsToSave = webviews || [];
      setSelectedWebviews(webviewsToSave);
      await SecureStore.setItemAsync('selectedWebviews', JSON.stringify(webviewsToSave));
    } catch (error) {
      console.error('Error while saving webviews:', error);
    }
  };

  /**
   * @function loadSelectedChannels
   * @description Loads the selected channels from the SecureStore
   * @returns {void}
   */
  const loadSelectedChannels = useCallback(async () => {
    try {
      const storedChannels = await SecureStore.getItemAsync('selectedWebviews');
      if (storedChannels) {
        const parsedChannels = JSON.parse(storedChannels);
        setSelectedWebviews(parsedChannels);
        if (parsedChannels.length > 0) {
          setWebviewUrl(parsedChannels[0].href);
        }
      }
    } catch (error) {
      console.error('❌ Erreur de chargement des canaux:', error);
      if (error.message.includes('Could not decrypt')) {
        console.log('🔐 Erreur de décryptage détectée, nettoyage...');
        await clearSecureStore();
      }
    }
  }, [setSelectedWebviews, setWebviewUrl]);

  /**
   * @function loadRefreshOption
   * @description Loads the refresh option from AsyncStorage
   * @returns {void}
   */
  const loadRefreshOption = useCallback(async () => {
    try {
      // D'abord, supprimons l'ancienne valeur
      await SecureStore.deleteItemAsync('refreshOption');

      // Ensuite, définissons une valeur par défaut
      const defaultOption = 'never';
      await SecureStore.setItemAsync('refreshOption', defaultOption);

      setRefreshOption(defaultOption);
      setRefreshInterval(getIntervalInMilliseconds(defaultOption));
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to load refresh option', error);
      }
      // En cas d'erreur, on définit des valeurs par défaut
      setRefreshOption('never');
      setRefreshInterval(null);
    }
  }, [setRefreshOption, setRefreshInterval, getIntervalInMilliseconds]);

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
   * @function navigateToWebview
   * @description Navigates to the web view screen
   * @param {string} url - The URL to navigate to
   * @returns {void}
   */
  const navigateToWebview = (url) => {
    console.log('🔄 Navigation vers la webview:', url);
    setWebviewUrl(url);
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
  }, [loadSelectedChannels]);

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

  useEffect(() => {
    loadSelectedChannels();
    loadPasswordFromSecureStore();
    loadRefreshOption();
  }, [loadSelectedChannels, loadPasswordFromSecureStore, loadRefreshOption]);

  const clearSecureStore = async () => {
    try {
      console.log('🧹 Nettoyage du SecureStore...');
      await SecureStore.deleteItemAsync('selectedWebviews');
      await SecureStore.deleteItemAsync('refreshOption');
      await SecureStore.deleteItemAsync('isReadOnly');
      setSelectedWebviews([]);
      setWebviewUrl('');
      setRefreshOption('never');
      setRefreshInterval(null);
      setIsReadOnly(false);
      console.log('✅ SecureStore nettoyé avec succès');
      return true;
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage:', error);
      return false;
    }
  };

  return {
    channels,
    setChannels,
    selectedWebviews,
    setSelectedWebviews,
    webViewUrl,
    setWebviewUrl,
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
    navigateToWebview,
    clearSecureStore,
  };
}
