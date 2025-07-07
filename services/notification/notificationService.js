import * as Notifications from 'expo-notifications';
import { Platform, AppState } from 'react-native';
import { ENV } from '../../config/env';
import '../../config/firebase';
import axios from 'axios';
import { createApiRequest } from '../api/baseApi';
import { getCurrentlyViewedChannel, emitUnreadMessage } from './notificationContext';
import * as SecureStore from 'expo-secure-store';

// Handler for notifications to be displayed
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    try {
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
                }
              }
            }
          }
        } catch (error) {
          console.error('[Notification] Error checking channel:', error);
        }
      }

      // In all other cases, we display the notification
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      };
    } catch (error) {
      console.error('[Notification] Error in notification handler:', error);
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
      console.error('[Notification] Permission denied');
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

    return token;
  } catch (error) {
    console.error('[Notification] Registration failed:', error);
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
    console.error('[Notification] Error checking notification conditions:', error);
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
    console.error('[Notification] Error playing notification sound:', error);
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
      console.error('[Notification] No credentials found for token synchronization');
      return false;
    }

    const { contractNumber, accountApiKey, accessToken } = JSON.parse(credentials);

    // We build the request
    const requestBody = await createApiRequest({
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

    const success = response.status === 200 && response.data?.cmd?.[0]?.amaiia_msg_srv?.notifications?.synchronize?.status === 'ok';
    return success;
  } catch (error) {
    console.error('[Notification] Token synchronization failed:', error);
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
    console.error('[Notification] Error generating device ID:', error);
    return `fallback_device_${Date.now()}`;
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
      console.error('[Notification] No credentials found for token deletion');
      return false;
    }

    // Parse credentials
    let parsedCredentials;
    try {
      parsedCredentials = JSON.parse(credentials);
      console.log('[Notification] Credentials parsed successfully:', {
        hasAccountApiKey: !!parsedCredentials.accountApiKey,
        hasContractNumber: !!parsedCredentials.contractNumber,
        hasAccessToken: !!parsedCredentials.accessToken
      });
    } catch (error) {
      console.error('[Notification] Error parsing credentials:', error);
      return false;
    }

    // Required fields verification
    if (!parsedCredentials.accountApiKey || !parsedCredentials.contractNumber || !parsedCredentials.accessToken) {
      console.error('[Notification] Invalid credentials for token deletion:', {
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
      console.log('[Notification] Token retrieved successfully:', currentToken?.substring(0, 10) + '...');
    } catch (error) {
      console.error('[Notification] Error retrieving token:', error);
    }

    if (!currentToken) {
      console.error('[Notification] No token found for deletion');
      return false;
    }

    // We build the request
    const requestBody = await createApiRequest({
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

    // Local deletion
    const possibleTokenKeys = ['expoPushToken', 'pushToken', 'notificationToken'];
    for (const key of possibleTokenKeys) {
      try {
        await SecureStore.deleteItemAsync(key);
        console.log('[Notification] Token local deleted:', key);
      } catch (error) {
        console.error('[Notification] Error deleting local token:', { key, error });
      }
    }

    const success = response.status === 200 && response.data?.cmd?.[0]?.amaiia_msg_srv?.notifications?.synchronize?.status === 'ok';
    return success;
  } catch (error) {
    console.error('[Notification] Error deleting token:', error);
    return false;
  }
};

/**
 * @function checkConnectionStatus
 * @description Check if the user is still connected
 * @returns {Promise<boolean>} true if the user is connected, false otherwise
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

    return true;
  } catch (error) {
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