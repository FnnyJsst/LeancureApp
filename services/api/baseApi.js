import axios from 'axios';
import { ENV } from '../../config/env';

export const createApiRequest = (cmd) => ({
  "api-version": "2",
  "api-contract-number": "202501121",
  "api-signature": "msgApiKey",
  "api-signature-hash": "sha256",
  "api-signature-timestamp": Date.now(),
  cmd: [cmd]
});

export const cleanApiResponse = (response) => {
  let cleanData = response.data;
  if (typeof response.data === 'string') {
    const jsonStart = response.data.indexOf('{');
    if (jsonStart !== -1) {
      try {
        cleanData = JSON.parse(response.data.substring(jsonStart));
      } catch (e) {
        throw new Error('Invalid JSON response');
      }
    }
  }
  return cleanData;
};

export const apiClient = axios.create({
  baseURL: ENV.API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 secondes de timeout
});

// Intercepteur pour logger les requêtes
apiClient.interceptors.request.use(request => {
  console.log('🌐 Starting Request:', {
    url: request.url,
    method: request.method,
    data: request.data
  });
  return request;
});

// Intercepteur pour logger les réponses
apiClient.interceptors.response.use(
  response => {
    console.log('✅ Response:', response.data);
    return response;
  },
  error => {
    console.error('🔴 API Error:', {
      message: error.message,
      config: error.config,
      response: error.response?.data
    });
    throw error;
  }
); 