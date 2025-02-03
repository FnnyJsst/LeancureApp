import * as Notifications from 'expo-notifications';

/**
 * @function sendNotification
 * @description Envoie une notification locale
 * @param {Object} params - Les paramètres de la notification
 * @param {string} params.title - Le titre de la notification
 * @param {string} params.body - Le contenu de la notification
 * @param {Object} [params.data] - Les données additionnelles de la notification
 */
export const sendNotification = async ({ title, body, data }) => {
  try {
    if (!title || !body) {
      throw new Error('Title and body are required for notifications');
    }

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
      },
      trigger: null,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

/**
 * @function registerForPushNotificationsAsync
 * @description Enregistre l'application pour les notifications push
 */
export const registerForPushNotificationsAsync = async () => {
  // Déplacez ici le code d'enregistrement des notifications de App.js
};
