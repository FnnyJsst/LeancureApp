const axios = require('axios');

async function sendTestNotification(token) {
  const message = {
    to: token,
    sound: 'default',
    title: '⚠️ TEST URGENT ⚠️',
    body: 'Ceci est un test IMPORTANT - ' + new Date().toTimeString(),
    priority: 'high',
    badge: 1,
    _displayInForeground: true,
    android: {
      channelId: 'default',
      priority: 'max',
      sound: true,
      vibrate: [0, 250, 250, 250],
      color: '#FF0000',
      icon: 'ic_launcher',
      sticky: true
    },
    data: {
      urgent: true,
      timestamp: Date.now()
    },
  };

  console.log('Envoi de la notification à:', token);
  try {
    const response = await axios.post('https://exp.host/--/api/v2/push/send', message, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
    console.log('Réponse:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erreur:', error.response?.data || error.message);
    return null;
  }
}

const token = 'ExponentPushToken[p2kWoeC5a_byJGml37Q7gh]';
sendTestNotification(token);