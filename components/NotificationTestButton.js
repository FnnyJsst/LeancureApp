import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useNotifications } from '../hooks/useNotifications';

export default function NotificationTestButton() {
  const { expoPushToken, channels, notification, sendNotification } = useNotifications();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.testButton}
        onPress={sendNotification}
      >
        <Text style={styles.buttonText}>Tester les notifications</Text>
      </TouchableOpacity>

      <View style={styles.debugContainer}>
        <Text style={styles.debugText}>Token: {expoPushToken}</Text>
        {notification && (
          <View style={styles.notificationContainer}>
            <Text style={styles.debugText}>Dernière notification :</Text>
            <Text style={styles.notificationText}>Titre: {notification.request.content.title}</Text>
            <Text style={styles.notificationText}>Message: {notification.request.content.body}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  debugContainer: {
    width: '100%',
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 5,
  },
  notificationContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  notificationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
});
