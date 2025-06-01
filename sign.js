// signin.js

import { auth, database } from './firebaseConfig.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { ref, set } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';

document.addEventListener('DOMContentLoaded', () => {
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const usernameInput = document.getElementById('username');
  const signUpButton = document.getElementById('signUp');
  const signInButton = document.getElementById('signIn');

  // Sign Up handler
  signUpButton.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    const username = usernameInput.value;

    createUserWithEmailAndPassword(auth, email, password)
      .then(userCredential => {
        const user = userCredential.user;
        console.log('User signed up:', user);

        return user.updateProfile({ displayName: username }).then(() => user);
      })
      .then(user => {
        return set(ref(database, 'usernames/' + user.uid), username);
      })
      .then(() => {
        console.log('Username saved to database successfully');
      })
      .catch(error => {
        console.error('Error signing up:', error.message);
      });
  });

  // Sign In handler
  signInButton.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    signInWithEmailAndPassword(auth, email, password)
      .then(userCredential => {
        const user = userCredential.user;
        console.log('User signed in:', user);
        window.location.href = "home.html"; // Redirect to your chat page or dashboard
      })
      .catch(error => {
        console.error('Error signing in:', error.message);
      });
  });

  // Monitor auth state
  onAuthStateChanged(auth, user => {
    if (user) {
      console.log('User is signed in:', user);
      window.location.href = "home.html"; // Redirect if already signed in
    } else {
      console.log('User is signed out');
    }
  });
});
