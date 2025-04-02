import * as SecureStore from 'expo-secure-store';

export const clearSecureStore = async () => {
    try {
        // Liste des clés à supprimer
        const keysToDelete = [
            'isMessagesHidden',
            'userCredentials',
            'pushToken',
            'notificationSettings'
        ];

        // Suppression de chaque clé
        for (const key of keysToDelete) {
            await SecureStore.deleteItemAsync(key);
        }

        console.log('SecureStore nettoyé avec succès');
    } catch (error) {
        console.error('Erreur lors du nettoyage du SecureStore:', error);
    }
};