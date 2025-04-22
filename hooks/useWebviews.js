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

      // Limiter le nombre de webviews à sauvegarder
      const maxWebviews = 10; // Limite arbitraire pour éviter les problèmes de taille
      const limitedWebviews = webviewsToSave.slice(0, maxWebviews);

      // Ne sauvegarder que les données essentielles avec une taille très limitée
      const simplifiedWebviews = limitedWebviews.map(webview => ({
        href: (webview.href || '').substring(0, 50), // Limiter encore plus la taille
        title: (webview.title || '').substring(0, 30) // Limiter encore plus la taille
      }));

      // Mettre à jour l'état local
      setSelectedWebviews(webviewsToSave);

      // Sauvegarder dans SecureStore avec une taille minimale
      const jsonString = JSON.stringify(simplifiedWebviews);
      if (jsonString.length > 2048) {
        console.warn('Les données sont trop grandes pour SecureStore, certaines informations seront tronquées');
      }
      await SecureStore.setItemAsync('selectedWebviews', jsonString);
    } catch (error) {
      console.error('Error while saving webviews:', error);
      // En cas d'erreur, essayer de sauvegarder une version encore plus simplifiée
      try {
        const emergencyWebviews = webviewsToSave.slice(0, 5).map(webview => ({
          href: (webview.href || '').substring(0, 20),
          title: (webview.title || '').substring(0, 10)
        }));
        await SecureStore.setItemAsync('selectedWebviews', JSON.stringify(emergencyWebviews));
      } catch (emergencyError) {
        console.error('Emergency save failed:', emergencyError);
      }
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
      // First, delete the old value
      await SecureStore.deleteItemAsync('refreshOption');

      // Then, we define a default value
      const defaultOption = 'never';
      await SecureStore.setItemAsync('refreshOption', defaultOption);

      setRefreshOption(defaultOption);
      setRefreshInterval(getIntervalInMilliseconds(defaultOption));
    } catch (error) {
      console.error('Failed to load refresh option', error);
      // In case of error, we define default values
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
