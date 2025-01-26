import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyDsc6iMiPIzezGfFQv3U_LjKTTua2xcnRQ",
    authDomain: "village-77c9f.firebaseapp.com",
    databaseURL: "https://village-77c9f-default-rtdb.firebaseio.com",
    projectId: "village-77c9f",
    storageBucket: "village-77c9f.firebasestorage.app",
    messagingSenderId: "934742515805",
    appId: "1:934742515805:web:3cbf4d9925ae2fc6cdadb4",
    measurementId: "G-RBEMMXKH98",
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
