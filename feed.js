import { auth, database, storage } from './firebaseConfig.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { ref as dbRef, push, set, update, onChildAdded } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js';

// Match these to your HTML
const postContent = document.getElementById('postContent');
const postImage = document.getElementById('postImage');
const submitPost = document.getElementById('submitPost');
const postsDiv = document.getElementById('posts');
const signOutBtn = document.getElementById('signOut');

// 🔐 Redirect to sign-in if not logged in
onAuthStateChanged(auth, user => {
    if (!user) {
        window.location.href = 'signin.html';
    }
});

// 🔗 Convert plain URLs into clickable links
function linkify(text) {
    const urlPattern = /(\b(https?:\/\/|www\.)[^\s<>]+(?:\.[^\s<>]+)*(?:\/[^\s<>]*)?)/gi;
    return text.replace(urlPattern, (match) => {
        const url = match.startsWith('http') ? match : `https://${match}`;
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${match}</a>`;
    });
}

// ➕ Post content (text + optional image) with mobile-friendly alerts
submitPost.addEventListener('click', async () => {
    const content = postContent.value.trim();
    const imageFile = postImage.files[0];

    if (!content && !imageFile) {
        alert('Post must have text or an image.');
        return;
    }

    const user = auth.currentUser;
    if (!user) {
        alert('User not signed in.');
        return;
    }

    const postRef = push(dbRef(database, 'posts'));
    const postKey = postRef.key;

    const newPost = {
        uid: user.uid,
        username: user.displayName || 'Anonymous',
        content: content || '',
        timestamp: Date.now(),
    };

    try {
        alert('Saving post to database...');
        await set(postRef, newPost);

        if (imageFile) {
            alert('Uploading image, please wait...');
            const imgRef = storageRef(storage, `postImages/${postKey}`);
            await uploadBytes(imgRef, imageFile);
            alert('Image uploaded. Getting image URL...');
            const imageURL = await getDownloadURL(imgRef);

            alert('Updating post with image URL...');
            await update(postRef, { imageURL });
        }

        alert('Post successfully uploaded!');
        postContent.value = '';
        postImage.value = '';
    } catch (error) {
        alert('Something went wrong. Upload failed.');
    }
});

// 📥 Realtime feed listener
const postFeedRef = dbRef(database, 'posts');
onChildAdded(postFeedRef, (snapshot) => {
    const post = snapshot.val();

    const postElement = document.createElement('div');
    postElement.className = 'post';

    const linkedContent = linkify(post.content);

    postElement.innerHTML = `
        <strong>${post.username}</strong><br/>
        <p>${linkedContent}</p>
        ${post.imageURL ? `<img src="${post.imageURL}" alt="Post image" style="max-width: 300px; max-height: 300px;" />` : ''}
        <small>${new Date(post.timestamp).toLocaleString()}</small>
    `;

    postsDiv.prepend(postElement);
});

// 🚪 Sign out
signOutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
        window.location.href = 'index.html';
    });
});