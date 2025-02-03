import { API_URL, MSG_API_KEY } from '@env';

// Vérification des variables d'environnement
if (!API_URL) {
    throw new Error('API_URL is not defined in .env file');
}

if (!MSG_API_KEY) {
    throw new Error('MSG_API_KEY is not defined in .env file');
}

export const ENV = {
    API_URL,
    MSG_API_KEY
}; 