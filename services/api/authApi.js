import axios from 'axios';
import { ENV } from '../../config/env';
import { createApiRequest, cleanApiResponse } from './baseApi';

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
      "accounts": {
        "loginmsg": {
          "get": {
            "login": login,
            "password": password
          }
        }
      }
    }, contractNumber, accessToken);

    console.log('🔗 URL API:', ENV.API_URL);
    console.log('📦 Données envoyées:', JSON.stringify(data, null, 2));
    console.log('🔑 Access Token:', accessToken);

    const response = await axios({
      method: 'POST',
      url: ENV.API_URL,
      data: data,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 secondes de timeout
    });

    // Récupérer l'accountApiKey de la réponse
    const accountApiKey = response.data?.cmd?.[0]?.accounts?.loginmsg?.get?.data?.accountapikey;
    return { ...response, accountApiKey };
  } catch (error) {
    throw error;
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
      accountApiKey
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