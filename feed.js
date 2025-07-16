import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getDatabase, ref, push, onChildAdded, update
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';
import {
  getAuth, onAuthStateChanged, signOut
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getStorage, ref as storageRef, uploadBytes, getDownloadURL
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';

import { firebaseConfig } from './firebaseConfig.js';

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const storage = getStorage(app);
const postsRef = ref(db, 'posts');

const postForm = document.getElementById('post-form');
const postText = document.getElementById('post-text');
const postImage = document.getElementById('post-image');
const feed = document.getElementById('feed');
const signOutBtn = document.getElementById('sign-out-btn');

onAuthStateChanged(auth, (user) => {
  if (user) {
    loadPosts();
  } else {
    window.location.href = 'index.html';
  }
});

signOutBtn.addEventListener('click', () => {
  signOut(auth);
});

postForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;

  const text = postText.value.trim();
  const file = postImage.files[0];
  postText.value = '';
  postImage.value = '';

  let imageUrl = '';

  if (file) {
    const imageStorageRef = storageRef(storage, `images/${Date.now()}-${file.name}`);
    try {
      const snapshot = await uploadBytes(imageStorageRef, file);
      imageUrl = await getDownloadURL(snapshot.ref);
      alert('Image uploaded successfully');
    } catch (err) {
      alert('Image upload failed: ' + err.message);
    }
  } else {
    alert('No image found for the post');
  }

  const post = {
    uid: user.uid,
    author: user.displayName || 'Anonymous',
    text,
    imageUrl,
    timestamp: Date.now(),
    likes: 0
  };

  try {
    await push(postsRef, post);
    alert('Post submitted successfully');
  } catch (err) {
    alert('Post failed: ' + err.message);
  }
});

function loadPosts() {
  onChildAdded(postsRef, (snapshot) => {
    const post = snapshot.val();
    const postId = snapshot.key;
    console.log('Loaded post:', post);
    displayPost(post, postId);
  });
}

function displayPost(post, postId) {
  const postDiv = document.createElement('div');
  postDiv.classList.add('post');

  const content = `
    <p><strong>${post.author}</strong></p>
    <p>${post.text}</p>
    ${post.imageUrl ? `<img src="${post.imageUrl}" alt="Post image" style="max-width:100%;">` : ''}
    <div class="like-section">
      <button class="like-button" data-id="${postId}">❤️ ${post.likes || 0}</button>
    </div>
    <hr>
  `;

  postDiv.innerHTML = content;
  feed.prepend(postDiv);

  const likeBtn = postDiv.querySelector('.like-button');
  likeBtn.addEventListener('click', () => {
    const postRef = ref(db, `posts/${postId}`);
    const newLikes = (post.likes || 0) + 1;
    update(postRef, { likes: newLikes });
    likeBtn.textContent = `❤️ ${newLikes}`;
  });
}