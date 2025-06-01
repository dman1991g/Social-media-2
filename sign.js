// signin.js

import { auth, database } from './firebaseConfig.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { ref, set } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

document.addEventListener('DOMContentLoaded', () => {
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const usernameInput = document.getElementById('username');
  const signUpButton = document.getElementById('signUp');
  const signInButton = document.getElementById('signIn');

  // Sign Up handler
  signUpButton.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const username = usernameInput.value.trim();

    if (!email || !password || !username) {
      alert('Please fill out all fields');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Set the displayName in Firebase Auth
      await updateProfile(user, { displayName: username });

      // Optionally save the username in Realtime Database too
      await set(ref(database, 'usernames/' + user.uid), username);

      console.log('User signed up and username saved');
      window.location.href = 'home.html';
    } catch (error) {
      console.error('Sign-up error:', error.message);
      alert(error.message);
    }
  });

  // Sign In handler
  signInButton.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      alert('Please enter email and password');
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Prompt for username if it doesn't exist
      if (!user.displayName) {
        const username = prompt('Please enter a username:');
        if (username) {
          await updateProfile(user, { displayName: username });
          await set(ref(database, 'usernames/' + user.uid), username);
        }
      }

      window.location.href = 'home.html';
    } catch (error) {
      console.error('Sign-in error:', error.message);
      alert(error.message);
    }
  });

  // Optional: auto-redirect if already signed in and has displayName
  onAuthStateChanged(auth, user => {
    if (user && user.displayName) {
      console.log('Already signed in as', user.displayName);
      window.location.href = 'home.html';
    }
  });
});