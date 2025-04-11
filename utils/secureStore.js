import * as SecureStore from 'expo-secure-store';
import { handleError, ErrorType } from './errorHandling';
import i18n from '../i18n';

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
        handleError(error, i18n.t('error.errorCleaningSecureStore'), {
            type: ErrorType.SYSTEM,
            silent: false
        });
    }
};