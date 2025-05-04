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
        console.log('🔒 [NotificationService] Notification ignorée: utilisateur non connecté');
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

      console.log('📝 [NotificationService] Données de notification extraites:', notificationData);

      // Case 1: Detection of new message notifications
      // If the notification has a title "New message" and contains "channel" in the body
      if (notificationData.title === "New message" &&
          notificationData.body &&
          notificationData.body.includes("channel")) {

        console.log('📨 [NotificationService] Notification de nouveau message détectée');

        // We check if the user is currently on the channel
        try {
          // We extract the channel name from the notification
          const channelMatch = notificationData.body.match(/channel\s+(.+)$/i);
          const channelName = channelMatch ? channelMatch[1] : null;

          console.log('🔍 [NotificationService] Extraction du nom du canal:', {
            channelMatch,
            channelName
          });

          if (channelName) {
            // Get the name of the currently displayed channel
            const viewedChannelName = await SecureStore.getItemAsync('viewedChannelName');
            console.log('👁️ [NotificationService] Canal actuellement visualisé:', {
              viewedChannelName,
              notificationChannelName: channelName
            });

            // If the channel name is the same as the currently displayed channel, we block the notification
            if (viewedChannelName && channelName.includes(viewedChannelName)) {
              console.log('🔕 [NotificationService] Notification ignorée: canal actuellement visualisé');
              return {
                shouldShowAlert: false,
                shouldPlaySound: false,
                shouldSetBadge: false,
              };
            }

            // Get the channel ID from the notification data
            const channelId = notificationData.data.channelId;
            console.log('🆔 [NotificationService] ID du canal:', {
              fromData: channelId,
              hasGlobalChannels: typeof global !== 'undefined' && !!global.channels
            });

            if (channelId) {
              // Emit the unread message event
              if (typeof global !== 'undefined' && global.unreadMessageEmitter) {
                console.log('🔔 [NotificationService] Émission d\'un message non lu via ID:', channelId);
                global.unreadMessageEmitter.emit(channelId);
              }
            } else {
              // Try to get the channel ID from the global channels
              if (typeof global !== 'undefined' && global.channels) {
                const channel = global.channels.find(c => c.title === channelName);
                console.log('🔍 [NotificationService] Recherche du canal dans la liste globale:', {
                  found: !!channel,
                  channelTitle: channel?.title
                });

                if (channel) {
                  // Emit the unread message event
                  if (typeof global !== 'undefined' && global.unreadMessageEmitter) {
                    console.log('🔔 [NotificationService] Émission d\'un message non lu via titre:', channel.id);
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

      console.log('✅ [NotificationService] Notification à afficher');
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
    console.log('🔍 [NotificationService] Vérification des conditions d\'affichage:', {
      messageData,
      currentChannelId,
      hasCredentials: !!credentials
    });

    // We check if the user is connected
    const savedCredentials = await SecureStore.getItemAsync('savedLoginInfo');
    // If the user is not connected, we return false
    if (!savedCredentials) {
      console.log('🔒 [NotificationService] Notification ignorée: utilisateur non connecté');
      return false;
    }

    // We check if the notification is a push notification
    const isPushNotification = !messageData.login && !messageData.isOwnMessage &&
      (messageData.title || messageData.body);

    console.log('📱 [NotificationService] Type de notification:', {
      isPushNotification,
      hasTitle: !!messageData.title,
      hasBody: !!messageData.body
    });

    if (isPushNotification) {
      // We get the channel ID from the notification
      let notificationChannelId = messageData.channelId;

      if (!notificationChannelId && messageData.body) {
        const body = messageData.body.toLowerCase();
        if (body.includes('channel') || body.includes('canal')) {
          const matches = body.match(/channel\s+(\w+)|canal\s+(\w+)/i);
          if (matches && (matches[1] || matches[2])) {
            notificationChannelId = matches[1] || matches[2];
            console.log('🔍 [NotificationService] Canal extrait du corps:', notificationChannelId);
          }
        }
      }

      const viewedChannelId = currentChannelId || getCurrentlyViewedChannel();
      console.log('👁️ [NotificationService] Canaux:', {
        notificationChannelId,
        viewedChannelId
      });

      // We only display the notification if the user is not already on the channel
      if (notificationChannelId && viewedChannelId) {
        const cleanNotifChannelId = notificationChannelId.toString().replace('channel_', '');
        const cleanViewedChannelId = viewedChannelId.toString().replace('channel_', '');

        console.log('🔄 [NotificationService] Comparaison des canaux:', {
          cleanNotifChannelId,
          cleanViewedChannelId,
          areEqual: cleanNotifChannelId === cleanViewedChannelId
        });

        if (cleanNotifChannelId === cleanViewedChannelId) {
          console.log('🔕 [NotificationService] Notification ignorée: canal actuellement visualisé');
          return false;
        }

        // We emit the unread message event
        console.log('🔔 [NotificationService] Émission d\'un message non lu:', cleanNotifChannelId);
        emitUnreadMessage(cleanNotifChannelId);
      }

      return true;
    }

    // We check if the message is from the user himself
    const senderLogin = messageData.login;
    const isOwnMessageFlag = messageData.isOwnMessage === true;
    const isOwnMessageByLogin = senderLogin && credentials?.login === senderLogin;
    const isOwnMessageByUsername = messageData.username === 'Me' || messageData.username === 'Moi';

    console.log('👤 [NotificationService] Vérification de l\'expéditeur:', {
      senderLogin,
      isOwnMessageFlag,
      isOwnMessageByLogin,
      isOwnMessageByUsername
    });

    if (isOwnMessageFlag || isOwnMessageByLogin || isOwnMessageByUsername) {
      console.log('🔕 [NotificationService] Notification ignorée: message de l\'utilisateur');
      return false;
    }

    // We check the active channel
    const messageChannelId = messageData.channelId ||
      (messageData.filters?.values?.channel) ||
      (messageData.notification?.filters?.values?.channel);

    const viewedChannelId = currentChannelId || getCurrentlyViewedChannel();

    console.log('📺 [NotificationService] Vérification du canal actif:', {
      messageChannelId,
      viewedChannelId
    });

    if (messageChannelId && viewedChannelId) {
      const cleanMessageChannelId = messageChannelId.toString().replace('channel_', '');
      const cleanViewedChannelId = viewedChannelId.toString().replace('channel_', '');

      console.log('🔄 [NotificationService] Comparaison finale des canaux:', {
        cleanMessageChannelId,
        cleanViewedChannelId,
        areEqual: cleanMessageChannelId === cleanViewedChannelId
      });

      if (cleanMessageChannelId === cleanViewedChannelId) {
        console.log('🔕 [NotificationService] Notification ignorée: canal actif');
        return false;
      }
    }

    console.log('✅ [NotificationService] Notification à afficher');
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
    console.log('🔊 [NotificationService] Tentative de lecture du son:', {
      hasMessageData: !!messageData,
      currentChannelId
    });

    const shouldDisplay = await shouldDisplayNotification(messageData, currentChannelId, credentials);

    if (shouldDisplay) {
      console.log('🎵 [NotificationService] Lecture du son de notification');
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
      console.log('✅ [NotificationService] Son de notification joué avec succès');
    } else {
      console.log('🔕 [NotificationService] Son de notification ignoré');
    }
  } catch (error) {
    console.error('❌ [NotificationService] Erreur lors de la lecture du son:', error);
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
    console.log('🔄 [NotificationService] Début de la synchronisation du token');

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

    console.log('📥 [NotificationService] Réponse reçue:', {
      status: response.status,
      data: response.data
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
    // We get the credentials from all possible keys
    const possibleCredentialKeys = ['savedLoginInfo', 'userCredentials', 'credentials'];
    let credentials = null;
    let usedKey = null;

    for (const key of possibleCredentialKeys) {
      const savedCreds = await SecureStore.getItemAsync(key);
      if (savedCreds) {
        credentials = savedCreds;
        usedKey = key;
        break;
      }
    }

    // If the credentials are not found, we return false
    if (!credentials) {
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

    console.log('📤 [Notification] Envoi de la requête de suppression du token:');

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