import axios from 'axios';
import { ENV } from '../../config/env';
import { createApiRequest } from './baseApi';
import * as SecureStore from 'expo-secure-store';
import { handleError, ErrorType, handleApiError } from '../../utils/errorHandling';
import CryptoJS from 'crypto-js';

/**
 * @function loginApi
 * @description Logs in to the API
 * @param {string} contractNumber - The contract number
 * @param {string} login - The login
 * @param {string} password - The password
 * @param {string} accessToken - The access token
 */
export const loginApi = async (contractNumber, login, password, accessToken = '') => {
  try {

    // We create the request data
    const requestData = createApiRequest({
      'accounts': {
        'loginmsg': {
          'get': {
            'login': login,
            'password': password,
          },
        },
      },
    }, contractNumber, accessToken);

    // We get the API URL and check if it ends with /ic.php
    let apiUrl = await ENV.API_URL();
    if (!apiUrl.endsWith('/ic.php')) {
      apiUrl = `${apiUrl}/ic.php`;
    }

    // We send the request
    const loginResponse = await axios({
      method: 'POST',
      url: apiUrl,
      data: requestData,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
      validateStatus: function (status) {
        return true;
      },
      maxRedirects: 0,
    });


    const accountsData = loginResponse.data.cmd[0].accounts;

    if ((!loginResponse.data?.cmd?.[0]?.accounts) || (!accountsData.loginmsg?.get?.data)) {
      throw new Error(t('errors.invalidResponse'));
    }

    const userData = accountsData.loginmsg.get.data;
    const accountApiKey = userData.accountapikey;
    const refreshToken = userData.refresh_token;
    const accessToken = userData.access_token;

    // We send the second request to get the rights of the user ()
    const channelsResponse = await axios({
      method: 'POST',
      url: await ENV.API_URL(),
      data: createApiRequest({
        'amaiia_msg_srv': {
          'client': {
            'get_account_links': {
              'accountinfos': {
                'accountapikey': accountApiKey,
              },
              'returnmessages': false,
              'resultsperchannel': 0,
              'orderby': 'ASC'
            },
          },
        },
      }, contractNumber, accessToken),
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    // Extract the rights of the group 4 (Admin group)
    const groupsData = channelsResponse.data?.cmd?.[0]?.amaiia_msg_srv?.client?.get_account_links?.data?.private?.groups;
    let userRights = null;

    if (groupsData && groupsData['4']) {
      userRights = groupsData['4'].rights;
    }

    // We save the credentials with the rights in the secure storage
    const credentials = {
      contractNumber,
      login,
      password,
      accountApiKey,
      rights: userRights,
      refreshToken,
      accessToken
    };

    await saveCredentials(credentials);

    // We return the credentials
    return {
      status: loginResponse.status,
      accountApiKey: accountApiKey,
      refreshToken: refreshToken,
      accessToken: accessToken,
      firstname: userData.firstname || '',
      lastname: userData.lastname || '',
      rights: userRights,
      success: true,
    };

  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 500,
      error: 'LOGIN_FAILED'
    };
  }
};

/**
 * @function saveCredentials
 * @description Saves the user credentials in secure storage
 * @param {Object} credentials - The credentials to save
 */
export const saveCredentials = async (credentials) => {
  try {
    await SecureStore.setItemAsync('userCredentials', JSON.stringify(credentials));
    // Save the rights separately for more security
    if (credentials.rights) {
      await SecureStore.setItemAsync('userRights', credentials.rights);
    }
  } catch (error) {
    handleError(error, 'auth.saveCredentials', {
      type: ErrorType.SYSTEM,
      silent: false
    });
    throw new Error(t('errors.errorSavingLoginInfo'));
  }
};

/**
 * @function getCredentials
 * @description Gets the saved credentials from secure storage
 * @returns {Promise<Object>} The saved credentials
 */
export const getCredentials = async () => {
  try {
    // We get the credentials from the secure storage and parse it
    const credentials = await SecureStore.getItemAsync('userCredentials');
    return credentials ? JSON.parse(credentials) : null;
  } catch (error) {
    handleError(error, 'auth.getCredentials', {
      type: ErrorType.SYSTEM,
      silent: false
    });
    throw new Error(t('errors.errorLoadingLoginInfo'));
  }
};

/**
 * @function getUserRights
 * @description Gets the saved user rights from secure storage
 * @returns {Promise<Object>} The saved user rights
 */
export const getUserRights = async () => {
  try {
    const credentials = await getCredentials();
    return credentials?.rights || null;
  } catch (error) {
    handleError(error, 'auth.getUserRights', {
      type: ErrorType.SYSTEM,
      silent: false
    });
    return null;
  }
};

/**
 * @function checkRefreshToken
 * @description Checks if the refresh token is valid
 * @param {string} contractNumber - The contract number
 * @param {string} accountApiKey - The account API key
 * @param {string} refreshToken - The refresh token
 * @returns {Promise<Object>} - The response of the API
 */
export const checkRefreshToken = async (contractNumber, accountApiKey, refreshToken) => {
  try {
    const timestamp = Date.now();
    const data = `accounts/token/refresh/${timestamp}/`;
    const hash = CryptoJS.HmacSHA256(data, contractNumber);
    const hashHex = hash.toString(CryptoJS.enc.Hex);

    const requestData = {
      "api-version": "2",
      "api-contract-number": contractNumber,
      "api-signature": hashHex,
      "api-signature-hash": "sha256",
      "api-signature-timestamp": timestamp,
      "client-type": "mobile",
      "client-login": "admin",
      "client-token": "",
      "cmd": [{
        "accounts": {
          "token": {
            "refresh": {
              "accountapikey": accountApiKey,
              "refresh_token": refreshToken
            }
          }
        }
      }]
    };

    const apiUrl = await ENV.API_URL();
    const response = await axios({
      method: 'POST',
      url: apiUrl,
      data: requestData,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
      validateStatus: function (status) {
        return true;
      }
    });

    return {
      success: response.data?.cmd?.[0]?.accounts?.token?.refresh?.data !== undefined,
      data: response.data?.cmd?.[0]?.accounts?.token?.refresh?.data
    };
  } catch (error) {
    return {
      success: false,
      error: 'REFRESH_TOKEN_FAILED'
    };
  }
};
