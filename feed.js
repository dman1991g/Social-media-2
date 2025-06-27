import { auth, database, storage } from './firebaseConfig.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { ref as dbRef, push, set, update, onChildAdded } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js';

// Match these to your HTML
const postContent = document.getElementById('postContent');    // textarea
const postImage = document.getElementById('postImage');        // file input
const submitPost = document.getElementById('submitPost');      // post button
const postsDiv = document.getElementById('posts');             // container for posts
const signOutBtn = document.getElementById('signOut');         // sign out button

onAuthStateChanged(auth, user => {
    if (!user) {
        window.location.href = 'signin.html'; // Redirect if not signed in
    }
});

// Submit post (text + optional image)
submitPost.addEventListener('click', async () => {
    const content = postContent.value.trim();
    const imageFile = postImage.files[0];

    if (!content && !imageFile) return; // Don't post empty

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

    // Clear input fields
    postContent.value = '';
    postImage.value = '';
});

// Realtime feed listener
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