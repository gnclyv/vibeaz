import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, doc, updateDoc, increment, arrayUnion, query, orderBy, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

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
};

window.closeStory = function() {
    const viewer = document.getElementById('story-viewer');
    if(viewer) viewer.style.display = 'none';
};

// --- 2. İZLƏ FUNKSİYASI (FOLLOW) ---
window.handleFollow = async (targetUserId) => {
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid === targetUserId) return;

    const myDocRef = doc(db, "users", currentUser.uid);
    const targetDocRef = doc(db, "users", targetUserId);

    try {
        // İzləyən şəxsin 'following' siyahısını yenilə
        await setDoc(myDocRef, { following: arrayUnion(targetUserId) }, { merge: true });
        // İzlənilən şəxsin 'followers' siyahısını yenilə
        await setDoc(targetDocRef, { followers: arrayUnion(currentUser.uid) }, { merge: true });

        // Düyməni dərhal vizual olarave yenilə
        const btns = document.querySelectorAll(`[id^="follow-${targetUserId}"]`);
        btns.forEach(btn => {
            btn.innerText = "İzlənilir";
            btn.classList.add('following');
        });
    } catch (err) {
        console.error("İzləmə xətası:", err);
    }
};

// --- 3. POST RENDER ---
function renderPostHTML(id, data, isLiked, isFollowing) {
    const author = data.userName || "İstifadəçi";
    const avatarImg = data.userPhoto || `https://ui-avatars.com/api/?name=${author}&background=random`;
    const commentsHTML = (data.comments || []).map(c => `
        <div class="modern-comment"><span><b>${c.user}</b> ${c.text}</span></div>`).join('');
    
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
                <img src="${data.url}" loading="lazy">
            </div>
            <div class="post-actions">
                <i class="${isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}" onclick="handleLike('${id}')" style="color:${isLiked ? '#ff3040' : 'white'}"></i>
                <i class="fa-regular fa-comment" onclick="document.getElementById('input-${id}').focus()"></i>
            </div>
            <div class="post-info-section">
                <div class="likes-count">${data.likes || 0} bəyənmə</div>
                <div class="post-description"><b>${author}</b> ${data.text || ""}</div>
                <div class="modern-comments-box">${commentsHTML}</div>
                <div class="modern-comment-input-area">
                    <input type="text" id="input-${id}" placeholder="Şərh əlavə et..." class="modern-input">
                    <button class="modern-post-btn" onclick="addComment('${id}')">Paylaş</button>
                </div>
            </div>
        </div>`;
}

// --- 4. LIKE VƏ COMMENT ---
window.handleLike = async (id) => {
    let liked = JSON.parse(localStorage.getItem('vibeLikes')) || [];
    if (liked.includes(id)) return;
    await updateDoc(doc(db, "posts", id), { likes: increment(1) });
    liked.push(id);
    localStorage.setItem('vibeLikes', JSON.stringify(liked));
};

window.addComment = async (postId) => {
    const input = document.getElementById(`input-${postId}`);
    const text = input.value.trim();
    if (!text || !auth.currentUser) return;
    await updateDoc(doc(db, "posts", postId), {
        comments: arrayUnion({
            user: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
            text: text,
            time: Date.now()
        })
    });
    input.value = "";
};

// --- 5. YÜKLƏMƏ MƏNTİQİ ---
async function uploadMedia(targetType = "post") {
    const fileInp = document.createElement('input');
    fileInp.type = 'file';
    fileInp.accept = "image/*";
    fileInp.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const fd = new FormData();
        fd.append("image", file);
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: fd });
        const result = await res.json();
        if (result.success) {
            const user = auth.currentUser;
            const docData = {
                url: result.data.url,
                userName: user.displayName || user.email.split('@')[0],
                userId: user.uid,
                timestamp: serverTimestamp()
            };
            if (targetType === "post") {
                docData.text = prompt("Açıqlama:") || "";
                docData.likes = 0;
                docData.comments = [];
            }
            await addDoc(collection(db, targetType === "story" ? "stories" : "posts"), docData);
        }
    };
    fileInp.click();
}

// --- 6. AUTH VƏ SNAPSHOT ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Story-lər
        onSnapshot(query(collection(db, "stories"), orderBy("timestamp", "desc")), (snap) => {
            const list = document.getElementById('stories-list');
            if(list) {
                list.innerHTML = '';
                snap.forEach(d => {
                    const s = d.data();
                    list.innerHTML += `<div class="story-item active" onclick="openStoryViewer('${s.url}', '${s.userName}')">
                        <div class="story-circle"><img src="${s.url}"></div>
                        <span class="story-username">${s.userName}</span>
                    </div>`;
                });
            }
        });

        // Postlar və İzləmə yoxlaması
        onSnapshot(query(collection(db, "posts"), orderBy("timestamp", "desc")), async (snap) => {
            const postList = document.getElementById('post-list');
            if (!postList) return;

            // Cari istifadəçinin kimi izlədiyini tapırıq
            const myDoc = await getDoc(doc(db, "users", user.uid));
            const following = myDoc.exists() ? (myDoc.data().following || []) : [];
            const liked = JSON.parse(localStorage.getItem('vibeLikes')) || [];

            postList.innerHTML = '';
            snap.forEach(d => {
                const data = d.data();
                const isFollowing = following.includes(data.userId);
                postList.innerHTML += renderPostHTML(d.id, data, liked.includes(d.id), isFollowing);
            });
        });
    } else {
        if (!window.location.pathname.includes("login.html")) window.location.href = "login.html";
    }
});

document.addEventListener('click', (e) => {
    if (e.target.id === 'mainAddBtn') uploadMedia('post');
    if (e.target.id === 'add-story-btn') uploadMedia('story');
    if (e.target.id === 'logout-btn') signOut(auth);
});
