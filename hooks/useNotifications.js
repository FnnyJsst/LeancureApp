import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(undefined);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => token && setExpoPushToken(token));

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('📬 Notification reçue:', notification);
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification cliquée:', response);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const sendNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Nouveau message 📬",
        body: 'Vous avez reçu un nouveau message',
        data: { data: 'goes here' },
      },
      trigger: { seconds: 2 },
    });
  };

  return {
    expoPushToken,
    notification,
    sendNotification
  };
}

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('❌ Permission refusée pour les notifications');
      return;
    }

    try {
      // Récupérer le projectId depuis app.json
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      // Essayer d'obtenir le token
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: "c0d7c103-e3ab-4ee8-9a7a-97cc31870324",
        applicationId: Constants.expoConfig?.android?.package || undefined,
      })).data;

      console.log('✅ Token obtenu:', token);
    } catch (e) {
      console.error('❌ Erreur lors de l\'obtention du token:', e);
      // Essayer une autre méthode si la première échoue
      try {
        token = (await Notifications.getDevicePushTokenAsync()).data;
        console.log('✅ Token device obtenu:', token);
      } catch (e2) {
        console.error('❌ Erreur lors de l\'obtention du token device:', e2);
      }
    }
  }

  return token;
}