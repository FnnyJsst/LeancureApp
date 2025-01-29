import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

/**
 * @function setNotificationHandler
 * @description Sets the notification handler
 * @returns {void}
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * @function registerForPushNotificationsAsync
 * @description Registers for push notifications
 * @returns {Promise<string>} - The token
 */
export async function registerForPushNotificationsAsync() {
  let token;

  // Check if the device is a real device
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    // If the permission is not granted, request it
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    // If the permission is not granted, return
    if (finalStatus !== 'granted') {
      console.log('Permission refused for notifications');
      return;
    }

    // Get the token to send notifications
    token = (await Notifications.getExpoPushTokenAsync()).data;
  }

  return token;
}

  /**
 * @function sendNotification
 * @description Sends a local notification
 * @param {Object} props - The properties of the notification
 * @returns {void}
 */
export async function sendNotification({ title, body, data = {} }) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: 'default',
    },
    trigger: null, // Immediate notification
  });
} 