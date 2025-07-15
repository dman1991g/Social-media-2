import { auth, database, storage } from './firebaseConfig.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { ref as dbRef, push, set, onChildAdded } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js';

const postContent = document.getElementById('postContent');
const postImage = document.getElementById('postImage');
const submitPost = document.getElementById('submitPost');
const postsDiv = document.getElementById('posts');
const signOutBtn = document.getElementById('signOut');

onAuthStateChanged(auth, user => {
    if (!user) {
        window.location.href = 'signin.html';
    }
});

function linkify(text) {
    const urlPattern = /(\b(https?:\/\/|www\.)[^\s<>]+(?:\.[^\s<>]+)*(?:\/[^\s<>]*)?)/gi;
    return text.replace(urlPattern, (match) => {
        const url = match.startsWith('http') ? match : `https://${match}`;
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${match}</a>`;
    });
}

submitPost.addEventListener('click', async () => {
    const content = postContent.value.trim();
    const imageFile = postImage.files[0];

    if (!content && !imageFile) return;

    const user = auth.currentUser;
    if (!user) return;

    const postRef = push(dbRef(database, 'posts')); // 🔑 Create post key first
    const postKey = postRef.key;

    const newPost = {
        uid: user.uid,
        username: user.displayName || 'Anonymous',
        content: content || '',
        timestamp: Date.now()
    };

    try {
        // ⬆️ Upload image first if there is one
        if (imageFile) {
            const imgRef = storageRef(storage, `postImages/${postKey}/image.jpg`);
            await uploadBytes(imgRef, imageFile);
            const imageURL = await getDownloadURL(imgRef);
            newPost.imageURL = imageURL;
        }

        // ✅ Save full post (with imageURL if uploaded)
        await set(postRef, newPost);

        // Clear inputs
        postContent.value = '';
        postImage.value = '';
    } catch (error) {
        alert('❌ Upload failed: ' + (error.message || error));
    }
});

const postFeedRef = dbRef(database, 'posts');
onChildAdded(postFeedRef, (snapshot) => {
    const post = snapshot.val();
    const postKey = snapshot.key;

    const postElement = document.createElement('div');
    postElement.className = 'post';
    postElement.setAttribute('data-key', postKey);

    const linkedContent = linkify(post.content || '');

    postElement.innerHTML = `
        <strong>${post.username}</strong><br/>
        <p>${linkedContent}</p>
        ${post.imageURL ? `<img src="${post.imageURL}" alt="Post image" style="max-width: 300px; margin-top: 5px;" />` : ''}
        <small>${new Date(post.timestamp).toLocaleString()}</small>
    `;

    postsDiv.prepend(postElement);
});

signOutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
        window.location.href = 'index.html';
    });
});