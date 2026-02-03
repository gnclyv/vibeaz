import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, doc, updateDoc, increment, arrayUnion, query, orderBy, setDoc, getDoc, where } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Firebase Konfiqurasiyası
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

// --- BİLDİRİŞ YARATMA FUNKSİYASI (YENİ) ---
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
    } catch (e) { console.error("Notif Error:", e); }
}

// İstifadəçi vəziyyətini izləyirik
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

// Bildirişləri Canlı Dinləmə (YENİ)
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
            if (!data.read) unread = true;
            nList.innerHTML += `
                <div class="notif-item">
                    <img src="${data.fromUserPhoto || 'https://ui-avatars.com/api/?name='+data.fromUserName}">
                    <div class="notif-text"><b>${data.fromUserName}</b> ${data.type}</div>
                </div>`;
        });
        if (nDot) nDot.style.display = unread ? 'block' : 'none';
        if (snap.empty) nList.innerHTML = "<p style='padding:15px; text-align:center; color:gray;'>Bildiriş yoxdur.</p>";
    });
}

// Naviqasiyadakı kiçik avatarı yeniləyir
function updateNavAvatar(user, nick) {
    const navAvatar = document.getElementById('nav-user-avatar');
    if (navAvatar) {
        const userPhoto = user.photoURL || `https://ui-avatars.com/api/?name=${nick}&background=random&color=fff`;
        navAvatar.innerHTML = `<img src="${userPhoto}" class="nav-profile-img">`;
    }
}

// Post Paylaşma
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
        } catch (e) { alert("Xəta baş verdi!"); }
    };
    fileInp.click();
}

// Postları yükləyir
function loadPosts() {
    const list = document.getElementById('post-list');
    if (!list) return;
    const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
    onSnapshot(q, (snap) => {
        list.innerHTML = '';
        const likedPosts = JSON.parse(localStorage.getItem('vibeLikes')) || [];
        snap.forEach(d => {
