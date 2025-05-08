import * as SecureStore from 'expo-secure-store';
import {
  FIREBASE_API_KEY,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
  EXPO_PROJECT_ID
} from '@env';

// We get the API URL from the environment variables
const DEFAULT_API_URL = process.env.API_URL;

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
                    console.error('[ENV] Error while getting the API URL:', urlError);
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
            console.error('[ENV] Error while setting the custom API URL:', error);
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
            console.error('[ENV] Error while setting the custom API URL:', error);
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
                    console.error('[ENV] Error while converting the API URL to a WebSocket URL:', urlError);
                }
            }

            const defaultWsUrl = 'ws://192.168.1.67:8000';
            return defaultWsUrl;
        } catch (error) {
            console.error('[ENV] Error while retrieving the WebSocket URL:', error);
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
