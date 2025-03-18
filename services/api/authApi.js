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
    console.log('🔵 Tentative de connexion avec:', { contractNumber, login });

    // Créer la requête une seule fois
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

    let apiUrl = await ENV.API_URL();
    if (!apiUrl.endsWith('/ic.php')) {
      apiUrl = `${apiUrl}/ic.php`;
    }
    console.log('🔵 URL de l\'API:', apiUrl);
    // console.log('🔵 Données envoyées:', JSON.stringify(requestData, null, 2));

    // Utiliser requestData directement
    const loginResponse = await axios({
      method: 'POST',
      url: apiUrl,
      data: requestData,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
      validateStatus: function (status) {
        console.log('🔵 Status reçu:', status);
        return true; // accepte tous les status pour le debug
      },
      maxRedirects: 0, // désactive les redirections pour le debug
    });

    console.log('🔵 Login response détaillée:', JSON.stringify(loginResponse.data, null, 2));

    if (!loginResponse.data?.cmd?.[0]?.accounts) {
        throw new Error('Format de réponse invalide - données manquantes');
    }

    const accountsData = loginResponse.data.cmd[0].accounts;
    // console.log('🔵 Données du compte:', JSON.stringify(accountsData, null, 2));

    if (!accountsData.loginmsg?.get?.data) {
        throw new Error('Données de connexion manquantes dans la réponse');
    }

    const userData = accountsData.loginmsg.get.data;
    const accountApiKey = userData.accountapikey;

    // Deuxième requête pour obtenir les droits
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

    // Extraire les droits du groupe 4 (Groupe admin)
    const groupsData = channelsResponse.data?.cmd?.[0]?.amaiia_msg_srv?.client?.get_account_links?.data?.private?.groups;
    let userRights = null;

    if (groupsData && groupsData['4']) {
      userRights = groupsData['4'].rights;
      console.log("Rights trouvés dans le groupe admin:", userRights);
    }

    // Sauvegarder les credentials avec les droits
    const credentials = {
      contractNumber,
      login,
      password,
      accountApiKey,
      rights: userRights
    };

    console.log("Sauvegarde des credentials:", {
      ...credentials,
      password: '***' // Masquer le mot de passe dans les logs
    });

    await saveCredentials(credentials);

    return {
      status: loginResponse.status,
      accountApiKey: accountApiKey,
      firstname: userData.firstname || '',
      lastname: userData.lastname || '',
      rights: userRights,
      success: true,
    };

  } catch (error) {
    console.error('🔴 Error loginApi:', error);
    console.error('🔴 Error details:', {
        message: error.message,
        code: error.code,
        response: error.response,
        request: error.request
    });
    return {
        status: 500,
        success: false,
        error: `${error.message} (${error.code || 'no code'})`,
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
export const saveCredentials = async (credentials) => {
  try {
    await SecureStore.setItemAsync('userCredentials', JSON.stringify(credentials));
    // Sauvegarder les droits séparément pour plus de sécurité
    if (credentials.rights) {
      await SecureStore.setItemAsync('userRights', credentials.rights);
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des credentials:', error);
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
 * @function getUserRights
 * @description Gets the saved user rights from secure storage
 * @returns {Promise<Object>} The saved user rights
 */
export const getUserRights = async () => {
  try {
    const credentials = await getCredentials();
    return credentials?.rights || null;
  } catch (error) {
    console.error('Erreur lors de la récupération des droits:', error);
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
    console.error('🔴 Error clearing secure storage:', error);
    return false;
  }
};