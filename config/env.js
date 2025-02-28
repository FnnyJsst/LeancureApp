import * as SecureStore from 'expo-secure-store';

const DEFAULT_API_URL = process.env.API_URL || 'http://192.168.1.67/ic.php';

if (!DEFAULT_API_URL) {
    console.warn('API_URL not found in environment variables, using default value');
}

export const ENV = {
    API_URL: async () => {
        console.log('🔄 Début récupération URL API');

        try {
            console.log('🔍 Recherche d\'une URL personnalisée...');
            const customUrl = await SecureStore.getItemAsync('custom_api_url');

            if (customUrl) {
                console.log('📱 URL personnalisée trouvée:', customUrl);
                // Vérifions que l'URL est valide
                try {
                    new URL(customUrl);
                    console.log('✅ Utilisation de l\'URL personnalisée:', customUrl);
                    return customUrl;
                } catch (urlError) {
                    console.error('🔴 URL personnalisée invalide:', urlError);
                    await SecureStore.deleteItemAsync('custom_api_url');
                }
            } else {
                console.log('ℹ️ Pas d\'URL personnalisée trouvée');
            }

            console.log('✅ Utilisation de l\'URL par défaut:', DEFAULT_API_URL);
            return DEFAULT_API_URL;
        } catch (error) {
            console.error('🔴 Erreur détaillée:', {
                name: error.name,
                message: error.message,
                stack: error.stack,
            });
            return DEFAULT_API_URL;
        }
    },

    setCustomApiUrl: async (url) => {
        console.log('💾 Début sauvegarde URL personnalisée');
        if (!url || typeof url !== 'string') {
            console.error('❌ URL invalide:', url);
            throw new Error('L\'URL doit être une chaîne de caractères valide');
        }

        const trimmedUrl = url.trim();
        try {
            // Vérifions que l'URL est valide
            new URL(trimmedUrl);

            // Supprimons d'abord l'ancienne URL
            await SecureStore.deleteItemAsync('custom_api_url');
            console.log('🗑️ Ancienne URL supprimée');

            // Sauvegardons la nouvelle URL
            await SecureStore.setItemAsync('custom_api_url', trimmedUrl);
            console.log('✅ Nouvelle URL sauvegardée:', trimmedUrl);

            return true;
        } catch (error) {
            console.error('🔴 Erreur lors de la sauvegarde:', {
                name: error.name,
                message: error.message,
            });
            throw error;
        }
    },
};
