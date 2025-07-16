import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getDatabase,
  ref,
  push,
  set,
  onChildAdded,
  update
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

import { firebaseConfig } from './firebaseConfig.js';

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);
const postsRef = ref(database, 'posts');

const postForm = document.getElementById('post-form');
const postInput = document.getElementById('post-input');
const feed = document.getElementById('feed');
const signOutButton = document.getElementById('sign-out');

onAuthStateChanged(auth, (user) => {
  if (user) {
    loadPosts();
  } else {
    window.location.href = 'index.html';
  }
});

signOutButton.addEventListener('click', () => {
  signOut(auth);
});

postForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const postContent = postInput.value.trim();
  if (!postContent) return;

  const user = auth.currentUser;
  if (!user) return;

  const newPostRef = push(postsRef);
  await set(newPostRef, {
    uid: user.uid,
    username: user.displayName || 'Anonymous',
    content: postContent,
    timestamp: Date.now(),
    likes: 0
  });

  postInput.value = '';
});

function loadPosts() {
  onChildAdded(postsRef, (snapshot) => {
    const post = snapshot.val();
    const postId = snapshot.key;
    displayPost(post, postId);
  });
}

function displayPost(post, postId) {
  const postElement = document.createElement('div');
  postElement.classList.add('post');

  const content = document.createElement('p');
  content.textContent = post.content;

  const username = document.createElement('span');
  username.classList.add('username');
  username.textContent = `Posted by: ${post.username}`;

  const likeButton = document.createElement('button');
  likeButton.textContent = `❤️ ${post.likes || 0}`;
  likeButton.addEventListener('click', () => {
    const likesRef = ref(database, `posts/${postId}/likes`);
    update(likesRef, {
      '.value': (post.likes || 0) + 1
    });
    likeButton.textContent = `❤️ ${(post.likes || 0) + 1}`;
    likeButton.disabled = true;
  });

  postElement.appendChild(content);
  postElement.appendChild(username);
  postElement.appendChild(likeButton);
  feed.prepend(postElement);
}