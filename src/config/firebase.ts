import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyARaoHfugEgaMP93H3G2WOstO-BO4l4JJY",
  authDomain: "jksms-247.firebaseapp.com",
  projectId: "jksms-247",
  storageBucket: "jksms-247.firebasestorage.app",
  messagingSenderId: "263572688751",
  appId: "1:263572688751:web:6df63e67584ac3a0d2629a",
  measurementId: "G-CN0K6QM64D"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Custom parameters to force account selection
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;
