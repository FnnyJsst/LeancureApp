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

  // We get the navigation function
  const { navigate } = useNavigation(setCurrentScreen);

  // We get the password from the SecureStore
  const {
    loadPasswordFromSecureStore,
  } = useWebviewsPassword(navigate);

  // We toggle the read only mode
  const toggleReadOnly = useCallback((value) => {
    setIsReadOnly(value !== undefined ? value : !isReadOnly);
  }, [isReadOnly]);

  // We handle the selection of the channels
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
      case 'every 5 minutes': return 300000;
      case 'every 15 minutes': return 900000;
      case 'every 30 minutes': return 1800000;
      case 'every hour': return 3600000;
      case 'every 2 hours': return 7200000;
      case 'every 6 hours': return 21600000;
      case 'every day': return 86400000;
      default: return null;
    }
  }, []);

  /**
   * @function handleSelectOption
   * @description Handles the selection of the refresh option
   * @param {string} option - The option to select
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
   */
  const saveRefreshOption = async (option) => {
    try {
      // We delete the old value, then we save the new one
      await SecureStore.deleteItemAsync('refreshOption');
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
   */
  const saveSelectedWebviews = async (webviews) => {
    try {
      const webviewsToSave = webviews || [];
      // Ne sauvegarder que les données essentielles et limiter la taille
      const simplifiedWebviews = webviewsToSave.map(webview => ({
        href: webview.href?.substring(0, 200) || '', // Limiter la taille de l'URL
        title: webview.title?.substring(0, 100) || '' // Limiter la taille du titre
      }));
      setSelectedWebviews(webviewsToSave);
      await SecureStore.setItemAsync('selectedWebviews', JSON.stringify(simplifiedWebviews));
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
  }, []);

  /**
   * @function loadRefreshOption
   * @description Loads the refresh option from AsyncStorage
   */
  const loadRefreshOption = useCallback(async () => {
    try {
      // On essaie d'abord de charger la valeur existante
      const savedOption = await SecureStore.getItemAsync('refreshOption');

      if (savedOption) {
        // Si une valeur existe, on l'utilise
        setRefreshOption(savedOption);
        setRefreshInterval(getIntervalInMilliseconds(savedOption));
      } else {
        // Si aucune valeur n'existe, on définit la valeur par défaut
        const defaultOption = 'never';
        await SecureStore.setItemAsync('refreshOption', defaultOption);
        setRefreshOption(defaultOption);
        setRefreshInterval(getIntervalInMilliseconds(defaultOption));
      }
    } catch (error) {
      console.error('Failed to load refresh option', error);
      // En cas d'erreur, on définit des valeurs par défaut
      setRefreshOption('never');
      setRefreshInterval(null);
    }
  }, [setRefreshOption, setRefreshInterval, getIntervalInMilliseconds]);

  /**
   * @function navigateToChannelsList
   * @description Navigates to the channels list screen
   * @param {Array} extractedChannels - The extracted channels
   */
  const navigateToChannelsList = (extractedChannels) => {
    setChannels(extractedChannels);
    navigate(SCREENS.WEBVIEWS_LIST);
  };

  /**
   * @function navigateToWebview
   * @description Navigates to the web view screen
   * @param {string} url - The URL to navigate to
   */
  const navigateToWebview = (url) => {
    setWebviewUrl(url);
    if (SCREENS.WEBVIEW) {
        navigate(SCREENS.WEBVIEW);
    }
  };

  /**
   * @description Loads the interval chosen by the user in the settings to refresh the webviews
   */
  useEffect(() => {
    if (refreshInterval) {
      const interval = setInterval(() => {
        // Logique de rafraîchissement
      }, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  // Garder uniquement un seul useEffect pour le chargement initial
  useEffect(() => {
    const initializeData = async () => {
      await loadSelectedChannels();
      await loadPasswordFromSecureStore();
      await loadRefreshOption();
    };
    initializeData();
  }, []);

  const clearSecureStore = async () => {
    try {
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