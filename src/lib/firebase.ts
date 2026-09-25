import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCCviF5gIcgmrA9UwuBD1-Vu4q71CnjpeE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "estampadosproject.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "estampadosproject",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "estampadosproject.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "957492429786",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:957492429786:web:410364fe3684d73fe3f6e3",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-FFK85Y11F1"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
