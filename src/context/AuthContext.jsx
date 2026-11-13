import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {auth} from '../config/firebase';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Menerjemahkan kode error Firebase ke pesan yang ramah pengguna (Bahasa Indonesia)
export const getFirebaseErrorMessage = error => {
  if (!error || !error.code) return 'Terjadi kesalahan. Silakan coba lagi.';

  switch (error.code) {
    case 'auth/invalid-email':
      return 'Format alamat email tidak valid.';
    case 'auth/user-disabled':
      return 'Akun pengguna ini telah dinonaktifkan.';
    case 'auth/user-not-found':
      return 'Akun dengan email ini tidak ditemukan.';
    case 'auth/wrong-password':
      return 'Kata sandi yang Anda masukkan salah.';
    case 'auth/invalid-credential':
      return 'Email atau kata sandi tidak cocok.';
    case 'auth/email-already-in-use':
      return 'Email sudah terdaftar. Silakan gunakan email lain atau login.';
    case 'auth/weak-password':
      return 'Kata sandi terlalu lemah (minimal 6 karakter).';
    case 'auth/missing-password':
      return 'Silakan masukkan kata sandi.';
    case 'auth/network-request-failed':
      return 'Koneksi internet bermasalah. Periksa jaringan Anda.';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan gagal. Silakan tunggu beberapa saat.';
    case 'auth/configuration-not-found':
    case 'auth/api-key-not-valid':
      return 'Konfigurasi Firebase belum diisi dengan benar di src/config/firebase.js';
    default:
      return error.message || 'Terjadi kesalahan sistem.';
  }
};

export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const registering = useRef(false);

  useEffect(() => {
    // Memantau perubahan status login pengguna (login, logout, refresh)
    const unsubscribe = onAuthStateChanged(auth, currentUser => {
      if (registering.current) {
        return;
      }
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Fungsi Login
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );
      return {success: true, user: userCredential.user};
    } catch (error) {
      return {success: false, error: getFirebaseErrorMessage(error)};
    }
  };

  // Fungsi Register / Daftar
  const register = async (email, password, displayName) => {
    registering.current = true;
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );
      if (displayName && displayName.trim()) {
        await updateProfile(userCredential.user, {
          displayName: displayName.trim(),
        });
      }
      return {success: true, user: userCredential.user};
    } catch (error) {
      return {success: false, error: getFirebaseErrorMessage(error)};
    } finally {
      registering.current = false;
      setUser(auth.currentUser);
    }
  };

  // Fungsi Logout
  const logout = async () => {
    try {
      await signOut(auth);
      return {success: true};
    } catch (error) {
      return {success: false, error: getFirebaseErrorMessage(error)};
    }
  };

  // Fungsi Lupa Password
  const resetPassword = async email => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return {success: true};
    } catch (error) {
      return {success: false, error: getFirebaseErrorMessage(error)};
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
