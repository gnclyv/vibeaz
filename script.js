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

// --- 1. STORY SİSTEMİ ---
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

// --- 2. İSTİFADƏÇİ SİSTEMİ ---
async function registerUserInFirestore(user) {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    try {
        await setDoc(userRef, {
            uid: user.uid,
            displayName: user.displayName || user.email.split('@')[0],
            email: user.email,
            photoURL: user.photoURL || "",
            lastSeen: serverTimestamp()
        }, { merge: true });
    } catch (e) { console.error("User Reg Error:", e); }
}

function loadDirectUsers() {
    const usersListContainer = document.getElementById('users-list');
    if (!usersListContainer) return;
    onSnapshot(collection(db, "users"), (snapshot) => {
        usersListContainer.innerHTML = '';
        snapshot.forEach((doc) => {
            const userData = doc.data();
            if (userData.uid !== auth.currentUser?.uid) {
                const blueTick = userData.isVerified ? '<i class="fa-solid fa-circle-check" style="color: #3897f0; font-size: 10px; margin-left: 3px;"></i>' : '';
                const userCard = document.createElement('div');
                userCard.className = 'user-card';
                const userImg = userData.photoURL || `https://ui-avatars.com/api/?name=${userData.displayName || 'User'}&background=0095f6&color=fff`;
                // Bu hissəni profilə (up.html) yönləndirmə üçün düzəltdim
                userCard.innerHTML = `<a href="up.html?uid=${userData.uid}"><img src="${userImg}"><span>${userData.displayName || "İstifadəçi"} ${blueTick}</span></a>`;
                usersListContainer.appendChild(userCard);
            }
        });
    });
}

// --- 3. POST SİSTEMİ ---
async function loadPosts() {
    const list = document.getElementById('post-list');
    if (!list || !auth.currentUser) return;
    
    const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
    const following = userDoc.exists() ? (userDoc.data().following || []) : [];

    onSnapshot(query(collection(db, "posts"), orderBy("timestamp", "desc")), (snap) => {
        list.innerHTML = ''; 
        snap.forEach(async (d) => {
            const data = d.data();
            const authorDoc = await getDoc(doc(db, "users", data.userId));
            const isVerified = authorDoc.exists() ? authorDoc.data().isVerified : false;
            const isLiked = (data.likedBy || []).includes(auth.currentUser.uid);
            list.innerHTML += renderPostHTML(d.id, data, isLiked, following.includes(data.userId), isVerified);
        });
    });
}

function renderPostHTML(id, data, isLiked, isFollowing, isVerified) {
    const author = data.userName || "İstifadəçi";
    const blueTick = isVerified ? '<i class="fa-solid fa-circle-check" style="color: #3897f0; font-size: 13px; margin-left: 4px;"></i>' : '';
    const commentsHTML = (data.comments || []).map(c => `<div class="modern-comment"><span class="comment-user">${c.user}</span><span class="comment-text">${c.text}</span></div>`).join('');
    
    // BURADA YENİ PROFIL LINKINI ƏLAVƏ ETDİM
    const profileLink = `up.html?uid=${data.userId}`;

    return `
        <div class="post-card" id="post-${id}">
            <div class="post-header">
                <div class="nav-avatar-wrapper" onclick="location.href='${profileLink}'" style="cursor:pointer;">
                    <img src="${data.userPhoto || 'https://ui-avatars.com/api/?name='+author}" class="nav-profile-img">
                </div>
                <div class="post-header-info" style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                    <span class="post-username-text" onclick="location.href='${profileLink}'" style="font-weight: 600; cursor:pointer;">
                        ${author} ${blueTick}
                    </span>
                    <button class="${isFollowing ? 'follow-btn following' : 'follow-btn'}" onclick="handleFollow('${data.userId}')" id="follow-${data.userId}">${isFollowing ? 'İzlənilir' : 'İzlə'}</button>
                </div>
            </div>
            <div class="post-img-container" ondblclick="handleLike('${id}', '${data.userId}')">
                <img src="${data.url}" loading="lazy">
            </div>
            <div class="post-actions">
                <i class="${isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}" onclick="handleLike('${id}', '${data.userId}')" style="color:${isLiked ? '#ff3040' : 'white'}; cursor:pointer;"></i>
                <i class="fa-regular fa-comment" onclick="document.getElementById('input-${id}').focus()" style="cursor:pointer;"></i>
            </div>
            <div class="post-info-section">
                <div class="likes-count" onclick="showLikes('${id}')" style="cursor:pointer; font-weight:600; margin-bottom:5px;">${data.likes || 0} bəyənmə</div>
                <div class="post-description">
                    <b onclick="location.href='${profileLink}'" style="cursor:pointer;">${author} ${blueTick}</b> ${data.text || ""}
                </div>
                <div class="modern-comments-box">${commentsHTML}</div>
                <div class="modern-comment-input-area">
                    <input type="text" id="input-${id}" placeholder="Şərh əlavə et..." class="modern-input">
                    <button class="modern-post-btn" onclick="addComment('${id}', '${data.userId}')">Paylaş</button>
                </div>
            </div>
        </div>`;
}

