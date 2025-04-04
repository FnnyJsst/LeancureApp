import React, { useState } from 'react';
import { View, Button, Text, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';

export default function NotificationTest() {
  const [status, setStatus] = useState('');

  const sendLocalNotification = async () => {
    try {
      setStatus('Envoi en cours...');
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Test Local",
          body: "Ceci est un test local - " + new Date().toLocaleTimeString(),
          data: { local: true },
        },
        trigger: null, // Immédiat
      });
      setStatus('Notification locale envoyée!');
    } catch (error) {
      setStatus('Erreur: ' + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test de Notifications</Text>
      <Button
        title="Envoyer Notification Locale"
        onPress={sendLocalNotification}
      />
      <Text style={styles.status}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    margin: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  status: {
    marginTop: 10,
    color: 'blue',
  }
});
