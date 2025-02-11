import { API_URL } from '@env';

// We check if the API_URL is defined in the .env file
if (!API_URL) {
    throw new Error('API_URL is not defined in .env file');
}
// We export the API_URL and MSG_API_KEY
export const ENV = {
    API_URL,
}; 