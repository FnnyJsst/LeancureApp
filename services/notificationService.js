import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { ENV } from '../config/env';
import * as SecureStore from 'expo-secure-store';
import '../config/firebase'; // Import de la configuration Firebase

// Notifications handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * @description Register for push notifications
 * @returns {Promise<string>} The token of the device
 */
export const registerForPushNotificationsAsync = async () => {
  try {
    let token;

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Permission refusée pour les notifications push');
        return null;
      }

      // Gestion de la promesse avec try/catch
      try {
        // Configuration du canal de notification pour Android
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
          });
        }

        token = (await Notifications.getExpoPushTokenAsync({
          projectId: ENV.EXPO_PROJECT_ID,
        })).data;

        // Stockage du token
        await SecureStore.setItemAsync('pushToken', token);
        console.log('Token de notification enregistré:', token);
        return token;
      } catch (tokenError) {
        console.error('Erreur lors de la récupération du token:', tokenError);
        return null;
      }
    } else {
      console.log('Les notifications push ne sont pas supportées sur les émulateurs');
      return null;
    }
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des notifications:', error);
    return null;
  }
};


export const scheduleNotification = async (title, body, data = {}) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null, // Immediate notification
  });
};

export const handleNotificationReceived = (notification) => {
  console.log('Notification reçue:', notification);
  // You can add here the logic to handle the received notification
};

export const handleNotificationResponse = (response) => {
  console.log('Réponse à la notification:', response);
  // You can add here the logic to handle the notification response
};