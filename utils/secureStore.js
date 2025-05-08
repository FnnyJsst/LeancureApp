import * as SecureStore from 'expo-secure-store';

export const cleanSecureStoreKeys = async () => {
    try {
        // List of keys to delete
        const keysToDelete = [
            'isMessagesHidden',
            'userCredentials',
            'pushToken',
            'notificationSettings',
            'savedLoginInfo',
            'custom_api_url',
            'userRights'
        ];

        // Delete each key
        for (const key of keysToDelete) {
            await SecureStore.deleteItemAsync(key);
        }
    } catch (error) {
        console.error('[SecureStore] Error while cleaning the SecureStore:', error);
    }
};