// --- 4. LIKE VƏ DİGƏR EVENTLƏR ---
window.handleLike = async (id, postOwnerId) => {
    const user = auth.currentUser;
    if (!user) return;
    const postRef = doc(db, "posts", id);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) return;
    const data = postSnap.data();
    if ((data.likedBy || []).includes(user.uid)) return;

    try {
        await updateDoc(postRef, { 
            likes: increment(1),
            likedBy: arrayUnion(user.uid) 
        });
        await sendNotification(postOwnerId, "postunuzu bəyəndi.");
    } catch (e) { console.error(e); }
};

window.sendNotification = async (targetUserId, typeMessage) => {
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
};

window.handleFollow = async (targetUserId) => {
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid === targetUserId) return;
    await updateDoc(doc(db, "users", currentUser.uid), { following: arrayUnion(targetUserId) });
    await updateDoc(doc(db, "users", targetUserId), { followers: arrayUnion(currentUser.uid) });
    const btns = document.querySelectorAll(`[id="follow-${targetUserId}"]`);
    btns.forEach(btn => { btn.innerText = "İzlənilir"; btn.classList.add('following'); });
    await sendNotification(targetUserId, "sizi izləməyə başladı.");
};

window.showLikes = async (postId) => {
    const modal = document.getElementById('like-modal');
    const content = document.getElementById('like-list-content');
    if (!modal || !content) return;
    modal.style.display = 'flex';
    content.innerHTML = 'Yüklənir...';
    try {
        const postSnap = await getDoc(doc(db, "posts", postId));
        const likedBy = postSnap.data().likedBy || [];
        content.innerHTML = '';
        for (const uid of likedBy) {
            const userSnap = await getDoc(doc(db, "users", uid));
            const uData = userSnap.data();
            if (uData) content.innerHTML += `<div style="padding:10px; color:white; border-bottom:1px solid #222;">${uData.displayName}</div>`;
        }
    } catch (e) { content.innerHTML = 'Xəta!'; }
};

window.closeLikeModal = () => { document.getElementById('like-modal').style.display = 'none'; };

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
    } catch (e) { console.error(e); }
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
                    likedBy: [],
                    comments: [],
                    timestamp: serverTimestamp()
                });
            }
        } catch (e) { alert("Yükləmə xətası!"); }
    };
    fileInp.click();
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        await registerUserInFirestore(user); 
        loadPosts();
        listenToStories();
        loadDirectUsers();
    } else if (!window.location.pathname.includes("login.html")) {
        window.location.href = "login.html";
    }
});

if (addStoryBtn) addStoryBtn.onclick = () => storyInput.click();
if (document.getElementById('mainAddBtn')) document.getElementById('mainAddBtn').onclick = uploadPost;
if (document.getElementById('logout-btn')) document.getElementById('logout-btn').onclick = () => signOut(auth);
