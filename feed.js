import { auth, database, storage } from './firebaseConfig.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { ref as dbRef, push, set, update, onChildAdded, onChildChanged } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
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

        postContent.value = '';
        postImage.value = '';
    } catch (error) {
        alert('❌ Error during post: ' + error.message);
        console.error(error);
    }
});

// Display new posts as they're added
const postFeedRef = dbRef(database, 'posts');
onChildAdded(postFeedRef, (snapshot) => {
    const post = snapshot.val();
    const postKey = snapshot.key;

    const postElement = document.createElement('div');
    postElement.className = 'post';
    postElement.setAttribute('data-id', postKey);

    const linkedContent = linkify(post.content);

    let imageHTML = '';
    if (post.imageURL) {
        alert('📷 Displaying image: ' + post.imageURL);
        imageHTML = `<img src="${post.imageURL}" alt="Post image" style="max-width: 300px; max-height: 300px;" />`;
    } else {
        alert('ℹ️ No image found for this post yet.');
    }

    postElement.innerHTML = `
        <strong>${post.username}</strong><br/>
        <p>${linkedContent}</p>
        <div class="post-image">${imageHTML}</div>
        <small>${new Date(post.timestamp).toLocaleString()}</small>
    `;

    postsDiv.prepend(postElement);
});

// Handle image being added later (after post text is already displayed)
onChildChanged(postFeedRef, (snapshot) => {
    const updatedPost = snapshot.val();
    const postKey = snapshot.key;

    const existingPost = document.querySelector(`.post[data-id="${postKey}"]`);
    if (existingPost && updatedPost.imageURL) {
        const postImageDiv = existingPost.querySelector('.post-image');
        if (postImageDiv) {
            postImageDiv.innerHTML = `<img src="${updatedPost.imageURL}" alt="Post image" style="max-width: 300px; max-height: 300px;" />`;
            alert('🖼️ Image loaded into post after upload.');
        }
    }
});

// Sign out
signOutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
        window.location.href = 'index.html';
    });
});