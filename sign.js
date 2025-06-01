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

  // ✅ SIGN UP
  signUpButton.addEventListener('click', () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const username = usernameInput.value.trim();

    if (!username) {
      alert('Please enter a username');
      return;
    }

    createUserWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        const user = userCredential.user;

        // Set the display name
        await updateProfile(user, { displayName: username });

        // Optional: Save username in database
        await set(ref(database, 'usernames/' + user.uid), username);

        console.log('User signed up and username set:', user.displayName);
        window.location.href = 'home.html';
      })
      .catch((error) => {
        console.error('Error signing up:', error.message);
        alert(error.message);
      });
  });

  // ✅ SIGN IN
  signInButton.addEventListener('click', () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        console.log('User signed in:', user);
        window.location.href = 'home.html';
      })
      .catch((error) => {
        console.error('Error signing in:', error.message);
        alert(error.message);
      });
  });

  // ✅ AUTH STATE CHECK
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('User is signed in:', user);
      if (!user.displayName) {
        const name = prompt("Please set a username:");
        if (name) {
          updateProfile(user, { displayName: name }).then(() => {
            set(ref(database, 'usernames/' + user.uid), name);
            window.location.href = 'home.html';
          });
        }
      } else {
        window.location.href = 'home.html';
      }
    }
  });
});