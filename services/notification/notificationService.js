import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ENV } from '../../config/env';
import '../../config/firebase';
import axios from 'axios';
import { createApiRequest } from '../api/baseApi';
import { getCurrentlyViewedChannel, useNotification, emitUnreadMessage } from './notificationContext';
import { handleError, ErrorType } from '../../utils/errorHandling';
import i18n from '../../i18n';
import * as SecureStore from 'expo-secure-store';
import CryptoJS from 'crypto-js';

// Handler for notifications to be displayed
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * @function registerForPushNotificationsAsync
 * @description Register for push notifications
 * @returns {Promise<string>} The token of the device
 */
export const registerForPushNotificationsAsync = async () => {
  try {
    // We check the status of the permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // If the permission is not granted, we return null
    if (finalStatus !== 'granted') {
      console.log(i18n.t('notification.permissionDenied'));
      return null;
    }

    // We configure the Android channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    // We get the expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: ENV.EXPO_PROJECT_ID,
    });

    const token = tokenData.data;
    console.log('🔑 Token récupéré:', token);

    return token;
  } catch (error) {
    handleError(error, i18n.t('error.errorRegisteringPushNotifications'), {
      type: ErrorType.SYSTEM,
      silent: false
    });
    return null;
  }
};

/**
 * @function shouldDisplayNotification
 * @description Determine if a notification should be displayed based on business rules
 * @param {Object} messageData - The data of the received message
 * @param {String} currentChannelId - The ID of the currently viewed channel (optional, will use currentlyViewedChannel if not provided)
 * @param {Object} credentials - The user authentication information
 * @returns {Boolean} true if the notification should be displayed, false otherwise
 */
export const shouldDisplayNotification = async (messageData, currentChannelId = null, credentials = null) => {
  try {
    // We check if the user is connected
    const savedCredentials = await SecureStore.getItemAsync('savedLoginInfo');
    // If the user is not connected, we return false
    if (!savedCredentials) {
      console.log('🔒 Notification ignorée: utilisateur non connecté');
      return false;
    }

    // We check if the notification is a push notification
    const isPushNotification = !messageData.login && !messageData.isOwnMessage &&
      (messageData.title || messageData.body);

    if (isPushNotification) {
      // We get the channel ID from the notification
      let notificationChannelId = messageData.channelId;

      if (!notificationChannelId && messageData.body) {
        const body = messageData.body.toLowerCase();
        if (body.includes('channel') || body.includes('canal')) {
          const matches = body.match(/channel\s+(\w+)|canal\s+(\w+)/i);
          if (matches && (matches[1] || matches[2])) {
            notificationChannelId = matches[1] || matches[2];
          }
        }
      }

      const viewedChannelId = currentChannelId || getCurrentlyViewedChannel();

      // We only display the notification if the user is not already on the channel
      if (notificationChannelId && viewedChannelId) {
        const cleanNotifChannelId = notificationChannelId.toString().replace('channel_', '');
        const cleanViewedChannelId = viewedChannelId.toString().replace('channel_', '');

        if (cleanNotifChannelId === cleanViewedChannelId) {
          console.log('🔕 Notification ignorée: canal actuellement visualisé');
          return false;
        }

        // Émettre l'événement de message non lu
        emitUnreadMessage(cleanNotifChannelId);
      }

      return true;
    }

    // We check if the message is from the user himself
    const senderLogin = messageData.login;
    const isOwnMessageFlag = messageData.isOwnMessage === true;
    const isOwnMessageByLogin = senderLogin && credentials?.login === senderLogin;
    const isOwnMessageByUsername = messageData.username === 'Me' || messageData.username === 'Moi';

    if (isOwnMessageFlag || isOwnMessageByLogin || isOwnMessageByUsername) {
      return false;
    }

    // We check the active channel
    const messageChannelId = messageData.channelId ||
      (messageData.filters?.values?.channel) ||
      (messageData.notification?.filters?.values?.channel);

    const viewedChannelId = currentChannelId || getCurrentlyViewedChannel();

    if (messageChannelId && viewedChannelId) {
      const cleanMessageChannelId = messageChannelId.toString().replace('channel_', '');
      const cleanViewedChannelId = viewedChannelId.toString().replace('channel_', '');

      if (cleanMessageChannelId === cleanViewedChannelId) {
        return false;
      }
    }

    return true;
  } catch (error) {
    handleError(error, i18n.t('error.errorCheckingNotificationConditions'), {
      type: ErrorType.SYSTEM,
      silent: false
    });
    return true;
  }
};

