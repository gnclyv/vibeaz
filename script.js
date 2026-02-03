import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, doc, updateDoc, increment, arrayUnion, query, orderBy, setDoc, getDoc, where } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

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

// --- STORY FUNKSİYALARI (YENİ ƏLAVƏ) ---
const storyInput = document.getElementById('storyInput');
const addStoryBtn = document.getElementById('add-story-btn');
const storiesListInner = document.getElementById('stories-list');

addStoryBtn?.addEventListener('click', () => storyInput.click());

storyInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const user = auth.currentUser;
            const stories = JSON.parse(localStorage.getItem('vibe_stories') || '[]');
            stories.push({
                url: event.target.result,
                username: user ? (user.displayName || user.email.split('@')[0]) : "İstifadəçi",
                time: Date.now()
            });
            localStorage.setItem('vibe_stories', JSON.stringify(stories));
            renderStories();
        };
        reader.readAsDataURL(file);
    }
});

function renderStories() {
    const stories = JSON.parse(localStorage.getItem('vibe_stories') || '[]');
    const now = Date.now();
    const validStories = stories.filter(s => now - s.time < 86400000);
    localStorage.setItem('vibe_stories', JSON.stringify(validStories));

    if(storiesListInner) {
        storiesListInner.innerHTML = validStories.map((s, i) => `
            <div class="story-item active" onclick="openStory(${i})">
                <div class="story-circle"><img src="${s.url}"></div>
                <span class="story-username">${s.username}</span>
            </div>
        `).join('');
    }
}

window.openStory = function(i) {
    const stories = JSON.parse(localStorage.getItem('vibe_stories') || '[]');
    const s = stories[i];
    const viewer = document.getElementById('story-viewer');
    
    document.getElementById('story-full-img').src = s.url;
    document.getElementById('viewer-username').innerText = s.username;
    document.getElementById('viewer-avatar').src = s.url;
    viewer.style.display = 'flex';
    
    const progress = document.getElementById('progress-fill');
    progress.style.transition = 'none';
    progress.style.width = '0%';
    setTimeout(() => {
        progress.style.transition = 'width 5s linear';
        progress.style.width = '100%';
    }, 100);

    window.storyTimeout = setTimeout(closeStory, 5000);
}

window.closeStory = function() {
    const viewer = document.getElementById('story-viewer');
    if(viewer) viewer.style.display = 'none';
    clearTimeout(window.storyTimeout);
}

// --- BİLDİRİŞ VƏ POST SİSTEMİ (SƏNİN KODUN) ---
async function sendNotification(targetUserId, typeMessage) {
    const user = auth.currentUser;
    if (!user || user.uid === targetUserId) return;
    try {
        await addDoc(collection(db, "notifications"), {
            toUserId: targetUserId,
            fromUserName: user.displayName || user.email.split('@')[0],
            fromUserPhoto: user.photoURL || "",
            type: typeMessage,
            timestamp: serverTimestamp(),
            read: false
        });
    } catch (e) { console.error("Notif error:", e); }
}

function loadPosts() {
    const list = document.getElementById('post-list');
    if (!list) return;
    const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
    onSnapshot(q, (snap) => {
        list.innerHTML = '';
        const likedPosts = JSON.parse(localStorage.getItem('vibeLikes')) || [];
        snap.forEach(d => {
            const data = d.data();
            const id = d.id;
            const isLiked = likedPosts.includes(id);
            list.innerHTML += renderPostHTML(id, data, isLiked);
        });
    });
}

