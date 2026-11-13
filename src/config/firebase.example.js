import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Masukkan konfigurasi Firebase Project Anda di sini
// Cara dapatkan: Buka Firebase Console > Project Settings > General > Your Apps (Web App)
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_apiKey",
  authDomain: "YOUR_FIREBASE_authDomain",
  projectId: "YOUR_FIREBASE_projectId",
  storageBucket: "YOUR_FIREBASE_storageBucket",
  messagingSenderId: "YOUR_FIREBASE_messagingSenderId",
  appId: "YOUR_FIREBASE_appId"
};

// Inisialisasi Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Inisialisasi Auth dengan AsyncStorage untuk persistensi login di React Native
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  // Jika auth sudah terinisialisasi sebelumnya
  auth = getAuth(app);
}

export { app, auth, firebaseConfig };
