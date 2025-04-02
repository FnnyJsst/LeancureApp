const fetch = require('node-fetch');

async function sendTestNotification(expoPushToken) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: 'Test de notification',
    body: 'Ceci est un test de notification push',
    data: { someData: 'goes here' },
  };

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  const result = await response.json();
  console.log('Résultat de l\'envoi:', result);
}

// Remplacez ce token par celui affiché dans votre application
const expoPushToken = 'VOTRE_TOKEN_PUSH';
sendTestNotification(expoPushToken);