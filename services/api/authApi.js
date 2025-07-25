import axios from 'axios';
import { ENV } from '../../config/env';
import { createApiRequest } from './baseApi';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { CustomAlert } from '../../components/modals/webviews/CustomAlert';
import { t } from '../../i18n/index';

/**
 * @function hashPassword
 * @description Hashes a password using SHA-256
 * @param {string} password - The password to hash
 * @returns {Promise<string>} The hashed password
 */
export const hashPassword = async (password) => {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password,
    { encoding: Crypto.CryptoEncoding.HEX }
  );
};

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
    const requestData = await createApiRequest({
      'accounts': {
        'loginmsg': {
          'get': {
            'login': login,
            'password': password,
          },
        },
      },
    }, contractNumber, accessToken, login);

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

    // Vérifier s'il y a une erreur dans la réponse
    if (loginResponse.data?.error || loginResponse.data?.status === 'error') {
      throw new Error(loginResponse.data?.error || 'Server error');
    }

    if (!loginResponse.data?.cmd || loginResponse.data.cmd.length === 0) {
      throw new Error('Invalid response structure');
    }

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
      data: await createApiRequest({
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
      }, contractNumber, accessToken, login),
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
    } else {
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
    const result = {
      status: loginResponse.status,
      accountApiKey: accountApiKey,
      refreshToken: refreshToken,
      accessToken: accessToken,
      firstname: userData.firstname || '',
      lastname: userData.lastname || '',
      rights: userRights,
      success: true,
    };

    return result;

  } catch (error) {
    CustomAlert.show({
      message: t('errors.connectionError')
    });
    return {
      status: error.response?.status || 500,
      success: false,
      error: t('errors.connectionError'),
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
    if (credentials.rights) {
      await SecureStore.setItemAsync('userRights', credentials.rights);
    }
  } catch (error) {
    console.error('[Auth] Error saving credentials:', error);
    CustomAlert.show({
      message: t('errors.errorSavingLoginInfo')
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
    const credentials = await SecureStore.getItemAsync('userCredentials');
    return credentials ? JSON.parse(credentials) : null;
  } catch (error) {
    CustomAlert.show({
      message: t('errors.errorLoadingLoginInfo')
    });
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
    console.error('[Auth] Error retrieving user rights:', error);
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
    console.error('[Auth] Error checking refresh token:', error);
    return {
      success: false,
      error: error.message || 'Error checking refresh token'
    };
  }
};
