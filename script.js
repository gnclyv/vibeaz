import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, doc, updateDoc, increment, arrayUnion, query, orderBy, getDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCUXJcQt0zkmQUul53VzgZOnX9UqvXKz3w",
    authDomain: "vibeaz-1e98a.firebaseapp.com",
    projectId: "vibeaz-1e98a",
    storageBucket: "vibeaz-1e98a.firebasestorage.app",
    messagingSenderId: "953434260285",
    appId: "1:953434260285:web:6263b4372487ba6d673b54"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const IMGBB_API_KEY = "c405e03c9dde65d450d8be8bdcfda25f";
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/demo/video/upload";
const CLOUDINARY_UPLOAD_PRESET = "docs_upload_example_us_preset";

// --- 1. STORY SİSTEMİ (HEKAYƏLƏR) ---
window.openStoryViewer = function(url, username) {
    const viewer = document.getElementById('story-viewer');
    const fullImg = document.getElementById('story-full-img');
    const viewerUser = document.getElementById('viewer-username');
    if(!viewer || !fullImg) return;

    fullImg.src = url;
    viewerUser.innerText = username;
    viewer.style.display = 'flex';
    
    const progress = document.getElementById('progress-fill');
    if(progress) {
        progress.style.transition = 'none';
        progress.style.width = '0%';
        setTimeout(() => {
            progress.style.transition = 'width 5s linear';
            progress.style.width = '100%';
        }, 100);
    }
    clearTimeout(window.storyTimeout);
    window.storyTimeout = setTimeout(window.closeStory, 5000);
}

window.closeStory = function() {
    const viewer = document.getElementById('story-viewer');
    if(viewer) viewer.style.display = 'none';
    clearTimeout(window.storyTimeout);
}

function listenToStories() {
    const storiesListInner = document.getElementById('stories-list');
    if (!storiesListInner) return;
    onSnapshot(query(collection(db, "stories"), orderBy("timestamp", "desc")), (snap) => {
        const now = Date.now();
        storiesListInner.innerHTML = '';
        snap.forEach(d => {
            const data = d.data();
            // 24 saatlıq hekayə məntiqi
            if (data.timestamp && (now - data.timestamp.toMillis() < 86400000)) {
                storiesListInner.innerHTML += `
                    <div class="story-item active" onclick="openStoryViewer('${data.url}', '${data.username}')">
                        <div class="story-circle"><img src="${data.url}"></div>
                        <span class="story-username">${data.username}</span>
                    </div>`;
            }
        });
    });
}

// --- 2. MULTIMEDIA RENDER (POSTLAR) ---
function renderPostHTML(id, data, isLiked, isFollowing) {
    const author = data.userName || "İstifadəçi";
    const avatarImg = data.userPhoto || `https://ui-avatars.com/api/?name=${author}&background=random`;
    const isVideo = data.url.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || data.type === 'video';
    
    const mediaContent = isVideo 
        ? `<video src="${data.url}" class="post-video" loop muted autoplay playsinline onclick="this.paused ? this.play() : this.pause()"></video>` 
        : `<img src="${data.url}" loading="lazy">`;

    const commentsHTML = (data.comments || []).map(c => `
        <div class="modern-comment">
            <span class="comment-user">${c.user}</span>
            <span class="comment-text">${c.text}</span>
        </div>`).join('');
    
    const btnText = isFollowing ? "İzlənilir" : "İzlə";
    const btnClass = isFollowing ? "follow-btn following" : "follow-btn";

    return `
        <div class="post-card">
            <div class="post-header">
                <div class="nav-avatar-wrapper"><img src="${avatarImg}" class="nav-profile-img"></div>
                <div class="post-header-info">
                    <span class="post-username-text">${author}</span>
                    <button class="${btnClass}" onclick="handleFollow('${data.userId}')" id="follow-${data.userId}">${btnText}</button>
                </div>
            </div>
            <div class="post-img-container" ondblclick="handleLike('${id}', '${data.userId}')">
                ${mediaContent}
            </div>
            <div class="post-actions">
                <i class="${isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}" onclick="handleLike('${id}', '${data.userId}')" style="color:${isLiked ? '#ff3040' : 'white'}"></i>
                <i class="fa-regular fa-comment" onclick="document.getElementById('input-${id}').focus()"></i>
            </div>
            <div class="post-info-section">
                <div class="likes-count">${data.likes || 0} bəyənmə</div>
                <div class="post-description"><b>${author}</b> ${data.text || ""}</div>
                <div class="modern-comments-box">${commentsHTML}</div>
                <div class="modern-comment-input-area">
                    <input type="text" id="input-${id}" placeholder="Şərh əlavə et..." class="modern-input">
                    <button class="modern-post-btn" onclick="addComment('${id}', '${data.userId}')">Paylaş</button>
                </div>
            </div>
        </div>`;
}

