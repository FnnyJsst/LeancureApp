import * as Notifications from 'expo-notifications';
import { Platform, AppState } from 'react-native';
import { ENV } from '../../config/env';
import '../../config/firebase';
import axios from 'axios';
import { createApiRequest } from '../api/baseApi';
import { getCurrentlyViewedChannel, emitUnreadMessage } from './notificationContext';
import { handleError, ErrorType } from '../../utils/errorHandling';
import i18n from '../../i18n';
import * as SecureStore from 'expo-secure-store';

// Handler for notifications to be displayed
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    try {
      console.log('🔔 [NotificationService] Réception d\'une notification:', {
        title: notification.request.content.title,
        body: notification.request.content.body,
        data: notification.request.content.data
      });

      // We check if the user is connected
      const savedCredentials = await SecureStore.getItemAsync('userCredentials');
      // If the user is not connected, we don't display the notification
      if (!savedCredentials) {
        return {
          shouldShowAlert: false,
          shouldPlaySound: false,
          shouldSetBadge: false,
        };
      }

      // Extract the notification data
      const notificationData = {
        title: notification.request.content.title,
        body: notification.request.content.body,
        data: notification.request.content.data || {}
      };

      // Case 1: Detection of new message notifications
      // If the notification has a title "New message" and contains "channel" in the body
      if (notificationData.title === "New message" &&
          notificationData.body &&
          notificationData.body.includes("channel")) {

        // We check if the user is currently on the channel
        try {
          // We extract the channel name from the notification
          const channelMatch = notificationData.body.match(/channel\s+(.+)$/i);
          const channelName = channelMatch ? channelMatch[1] : null;

          if (channelName) {
            // Get the name of the currently displayed channel
            const viewedChannelName = await SecureStore.getItemAsync('viewedChannelName');

            // If the channel name is the same as the currently displayed channel, we block the notification
            if (viewedChannelName && channelName.includes(viewedChannelName)) {
              return {
                shouldShowAlert: false,
                shouldPlaySound: false,
                shouldSetBadge: false,
              };
            }

            // Get the channel ID from the notification data
            const channelId = notificationData.data.channelId;

            if (channelId) {
              // Emit the unread message event
              if (typeof global !== 'undefined' && global.unreadMessageEmitter) {
                global.unreadMessageEmitter.emit(channelId);
              }
            } else {
              // Try to get the channel ID from the global channels
              if (typeof global !== 'undefined' && global.channels) {
                const channel = global.channels.find(c => c.title === channelName);

                if (channel) {
                  // Emit the unread message event
                  if (typeof global !== 'undefined' && global.unreadMessageEmitter) {
                    global.unreadMessageEmitter.emit(channel.id);
                  }
                } else {
                  console.log('❌ [NotificationService] Canal non trouvé dans la liste des canaux');
                }
              } else {
                console.log('❌ [NotificationService] Liste des canaux non disponible');
              }
            }
          }
        } catch (error) {
          console.error('❌ [NotificationService] Erreur lors de la vérification du canal:', error);
        }
      }

      // In all other cases, we display the notification
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      };
    } catch (error) {
      console.error('❌ [NotificationService] Erreur dans le gestionnaire global de notification:', error);
      // In case of error, we display the default notification
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      };
    }
  },
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
    const savedCredentials = await SecureStore.getItemAsync('userCredentials');
    // If the user is not connected, we return false
    if (!savedCredentials) {
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

      // Vérification des doublons
      const timestamp = messageData.data?.timestamp || Date.now();

      const viewedChannelId = currentChannelId || getCurrentlyViewedChannel();

      // We only display the notification if the user is not already on the channel
      if (notificationChannelId && viewedChannelId) {
        const cleanNotifChannelId = notificationChannelId.toString().replace('channel_', '');
        const cleanViewedChannelId = viewedChannelId.toString().replace('channel_', '');

        if (cleanNotifChannelId === cleanViewedChannelId) {
          return false;
        }

        // We emit the unread message event
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
    console.error('❌ [NotificationService] Erreur lors de la vérification des conditions:', error);
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
      console.log('❌ [NotificationService] Synchronisation échouée: pas de credentials');
      return false;
    }

    const { contractNumber, accountApiKey, accessToken } = JSON.parse(credentials);

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

    console.log('📤 [NotificationService] Envoi de la requête de synchronisation:', {
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

    const success = response.status === 200;
    console.log(success ? '✅ [NotificationService] Synchronisation réussie' : '❌ [NotificationService] Synchronisation échouée');
    return success;
  } catch (error) {
    console.error('❌ [NotificationService] Erreur lors de la synchronisation:', error);
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
 * @description Removes the notification token when logging out
 * @returns {Promise<boolean>} - Whether the removal was successful
 */
export const removeNotificationToken = async () => {
  try {

    // We get the credentials
    const credentials = await SecureStore.getItemAsync('userCredentials');
    if (!credentials) {
      console.log('❌ [NotificationService] Pas de credentials trouvés');
      return false;
    }

    // Parse credentials
    let parsedCredentials;
    try {
      parsedCredentials = JSON.parse(credentials);
    } catch (error) {
      console.error('❌ [NotificationService] Erreur lors du parsing des credentials:', error);
      return false;
    }

    // Vérification des champs requis
    if (!parsedCredentials.accountApiKey || !parsedCredentials.contractNumber || !parsedCredentials.accessToken) {
      console.error('❌ [NotificationService] Credentials incomplets:', {
        hasAccountApiKey: !!parsedCredentials.accountApiKey,
        hasContractNumber: !!parsedCredentials.contractNumber,
        hasAccessToken: !!parsedCredentials.accessToken
      });
      return false;
    }

    // We get the current token
    let currentToken = null;
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: ENV.EXPO_PROJECT_ID,
      });
      currentToken = tokenData.data;
      console.log('✅ [NotificationService] Token récupéré:', currentToken);
    } catch (error) {
      console.error('❌ [NotificationService] Erreur lors de la récupération du token:', error);
      return false;
    }

    if (!currentToken) {
      console.log('❌ [NotificationService] Aucun token trouvé');
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
    // We delete the stored token if it exists
    if (currentToken) {
      const possibleTokenKeys = ['expoPushToken', 'pushToken', 'notificationToken'];
      for (const key of possibleTokenKeys) {
        try {
          await SecureStore.deleteItemAsync(key);
          console.log(`✅ [NotificationService] Token supprimé de la clé ${key}`);
        } catch (error) {
          console.log(`⚠️ [NotificationService] Pas de token trouvé pour la clé ${key}`);
        }
      }
    }

    const success = response.status === 200 && responseData?.cmd?.[0]?.amaiia_msg_srv?.notifications?.synchronize?.status === 'ok';
    console.log(success ? '✅ [NotificationService] Suppression réussie' : '❌ [NotificationService] Suppression échouée');
    return success;
  } catch (error) {
    console.error('❌ [NotificationService] Erreur lors de la suppression du token:', error);
    return false;
  }
};

/**
 * @function checkConnectionStatus
 * @description Vérifie si l'utilisateur est toujours connecté
 * @returns {Promise<boolean>} true si l'utilisateur est connecté, false sinon
 */
const checkConnectionStatus = async () => {
  try {
    const credentials = await SecureStore.getItemAsync('userCredentials');
    if (!credentials) {
      return false;
    }

    const { accessToken, contractNumber, accountApiKey } = JSON.parse(credentials);
    if (!accessToken || !contractNumber || !accountApiKey) {
      return false;
    }

    // Vérification de la validité du token
    try {
      const response = await axios({
        method: 'POST',
        url: await ENV.API_URL(),
        data: createApiRequest({
          "amaiia_msg_srv": {
            "auth": {
              "check": {}
            }
          }
        }, contractNumber, accessToken),
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });

      const isValid = response.status === 200 && response.data?.cmd?.[0]?.amaiia_msg_srv?.auth?.check?.status === 'ok';

      return isValid;
    } catch (error) {
      console.error('❌ [NotificationService] Erreur lors de la vérification de la connexion:', error);
      return false;
    }
  } catch (error) {
    console.error('❌ [NotificationService] Erreur lors de la vérification des credentials:', error);
    return false;
  }
};

/**
 * @function setupConnectionMonitor
 * @description Configure the connection monitoring
 */
export const setupConnectionMonitor = () => {
  let checkInterval = null;
  let lastAppState = AppState.currentState;

  // Function to check the connection and delete the token if necessary
  const checkAndHandleDisconnection = async () => {
    const isConnected = await checkConnectionStatus();
    if (!isConnected) {
      console.log('🔒 [NotificationService] Déconnexion détectée, suppression du token');
      await removeNotificationToken();
    }
  };

  checkAndHandleDisconnection();

  // Configuration of the check interval (every 5 minutes)
  checkInterval = setInterval(checkAndHandleDisconnection, 5 * 60 * 1000);

  // Monitoring of the app state change
  const subscription = AppState.addEventListener('change', async (nextAppState) => {
    if (lastAppState.match(/inactive|background/) && nextAppState === 'active') {
      await checkAndHandleDisconnection();
    }
    lastAppState = nextAppState;
  });

  // Cleaning function
  return () => {
    if (checkInterval) {
      clearInterval(checkInterval);
    }
    subscription.remove();
  };
};