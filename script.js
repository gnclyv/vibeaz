import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, doc, updateDoc, increment, arrayUnion, query, orderBy, where } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-messaging.js";

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
const messaging = getMessaging(app);
const IMGBB_API_KEY = "c405e03c9dde65d450d8be8bdcfda25f";

// 2. İstifadəçi Statusu və Push Bildiriş İcazəsi
onAuthStateChanged(auth, (user) => {
    if (user) {
        const userName = user.email.split('@')[0];
        updateNavAvatar(user, userName);
        loadPosts();
        
        // 5 saniyə sonra bildiriş icazəsi istə (Soft Prompt)
        setTimeout(() => setupNotifications(user), 5000);
        
        // Gələn bildirişləri dinlə (Sayt açıq olanda)
        listenNotifications(userName);
    } else {
        if (!window.location.pathname.includes("login.html")) {
            window.location.href = "login.html";
        }
    }
});

// 3. Push Bildirişləri Quraşdırma (Həqiqi Push)
async function setupNotifications(user) {
    try {
        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                // Token al (VAPID Key-i Firebase-dən alıb bura yapışdır)
                const token = await getToken(messaging, { 
                    vapidKey: 'BErWSc6Tr3YhkpIjersOOPPZuthPFnJZgeNOHVY2xiD05T3aMDUTUGhWsG4FOz87cWq5F6OghIPzE1EVoPJPONc' 
                });
                
                if (token) {
                    // Tokeni bazada istifadəçinin altına qeyd et
                    await updateDoc(doc(db, "users", user.uid), { pushToken: token });
                    console.log("Push Token qeyd edildi.");
                }
            }
        }
    } catch (err) {
        console.log("Bildiriş xətası:", err);
    }
}

// 4. Dinamik Profil Şəkli (Aşağı Menyu)
function updateNavAvatar(user, userName) {
    const navAvatar = document.getElementById('nav-user-avatar');
    if (navAvatar) {
        const userPhoto = user.photoURL || `https://ui-avatars.com/api/?name=${userName}&background=random&color=fff`;
        navAvatar.innerHTML = `<img src="${userPhoto}" class="nav-profile-img">`;
    }
}

// 5. Post Paylaşma
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
                    userName: user.email.split('@')[0],
                    likes: 0,
                    comments: [],
                    timestamp: serverTimestamp()
                });
                alert("Paylaşıldı!");
            }
        } catch (e) { alert("Xəta!"); }
    };
    fileInp.click();
}

// 6. Postları Yükləmə
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
            const author = data.userName || "User";
            list.innerHTML += renderPostHTML(id, data, isLiked, author);
        });
    });
}

function renderPostHTML(id, data, isLiked, author) {
    return `
        <div class="post-card">
            <div class="post-header" style="padding:10px; display:flex; align-items:center; gap:10px;">
                <img src="https://ui-avatars.com/api/?name=${author}&background=random" style="width:30px; border-radius:50%;">
                <span style="font-weight:bold;">${author}</span>
            </div>
            <img src="${data.url}" style="width:100%;" ondblclick="handleLike('${id}')">
            <div style="padding:10px;">
                <i class="${isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}" 
                   onclick="handleLike('${id}')" style="font-size:20px; color:${isLiked ? '#ff3040' : 'white'}"></i>
                <div style="font-weight:bold; margin-top:5px;">${data.likes || 0} bəyənmə</div>
                <div><b>${author}</b> ${data.text || ""}</div>
            </div>
        </div>`;
}

// 7. Admin Qlobal Bildiriş Göndərmə
window.sendGlobalNotification = async () => {
    const msg = document.getElementById('admin-msg').value;
    if (!msg) return;
    await addDoc(collection(db, "notifications"), {
        from: "Admin",
        to: "all",
        text: msg,
        type: "system",
        timestamp: serverTimestamp()
    });
    alert("Göndərildi!");
};

// 8. Bildirişləri Dinləmə
function listenNotifications(userName) {
    const q = query(collection(db, "notifications"), where("to", "in", [userName, "all"]));
    onSnapshot(q, (snap) => {
        snap.docChanges().forEach(change => {
            if (change.type === "added") {
                const data = change.doc.data();
                showToast(data.from + ": " + data.text);
            }
        });
    });
}

function showToast(msg) {
    const t = document.createElement('div');
    t.className = "toast-msg";
    t.innerText = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 4000);
}

// Qlobal Funksiyalar
window.handleLike = async (id) => {
    let liked = JSON.parse(localStorage.getItem('vibeLikes')) || [];
    if (liked.includes(id)) return;
    await updateDoc(doc(db, "posts", id), { likes: increment(1) });
    liked.push(id);
    localStorage.setItem('vibeLikes', JSON.stringify(liked));
};

if (document.getElementById('mainAddBtn')) document.getElementById('mainAddBtn').onclick = uploadPost;

