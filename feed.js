import { auth, database, storage } from './firebaseConfig.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { ref as dbRef, push, set, update, onChildAdded } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js';
import { Picker } from 'https://cdn.jsdelivr.net/npm/emoji-mart@latest/dist/browser.js';

// DOM Elements
const postContent = document.getElementById('postContent');
const postImage = document.getElementById('postImage');
const submitPost = document.getElementById('submitPost');
const postsDiv = document.getElementById('posts');
const signOutBtn = document.getElementById('signOut');
const toggleImageUpload = document.getElementById('toggleImageUpload');
const emojiButton = document.getElementById('emojiButton');
const emojiPickerContainer = document.getElementById('emojiPicker');
const imagePreview = document.getElementById('imagePreview');

// Auth check
onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = 'signin.html';
  }
});

// Toggle image upload input
toggleImageUpload.addEventListener('click', () => {
  postImage.click();
});

// Image preview
postImage.addEventListener('change', () => {
  const file = postImage.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = e => {
      imagePreview.src = e.target.result;
      imagePreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  } else {
    imagePreview.src = '';
    imagePreview.style.display = 'none';
  }
});

// Emoji picker setup
const picker = new Picker({
  onEmojiSelect: emoji => {
    postContent.value += emoji.native;
  },
  theme: 'light'
});

emojiPickerContainer.appendChild(picker);
emojiPickerContainer.classList.add('hidden');

emojiButton.addEventListener('click', () => {
  emojiPickerContainer.classList.toggle('hidden');
});

// Submit post
submitPost.addEventListener('click', async () => {
  const content = postContent.value.trim();
  const imageFile = postImage.files[0];

  if (!content && !imageFile) return;

  const user = auth.currentUser;
  if (!user) return;

  const postRef = push(dbRef(database, 'posts'));
  const postKey = postRef.key;

  const newPost = {
    uid: user.uid,
    username: user.displayName || 'Anonymous',
    content: content || '',
    timestamp: Date.now(),
  };

  await set(postRef, newPost);

  if (imageFile) {
    const imgRef = storageRef(storage, `postImages/${postKey}`);
    await uploadBytes(imgRef, imageFile);
    const imageURL = await getDownloadURL(imgRef);
    await update(postRef, { imageURL });
  }

  // Clear inputs
  postContent.value = '';
  postImage.value = '';
  imagePreview.src = '';
  imagePreview.style.display = 'none';
  emojiPickerContainer.classList.add('hidden');
});

// Show new posts
const postFeedRef = dbRef(database, 'posts');
onChildAdded(postFeedRef, (snapshot) => {
  const post = snapshot.val();

  const postElement = document.createElement('div');
  postElement.className = 'post';

  postElement.innerHTML = `
    <strong>${post.username}</strong><br/>
    <p>${post.content}</p>
    ${post.imageURL ? `<img src="${post.imageURL}" alt="Post image" style="max-width: 300px; max-height: 300px;" />` : ''}
    <small>${new Date(post.timestamp).toLocaleString()}</small>
  `;

  postsDiv.prepend(postElement);
});

// Sign out
signOutBtn.addEventListener('click', () => {
  signOut(auth).then(() => {
    window.location.href = 'index.html';
  });
});