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
    console.log('🔵 Début de loginApi');
    console.log('🔵 Paramètres reçus:', { contractNumber, login, accessToken: accessToken ? 'présent' : 'absent' });

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
    console.log('🔵 URL de l\'API:', apiUrl);

    // We send the request
    console.log('🔵 Envoi de la requête de login...');
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

    console.log('🔵 Réponse reçue:', {
      status: loginResponse.status,
      hasData: !!loginResponse.data,
      hasCmd: !!loginResponse.data?.cmd?.[0],
      hasAccounts: !!loginResponse.data?.cmd?.[0]?.accounts
    });

    const accountsData = loginResponse.data.cmd[0].accounts;

    if ((!loginResponse.data?.cmd?.[0]?.accounts) || (!accountsData.loginmsg?.get?.data)) {
        console.log('❌ Réponse invalide:', loginResponse.data);
        throw new Error(t('errors.invalidResponse'));
    }

    const userData = accountsData.loginmsg.get.data;
    const accountApiKey = userData.accountapikey;
    const refreshToken = userData.refresh_token;
    console.log('🔵 AccountApiKey obtenue:', accountApiKey);
    console.log('🔵 Refresh token obtenu:', refreshToken ? 'présent' : 'absent');

    // We send the second request to get the rights of the user
    console.log('🔵 Envoi de la requête pour les droits...');
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

    console.log('🔵 Réponse des droits reçue:', {
      status: channelsResponse.status,
      hasData: !!channelsResponse.data,
      hasCmd: !!channelsResponse.data?.cmd?.[0]
    });

    // Extract the rights of the group 4 (Admin group)
    const groupsData = channelsResponse.data?.cmd?.[0]?.amaiia_msg_srv?.client?.get_account_links?.data?.private?.groups;
    let userRights = null;

    if (groupsData && groupsData['4']) {
      userRights = groupsData['4'].rights;
      console.log('🔵 Droits utilisateur obtenus:', userRights);
    } else {
      console.log('⚠️ Aucun droit trouvé pour le groupe 4');
    }

    // We save the credentials with the rights in the secure storage
    const credentials = {
      contractNumber,
      login,
      password,
      accountApiKey,
      rights: userRights,
      refreshToken
    };

    await saveCredentials(credentials);
    console.log('🔵 Credentials sauvegardés');

    // We return the credentials
    return {
      status: loginResponse.status,
      accountApiKey: accountApiKey,
      refreshToken: refreshToken,
      firstname: userData.firstname || '',
      lastname: userData.lastname || '',
      rights: userRights,
      success: true,
    };

  } catch (error) {
    console.log('❌ Erreur dans loginApi:', error.message);
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
 * @description Vérifie la validité du refresh token
 * @param {string} contractNumber - Le numéro de contrat
 * @param {string} accountApiKey - La clé API du compte
 * @param {string} refreshToken - Le refresh token
 * @returns {Promise<Object>} - La réponse de l'API
 */
export const checkRefreshToken = async (contractNumber, accountApiKey, refreshToken) => {
  try {
    console.log('🔵 Début de checkRefreshToken');
    console.log('🔵 Paramètres reçus:', {
      contractNumber,
      accountApiKey,
      hasRefreshToken: !!refreshToken
    });

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

    console.log('🔵 Envoi de la requête de vérification du refresh token...');
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

    console.log('🔵 Réponse de vérification du refresh token:', {
      status: response.status,
      hasData: !!response.data?.cmd?.[0]?.accounts?.token?.refresh?.data,
      success: response.data?.cmd?.[0]?.accounts?.token?.refresh?.data !== undefined
    });

    return {
      success: response.data?.cmd?.[0]?.accounts?.token?.refresh?.data !== undefined,
      data: response.data?.cmd?.[0]?.accounts?.token?.refresh?.data
    };
  } catch (error) {
    console.log('❌ Erreur dans checkRefreshToken:', error.message);
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
