import { auth, database, storage } from './firebaseConfig.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { ref as dbRef, push, onChildAdded } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js';

const postContent = document.getElementById('postContent');
const postImage = document.getElementById('postImage');
const submitPost = document.getElementById('submitPost');
const postsDiv = document.getElementById('posts');
const signOutBtn = document.getElementById('signOut');

onAuthStateChanged(auth, user => {
    if (!user) {
        window.location.href = 'signin.html'; // Redirect if not signed in
    }
});

// Create a post
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
});

// Load posts
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
        window.location.href = 'signin.html';
    });
});