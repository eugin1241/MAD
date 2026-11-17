import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Konfigurasi Firebase bersama untuk demo kelas Klabox
// Cara dapatkan: Buka Firebase Console > Project Settings > General > Your Apps (Web App)
const firebaseConfig = {
  apiKey: "AIzaSyC1YtHonueHrMgxeGFjna3GKDxSwoX3x5I",
  authDomain: "jil-awesome-project.firebaseapp.com",
  projectId: "jil-awesome-project",
  storageBucket: "jil-awesome-project.firebasestorage.app",
  messagingSenderId: "1049446119554",
  appId: "1:1049446119554:web:791320c671af3efb465c9b"
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
