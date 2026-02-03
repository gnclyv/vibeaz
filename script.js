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
const storiesListInner = document.getElementById('stories-list');

// --- 1. FIREBASE STORY SİSTEMİ ---
document.getElementById('add-story-btn')?.addEventListener('click', () => storyInput.click());

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
    } catch (e) { console.error("Story xətası:", e); }
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
                    <div class="story-item" onclick="openStoryViewer('${data.url}', '${data.username}')">
                        <div class="story-circle"><img src="${data.url}"></div>
                        <span class="story-username">${data.username}</span>
                    </div>`;
            }
        });
    });
}

// --- 2. POST SİSTEMİ ---
function loadPosts() {
    const list = document.getElementById('post-list');
    if (!list) return;
    onSnapshot(query(collection(db, "posts"), orderBy("timestamp", "desc")), (snap) => {
        list.innerHTML = '';
        snap.forEach(d => {
            const data = d.data();
            const id = d.id;
            const author = data.userName || "İstifadəçi";
            const avatarImg = data.userPhoto || `https://ui-avatars.com/api/?name=${author}&background=random`;
            
            list.innerHTML += `
                <div class="post-card">
                    <div class="post-header">
                        <div class="post-header-left">
                            <img src="${avatarImg}" class="nav-profile-img">
                            <span>${author}</span>
                        </div>
                        <button class="follow-btn" onclick="handleFollow('${data.userId}')" id="follow-${data.userId}">İzlə</button>
                    </div>
                    <div class="post-img-container" ondblclick="handleLike('${id}')">
                        <img src="${data.url}" loading="lazy">
                    </div>
                    <div class="post-actions">
                        <i class="fa-regular fa-heart" onclick="handleLike('${id}')"></i>
                        <i class="fa-regular fa-comment"></i>
                    </div>
                    <div class="post-info-section">
                        <div class="likes-count">${data.likes || 0} bəyənmə</div>
                        <div class="post-description"><b>${author}</b> ${data.text || ""}</div>
                    </div>
                </div>`;
        });
    });
}

// GLOBAL FUNKSİYALAR
window.handleFollow = (uid) => {
    const btn = document.getElementById(`follow-${uid}`);
    if(btn) { btn.innerText = "İzlənilir"; btn.style.background = "#333"; }
};

window.handleLike = async (id) => {
    await updateDoc(doc(db, "posts", id), { likes: increment(1) });
};

// --- 3. AUTH MUSHAHIDƏSİ ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        loadPosts();
        listenToStories();
    } else if (!window.location.pathname.includes("login.html")) {
        window.location.href = "login.html";
    }
});
