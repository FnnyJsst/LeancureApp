import { useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from './useNavigation';
import { useWebviewsPassword } from './useWebViewsPassword';
import { SCREENS } from '../constants/screens';
import { useTranslation } from 'react-i18next';

/**
 * @function useWebviews
 * @description This hook is used to manage the webviews
 * @returns {Object} - The webviews state
 */
export function useWebviews(setCurrentScreen) {

  const { t } = useTranslation();

  const [channels, setChannels] = useState([]);
  const [selectedWebviews, setSelectedWebviews] = useState([]);
  const [webViewUrl, setWebViewUrl] = useState('');
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [refreshOption, setRefreshOption] = useState('never');
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { navigate } = useNavigation(setCurrentScreen);

  const {
    loadPasswordFromSecureStore,
  } = useWebviewsPassword(navigate);

  const toggleReadOnly = useCallback(async (value) => {
    const newValue = value !== undefined ? value : !isReadOnly;
    setIsReadOnly(newValue);
    try {
      await SecureStore.setItemAsync('isReadOnly', JSON.stringify(newValue));
    } catch (error) {
      throw new Error(t('errors.errorSavingReadOnlyMode'), error);
    }
  }, [isReadOnly]);

  const handleSelectChannels = async (selectedChannels) => {
    try {
      setSelectedWebviews(prev => {
        const updatedWebviews = [...(prev || []), ...(selectedChannels || [])];
        if (updatedWebviews[0]?.href) {
          setWebViewUrl(updatedWebviews[0].href);
        }
        saveSelectedWebviews(updatedWebviews);
        return updatedWebviews;
      });
    } catch (error) {
      throw new Error(t('errors.errorSelectingChannels'), error);
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
      await SecureStore.setItemAsync('refreshOption', option);
    } catch (error) {
      throw new Error(t('errors.errorSavingRefreshOption'), error);
    }
  };

  /**
   * @function saveSelectedWebviews
   * @description Saves the channels selected by the user in AsyncStorage
   * @param {Array} webviews - The channels to save
   */
  const saveSelectedWebviews = async (webviews) => {
    try {
      const webviewsToSave = webviews || [];
      // Sauvegarder dans SecureStore
      await SecureStore.setItemAsync('selectedWebviews', JSON.stringify(webviewsToSave));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des webviews:', error);
      throw new Error(t('errors.errorSavingWebviews'), error);
    }
  };

  /**
   * @function loadSelectedChannels
   * @description Loads the selected channels from the SecureStore
   */
  const loadSelectedChannels = useCallback(async () => {
    try {
      const storedChannels = await SecureStore.getItemAsync('selectedWebviews');
      let parsedChannels = [];

      if (storedChannels) {
        try {
          parsedChannels = JSON.parse(storedChannels) || [];
        } catch (e) {
          console.error('Erreur de parsing des channels:', e);
        }
      }

      setSelectedWebviews(parsedChannels);
      return parsedChannels;
    } catch (error) {
      console.error('Erreur de chargement des channels:', error);
      return [];
    }
  }, []);

  /**
   * @function loadRefreshOption
   * @description Loads the refresh option from AsyncStorage
   */
  const loadRefreshOption = useCallback(async () => {
    try {
      const storedOption = await SecureStore.getItemAsync('refreshOption');
      if (storedOption) {
        setRefreshOption(storedOption);
        setRefreshInterval(getIntervalInMilliseconds(storedOption));
      }
    } catch (error) {
      if (__DEV__) {
        throw new Error(t('errors.errorLoadingRefreshOption'), error);
      }
    }
  }, [setRefreshOption, setRefreshInterval, getIntervalInMilliseconds]);

  useEffect(() => {
    if (!isInitialized) {
      const loadReadOnlyMode = async () => {
        try {
          const savedMode = await SecureStore.getItemAsync('isReadOnly');
          if (savedMode !== null) {
            setIsReadOnly(savedMode === 'true');
          }
        } catch (error) {
          setIsInitialized(true);
        }
      };

      loadReadOnlyMode();
    }
  }, [isInitialized]);

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
    setWebViewUrl(url);
    if (SCREENS.WEBVIEW) {
      navigate(SCREENS.WEBVIEW);
    } else {
      throw new Error(t('errors.screenNotFound'), SCREENS.WEBVIEW);
    }
  };

  /**
   * @function useEffect
   * @description Loads the selected channels from the SecureStore when user opens the app
   */
  useEffect(() => {
    const initializeWebviews = async () => {
      try {
        await loadRefreshOption();
        await loadPasswordFromSecureStore();

        const storedChannels = await SecureStore.getItemAsync('selectedWebviews');
        if (storedChannels) {
          const parsedChannels = JSON.parse(storedChannels);
          setSelectedWebviews(parsedChannels || []);
          if (parsedChannels?.[0]?.href) {
            setWebViewUrl(parsedChannels[0].href);
          }
        } else {
          setSelectedWebviews([]);
        }
      } catch (error) {
        setSelectedWebviews([]);
        throw new Error(t('errors.errorLoadingWebviews'), error);
      }
    };

    initializeWebviews();
  }, []);

  /**
   * @function useEffect
   * @description Loads the interval chosen by the user in the settings to refresh the webviews
   */
  useEffect(() => {
    if (!refreshInterval || selectedWebviews.length === 0) {
      return;
    }

    const interval = setInterval(() => {
      const timestamp = new Date().toLocaleTimeString();

      // Increment the refreshKey
      setRefreshKey(prevKey => {
        const newKey = prevKey + 1;
        return newKey;
      });
    }, refreshInterval);

    // Nettoyage de l'intervalle
    return () => {
      clearInterval(interval);
    };
  }, [refreshInterval, refreshOption]); // Réduire les dépendances

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
    navigateToWebview,
    refreshKey,
  };
}
