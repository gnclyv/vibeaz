import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, doc, updateDoc, increment, arrayUnion, query, orderBy, setDoc, getDoc, where } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// 1. Firebase Konfiqurasiyası
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

// 2. Bildiriş Göndərmə Funksiyası
async function sendNotification(targetUserId, typeMessage) {
    const user = auth.currentUser;
    // Özünə bildiriş getməməsi üçün yoxlama
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
    } catch (e) {
        console.error("Bildiriş göndərilərkən xəta:", e);
    }
}

// 3. İstifadəçi vəziyyətini izləyirik
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const displayNick = user.displayName || user.email.split('@')[0];
        
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            await setDoc(userRef, {
                uid: user.uid,
                displayName: displayNick,
                photoURL: user.photoURL || "",
                followers: [],
                following: []
            }, { merge: true });
        }

        updateNavAvatar(user, displayNick);
        loadPosts();
        setupNotifListener(user.uid); // Bildirişləri dinləməyə başla
    } else if (!window.location.pathname.includes("login.html")) {
        window.location.href = "login.html";
    }
});

// 4. Bildirişləri Real Vaxtda Dinləmə (UI Dəyişikliyi Buradadır)
function setupNotifListener(uid) {
    const nDot = document.getElementById('notif-dot');
    const nList = document.getElementById('notif-list');
    
    const q = query(
        collection(db, "notifications"), 
        where("toUserId", "==", uid), 
        orderBy("timestamp", "desc")
    );

    onSnapshot(q, (snap) => {
        if (!nList) return;
        nList.innerHTML = "";
        let unread = false;

        snap.forEach(d => {
            const data = d.data();
            if (data.read === false) unread = true;

            nList.innerHTML += `
                <div class="notif-item">
                    <img src="${data.fromUserPhoto || 'https://ui-avatars.com/api/?name='+data.fromUserName}">
                    <div class="notif-text">
                        <b>${data.fromUserName}</b> ${data.type}
                    </div>
                </div>`;
        });

        // Əgər oxunmamış bildiriş varsa nöqtəni göstər
        if (nDot) nDot.style.display = unread ? 'block' : 'none';
        
        if (snap.empty) {
            nList.innerHTML = "<p style='padding:15px; text-align:center; color:gray;'>Bildiriş yoxdur.</p>";
        }
    });
}

// 5. Post Paylaşma, Like, Follow və Yorum Funksiyaları
window.handleLike = async (id, postOwnerId) => {
    let liked = JSON.parse(localStorage.getItem('vibeLikes')) || [];
    if (liked.includes(id)) return;
    
    try {
        await updateDoc(doc(db, "posts", id), { likes: increment(1) });
        liked.push(id);
        localStorage.setItem('vibeLikes', JSON.stringify(liked));
        
        // Bildiriş göndər
        await sendNotification(postOwnerId, "postunuzu bəyəndi.");
    } catch (e) { console.error(e); }
};

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
        // Bildiriş göndər
        await sendNotification(postOwnerId, "postunuza şərh yazdı.");
    } catch (e) { console.error(e); }
};

window.handleFollow = async (targetUserId) => {
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid === targetUserId) return;

    try {
        await updateDoc(doc(db, "users", currentUser.uid), { following: arrayUnion(targetUserId) });
        await updateDoc(doc(db, "users", targetUserId), { followers: arrayUnion(currentUser.uid) });
        
        const btn = document.getElementById(`follow-${targetUserId}`);
        if(btn) btn.innerText = "• İzlənilir";
        
        // Bildiriş göndər
        await sendNotification(targetUserId, "sizi izləməyə başladı.");
    } catch (error) { console.error(error); }
};

// 6. UI Render və Digər Köməkçi Funksiyalar
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
            list.innerHTML += renderPostHTML(id, data, isLiked, data.userName || "İstifadəçi");
        });
    });
}

function renderPostHTML(id, data, isLiked, author) {
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

function updateNavAvatar(user, nick) {
    const navAvatar = document.getElementById('nav-user-avatar');
    if (navAvatar) {
        const userPhoto = user.photoURL || `https://ui-avatars.com/api/?name=${nick}&background=random&color=fff`;
        navAvatar.innerHTML = `<img src="${userPhoto}" class="nav-profile-img">`;
    }
}

// 7. Panel İdarəetməsi
const nBtn = document.getElementById('notif-btn');
if(nBtn) {
    nBtn.onclick = (e) => {
        e.stopPropagation();
        const panel = document.getElementById('notif-panel');
        if(!panel) return;
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        // Paneli açanda nöqtəni gizlət
        const dot = document.getElementById('notif-dot');
        if(dot) dot.style.display = 'none';
    };
}

document.addEventListener('click', () => { 
    const panel = document.getElementById('notif-panel');
    if(panel) panel.style.display = 'none'; 
});

if (document.getElementById('logout-btn')) document.getElementById('logout-btn').onclick = () => signOut(auth);
