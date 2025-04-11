import * as SecureStore from 'expo-secure-store';

export const clearSecureStore = async () => {
    try {
        // List of keys to delete
        const keysToDelete = [
            'isMessagesHidden',
            'userCredentials',
            'pushToken',
            'notificationSettings'
        ];

        // Delete each key
        for (const key of keysToDelete) {
            await SecureStore.deleteItemAsync(key);
        }
    } catch (error) {
        console.error('Erreur lors du nettoyage du SecureStore:', error);
    }
};