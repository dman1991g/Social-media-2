import { auth, database, storage } from './firebaseConfig.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { ref as dbRef, push, onChildAdded } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js';

const postContent = document.getElementById('postContent');
const postImage = document.getElementById('postImage');
const submitPost = document.getElementById('submitPost');
const postsDiv = document.getElementById('posts');
const signOutBtn = document.getElementById('signOut');

const toggleImageUploadBtn = document.getElementById('toggleImageUpload');
const emojiButton = document.getElementById('emojiButton');
const sendImageBtn = document.getElementById('sendImage');
const emojiPickerDiv = document.getElementById('emojiPicker');

onAuthStateChanged(auth, user => {
    if (!user) {
        window.location.href = 'signin.html'; // Redirect if not signed in
    }
});

// Toggle Image Upload input visibility
toggleImageUploadBtn.addEventListener('click', () => {
    if (postImage.style.display === 'none' || !postImage.style.display) {
        postImage.style.display = 'block';
        sendImageBtn.style.display = 'inline-block';
    } else {
        postImage.style.display = 'none';
        sendImageBtn.style.display = 'none';
    }
});

// Basic emoji picker setup (using emoji-mart)
let pickerVisible = false;
emojiButton.addEventListener('click', () => {
    if (!pickerVisible) {
        // Create emoji picker if not exists
        if (!emojiPickerDiv.hasChildNodes()) {
            const picker = new EmojiMart.Picker({ 
                onEmojiSelect: (emoji) => {
                    postContent.value += emoji.native;
                }
            });
            emojiPickerDiv.appendChild(picker);
        }
        emojiPickerDiv.classList.remove('hidden');
        pickerVisible = true;
    } else {
        emojiPickerDiv.classList.add('hidden');
        pickerVisible = false;
    }
});

// Send image as a post (same as clicking post with image selected)
sendImageBtn.addEventListener('click', async () => {
    if (!postImage.files.length) return;

    const image = postImage.files[0];
    const postRef = dbRef(database, 'posts');
    const newPost = {
        uid: auth.currentUser.uid,
        content: '', // No text content
        timestamp: Date.now(),
        username: auth.currentUser.displayName || 'Anonymous'
    };

    const postKey = push(postRef, newPost).key;

    const imgRef = storageRef(storage, `postImages/${postKey}`);
    await uploadBytes(imgRef, image);
    const imageURL = await getDownloadURL(imgRef);

    await push(dbRef(database, `posts/${postKey}/image`), imageURL);

    postImage.value = '';
    postImage.style.display = 'none';
    sendImageBtn.style.display = 'none';
});

// Create a post (text and optional image)
submitPost.addEventListener('click', async () => {
    const content = postContent.value;
    const image = postImage.files[0];

    if (!content && !image) return;

    const postRef = dbRef(database, 'posts');
    const newPost = {
        uid: auth.currentUser.uid,
        content,
        timestamp: Date.now(),
        username: auth.currentUser.displayName || 'Anonymous'
    };

    const postKey = push(postRef, newPost).key;

    if (image) {
        const imgRef = storageRef(storage, `postImages/${postKey}`);
        await uploadBytes(imgRef, image);
        const imageURL = await getDownloadURL(imgRef);
        await push(dbRef(database, `posts/${postKey}/image`), imageURL);
    }

    postContent.value = '';
    postImage.value = '';
    postImage.style.display = 'none';
    sendImageBtn.style.display = 'none';
});

// Load posts and display them
const postFeedRef = dbRef(database, 'posts');
onChildAdded(postFeedRef, async (snapshot) => {
    const post = snapshot.val();
    const postElement = document.createElement('div');
    postElement.className = 'post';
    postElement.innerHTML = `
        <strong>${post.username}</strong><br/>
        <p>${post.content || ''}</p>
        ${post.image ? `<img src="${Object.values(post.image)[0]}" alt="Post image" />` : ''}
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