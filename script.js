import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
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

// --- 1. MEDIA RENDER (Video və ya Şəkil fərqləndirmə) ---
function renderMedia(url) {
    const isVideo = url.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/);
    if (isVideo) {
        return `<video src="${url}" class="post-video" loop muted autoplay playsinline onclick="this.paused ? this.play() : this.pause()"></video>`;
    }
    return `<img src="${url}" loading="lazy" alt="VibeAz Content">`;
}

// --- 2. ANA SƏHİFƏ POSTLARINI RENDER ETMƏK ---
function renderPostHTML(id, data, isLiked, isFollowing) {
    const author = data.userName || "İstifadəçi";
    const avatarImg = data.userPhoto || `https://ui-avatars.com/api/?name=${author}&background=random`;
    const commentsHTML = (data.comments || []).map(c => `
        <div class="modern-comment">
            <span class="comment-user">${c.user}</span>
            <span class="comment-text">${c.text}</span>
        </div>`).join('');
    
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
                ${renderMedia(data.url)}
            </div>
            <div class="post-actions">
                <i class="${isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}" onclick="handleLike('${id}', '${data.userId}')" style="color:${isLiked ? '#ff3040' : 'white'}"></i>
                <i class="fa-regular fa-comment" onclick="document.getElementById('input-${id}').focus()"></i>
            </div>
            <div class="post-info-section">
                <div class="likes-count">${data.likes || 0} bəyənmə</div>
                <div class="post-description"><b>${author}</b> ${data.text || ""}</div>
                <div class="modern-comments-box">${commentsHTML}</div>
                <div class="modern-comment-input-area">
                    <input type="text" id="input-${id}" placeholder="Şərh əlavə et..." class="modern-input">
                    <button class="modern-post-btn" onclick="addComment('${id}', '${data.userId}')">Paylaş</button>
                </div>
            </div>
        </div>`;
}

// --- 3. MULTIMEDIA SEÇİMİ VƏ YÜKLƏMƏ ---
async function uploadMedia() {
    const fileInp = document.getElementById('fileInput');
    if(!fileInp) return;

    // VİDEO SEÇMƏYƏ İCAZƏ VERİR
    fileInp.setAttribute("accept", "image/*,video/*");
    
    fileInp.onchange = async (e) => {
        const file = e.target.files[0];
        const user = auth.currentUser;
        if (!file || !user) return;

        if (file.type.startsWith("video/")) {
            // Video üçün Firebase Storage yoxdursa link istəyirik
            const videoUrl = prompt("Video yükləmək üçün hələlik birbaşa link daxil edin (məs: .mp4):");
            if(videoUrl) await savePostToFirestore(videoUrl, "video");
        } else {
            // Şəkil yükləmə
            const fd = new FormData();
            fd.append("image", file);
            try {
                const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: fd });
                const result = await res.json();
                if (result.success) await savePostToFirestore(result.data.url, "image");
            } catch (err) { alert("Yükləmə xətası!"); }
        }
    };
    fileInp.click();
}

async function savePostToFirestore(url, type) {
    const user = auth.currentUser;
    const text = prompt("Açıqlama yazın:");
    await addDoc(collection(db, "posts"), {
        url: url,
        type: type,
        text: text || "",
        userName: user.displayName || user.email.split('@')[0],
        userPhoto: user.photoURL || "",
        userId: user.uid,
        likes: 0,
        comments: [],
        timestamp: serverTimestamp()
    });
}

// --- 4. PROFİL POSTLARINI QUERİ ETMƏK (Grid Üçün) ---
function loadUserPosts(userNameToFind) {
    const grid = document.getElementById('user-posts-grid');
    if(!grid) return;
    const q = query(collection(db, "posts"), where("userName", "==", userNameToFind));

    onSnapshot(q, (snapshot) => {
        grid.innerHTML = ""; 
        snapshot.forEach((doc) => {
            const postData = doc.data();
            const isVideo = postData.url.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/);
            grid.innerHTML += `
                <div class="grid-item">
                    ${isVideo ? `<video src="${postData.url}" muted loop playsinline onmouseover="this.play()" onmouseout="this.pause()"></video><i class="fa-solid fa-play video-icon"></i>` : `<img src="${postData.url}">`}
                </div>`;
        });
    });
}

// --- 5. AUTH VƏ GLOBAL EVENTLƏR ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const cleanName = user.displayName || user.email.split('@')[0];
        
        // Header və Profil yeniləmələri
        if(document.getElementById('header-username')) document.getElementById('header-username').innerText = cleanName;
        if(document.getElementById('profile-display-name')) document.getElementById('profile-display-name').innerText = cleanName;
        
        // Postları yüklə
        const postList = document.getElementById('post-list');
        if(postList) {
            onSnapshot(query(collection(db, "posts"), orderBy("timestamp", "desc")), (snap) => {
                postList.innerHTML = '';
                snap.forEach(d => postList.innerHTML += renderPostHTML(d.id, d.data(), false, false));
            });
        }
        
        loadUserPosts(cleanName);
    } else {
        if (!window.location.pathname.includes("login.html")) window.location.href = "login.html";
    }
});

// Window-a bağlanan funksiyalar (HTML-dən çağırılanlar)
window.handleFollow = async (id) => { /* Follow kodu bura */ };
window.handleLike = async (id, owner) => { /* Like kodu bura */ };
window.addComment = async (id, owner) => { /* Comment kodu bura */ };
window.closeNewsModal = () => { document.getElementById('news-modal').style.display='none'; localStorage.setItem('vibe_news_seen','true'); };

if (document.getElementById('mainAddBtn')) document.getElementById('mainAddBtn').onclick = uploadMedia;
if (document.getElementById('logout-btn')) document.getElementById('logout-btn').onclick = () => signOut(auth);
