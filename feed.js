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

// ➕ Post content (text + optional image) with alerts for mobile debugging
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
            
            // ✅ Use a subpath: postImages/{postKey}/image.jpg
            const imgRef = storageRef(storage, `postImages/${postKey}/image.jpg`);
            await uploadBytes(imgRef, imageFile);

            alert('Image uploaded. Getting image URL...');
            const imageURL = await getDownloadURL(imgRef);

            if (!imageURL) {
                alert('Failed to get image URL.');
                return;
            }

            alert('Saving image URL to database...');
            const postPathRef = dbRef(database, `posts/${postKey}`);
            await update(postPathRef, { imageURL });

            alert('✅ Image URL saved to database!');
        }

        alert('✅ Post successfully uploaded!');
        postContent.value = '';
        postImage.value = '';
    } catch (error) {
        alert('❌ Upload failed: ' + (error.message || error));
    }
});

// 📥 Realtime feed listener
const postFeedRef = dbRef(database, 'posts');
onChildAdded(postFeedRef, (snapshot) => {
    const post = snapshot.val();
    const postKey = snapshot.key;

    const postElement = document.createElement('div');
    postElement.className = 'post';
    postElement.setAttribute('data-key', postKey); // used for possible future updates

    const linkedContent = linkify(post.content || '');

    postElement.innerHTML = `
        <strong>${post.username}</strong><br/>
        <p>${linkedContent}</p>
        ${post.imageURL ? `<img src="${post.imageURL}" alt="Post image" style="max-width: 300px; border: 2px solid #ccc; margin-top: 5px;" />` : ''}
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