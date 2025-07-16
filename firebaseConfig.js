// Import Firebase Modular SDK modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js';  // Import getStorage

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCJKPi-WkesRIZVUqVUOn3Nzxu8eAGMsdc",
  authDomain: "trvia-game.firebaseapp.com",
  projectId: "trvia-game",
  storageBucket: "trvia-game.firebasestorage.app",
  messagingSenderId: "752578431372",
  appId: "1:752578431372:web:1cb44be093d20165452ea9",
  measurementId: "G-GB72R4Y6FD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);  // Initialize Firebase Storage

export { app, auth, database, storage };
