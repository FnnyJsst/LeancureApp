import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyBed_Zd-irYhqd8xF10e_LfygdTuAD_Zz0",
  projectId: "leancure-app",
  storageBucket: "leancure-app.firebasestorage.app",
  messagingSenderId: "627566161284",
  appId: "1:627566161284:android:d1bdce9014a28a70efc1d1"
};

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase initialisé avec succès');
} catch (error) {
  console.error('❌ Erreur lors de l\'initialisation de Firebase:', error);
}

export default app;