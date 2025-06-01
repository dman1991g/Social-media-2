import { auth, database, storage } from './firebaseConfig.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { ref as dbRef, push, update, onChildAdded } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js';

const postContent = document.getElementById('postInput');    // textarea for post text
const postImage = document.getElementById('imageInput');      // file input for image
const submitPost = document.getElementById('postButton');     // button to submit post
const postsDiv = document.getElementById('postFeed');         // container div for posts
const signOutBtn = document.getElementById('signOut');

onAuthStateChanged(auth, user => {
    if (!user) {
        window.location.href = 'signin.html'; // Redirect if not signed in
    }
});

// Create a post with optional image upload
submitPost.addEventListener('click', async () => {
    const content = postContent.value.trim();
    const imageFile = postImage.files[0];

    if (!content && !imageFile) return; // Don't post empty content

    const user = auth.currentUser;
    if (!user) return;

    // Create a new post entry with initial data
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
        // Upload image to storage
        const imgRef = storageRef(storage, `postImages/${postKey}`);
        await uploadBytes(imgRef, imageFile);

        // Get image URL
        const imageURL = await getDownloadURL(imgRef);

        // Update post with image URL
        await update(postRef, { imageURL });
    }

    // Clear inputs after posting
    postContent.value = '';
    postImage.value = '';
});

// Load and display posts in realtime
const postFeedRef = dbRef(database, 'posts');
onChildAdded(postFeedRef, (snapshot) => {
    const post = snapshot.val();

    const postElement = document.createElement('div');
    postElement.className = 'post';

    postElement.innerHTML = `
        <strong>${post.username}</strong><br/>
        <p>${post.content}</p>
        ${post.imageURL ? `<img src="${post.imageURL}" alt="Post image" style="max-width: 300px; max-height: 300px;"/>` : ''}
        <small>${new Date(post.timestamp).toLocaleString()}</small>
    `;

    postsDiv.prepend(postElement);
});

// Sign out functionality
signOutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
        window.location.href = 'index.html';
    });
});