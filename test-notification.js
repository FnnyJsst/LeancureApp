const fetch = require('node-fetch');

async function sendTestNotification(token) {
  const message = {
    to: token,
    sound: 'default',
    title: 'Test de notification',
    body: 'Ceci est un test de notification',
    data: { testData: 'test' },
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    console.log('Résultat de l\'envoi de notification:', result);
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification:', error);
  }
}

// Remplacer par votre token Expo
const expoPushToken = 'ExponentPushToken[UjmgiqJ63T-hAu33bUl_J8]';
sendTestNotification(expoPushToken);