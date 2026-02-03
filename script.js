import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, doc, updateDoc, increment, arrayUnion, query, orderBy } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

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

onAuthStateChanged(auth, (user) => {
    if (user) {
        const displayNick = user.displayName || user.email.split('@')[0];
        updateNavAvatar(user, displayNick);
        loadPosts();
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
                    userId: user.uid,
                    likes: 0,
                    comments: [],
                    timestamp: serverTimestamp()
                });
            }
        } catch (e) { alert("Xəta!"); }
    };
    fileInp.click();
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
            const author = data.userName || "İstifadəçi";
            list.innerHTML += renderPostHTML(id, data, isLiked, author);
        });
    });
}

function renderPostHTML(id, data, isLiked, author) {
    const commentsHTML = (data.comments || []).map(c => `
        <div class="comment-item"><b>${c.user}</b> ${c.text}</div>
    `).join('');

    return `
        <div class="post-card">
            <div class="post-header">
                <div class="nav-avatar-wrapper">
                    <img src="https://ui-avatars.com/api/?name=${author}&background=random" class="nav-profile-img">
                </div>
                <div class="post-header-info">
                    <span>${author}</span>
                    <button class="follow-btn" onclick="handleFollow('${data.userId}')">• İzlə</button>
                </div>
            </div>
            <div class="post-img-container" ondblclick="handleLike('${id}')">
                <img src="${data.url}" loading="lazy">
            </div>
            <div class="post-actions">
                <i class="${isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}" onclick="handleLike('${id}')" style="color:${isLiked ? '#ff3040' : 'white'}"></i>
                <i class="fa-regular fa-comment" onclick="document.getElementById('input-${id}').focus()"></i>
            </div>
            <div class="post-info-section">
                <div class="likes-count">${data.likes || 0} bəyənmə</div>
                <div class="post-description"><b>${author}</b> ${data.text || ""}</div>
                <div class="comments-container" id="comments-${id}">${commentsHTML}</div>
                <div class="comment-input-wrapper">
                    <input type="text" id="input-${id}" placeholder="Şərh yaz...">
                    <button class="comment-post-btn" onclick="addComment('${id}')">Paylaş</button>
                </div>
            </div>
        </div>`;
}

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

window.handleFollow = async (targetId) => {
    alert("İzləmə siyahısına əlavə edildi!"); 
    // Burada Firestore-da users kolleksiyasını yeniləyən kodu əlavə edə bilərsən
};

if (document.getElementById('mainAddBtn')) document.getElementById('mainAddBtn').onclick = uploadPost;
