import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
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

// Export Firebase utilities
const firebase = app; // To maintain backward compatibility with old imports
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { firebase, db, auth, storage };
