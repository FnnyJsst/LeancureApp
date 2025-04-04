import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { ENV } from '../config/env';
import * as SecureStore from 'expo-secure-store';
import '../config/firebase';
import axios from 'axios';
import { createApiRequest } from '../services/api/baseApi';

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
      console.log('🔔 Demande de permission pour les notifications...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('🔔 Nouveau statut des permissions:', status);
    }

    // If the permission is not granted, we return null
    if (finalStatus !== 'granted') {
      console.log('❌ Permission refusée pour les notifications push');
      return null;
    }

    // We configure the Android channel
    if (Platform.OS === 'android') {
      console.log('🔔 Configuration du canal Android...');
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    // We get the token
    console.log('🔔 Récupération du token push...');
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

// /**
//  * @function scheduleNotification
//  * @description Schedule a notification to be displayed locally
//  * @param {string} title - The title of the notification
//  * @param {string} body - The body of the notification
//  * @param {object} data - The data of the notification
//  */
// export const scheduleNotification = async (title, body, data = {}) => {
//   try {
//     await Notifications.scheduleNotificationAsync({
//       content: {
//         title,
//         body,
//         data: { ...data, timestamp: new Date().toISOString() },
//         sound: true,
//       },
//       trigger: null, // Notification immédiate
//     });
//     console.log('Notification locale envoyée avec succès');
//   } catch (error) {
//     console.error('Erreur lors de l\'envoi de la notification locale:', error);
//   }
// };

// export const handleNotificationReceived = (notification) => {
//   console.log('Notification reçue:', notification);
//   // You can add here the logic to handle the received notification
// };

// export const handleNotificationResponse = (response) => {
//   console.log('Réponse à la notification:', response);
//   // You can add here the logic to handle the notification response
// };

/**
 * @function synchronizeTokenWithAPI
 * @description Synchronize the token with the API
 * @param {string} token - The token to synchronize
 * @returns {Promise<boolean>} True if the token is synchronized, false otherwise
 */
export const synchronizeTokenWithAPI = async (token) => {
  try {
    console.log('🔔 Token à synchroniser:', token);

    // We get the credentials
    const credentialsStr = await SecureStore.getItemAsync('userCredentials');

    if (!credentialsStr) {
      return false;
    }

    const credentials = JSON.parse(credentialsStr);

    // We create the request
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

    // We send the request
    console.log('🔔 Envoi de la requête de synchronisation...');
    const response = await axios.post(await ENV.API_URL(), body, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    // console.log('🔔 Réponse de l\'API:', {
    //   status: response.status,
    //   statusText: response.statusText,
    //   data: response.data
    // });

    if (response.status === 200) {
      console.log('✅ Token synchronisé avec succès');
      return true;
    } else {
      console.log('❌ Erreur de synchronisation:', response.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur détaillée lors de la synchronisation du token:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    });
    return false;
  }
};