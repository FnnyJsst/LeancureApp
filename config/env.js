import { API_URL, MSG_API_KEY } from '@env';

// We check if the API_URL is defined in the .env file
if (!API_URL) {
    throw new Error('API_URL is not defined in .env file');
}

// We check if the MSG_API_KEY is defined in the .env file
if (!MSG_API_KEY) {
    throw new Error('MSG_API_KEY is not defined in .env file');
}

// We export the API_URL and MSG_API_KEY
export const ENV = {
    API_URL,
    MSG_API_KEY
}; 