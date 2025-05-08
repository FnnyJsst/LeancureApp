import { initializeApp } from 'firebase/app';
import { ENV } from './env';
import { handleError, ErrorType } from '../utils/errorHandling';

const firebaseConfig = {
  apiKey: ENV.FIREBASE_API_KEY,
  projectId: ENV.FIREBASE_PROJECT_ID,
  storageBucket: ENV.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: ENV.FIREBASE_MESSAGING_SENDER_ID,
  appId: ENV.FIREBASE_APP_ID
};

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  handleError(error, 'firebase.initialization', {
    type: ErrorType.SYSTEM,
    userMessageKey: 'errors.firebase.initialization',
    silent: false
  });
}

export default app;