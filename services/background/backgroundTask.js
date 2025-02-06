import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { fetchChannelMessages } from '../api/messageApi';
import * as SecureStore from 'expo-secure-store';

export const BACKGROUND_FETCH_TASK = 'background-message-fetch';

// TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
//   try {
//     const credentialsStr = await SecureStore.getItemAsync('userCredentials');
//     if (!credentialsStr) return BackgroundFetch.Result.NoData;
    
//     const credentials = JSON.parse(credentialsStr);
//     const messages = await fetchChannelMessages(channelId, credentials);
    
//     // On compare avec le dernier message connu
//     const lastKnownMessage = await SecureStore.getItemAsync('lastKnownMessage');
//     const lastKnownTimestamp = lastKnownMessage ? JSON.parse(lastKnownMessage).timestamp : 0;
    
//     const newMessages = messages.filter(msg => parseInt(msg.savedTimestamp) > lastKnownTimestamp);
//     console.log('📨 Messages récupérés:', messages);
//     console.log('⏰ Dernier timestamp connu:', lastKnownTimestamp);
//     console.log('🆕 Nouveaux messages:', newMessages);
    
//     if (newMessages.length > 0) {
//       await Notifications.scheduleNotificationAsync({
//         content: {
//           title: "Nouveau message",
//           body: `Vous avez ${newMessages.length} nouveau(x) message(s)`
//         },
//         trigger: null
//       });
      
//       // On sauvegarde le timestamp du dernier message
//       await SecureStore.setItemAsync('lastKnownMessage', JSON.stringify({
//         timestamp: Math.max(...newMessages.map(msg => parseInt(msg.savedTimestamp)))
//       }));
//     }
    
//     return BackgroundFetch.Result.NewData;
//   } catch (error) {
//     console.error('Background fetch failed:', error);
//     return BackgroundFetch.Result.Failed;
//   }
// });

// TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
//   try {
//     const credentialsStr = await SecureStore.getItemAsync('userCredentials');
//     if (!credentialsStr) return BackgroundFetch.Result.NoData;
    
//     const credentials = JSON.parse(credentialsStr);
//     const messages = await fetchChannelMessages(selectedChannel?.id, credentials);
    
//     if (messages && messages.length > 0) {
//       await Notifications.scheduleNotificationAsync({
//         content: {
//           title: "Nouveau message",
//           body: `Vous avez ${messages.length} nouveau(x) message(s)`,
//           sound: true,
//           priority: 'high',
//         },
//         trigger: null
//       });
//     }
    
//     return BackgroundFetch.Result.NewData;
//   } catch (error) {
//     console.error('🔴 Erreur tâche de fond:', error);
//     return BackgroundFetch.Result.Failed;
//   }
// });

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Test notification",
        body: "Ceci est un test de notification",
        sound: true,
      },
      trigger: null
    });
    
    return BackgroundFetch.Result.NewData;
  } catch (error) {
    console.error('🔴 Erreur notification:', error);
    return BackgroundFetch.Result.Failed;
  }
});

// Fonction pour enregistrer la tâche
export async function registerBackgroundTask() {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 60, // 1 minute
      stopOnTerminate: false,
      startOnBoot: true
    });
    console.log('✅ Tâche de fond enregistrée');
  } catch (error) {
    console.error('❌ Erreur enregistrement tâche:', error);
  }
}