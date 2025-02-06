import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export default function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState(null);

  useEffect(() => {
    async function registerForPushNotificationsAsync() {
      try {
        if (!Device.isDevice) {
          console.log('💻 Émulateur détecté');
          return;
        }

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
          });
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          console.log('❌ Permission refusée');
          return;
        }

        try {
          const projectId = Constants.expoConfig.extra.eas.projectId;
          console.log('🔑 ProjectId:', projectId);
          
          const token = await Notifications.getExpoPushTokenAsync({
            projectId: projectId
          });
          
          console.log('✅ Token obtenu:', token);
          setExpoPushToken(token.data);
        } catch (tokenError) {
          console.error('🔴 Erreur token spécifique:', tokenError);
        }

      } catch (error) {
        console.error('🔴 Erreur globale:', error);
      }
    }

    registerForPushNotificationsAsync();
  }, []);

  return expoPushToken;
}
