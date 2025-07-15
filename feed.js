import { auth, database, storage } from './firebaseConfig.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { ref as dbRef, push, set, update, onChildAdded, onChildChanged } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
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
    const urlPattern = /(\b(https?:\/\/|www\.)[^\s<>]+(?:\.[^\s<>]*)?)/gi;
    return text.replace(urlPattern, (match) => {
        const url = match.startsWith('http') ? match : `https://${match}`;
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${match}</a>`;
    });
}

// ➕ Post content (text + optional image)
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
            const imgRef = storageRef(storage, `postImages/${postKey}/image.jpg`);
            await uploadBytes(imgRef, imageFile);

            alert('Image uploaded. Getting image URL...');
            const imageURL = await getDownloadURL(imgRef);

            if (!imageURL) {
                alert('Failed to get image URL.');
                return;
            }

            alert('Saving image URL to database...');
            await update(postRef, { imageURL });

            alert('✅ Image URL saved to database!');
        }

        alert('✅ Post successfully uploaded!');
        postContent.value = '';
        postImage.value = '';
    } catch (error) {
        alert('❌ Upload failed: ' + (error.message || error));
    }
});

// 📥 Realtime feed listener (new post)
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
        ${post.imageURL ? `
            <p><a href="${post.imageURL}" target="_blank">Open Image</a></p>
            <img src="${post.imageURL}" alt="Post image" style="max-width: 300px; border: 2px solid red; margin-top: 5px;" />
        ` : '<em>No image</em>'}
        <small>${new Date(post.timestamp).toLocaleString()}</small>
    `;

    postsDiv.prepend(postElement);
});

// 🔄 Realtime update: when imageURL is added later
onChildChanged(postFeedRef, (snapshot) => {
    const post = snapshot.val();
    const postKey = snapshot.key;

    const postElement = document.querySelector(`.post[data-key="${postKey}"]`);
    if (!postElement || !post.imageURL) return;

    // Avoid duplicating image if it's already there
    const existingImage = postElement.querySelector('img');
    if (existingImage) return;

    // Insert image before the timestamp
    const image = document.createElement('img');
    image.src = post.imageURL;
    image.alt = 'Post image';
    image.style.maxWidth = '300px';
    image.style.border = '2px solid red';
    image.style.marginTop = '5px';

    const timestampElement = postElement.querySelector('small');
    if (timestampElement) {
        postElement.insertBefore(image, timestampElement);
    } else {
        postElement.appendChild(image);
    }

    // Also add link (optional, matches debugging style)
    const link = document.createElement('p');
    link.innerHTML = `<a href="${post.imageURL}" target="_blank">Open Image</a>`;
    postElement.insertBefore(link, image);
});

// 🚪 Sign out
signOutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
        window.location.href = 'index.html';
    });
});