import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, doc, updateDoc, increment, arrayUnion, query, orderBy, setDoc, getDoc, where, deleteDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

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

const storyInput = document.getElementById('storyInput');
const addStoryBtn = document.getElementById('add-story-btn');
const storiesListInner = document.getElementById('stories-list');

// --- 1. FIREBASE STORY SİSTEMİ ---
addStoryBtn?.addEventListener('click', () => storyInput.click());

storyInput?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    const user = auth.currentUser;
    if (!file || !user) return;
    const fd = new FormData();
    fd.append("image", file);
    try {
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: fd });
        const result = await res.json();
        if (result.success) {
            await addDoc(collection(db, "stories"), {
                url: result.data.url,
                userId: user.uid,
                username: user.displayName || user.email.split('@')[0],
                timestamp: serverTimestamp(),
                createdAt: Date.now()
            });
        }
    } catch (e) { alert("Story xətası!"); }
});

function listenToStories() {
    if (!storiesListInner) return;
    onSnapshot(query(collection(db, "stories"), orderBy("timestamp", "desc")), (snap) => {
        const now = Date.now();
        storiesListInner.innerHTML = '';
        snap.forEach(d => {
            const data = d.data();
            if (now - data.createdAt < 86400000) {
                storiesListInner.innerHTML += `
                    <div class="story-item active" onclick="openStoryViewer('${data.url}', '${data.username}')">
                        <div class="story-circle"><img src="${data.url}"></div>
                        <span class="story-username">${data.username}</span>
                    </div>`;
            }
        });
    });
}

// STORY VIEWER FUNKSİYALARI (Həmişə Window obyektinə bağlı)
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

// --- 2. BİLDİRİŞ VƏ POST SİSTEMİ ---
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
    } catch (e) { console.error(e); }
}

async function loadPosts() {
    const list = document.getElementById('post-list');
    if (!list || !auth.currentUser) return;
    const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
    const following = userDoc.exists() ? (userDoc.data().following || []) : [];
    onSnapshot(query(collection(db, "posts"), orderBy("timestamp", "desc")), (snap) => {
        list.innerHTML = '';
        const likedPosts = JSON.parse(localStorage.getItem('vibeLikes')) || [];
        snap.forEach(d => {
            const data = d.data();
            const id = d.id;
            const isLiked = likedPosts.includes(id);
            const isFollowing = following.includes(data.userId);
            list.innerHTML += renderPostHTML(id, data, isLiked, isFollowing);
        });
    });
}

function renderPostHTML(id, data, isLiked, isFollowing) {
    const author = data.userName || "İstifadəçi";
    const avatarImg = data.userPhoto || `https://ui-avatars.com/api/?name=${author}&background=random`;
    const commentsHTML = (data.comments || []).map(c => `<div class="comment-item"><b>${c.user}</b> ${c.text}</div>`).join('');
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

// GLOBAL FUNKSİYALAR
window.handleFollow = async (targetUserId) => {
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid === targetUserId) return;
    await updateDoc(doc(db, "users", currentUser.uid), { following: arrayUnion(targetUserId) });
    await updateDoc(doc(db, "users", targetUserId), { followers: arrayUnion(currentUser.uid) });
    const btns = document.querySelectorAll(`[id="follow-${targetUserId}"]`);
    btns.forEach(btn => {
        btn.innerText = "İzlənilir";
        btn.classList.add('following');
    });
    await sendNotification(targetUserId, "sizi izləməyə başladı.");
};

window.handleLike = async (id, postOwnerId) => {
    let liked = JSON.parse(localStorage.getItem('vibeLikes')) || [];
    if (liked.includes(id)) return;
    await updateDoc(doc(db, "posts", id), { likes: increment(1) });
    liked.push(id);
    localStorage.setItem('vibeLikes', JSON.stringify(liked));
    await sendNotification(postOwnerId, "postunuzu bəyəndi.");
};

window.addComment = async (postId, postOwnerId) => {
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
    await sendNotification(postOwnerId, "postunuza şərh yazdı.");
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

// --- YENİLİK MODAL SİSTEMİ (Əlavə) ---
window.closeNewsModal = function() {
    const modal = document.getElementById('news-modal');
    if(modal) modal.style.display = 'none';
    localStorage.setItem('vibe_news_seen', 'true');
}

// --- AUTH VƏ BAŞLANĞIÇ ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        loadPosts();
        listenToStories();
        
        // Yenilik modalını yoxla
        const hasSeen = localStorage.getItem('vibe_news_seen');
        if (!hasSeen) {
            setTimeout(() => {
                const modal = document.getElementById('news-modal');
                if(modal) modal.style.display = 'flex';
            }, 1500);
        }
    } else if (!window.location.pathname.includes("login.html")) {
        window.location.href = "login.html";
    }
});

if (document.getElementById('mainAddBtn')) document.getElementById('mainAddBtn').onclick = uploadPost;
if (document.getElementById('logout-btn')) document.getElementById('logout-btn').onclick = () => signOut(auth);