function renderPostHTML(id, data, isLiked) {
    const author = data.userName || "İstifadəçi";
    const avatarImg = data.userPhoto ? data.userPhoto : `https://ui-avatars.com/api/?name=${author}&background=random`;
    const commentsHTML = (data.comments || []).map(c => `<div class="comment-item"><b>${c.user}</b> ${c.text}</div>`).join('');
    
    return `
        <div class="post-card">
            <div class="post-header">
                <div class="nav-avatar-wrapper"><img src="${avatarImg}" class="nav-profile-img"></div>
                <div class="post-header-info">
                    <span>${author}</span>
                    <button class="follow-btn" onclick="handleFollow('${data.userId}')" id="follow-${data.userId}">• İzlə</button>
                </div>
            </div>
            <div class="post-img-container" ondblclick="handleLike('${id}', '${data.userId}')">
                <img src="${data.url}" loading="lazy">
            </div>
            <div class="post-actions">
                <i class="${isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}" onclick="handleLike('${id}', '${data.userId}')" style="color:${isLiked ? '#ff3040' : 'white'}"></i>
                <i class="fa-regular fa-comment" onclick="document.getElementById('input-${id}').focus()"></i>
            </div>
            <div class="post-info-section">
                <div class="likes-count">${data.likes || 0} bəyənmə</div>
                <div class="post-description"><b>${author}</b> ${data.text || ""}</div>
                <div class="comments-container">${commentsHTML}</div>
                <div class="comment-input-wrapper">
                    <input type="text" id="input-${id}" placeholder="Şərh yaz...">
                    <button class="comment-post-btn" onclick="addComment('${id}', '${data.userId}')">Paylaş</button>
                </div>
            </div>
        </div>`;
}

// Global funksiyalar (HTML-dən çağırıldığı üçün window obyektinə bağlanır)
window.addComment = async (postId, postOwnerId) => {
    const input = document.getElementById(`input-${postId}`);
    const commentText = input.value.trim();
    if (!commentText || !auth.currentUser) return;
    try {
        await updateDoc(doc(db, "posts", postId), {
            comments: arrayUnion({
                user: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
                text: commentText,
                time: Date.now()
            })
        });
        input.value = "";
        await sendNotification(postOwnerId, "postunuza şərh yazdı.");
    } catch (e) { console.error("Şərh xətası:", e); }
};

window.handleLike = async (id, postOwnerId) => {
    let liked = JSON.parse(localStorage.getItem('vibeLikes')) || [];
    if (liked.includes(id)) return;
    await updateDoc(doc(db, "posts", id), { likes: increment(1) });
    liked.push(id);
    localStorage.setItem('vibeLikes', JSON.stringify(liked));
    await sendNotification(postOwnerId, "postunuzu bəyəndi.");
};

window.handleFollow = async (targetUserId) => {
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid === targetUserId) return;
    await updateDoc(doc(db, "users", currentUser.uid), { following: arrayUnion(targetUserId) });
    await updateDoc(doc(db, "users", targetUserId), { followers: arrayUnion(currentUser.uid) });
    const btn = document.getElementById(`follow-${targetUserId}`);
    if (btn) btn.innerText = "• İzlənilir";
    await sendNotification(targetUserId, "sizi izləməyə başladı.");
};

async function uploadPost() {
    const fileInp = document.getElementById('fileInput');
    fileInp.onchange = async () => {
        const user = auth.currentUser;
        if (!user || !fileInp.files[0]) return;
        const fd = new FormData();
        fd.append("image", fileInp.files[0]);
        try {
            const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: fd });
            const result = await res.json();
            if (result.success) {
                const text = prompt("Açıqlama yazın:");
                await addDoc(collection(db, "posts"), {
                    url: result.data.url,
                    text: text || "",
                    userName: user.displayName || user.email.split('@')[0],
                    userPhoto: user.photoURL || "",
                    userId: user.uid,
                    likes: 0,
                    comments: [],
                    timestamp: serverTimestamp()
                });
            }
        } catch (e) { alert("Yükləmə xətası!"); }
    };
    fileInp.click();
}

// AUTH MUSHAHIDƏSİ
onAuthStateChanged(auth, async (user) => {
    if (user) {
        loadPosts();
        renderStories(); // Story-ləri yüklə
        const displayNick = user.displayName || user.email.split('@')[0];
        updateNavAvatar(user, displayNick);
    } else if (!window.location.pathname.includes("login.html")) {
        window.location.href = "login.html";
    }
});

function updateNavAvatar(user, nick) {
    const navAvatar = document.getElementById('nav-user-avatar');
    if (navAvatar) {
        const userPhoto = user.photoURL || `https://ui-avatars.com/api/?name=${nick}&background=random&color=fff`;
        navAvatar.innerHTML = `<img src="${userPhoto}" class="nav-profile-img">`;
    }
}

// Event Listeners
if (document.getElementById('mainAddBtn')) document.getElementById('mainAddBtn').onclick = uploadPost;
if (document.getElementById('logout-btn')) document.getElementById('logout-btn').onclick = () => signOut(auth);
