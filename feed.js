import { auth, database, storage } from './firebaseConfig.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { ref as dbRef, push, set, update, onChildAdded } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js';

// Match to HTML elements
const postContent = document.getElementById('postContent');
const postImage = document.getElementById('postImage');
const submitPost = document.getElementById('submitPost');
const postsDiv = document.getElementById('posts');
const signOutBtn = document.getElementById('signOut');

// Redirect if not logged in
onAuthStateChanged(auth, user => {
    if (!user) {
        window.location.href = 'signin.html';
    }
});

// Convert URLs into clickable links
function linkify(text) {
    const urlPattern = /(\b(https?:\/\/|www\.)[^\s<>]+(?:\.[^\s<>]+)*(?:\/[^\s<>]*)?)/gi;
    return text.replace(urlPattern, (match) => {
        const url = match.startsWith('http') ? match : `https://${match}`;
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${match}</a>`;
    });
}

// Post content (with optional image)
submitPost.addEventListener('click', async () => {
    const content = postContent.value.trim();
    const imageFile = postImage.files[0];

    if (!content && !imageFile) {
        alert('Post content or image is required.');
        return;
    }

    const user = auth.currentUser;
    if (!user) {
        alert('You must be signed in to post.');
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
        await set(postRef, newPost);
        alert('✅ Post text saved to database.');

        if (imageFile) {
            const imgRef = storageRef(storage, `postImages/${postKey}/${imageFile.name}`);
            alert('⏳ Uploading image...');

            await uploadBytes(imgRef, imageFile);
            alert('✅ Image uploaded successfully.');

            const imageURL = await getDownloadURL(imgRef);
            alert('🌐 Image URL retrieved: ' + imageURL);

            await update(postRef, { imageURL });
            alert('✅ Image URL added to post.');
        }

        // Clear form
        postContent.value = '';
        postImage.value = '';
    } catch (error) {
        alert('❌ Error during post: ' + error.message);
        console.error(error);
    }
});

// Realtime feed listener
const postFeedRef = dbRef(database, 'posts');
onChildAdded(postFeedRef, (snapshot) => {
    const post = snapshot.val();

    const postElement = document.createElement('div');
    postElement.className = 'post';

    const linkedContent = linkify(post.content);

    let imageHTML = '';
    if (post.imageURL) {
        alert('📷 Displaying image: ' + post.imageURL);
        imageHTML = `<img src="${post.imageURL}" alt="Post image" style="max-width: 300px; max-height: 300px;" />`;
    } else {
        alert('ℹ️ No image found for this post.');
    }

    postElement.innerHTML = `
        <strong>${post.username}</strong><br/>
        <p>${linkedContent}</p>
        ${imageHTML}
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