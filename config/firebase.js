import { initializeApp } from 'firebase/app';
import { ENV } from './env';

const firebaseConfig = {
  apiKey: ENV.FIREBASE_API_KEY,
  authDomain: ENV.FIREBASE_AUTH_DOMAIN,
  projectId: ENV.FIREBASE_PROJECT_ID,
  storageBucket: ENV.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: ENV.FIREBASE_MESSAGING_SENDER_ID,
  appId: ENV.FIREBASE_APP_ID
};

let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase initialisé avec succès');
} catch (error) {
  console.error('❌ Erreur lors de l\'initialisation de Firebase:', error);
}

export default app;