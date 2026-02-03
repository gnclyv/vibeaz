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

// 2. İstifadəçi Statusu
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Gmail əvəzinə displayName (Nickname) istifadə edirik
        const displayNick = user.displayName || user.email.split('@')[0];
        updateNavAvatar(user, displayNick);
        loadPosts();
        setTimeout(() => setupNotifications(user), 5000);
        listenNotifications(displayNick);
    } else {
        if (!window.location.pathname.includes("login.html")) {
            window.location.href = "login.html";
        }
    }
});

// 3. Push Bildirişləri
async function setupNotifications(user) {
    try {
        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                const token = await getToken(messaging, { 
                    vapidKey: 'BErWSc6Tr3YhkpIjersOOPPZuthPFnJZgeNOHVY2xiD05T3aMDUTUGhWsG4FOz87cWq5F6OghIPzE1EVoPJPONc' 
                });
                if (token) {
                    await updateDoc(doc(db, "users", user.uid), { pushToken: token });
                }
            }
        }
    } catch (err) { console.log("Bildiriş xətası:", err); }
}

// 4. Profil Şəkli
function updateNavAvatar(user, nick) {
    const navAvatar = document.getElementById('nav-user-avatar');
    if (navAvatar) {
        const userPhoto = user.photoURL || `https://ui-avatars.com/api/?name=${nick}&background=random&color=fff`;
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
                    userName: user.displayName || user.email.split('@')[0], // Nickname burada qeyd olunur
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
            const author = data.userName || "İstifadəçi";
            list.innerHTML += renderPostHTML(id, data, isLiked, author);
        });
    });
}

// 7. HTML Render (Şərh bölməsi əlavə edildi)
function renderPostHTML(id, data, isLiked, author) {
    const commentsHTML = (data.comments || []).map(c => `
        <div style="font-size: 13px; margin-top: 5px;">
            <b style="color: #0095f6;">${c.user}:</b> <span>${c.text}</span>
        </div>
    `).join('');

    return `
        <div class="post-card" style="margin-bottom: 20px; border-bottom: 1px solid #222;">
            <div class="post-header" style="padding:10px; display:flex; align-items:center; gap:10px;">
                <img src="https://ui-avatars.com/api/?name=${author}&background=random" style="width:30px; border-radius:50%;">
                <span style="font-weight:bold;">${author}</span>
            </div>
            <img src="${data.url}" style="width:100%;" ondblclick="handleLike('${id}')">
            <div style="padding:10px;">
                <i class="${isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}" 
                   onclick="handleLike('${id}')" style="font-size:20px; color:${isLiked ? '#ff3040' : 'white'}; cursor:pointer;"></i>
                <div style="font-weight:bold; margin-top:5px;">${data.likes || 0} bəyənmə</div>
                <div><b>${author}</b> ${data.text || ""}</div>
                
                <div id="comments-${id}" style="margin-top: 10px; border-top: 1px solid #111; padding-top: 5px;">
                    ${commentsHTML}
                </div>

                <div style="display: flex; margin-top: 10px; gap: 5px;">
                    <input type="text" id="input-${id}" placeholder="Şərh yaz..." 
                           style="flex: 1; background: transparent; border: none; border-bottom: 1px solid #333; color: white; outline: none;">
                    <button onclick="addComment('${id}')" style="background: none; border: none; color: #0095f6; font-weight: bold; cursor: pointer;">Paylaş</button>
                </div>
            </div>
        </div>`;
}

// 8. Şərh Əlavə Etmə Funksiyası
window.addComment = async (postId) => {
    const input = document.getElementById(`input-${postId}`);
    const commentText = input.value.trim();
    const user = auth.currentUser;

    if (!commentText || !user) return;

    try {
        const postRef = doc(db, "posts", postId);
        await updateDoc(postRef, {
            comments: arrayUnion({
                user: user.displayName || user.email.split('@')[0],
                text: commentText,
                time: Date.now()
            })
        });
        input.value = ""; // Xananı təmizlə
    } catch (e) { console.error("Şərh xətası:", e); }
};

// ... (Bəyənmə və Bildiriş funksiyaları eyni qalır) ...
window.handleLike = async (id) => {
    let liked = JSON.parse(localStorage.getItem('vibeLikes')) || [];
    if (liked.includes(id)) return;
    await updateDoc(doc(db, "posts", id), { likes: increment(1) });
    liked.push(id);
    localStorage.setItem('vibeLikes', JSON.stringify(liked));
};

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

if (document.getElementById('mainAddBtn')) document.getElementById('mainAddBtn').onclick = uploadPost;
