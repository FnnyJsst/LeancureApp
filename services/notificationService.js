import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { ENV } from '../config/env';
import '../config/firebase';
import axios from 'axios';
import { createApiRequest } from '../services/api/baseApi';
import { getCurrentlyViewedChannel } from './notificationContext';

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

    if (!Device.isDevice) {
      return null;
    }

    // We check the status of the permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // If the permission is not granted, we return null
    if (finalStatus !== 'granted') {
      console.log('❌ Permission refusée pour les notifications push');
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

    // We get the token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: ENV.EXPO_PROJECT_ID,
    });

    const token = tokenData.data;
    console.log('✅ Token push récupéré :', token);

    return token;
  } catch (error) {
    console.error('❌ Erreur lors de l\'enregistrement des notifications:', error);
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
    // // If there is no message data, we display the default notification
    // if (!messageData) {
    //   console.log('⚠️ Message data manquant, notification par défaut autorisée');
    //   return true;
    // }

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

      if (notificationChannelId && viewedChannelId) {
        const cleanNotifChannelId = notificationChannelId.toString().replace('channel_', '');
        const cleanViewedChannelId = viewedChannelId.toString().replace('channel_', '');

        if (cleanNotifChannelId === cleanViewedChannelId) {
          return false;
        }
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
    console.error('❌ Erreur lors de la vérification des conditions de notification:', error);
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
    console.error('❌ Error when playing the notification sound:', error);
  }
};

/**
 * @function synchronizeTokenWithAPI
 * @description Synchronize the token with the API
 */
export const synchronizeTokenWithAPI = async (token, credentials) => {
  try {

    if (!credentials) {
      return;
    }

    const body = createApiRequest({
      'amaiia_msg_srv': {
        'notifications': {
          'synchronize': {
            'action': 'add',
            'accountapikey': credentials.accountApiKey,
            'token': token
          }
        }
      }
    }, credentials.contractNumber, credentials.accessToken);

    const response = await axios.post(await ENV.API_URL(), body, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.status === 200) {
      console.log('✅ Token synchronisé avec succès');
      return true;
    }

    console.log('❌ Erreur de synchronisation:', response.statusText);
    return false;

  } catch (error) {
    console.error('❌ Erreur détaillée lors de la synchronisation du token:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
    });
    return false;
  }
};