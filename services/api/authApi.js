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
    console.log('[Auth] Début de la tentative de connexion:', { contractNumber, login, accessToken: accessToken ? '***' : '' });

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
    console.log('[Auth] URL de l\'API:', apiUrl);

    // We send the request
    console.log('[Auth] Envoi de la requête de connexion');

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
    console.log('[Auth] Réponse reçue:', {
      status: loginResponse.status,
      hasData: !!loginResponse.data,
      hasCmd: !!loginResponse.data?.cmd?.[0]?.accounts
    });

    const accountsData = loginResponse.data.cmd[0].accounts;

    if ((!loginResponse.data?.cmd?.[0]?.accounts) || (!accountsData.loginmsg?.get?.data)) {
      console.log('[Auth] Réponse invalide:', loginResponse.data);
      throw new Error(t('errors.invalidResponse'));
    }

    const userData = accountsData.loginmsg.get.data;
    const accountApiKey = userData.accountapikey;
    const refreshToken = userData.refresh_token;
    const accessToken = userData.access_token;
    console.log('[Auth] Données utilisateur extraites:', {
      hasAccountApiKey: !!accountApiKey,
      hasRefreshToken: !!refreshToken,
      hasAccessToken: !!accessToken
    });

    // We send the second request to get the rights of the user
    console.log('[Auth] Récupération des droits utilisateur');

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
    console.log('[Auth] Réponse des droits reçue:', {
      status: channelsResponse.status,
      hasData: !!channelsResponse.data
    });

    // Extract the rights of the group 4 (Admin group)
    const groupsData = channelsResponse.data?.cmd?.[0]?.amaiia_msg_srv?.client?.get_account_links?.data?.private?.groups;
    let userRights = null;

    if (groupsData && groupsData['4']) {
      userRights = groupsData['4'].rights;
      console.log('[Auth] Droits utilisateur trouvés:', { hasRights: !!userRights });
    } else {
      console.log('[Auth] Aucun droit utilisateur trouvé');
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

    console.log('[Auth] Sauvegarde des credentials');
    await saveCredentials(credentials);
    console.log('[Auth] Credentials sauvegardés');

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
    console.log('[Auth] Erreur lors de la connexion:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    handleApiError(error, 'auth.login', {
      type: ErrorType.AUTH,
      silent: false
    });
    return {
      status: error.response?.status || 500,
      success: false,
      error: error.message || t('errors.connectionError'),
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
 * @function clearSecureStorage
 * @description Clears the secure storage when the user logs out
 */
export const clearSecureStorage = async () => {
  try {
    await SecureStore.deleteItemAsync('userCredentials');
    await SecureStore.deleteItemAsync('savedLoginInfo');
    await SecureStore.deleteItemAsync('custom_api_url');
    await SecureStore.deleteItemAsync('isMessagesHidden');
    await SecureStore.deleteItemAsync('userRights');
    return true;
  } catch (error) {
    handleError(error, 'auth.clearSecureStorage', {
      type: ErrorType.SYSTEM,
      silent: false
    });
    return false;
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
    console.log('[Auth] Vérification du refresh token');
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

    console.log('[Auth] Request data:', requestData);
    const apiUrl = await ENV.API_URL();
    console.log('[Auth] Envoi de la requête de refresh token');
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
    console.log('[Auth] Réponse du refresh token:', {
      status: response.status,
      hasData: !!response.data?.cmd?.[0]?.accounts?.token?.refresh?.data
    });

    return {
      success: response.data?.cmd?.[0]?.accounts?.token?.refresh?.data !== undefined,
      data: response.data?.cmd?.[0]?.accounts?.token?.refresh?.data
    };
  } catch (error) {
    console.log('[Auth] Erreur lors de la vérification du refresh token:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    handleApiError(error, 'auth.checkRefreshToken', {
      type: ErrorType.AUTH,
      silent: false
    });
    return {
      success: false,
      error: error.message
    };
  }
};
