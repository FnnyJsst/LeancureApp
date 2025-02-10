import axios from 'axios';
import { ENV } from '../../config/env';
import { createApiRequest, cleanApiResponse } from './baseApi';

/**
 * @function loginApi
 * @description Logs in to the API
 * @param {string} contractNumber - The contract number
 * @param {string} login - The login
 * @param {string} password - The password
 * @returns {Promise<Object>} - The login data
 */
export const loginApi = async (contractNumber, login, password) => {
  try {
    const data = createApiRequest({
      "msg_srv": {
        "client": {
          "get_account_links": {
            "accountinfos": {
              "login": login,
              "password": password,
              "email": "",
              "nom": "",
              "prenom": ""
            },
            "msg-msgapikey": ENV.MSG_API_KEY,
            "msg-contract-number": contractNumber
          }
        }
      }
    }, contractNumber);

    console.log('🔗 URL API:', ENV.API_URL);
    console.log('📦 Données envoyées:', JSON.stringify(data, null, 2));

    const response = await axios({
      method: 'POST',
      url: ENV.API_URL,
      data: data,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 secondes de timeout
    });

    return cleanApiResponse(response);
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
export const saveCredentials = async ({ contractNumber, login, password }) => {
  try {
    await SecureStore.setItemAsync('userCredentials', JSON.stringify({
      contractNumber,
      login,
      password
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