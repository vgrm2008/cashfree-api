// firebase.js
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyB5aVtQn22Y17TJpKEdV7X3I6CuzyfN-fg", // ✅ use real keys from Firebase Console
  authDomain: "airofix-619ad.firebaseapp.com",
  databaseURL: "https://airofix-619ad-default-rtdb.firebaseio.com/",
  projectId: "airofix-619ad",
  storageBucket: "gs://airofix-619ad.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123xyz"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const storage = getStorage(app);

export { db, storage };