/**
 * @function playNotificationSound
 * @description Play the notification sound if necessary
 * @param {Object} messageData - The data of the received message
 * @param {String} currentChannelId - The ID of the currently viewed channel (optional)
 * @param {Object} credentials - The user authentication information
 */
export const playNotificationSound = async (messageData, currentChannelId = null, credentials = null) => {
  try {
    const shouldDisplay = await shouldDisplayNotification(messageData, currentChannelId, credentials);

    if (shouldDisplay) {
      // The notification must be displayed, so we use the Notifications API to play the sound
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '', // Empty title for silent notification
          body: '',  // Empty body for silent notification
          sound: true,
          data: { silent: true } // Indication that this is a silent notification (just for the sound)
        },
        trigger: null, // Immediate trigger
      });
    }
  } catch (error) {
    handleError(error, i18n.t('error.errorPlayingNotificationSound'), {
      type: ErrorType.SYSTEM,
      silent: false
    });
  }
};

/**
 * @function synchronizeTokenWithAPI
 * @description Synchronizes the push notification token with the API
 * @param {string} token - The push notification token
 * @returns {Promise<boolean>} - Whether the synchronization was successful
 */
export const synchronizeTokenWithAPI = async (token) => {
  try {
    // We get the credentials
    const credentials = await SecureStore.getItemAsync('userCredentials');
    // If the credentials are not found, we return false
    if (!credentials) {
      return false;
    }

    const { contractNumber, accountApiKey, accessToken } = JSON.parse(credentials);

    // We create the timestamp and the data path
    const timestamp = Date.now();
    const data = `amaiia_msg_srv/notifications/synchronize/${timestamp}/`;

    // We generate the signature
    const hash = CryptoJS.HmacSHA256(data, contractNumber);
    const hashHex = hash.toString(CryptoJS.enc.Hex);

    // We build the request
    const requestBody = createApiRequest({
      "amaiia_msg_srv": {
        "notifications": {
          "synchronize": {
            "action": "add",
            "accountapikey": accountApiKey,
            "token": token,
            "deviceId": await getDeviceId()
          }
        }
      }
    }, contractNumber, accessToken);

    console.log('📤 [Notification] Envoi de la requête de synchronisation:', {
      contractNumber,
      accountApiKey,
      token,
      deviceId: await getDeviceId()
    });

    // We send the request
    const response = await axios({
      method: 'POST',
      url: await ENV.API_URL(),
      data: requestBody,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    console.log('📥 [Notification] Réponse reçue:', {
      status: response.status,
      data: response.data
    });

    return response.status === 200;
  } catch (error) {
    console.error('❌ [Notification] Erreur lors de la synchronisation du token:', error);
    return false;
  }
};

/**
 * @function getDeviceId
 * @description Generates a unique identifier for the device
 * @returns {Promise<string>} - The identifier of the device
 */
const getDeviceId = async () => {
  try {
    let deviceId = await SecureStore.getItemAsync('deviceId');
    if (!deviceId) {
      // Generate a unique ID if it does not exist
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await SecureStore.setItemAsync('deviceId', deviceId);
    }
    return deviceId;
  } catch (error) {
    console.error('❌ [Notification] Erreur lors de la génération de l\'ID appareil:', error);
    return `device_${Date.now()}`;
  }
};

/**
 * @function removeNotificationToken
 * @description Supprime le token de notification lors de la déconnexion
 * @returns {Promise<boolean>} - Si la suppression a réussi
 */
export const removeNotificationToken = async () => {
  try {
    // We get the credentials from all possible keys
    const possibleCredentialKeys = ['savedLoginInfo', 'userCredentials', 'credentials'];
    let credentials = null;
    let usedKey = null;

    for (const key of possibleCredentialKeys) {
      const savedCreds = await SecureStore.getItemAsync(key);
      if (savedCreds) {
        credentials = savedCreds;
        usedKey = key;
        console.log(`✅ Credentials trouvés avec la clé ${key}`);
        break;
      }
    }

    // If the credentials are not found, we return false
    if (!credentials) {
      console.log('❌ [Notification] Pas de credentials trouvés pour la suppression du token');
      return false;
    }

    // We get the current token
    let currentToken = null;
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: ENV.EXPO_PROJECT_ID,
      });
      currentToken = tokenData.data;
      console.log('✅ Token récupéré depuis Expo:', currentToken);
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du token depuis Expo:', error);
    }

    // If the token is not found via Expo, try the storage
    if (!currentToken) {
      const possibleTokenKeys = ['expoPushToken', 'pushToken', 'notificationToken'];
      console.log('🔍 Search for token in storage:', possibleTokenKeys);

      for (const key of possibleTokenKeys) {
        const token = await SecureStore.getItemAsync(key);
        if (token) {
          currentToken = token;
          break;
        }
      }
    }

    if (!currentToken) {
      console.log('❌ Aucun token trouvé');
      return false;
    }

    const deviceId = await getDeviceId();

    // Check and extract credentials
    let parsedCredentials;
    try {
      parsedCredentials = JSON.parse(credentials);
      console.log('✅ Credentials parsés:', {
        contractNumber: parsedCredentials.contractNumber,
        accountApiKey: parsedCredentials.accountApiKey,
        hasAccessToken: !!parsedCredentials.accessToken
      });
    } catch (error) {
      console.error('❌ Erreur lors du parsing des credentials:', error);
      return false;
    }

    if (!parsedCredentials.accountApiKey) {
      console.error('❌ Account API Key manquant dans les credentials');
      return false;
    }

    // We build the request
    const requestBody = createApiRequest({
      "amaiia_msg_srv": {
        "notifications": {
          "synchronize": {
            "action": "delete",
            "accountapikey": parsedCredentials.accountApiKey,
            "token": currentToken
          }
        }
      }
    }, parsedCredentials.contractNumber, parsedCredentials.accessToken);

    console.log('📤 [Notification] Envoi de la requête de suppression du token:', {
      hasToken: !!currentToken,
      accountApiKey: parsedCredentials.accountApiKey,
      token: currentToken
    });

    // We send the request
    const response = await axios({
      method: 'POST',
      url: await ENV.API_URL(),
      data: requestBody,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    // Check the detailed response
    const responseData = response.data;
    console.log('📥 [Notification] Detailed response:', {
      status: response.status,
      data: responseData,
      success: responseData?.cmd?.[0]?.amaiia_msg_srv?.notifications?.synchronize?.status === 'ok'
    });

    // We delete the stored token if it exists
    if (currentToken) {

      const possibleTokenKeys = ['expoPushToken', 'pushToken', 'notificationToken'];
      for (const key of possibleTokenKeys) {
        try {
          await SecureStore.deleteItemAsync(key);
          console.log(`✅ Token supprimé de la clé ${key}`);
        } catch (error) {
          console.log(`⚠️ Pas de token trouvé pour la clé ${key}`);
        }
      }
    }

    return response.status === 200 && responseData?.cmd?.[0]?.amaiia_msg_srv?.notifications?.synchronize?.status === 'ok';
  } catch (error) {
    console.error('❌ [Notification] Erreur lors de la suppression du token:', error);
    return false;
  }
};