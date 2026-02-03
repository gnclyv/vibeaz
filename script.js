import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, doc, updateDoc, increment, arrayUnion, query, orderBy, getDoc, where, setDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

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

// --- STREAMABLE MƏLUMATLARI (VİDEO ÜÇÜN) ---
const STREAMABLE_EMAIL = "bigbass535@gmail.com"; 
const STREAMABLE_PASS = "Nihad_123";

// --- 1. MEDIA RENDER (Video və Şəkil üçün tam dəstək) ---
function renderMedia(url, type) {
    if (type === 'video' || url.includes('streamable.com')) {
        const embedUrl = url.replace("streamable.com/", "streamable.com/e/");
        return `<iframe src="${embedUrl}" class="post-video" frameborder="0" allowfullscreen style="width:100%; aspect-ratio:16/9; background:#000;"></iframe>`;
    }
    return `<img src="${url}" loading="lazy" style="width:100%; display:block;">`;
}

// --- 2. ANA SƏHİFƏ POST HTML (Like, Comment, Follow daxil) ---
function renderPostHTML(id, data, isLiked, isFollowing) {
    const author = data.userName || "İstifadəçi";
    const avatarImg = data.userPhoto || `https://ui-avatars.com/api/?name=${author}&background=random`;
    
    const commentsHTML = (data.comments || []).map(c => `
        <div class="modern-comment">
            <span class="comment-user"><b>${c.user}</b></span>
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
            <div class="post-img-container" ondblclick="handleLike('${id}')">
                ${renderMedia(data.url, data.type)}
            </div>
            <div class="post-actions">
                <i class="${isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}" onclick="handleLike('${id}')" style="color:${isLiked ? '#ff3040' : 'white'}"></i>
                <i class="fa-regular fa-comment" onclick="document.getElementById('input-${id}').focus()"></i>
            </div>
            <div class="post-info-section">
                <div class="likes-count" id="likes-${id}">${data.likes || 0} bəyənmə</div>
                <div class="post-description"><b>${author}</b> ${data.text || ""}</div>
                <div class="modern-comments-box">${commentsHTML}</div>
                <div class="modern-comment-input-area">
                    <input type="text" id="input-${id}" placeholder="Şərh əlavə et..." class="modern-input">
                    <button class="modern-post-btn" onclick="addComment('${id}')">Paylaş</button>
                </div>
            </div>
        </div>`;
}

// --- 3. STORY SİSTEMİ (Açılma və İzlənmə) ---
window.openStoryViewer = function(url, username) {
    const viewer = document.getElementById('story-viewer');
    if(!viewer) return;
    document.getElementById('story-full-img').src = url;
    document.getElementById('viewer-username').innerText = username;
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
    window.storyTimeout = setTimeout(() => viewer.style.display = 'none', 5000);
};

// --- 4. YÜKLƏMƏ (Post və Story üçün Streamable dəstəyi ilə) ---
async function uploadMedia(targetType = "post") {
    const fileInp = document.createElement('input');
    fileInp.type = 'file';
    fileInp.accept = "image/*,video/*"; 
    
    fileInp.onchange = async (e) => {
        const file = e.target.files[0];
        const user = auth.currentUser;
        if (!file || !user) return;

        alert(targetType === "story" ? "Story yüklənir..." : "Post yüklənir...");
        let finalUrl = "";
        let mediaType = file.type.startsWith("video/") ? "video" : "image";

        try {
            if (mediaType === "video") {
                const authHeader = btoa(`${STREAMABLE_EMAIL}:${STREAMABLE_PASS}`);
                const fd = new FormData();
                fd.append("file", file);
                const res = await fetch("https://api.streamable.com/upload", {
                    method: "POST",
                    headers: { "Authorization": `Basic ${authHeader}` },
                    body: fd
                });
                const data = await res.json();
                if (data.shortcode) finalUrl = `https://streamable.com/${data.shortcode}`;
            } else {
                const fd = new FormData();
                fd.append("image", file);
                const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: fd });
                const data = await res.json();
                if (data.success) finalUrl = data.data.url;
            }

            if (finalUrl) {
                const col = targetType === "story" ? "stories" : "posts";
                const docData = {
                    url: finalUrl,
                    type: mediaType,
                    userName: user.displayName || user.email.split('@')[0],
                    userPhoto: user.photoURL || "",
                    userId: user.uid,
                    timestamp: serverTimestamp()
                };
                if (targetType === "post") {
                    docData.text = prompt("Açıqlama:") || "";
                    docData.likes = 0;
                    docData.comments = [];
                }
                await addDoc(collection(db, col), docData);
                alert("Uğurla paylaşıldı!");
            }
        } catch (err) { alert("Xəta: " + err.message); }
    };
    fileInp.click();
}

// --- 5. LİKE, COMMENT, FOLLOW ---
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

window.handleFollow = async (targetUserId) => {
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid === targetUserId) return;
    await updateDoc(doc(db, "users", currentUser.uid), { following: arrayUnion(targetUserId) });
    await updateDoc(doc(db, "users", targetUserId), { followers: arrayUnion(currentUser.uid) });
    document.querySelectorAll(`[id="follow-${targetUserId}"]`).forEach(btn => {
        btn.innerText = "İzlənilir";
        btn.classList.add('following');
    });
};

// --- 6. BAŞLANĞIÇ VƏ REALTİME ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Story-lər
        onSnapshot(query(collection(db, "stories"), orderBy("timestamp", "desc")), (snap) => {
            const list = document.getElementById('stories-list');
            if(list) {
                list.innerHTML = '';
                snap.forEach(d => {
                    const s = d.data();
                    list.innerHTML += `<div class="story-item" onclick="openStoryViewer('${s.url}', '${s.userName}')">
                        <div class="story-circle"><img src="${s.url}"></div>
                        <span class="story-username">${s.userName}</span>
                    </div>`;
                });
            }
        });

        // Postlar
        const postList = document.getElementById('post-list');
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const following = userDoc.exists() ? (userDoc.data().following || []) : [];

        onSnapshot(query(collection(db, "posts"), orderBy("timestamp", "desc")), (snap) => {
            if (postList) {
                postList.innerHTML = '';
                const liked = JSON.parse(localStorage.getItem('vibeLikes')) || [];
                snap.forEach(d => {
                    const data = d.data();
                    const isFollowing = following.includes(data.userId);
                    const isLiked = liked.includes(d.id);
                    postList.innerHTML += renderPostHTML(d.id, data, isLiked, isFollowing);
                });
            }
        });
    } else {
        if (!window.location.pathname.includes("login.html")) window.location.href = "login.html";
    }
});

// Event Listeners
document.addEventListener('click', (e) => {
    if (e.target.id === 'mainAddBtn') uploadMedia('post');
    if (e.target.id === 'add-story-btn') uploadMedia('story');
    if (e.target.id === 'logout-btn') signOut(auth);
});
