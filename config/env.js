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

// We check if the API URL is defined
if (!DEFAULT_API_URL) {
    console.warn('API_URL not found in environment variables, using default value');
}

export const ENV = {
    /**
     * @function API_URL
     * @description Get the API URL from the SecureStore
     * @returns {Promise<string>} The API URL
     */
    API_URL: async () => {

        // We try to get the custom API URL from the SecureStore
        try {
            // We get the custom API URL from the SecureStore
            const customUrl = await SecureStore.getItemAsync('custom_api_url');

            // We check if the custom API URL is defined
            if (customUrl) {
                // We check if the custom API URL is valid
                try {
                    new URL(customUrl);
                    console.log('✅ Utilisation de l\'URL personnalisée:', customUrl);
                    return customUrl;
                // If the custom API URL is not valid, we delete it from the SecureStore
                } catch (urlError) {
                    await SecureStore.deleteItemAsync('custom_api_url');
                    console.error('🔴 URL personnalisée invalide:', urlError);
                }
            }
            // If the custom API URL is not defined, we use the default API URL
            console.log('✅ Utilisation de l\'URL par défaut:', DEFAULT_API_URL);
            return DEFAULT_API_URL;
        } catch (error) {
            // console.error('🔴 Erreur détaillée:', {
            //     name: error.name,
            //     message: error.message,
            //     stack: error.stack,
            // });
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
        // We check if the URL is valid
        if (!url || typeof url !== 'string') {
            console.error('❌ URL invalide:', url);
            throw new Error('L\'URL doit être une chaîne de caractères valide');
        }

        const trimmedUrl = url.trim();
        try {
            // We check if the URL is valid
            const parsedUrl = new URL(trimmedUrl);

            // We delete the old API and WebSocket URLs
            await SecureStore.deleteItemAsync('custom_api_url');
            await SecureStore.deleteItemAsync('custom_ws_url');

            // We save the new API URL
            await SecureStore.setItemAsync('custom_api_url', trimmedUrl);
            console.log('✅ Nouvelle URL API sauvegardée:', trimmedUrl);

            // We generate and save the corresponding WebSocket URL
            // We always use the specific port 8000 for WebSockets
            const host = parsedUrl.hostname;
            const wsProtocol = parsedUrl.protocol === 'https:' ? 'wss:' : 'ws:';
            // Fixed port 8000 for WebSockets
            const wsUrl = `${wsProtocol}//${host}:8000`;

            await SecureStore.setItemAsync('custom_ws_url', wsUrl);
            console.log('✅ Nouvelle URL WebSocket sauvegardée:', wsUrl);

            return true;
        } catch (error) {
            throw error;
        }
    },

    /**
     * @function WS_URL
     * @description Get the WebSocket URL from the SecureStore
     * @returns {Promise<string>} The WebSocket URL
     */
    WS_URL: async () => {
        try {
            // We check if a custom WebSocket URL exists
            const customWsUrl = await SecureStore.getItemAsync('custom_ws_url');
            if (customWsUrl) {
                console.log('📱 URL WebSocket personnalisée trouvée:', customWsUrl);
                return customWsUrl;
            }

            // We check if a custom API URL exists and convert it to a WebSocket URL
            const customApiUrl = await SecureStore.getItemAsync('custom_api_url');
            if (customApiUrl) {
                try {
                    // We analyze the API URL
                    const apiUrl = new URL(customApiUrl);
                    // We create a WebSocket URL based on the API URL
                    const host = apiUrl.hostname;
                    const wsProtocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
                    // Fixed port 8000 for WebSockets
                    const wsUrl = `${wsProtocol}//${host}:8000`;

                    console.log('🔄 URL WebSocket générée à partir de l\'URL API:', wsUrl);
                    return wsUrl;
                } catch (urlError) {
                    console.error('🔴 Erreur lors de la conversion de l\'URL API en URL WebSocket:', urlError);
                }
            }

            // If no custom URL is found, use the default URL
            const defaultWsUrl = 'ws://192.168.1.67:8000';
            console.log('✅ Utilisation de l\'URL WebSocket par défaut:', defaultWsUrl);
            return defaultWsUrl;
        } catch (error) {
            console.error('🔴 Erreur lors de la récupération de l\'URL WebSocket:', error);
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
