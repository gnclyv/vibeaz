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

// 1. BİLDİRİŞ SİSTEMİ
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

function setupNotifListener(uid) {
    const nDot = document.getElementById('notif-dot');
    const nList = document.getElementById('notif-list');
    const q = query(collection(db, "notifications"), where("toUserId", "==", uid), orderBy("timestamp", "desc"));

    onSnapshot(q, (snap) => {
        if (!nList) return;
        nList.innerHTML = "";
        let unread = false;
        snap.forEach(d => {
            const data = d.data();
            if (data.read === false) unread = true;
            nList.innerHTML += `<div class="notif-item"><img src="${data.fromUserPhoto || 'https://ui-avatars.com/api/?name='+data.fromUserName}"><div class="notif-text"><b>${data.fromUserName}</b> ${data.type}</div></div>`;
        });
        if (nDot) nDot.style.display = unread ? 'block' : 'none';
    });
}

// 2. POST VƏ ŞƏRH FUNKSİYALARI
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
        input.value = ""; // Girişi təmizlə
        await sendNotification(postOwnerId, "postunuza şərh yazdı.");
    } catch (e) {
        console.error("Şərh xətası:", e);
        alert("Şərh paylaşıla bilmədi.");
    }
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

// 3. POSTLARI YÜKLƏMƏ VƏ RENDER
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
                <div class="comments-container" id="comments-${id}">${commentsHTML}</div>
                <div class="comment-input-wrapper">
                    <input type="text" id="input-${id}" placeholder="Şərh yaz...">
                    <button class="comment-post-btn" onclick="addComment('${id}', '${data.userId}')">Paylaş</button>
                </div>
            </div>
        </div>`;
}

// 4. AUTH VƏ FAYL YÜKLƏMƏ
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const displayNick = user.displayName || user.email.split('@')[0];
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            await setDoc(userRef, { uid: user.uid, displayName: displayNick, photoURL: user.photoURL || "", followers: [], following: [] }, { merge: true });
        }
        updateNavAvatar(user, displayNick);
        loadPosts();
        setupNotifListener(user.uid);
    } else if (!window.location.pathname.includes("login.html")) {
        window.location.href = "login.html";
    }
});

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

// 5. NAVİQASİYA VƏ PANEL
function updateNavAvatar(user, nick) {
    const navAvatar = document.getElementById('nav-user-avatar');
    if (navAvatar) {
        const userPhoto = user.photoURL || `https://ui-avatars.com/api/?name=${nick}&background=random&color=fff`;
        navAvatar.innerHTML = `<img src="${userPhoto}" class="nav-profile-img">`;
    }
}

if (document.getElementById('mainAddBtn')) document.getElementById('mainAddBtn').onclick = uploadPost;
if (document.getElementById('logout-btn')) document.getElementById('logout-btn').onclick = () => signOut(auth);

const nBtn = document.getElementById('notif-btn');
if (nBtn) nBtn.onclick = (e) => {
    e.stopPropagation();
    const panel = document.getElementById('notif-panel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    document.getElementById('notif-dot').style.display = 'none';
};
document.onclick = () => { if(document.getElementById('notif-panel')) document.getElementById('notif-panel').style.display = 'none'; };