// --- 3. YÜKLƏMƏ MƏNTİQİ (STORY VƏ POST) ---
async function uploadMedia(targetType = "post") {
    const fileInp = document.createElement('input');
    fileInp.type = 'file';
    fileInp.accept = "image/*,video/*";
    
    fileInp.onchange = async (e) => {
        const file = e.target.files[0];
        const user = auth.currentUser;
        if (!file || !user) return;

        alert(targetType === "story" ? "Story yüklənir..." : "Post yüklənir...");

        if (file.type.startsWith("video/")) {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

            try {
                const res = await fetch(CLOUDINARY_URL, { method: "POST", body: formData });
                const result = await res.json();
                if (result.secure_url) await saveToDB(result.secure_url, "video", targetType);
            } catch (err) { alert("Video yüklənmədi!"); }
        } else {
            const fd = new FormData();
            fd.append("image", file);
            try {
                const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: fd });
                const result = await res.json();
                if (result.success) await saveToDB(result.data.url, "image", targetType);
            } catch (e) { alert("Şəkil yüklənmədi!"); }
        }
    };
    fileInp.click();
}

async function saveToDB(url, mediaType, targetType) {
    const user = auth.currentUser;
    const collectionName = targetType === "story" ? "stories" : "posts";
    const data = {
        url: url,
        type: mediaType,
        userName: user.displayName || user.email.split('@')[0],
        userPhoto: user.photoURL || "",
        userId: user.uid,
        timestamp: serverTimestamp()
    };
    
    if(targetType === "post") {
        data.text = prompt("Açıqlama yazın:") || "";
        data.likes = 0;
        data.comments = [];
    } else {
        data.username = user.displayName || user.email.split('@')[0];
    }

    await addDoc(collection(db, collectionName), data);
    alert(targetType === "story" ? "Story paylaşıldı!" : "Post paylaşıldı!");
}

// --- 4. QALAN FUNKSİYALAR ---
window.handleLike = async (id) => {
    let liked = JSON.parse(localStorage.getItem('vibeLikes')) || [];
    if (liked.includes(id)) return;
    await updateDoc(doc(db, "posts", id), { likes: increment(1) });
    liked.push(id);
    localStorage.setItem('vibeLikes', JSON.stringify(liked));
};

window.addComment = async (postId) => {
    const input = document.getElementById(`input-${postId}`);
    const commentText = input.value.trim();
    if (!commentText || !auth.currentUser) return;
    await updateDoc(doc(db, "posts", postId), {
        comments: arrayUnion({
            user: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
            text: commentText,
            time: Date.now()
        })
    });
    input.value = "";
};

window.handleFollow = async (targetUserId) => {
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid === targetUserId) return;
    await updateDoc(doc(db, "users", currentUser.uid), { following: arrayUnion(targetUserId) });
    await updateDoc(doc(db, "users", targetUserId), { followers: arrayUnion(currentUser.uid) });
    document.querySelectorAll(`[id="follow-${targetUserId}"]`).forEach(btn => {
        btn.innerText = "İzlənilir";
        btn.classList.add('following');
    });
};

// --- 5. AUTH VƏ SNAPSHOT ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        listenToStories();
        const postList = document.getElementById('post-list');
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const following = userDoc.exists() ? (userDoc.data().following || []) : [];

        onSnapshot(query(collection(db, "posts"), orderBy("timestamp", "desc")), (snap) => {
            if (postList) {
                postList.innerHTML = '';
                snap.forEach(d => {
                    const data = d.data();
                    const isFollowing = following.includes(data.userId);
                    postList.innerHTML += renderPostHTML(d.id, data, false, isFollowing);
                });
            }
        });
    } else {
        if (!window.location.pathname.includes("login.html")) window.location.href = "login.html";
    }
});

// Event Listeners
if (document.getElementById('add-story-btn')) {
    document.getElementById('add-story-btn').onclick = () => uploadMedia("story");
}
if (document.getElementById('mainAddBtn')) {
    document.getElementById('mainAddBtn').onclick = () => uploadMedia("post");
}
if (document.getElementById('logout-btn')) {
    document.getElementById('logout-btn').onclick = () => signOut(auth);
}
