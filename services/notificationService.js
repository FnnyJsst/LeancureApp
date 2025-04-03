import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { ENV } from '../config/env';
import * as SecureStore from 'expo-secure-store';
import '../config/firebase'; // Le chemin est correct ici car le fichier est dans services/
import CryptoJS from 'crypto-js';

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

    // Récupérer les informations de l'utilisateur depuis SecureStore
    const credentials = await SecureStore.getItemAsync('userCredentials');
    if (!credentials) {
      console.log('❌ Aucune information d\'utilisateur trouvée dans SecureStore');
      return false;
    }

    const { contractNumber, accountApiKey, accessToken } = JSON.parse(credentials);
    console.log('✅ Informations utilisateur récupérées:', {
      contractNumber: contractNumber ? '***' : null,
      hasAccountApiKey: !!accountApiKey,
      hasAccessToken: !!accessToken
    });

    const timestamp = Date.now();
    const data = `amaiia_msg_srv/notifications/synchronize/${timestamp}/`;
    const hash = CryptoJS.HmacSHA256(data, contractNumber);
    const hashHex = hash.toString(CryptoJS.enc.Hex);

    const body = {
      "api-version": "2",
      "api-contract-number": contractNumber,
      "api-signature": hashHex,
      "api-signature-hash": "sha256",
      "api-signature-timestamp": timestamp,
      "client-type": "mobile",
      "client-login": "admin",
      "client-token": accessToken,
      "cmd": [
        {
          "amaiia_msg_srv": {
            "notifications": {
              "synchronize": {
                "action": "add",
                "accountapikey": accountApiKey,
                "token": token
              }
            }
          }
        }
      ]
    };

    console.log('🔔 Envoi de la requête de synchronisation...');
    const response = await fetch(ENV.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('❌ Erreur lors de la synchronisation:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log('✅ Token synchronisé avec succès:', {
      status: response.status,
      hasResponseData: !!responseData
    });

    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation du token:', error);
    return false;
  }
};