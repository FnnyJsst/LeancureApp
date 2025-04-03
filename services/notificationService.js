import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { ENV } from '../config/env';
import * as SecureStore from 'expo-secure-store';
import '../config/firebase'; // Le chemin est correct ici car le fichier est dans services/
import CryptoJS from 'crypto-js';
import axios from 'axios';
import { createApiRequest } from '../services/api/baseApi';

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
    console.log('🔔 Statut actuel des permissions:', existingStatus);

    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      console.log('🔔 Demande de permission pour les notifications...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('🔔 Nouveau statut des permissions:', status);
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
    console.log('✅ Token push récupéré :', token);

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

export const synchronizeTokenWithAPI = async (token) => {
  try {
    console.log('🔔 Début de la synchronisation du token...');
    console.log('🔔 Token à synchroniser:', token);

    // Récupération des credentials
    const credentialsStr = await SecureStore.getItemAsync('userCredentials');
    console.log('🔔 Credentials trouvés:', !!credentialsStr);

    if (!credentialsStr) {
      console.log('❌ Pas de credentials trouvés dans le SecureStore');
      return false;
    }

    const credentials = JSON.parse(credentialsStr);
    console.log('✅ Informations utilisateur récupérées:', {
      contractNumber: credentials.contractNumber,
      hasAccessToken: !!credentials.accessToken,
      hasAccountApiKey: !!credentials.accountApiKey
    });

    // Construction de la requête
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

    console.log('🔔 URL de l\'API:', await ENV.API_URL());
    console.log('🔔 Corps de la requête:', JSON.stringify(body, null, 2));

    // Envoi de la requête
    console.log('🔔 Envoi de la requête de synchronisation...');
    const response = await axios.post(await ENV.API_URL(), body, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('🔔 Réponse de l\'API:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });

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