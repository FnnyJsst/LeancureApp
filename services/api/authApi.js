import axios from 'axios';
import { ENV } from '../../config/env';
import { createApiRequest } from './baseApi';
import * as SecureStore from 'expo-secure-store';

/**
 * @function loginApi
 * @description Logs in to the API
 * @param {string} contractNumber - The contract number
 * @param {string} login - The login
 * @param {string} password - The password
 * @param {string} accessToken - The access token
 * @returns {Promise<Object>} - The login data
 */
export const loginApi = async (contractNumber, login, password, accessToken = '') => {
  try {
    const data = createApiRequest({
      'accounts': {
        'loginmsg': {
          'get': {
            'login': login,
            'password': password,
          },
        },
      },
    }, contractNumber, accessToken);

    const apiUrl = await ENV.API_URL();

    // Try to send the request to the API
    try {
      const response = await axios({
        method: 'POST',
        url: apiUrl,
        data: data,
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      if (!response.data?.cmd?.[0]?.accounts?.loginmsg?.get?.data) {
        throw new Error('Invalid response format');
      }

      // Get the user data
      const userData = response.data.cmd[0].accounts.loginmsg.get.data;

      return {
        status: response.status,
        accountApiKey: userData.accountapikey || '',
        firstname: userData.firstname || '',
        lastname: userData.lastname || '',
        success: true,
      };
    } catch (axiosError) {
      console.error('🔴 Axios error:', axiosError?.response || axiosError);
      return {
        status: axiosError?.response?.status || 500,
        success: false,
        error: axiosError?.response?.data?.message || 'Erreur de connexion au serveur',
      };
    }
  } catch (error) {
    console.error('🔴 Error loginApi:', error);
    return {
      status: 500,
      success: false,
      error: error.message,
    };
  }
};


/**
 * @function saveCredentials
 * @description Saves the user credentials in secure storage
 * @param {Object} credentials - The credentials to save
 * @param {string} credentials.contractNumber - The contract number
 * @param {string} credentials.login - The login
 * @param {string} credentials.password - The hashed password
 */
export const saveCredentials = async ({ contractNumber, login, password, accountApiKey }) => {
  try {
    await SecureStore.setItemAsync('userCredentials', JSON.stringify({
      contractNumber,
      login,
      password,
      accountApiKey,
    }));
  } catch (error) {
    throw new Error('Failed to save credentials');
  }
};

/**
 * @function getCredentials
 * @description Gets the saved credentials from secure storage
 * @returns {Promise<Object>} The saved credentials
 */
export const getCredentials = async () => {
  try {
    const credentials = await SecureStore.getItemAsync('userCredentials');
    return credentials ? JSON.parse(credentials) : null;
  } catch (error) {
    throw new Error('Failed to get credentials');
  }
};

/**
 * @function clearSecureStorage
 * @description Clears the secure storage when the user logs out
 */
export const clearSecureStorage = async () => {
  try {
    await SecureStore.deleteItemAsync('userCredentials');
    await SecureStore.deleteItemAsync('savedLoginInfo');
    await SecureStore.deleteItemAsync('custom_api_url');
    await SecureStore.deleteItemAsync('isMessagesHidden');
    return true;
  } catch (error) {
    console.error('🔴 Error clearing secure storage:', error);
    return false;
  }
};
