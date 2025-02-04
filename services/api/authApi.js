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
    const timestamp = Date.now();
    
    const body = createApiRequest({
        "accounts": {
          "loginmsg": {
            "get": {
              "contractnumber": contractNumber,
              "login": login,
              "password": password,
              "msg-msgapikey": ENV.MSG_API_KEY
            }
          }
        }
    });

    const response = await axios.post(ENV.API_URL, body);
    // let cleanData = response.data;
    const cleanData = cleanApiResponse(response); 



    // if (typeof response.data === 'string') {
    //   const sqlEnd = response.data.indexOf('{');
    //   if (sqlEnd !== -1) {
    //     const jsonStr = response.data.substring(sqlEnd);
    //     cleanData = JSON.parse(jsonStr);
    //   }
    // }

    if (cleanData.status === 'error') {
      throw new Error(cleanData.error || 'Login failed');
    }

    return cleanData;
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