import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { ENV } from '../config/env';
import * as SecureStore from 'expo-secure-store';
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

/**
 * @function shouldDisplayNotification
 * @description Détermine si une notification doit être affichée en fonction des règles métier
 * @param {Object} messageData - Les données du message reçu
 * @param {String} currentChannelId - L'ID du canal actuellement visualisé (facultatif, utilisera currentlyViewedChannel si non fourni)
 * @param {Object} credentials - Les informations d'authentification de l'utilisateur
 * @returns {Boolean} true si la notification doit être affichée, false sinon
 */
export const shouldDisplayNotification = async (messageData, currentChannelId = null, credentials = null) => {
  try {
    // Si pas de données de message, on affiche la notification par défaut
    if (!messageData) {
      console.log('⚠️ Message data manquant, notification autorisée par défaut');
      return true;
    }

    // Si nous examinons une notification push générée par le serveur, on la traite différemment
    const isPushNotification = !messageData.login && !messageData.isOwnMessage &&
                               (messageData.title || messageData.body);

    if (isPushNotification) {
      console.log('🔔 Analyse d\'une notification push:', JSON.stringify(messageData));

      // Récupérer les credentials si nécessaire pour la comparaison
      if (!credentials) {
        try {
          const credentialsStr = await SecureStore.getItemAsync('userCredentials');
          if (credentialsStr) {
            credentials = JSON.parse(credentialsStr);
            console.log('🔐 Credentials récupérés pour notification push:', credentials.login);
          }
        } catch (error) {
          console.log('⚠️ Impossible de récupérer les credentials:', error);
        }
      }

      // Règle 2: Vérifier si l'utilisateur est déjà sur le canal mentionné dans la notification
      // Extraire le canal de la notification s'il est mentionné dans le corps
      let notificationChannelId = messageData.channelId;

      if (!notificationChannelId && messageData.body) {
        // Chercher des mots clés qui pourraient indiquer un canal
        const body = messageData.body.toLowerCase();
        if (body.includes('channel') || body.includes('canal')) {
          // Essayer d'extraire le nom du canal
          const matches = body.match(/channel\s+(\w+)|canal\s+(\w+)/i);
          if (matches && (matches[1] || matches[2])) {
            notificationChannelId = matches[1] || matches[2];
            console.log('🔍 Canal extrait du corps de la notification:', notificationChannelId);
          }
        }
      }

      // Utiliser le canal fourni ou obtenir depuis le contexte
      const viewedChannelId = currentChannelId || getCurrentlyViewedChannel();

      console.log('🔍 Vérification de canal (push):', {
        notificationChannelId,
        viewedChannelId,
        currentGlobalChannel: getCurrentlyViewedChannel()
      });

      if (notificationChannelId && viewedChannelId) {
        // Nettoyage et comparaison des ID de canal
        const cleanNotifChannelId = notificationChannelId.toString().replace('channel_', '');
        const cleanViewedChannelId = viewedChannelId.toString().replace('channel_', '');

        if (cleanNotifChannelId === cleanViewedChannelId) {
          console.log('🔕 Notification push supprimée: canal déjà visualisé');
          return false;
        }
      }

      // Dans les autres cas, autoriser la notification push
      return true;
    }

    console.log('🔍 Analyse message pour notification:',
      JSON.stringify({
        id: messageData.id,
        login: messageData.login,
        isOwnMessage: messageData.isOwnMessage,
        channelId: messageData.channelId ||
                  messageData.filters?.values?.channel ||
                  messageData.notification?.filters?.values?.channel
      })
    );

    // Si les credentials ne sont pas fournis, on essaie de les récupérer
    let userCredentials = credentials;

    if (!userCredentials) {
      // Récupération des credentials depuis le stockage sécurisé
      const credentialsStr = await SecureStore.getItemAsync('userCredentials');
      if (credentialsStr) {
        userCredentials = JSON.parse(credentialsStr);
        console.log('🔐 Credentials récupérés:', userCredentials.login);
      } else {
        // Si pas de credentials, on affiche la notification par défaut
        console.log('⚠️ Credentials manquants, notification autorisée par défaut');
        return true;
      }
    }

    // Règle 1: Ne pas afficher la notification si le message provient de l'utilisateur lui-même
    // Vérifier de plusieurs manières pour être certain
    const senderLogin = messageData.login;
    const isOwnMessageFlag = messageData.isOwnMessage === true;
    const isOwnMessageByLogin = senderLogin && userCredentials?.login === senderLogin;
    const isOwnMessageByUsername = messageData.username === 'Me' || messageData.username === 'Moi';

    console.log('🔍 Vérif émetteur:', {
      userLogin: userCredentials?.login,
      senderLogin,
      isOwnMessageFlag,
      isOwnMessageByLogin,
      isOwnMessageByUsername
    });

    if (isOwnMessageFlag || isOwnMessageByLogin || isOwnMessageByUsername) {
      console.log('🔔 Notification supprimée: message détecté comme provenant de l\'utilisateur lui-même');
      return false;
    }

    // Règle 2: Ne pas afficher la notification si l'utilisateur visualise déjà le canal
    const messageChannelId = messageData.channelId ||
                            (messageData.filters?.values?.channel) ||
                            (messageData.notification?.filters?.values?.channel);

    // On utilise le canal fourni ou on récupère depuis le contexte
    const viewedChannelId = currentChannelId || getCurrentlyViewedChannel();

    console.log('🔍 Vérif canal:', {
      messageChannelId,
      viewedChannelId,
      currentGlobalChannel: getCurrentlyViewedChannel()
    });

    if (messageChannelId && viewedChannelId) {
      // Nettoyage des IDs pour les comparer (suppression du préfixe "channel_" si présent)
      const cleanMessageChannelId = messageChannelId.toString().replace('channel_', '');
      const cleanViewedChannelId = viewedChannelId.toString().replace('channel_', '');

      if (cleanMessageChannelId === cleanViewedChannelId) {
        console.log('🔔 Notification supprimée: canal déjà visualisé par l\'utilisateur');
        return false;
      }
    }

    // Dans tous les autres cas, la notification doit être affichée
    console.log('✅ Notification autorisée: ce n\'est ni un message propre ni sur le canal actuel');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des conditions de notification:', error);
    // En cas d'erreur, on affiche la notification par défaut
    return true;
  }
};

/**
 * @function playNotificationSound
 * @description Joue le son de notification si nécessaire
 * @param {Object} messageData - Les données du message reçu
 * @param {String} currentChannelId - L'ID du canal actuellement visualisé (facultatif)
 * @param {Object} credentials - Les informations d'authentification de l'utilisateur
 */
export const playNotificationSound = async (messageData, currentChannelId = null, credentials = null) => {
  try {
    const shouldDisplay = await shouldDisplayNotification(messageData, currentChannelId, credentials);

    if (shouldDisplay) {
      // La notification doit être affichée, on utilise donc l'API Notifications pour jouer le son
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '', // Titre vide pour notification silencieuse
          body: '',  // Corps vide pour notification silencieuse
          sound: true,
          data: { silent: true } // Indication que c'est une notification silencieuse (juste pour le son)
        },
        trigger: null, // Déclenchement immédiat
      });
    }
  } catch (error) {
    console.error('❌ Erreur lors de la lecture du son de notification:', error);
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