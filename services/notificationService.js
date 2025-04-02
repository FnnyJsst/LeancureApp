import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { ENV } from '../config/env';
import * as SecureStore from 'expo-secure-store';
import '../config/firebase'; // Le chemin est correct ici car le fichier est dans services/

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
    console.log('🔔 Début de l\'enregistrement des notifications...');

    if (!Device.isDevice) {
      console.log('⚠️ Les notifications ne sont pas supportées sur les émulateurs');
      return null;
    }

    // Vérification des permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      console.log('🔔 Demande de permission pour les notifications...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('❌ Permission refusée pour les notifications push');
      return null;
    }

    // Configuration du canal Android
    if (Platform.OS === 'android') {
      console.log('🔔 Configuration du canal Android...');
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    // Récupération du token
    console.log('🔔 Récupération du token push...');
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: ENV.EXPO_PROJECT_ID,
    });

    const token = tokenData.data;
    console.log('✅ Token push récupéré:', token);

    // Stockage du token
    await SecureStore.setItemAsync('pushToken', token);
    console.log('✅ Token enregistré dans le SecureStore');

    return token;
  } catch (error) {
    console.error('❌ Erreur lors de l\'enregistrement des notifications:', error);
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