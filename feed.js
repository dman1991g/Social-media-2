import { auth, database, storage } from './firebaseConfig.js';
import {
    onAuthStateChanged, signOut
} from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import {
    ref as dbRef, push, onChildAdded, update, set
} from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
import {
    ref as storageRef, uploadBytes, getDownloadURL
} from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js';

const postInput = document.getElementById('postInput');
const postButton = document.getElementById('postButton');
const imageInput = document.getElementById('imageInput');
const toggleImageUpload = document.getElementById('toggleImageUpload');
const emojiButton = document.getElementById('emojiButton');
const emojiPicker = document.getElementById('emojiPicker');
const postFeed = document.getElementById('postFeed');
const signOutBtn = document.getElementById('signOut');

// Emoji picker setup
let pickerVisible = false;
emojiButton.addEventListener('click', () => {
    if (!pickerVisible) {
        emojiPicker.classList.remove('hidden');
        new EmojiMart.Picker({
            onEmojiSelect: emoji => {
                postInput.value += emoji.native;
            },
            theme: 'light',
            parent: emojiPicker
        });
    } else {
        emojiPicker.innerHTML = '';
        emojiPicker.classList.add('hidden');
    }
    pickerVisible = !pickerVisible;
});

// Show image upload
toggleImageUpload.addEventListener('click', () => {
    imageInput.click();
});

// Auth check
onAuthStateChanged(auth, user => {
    if (!user) window.location.href = 'signin.html';
});

// Handle post
postButton.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) return;

    const content = postInput.value.trim();
    const file = imageInput.files[0];

    if (!content && !file) return;

    const newPostRef = push(dbRef(database, 'posts'));
    const postKey = newPostRef.key;

    const postData = {
        uid: user.uid,
        username: user.displayName || 'Anonymous',
        content: content,
        timestamp: Date.now()
    };

    await set(newPostRef, postData);

    if (file) {
        const imgRef = storageRef(storage, `postImages/${postKey}`);
        await uploadBytes(imgRef, file);
        const imageURL = await getDownloadURL(imgRef);
        await update(newPostRef, { imageURL });
    }

    postInput.value = '';
    imageInput.value = '';
});

// Load posts
onChildAdded(dbRef(database, 'posts'), (snapshot) => {
    const post = snapshot.val();

    const postEl = document.createElement('div');
    postEl.className = 'post';
    postEl.innerHTML = `
        <strong>${post.username}</strong><br/>
        <p>${post.content}</p>
        ${post.imageURL ? `<img src="${post.imageURL}" alt="Post image" style="max-width: 300px;" />` : ''}
        <small>${new Date(post.timestamp).toLocaleString()}</small>
    `;

    postFeed.prepend(postEl);
});

// Sign out
signOutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
        window.location.href = 'index.html';
    });
});