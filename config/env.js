import * as SecureStore from 'expo-secure-store';
import {
  FIREBASE_API_KEY,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
  EXPO_PROJECT_ID
} from '@env';
import { handleError, ErrorType } from '../utils/errorHandling';

// We get the API URL from the environment variables
const DEFAULT_API_URL = process.env.API_URL;

// We check if the API URL is defined
if (!DEFAULT_API_URL) {
    handleError(
        new Error('API_URL not found in environment variables'),
        'env.config',
        { type: ErrorType.SYSTEM, silent: true }
    );
}

export const ENV = {
    /**
     * @function API_URL
     * @description Get the API URL from the SecureStore
     * @returns {Promise<string>} The API URL
     */
    API_URL: async () => {
        try {
            const customUrl = await SecureStore.getItemAsync('custom_api_url');

            if (customUrl) {
                try {
                    new URL(customUrl);
                    return customUrl;
                } catch (urlError) {
                    await SecureStore.deleteItemAsync('custom_api_url');
                    handleError(urlError, 'env.invalidCustomUrl', {
                        type: ErrorType.SYSTEM,
                        silent: false,
                        userMessageKey: 'errors.env.invalidCustomUrl'
                    });
                }
            }
            return DEFAULT_API_URL;
        } catch (error) {
            return DEFAULT_API_URL;
        }
    },

    /**
     * @function setCustomApiUrl
     * @description Set the custom API URL in the SecureStore
     * @param {string} url - The custom API URL
     * @returns {Promise<boolean>} True if the URL is set, false otherwise
     */
    setCustomApiUrl: async (url) => {
        if (!url || typeof url !== 'string') {
            handleError(
                new Error('URL must be a valid string'),
                'env.setCustomApiUrl',
                { type: ErrorType.VALIDATION }
            );
            return false;
        }

        const trimmedUrl = url.trim();
        try {
            const parsedUrl = new URL(trimmedUrl);

            await SecureStore.deleteItemAsync('custom_api_url');
            await SecureStore.deleteItemAsync('custom_ws_url');

            await SecureStore.setItemAsync('custom_api_url', trimmedUrl);

            const host = parsedUrl.hostname;
            const wsProtocol = parsedUrl.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${wsProtocol}//${host}:8000`;

            await SecureStore.setItemAsync('custom_ws_url', wsUrl);

            return true;
        } catch (error) {
            handleError(error, 'env.setCustomApiUrl', {
                type: ErrorType.SYSTEM,
                userMessageKey: 'errors.env.invalidUrl'
            });
            return false;
        }
    },

    /**
     * @function WS_URL
     * @description Get the WebSocket URL from the SecureStore
     * @returns {Promise<string>} The WebSocket URL
     */
    WS_URL: async () => {
        try {
            const customWsUrl = await SecureStore.getItemAsync('custom_ws_url');
            if (customWsUrl) {
                return customWsUrl;
            }

            const customApiUrl = await SecureStore.getItemAsync('custom_api_url');
            if (customApiUrl) {
                try {
                    const apiUrl = new URL(customApiUrl);
                    const host = apiUrl.hostname;
                    const wsProtocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
                    const wsUrl = `${wsProtocol}//${host}:8000`;

                    return wsUrl;
                } catch (urlError) {
                    handleError(urlError, 'env.wsUrlConversion', {
                        type: ErrorType.SYSTEM,
                        userMessageKey: 'errors.env.wsUrlConversion'
                    });
                }
            }

            const defaultWsUrl = 'ws://192.168.1.67:8000';
            return defaultWsUrl;
        } catch (error) {
            handleError(error, 'env.wsUrlRetrieval', {
                type: ErrorType.SYSTEM,
                userMessageKey: 'errors.env.wsUrlRetrieval'
            });
            return 'ws://192.168.1.67:8000';
        }
    },

    FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: `${FIREBASE_PROJECT_ID}.firebaseapp.com`,
    FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID,
    EXPO_PROJECT_ID
};
