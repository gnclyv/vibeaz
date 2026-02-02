import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, updateDoc, increment, arrayUnion } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

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

// 2. Auth Keşikçisi
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html"; 
    } else {
        console.log("Sistem aktivdir");
    }
});

// 3. Like Funksiyası (Global)
window.handleLike = async (postId) => {
    let likedPosts = JSON.parse(localStorage.getItem('likedPosts')) || [];
    if (likedPosts.includes(postId)) return;
    try {
        await updateDoc(doc(db, "posts", postId), { likes: increment(1) });
        likedPosts.push(postId);
        localStorage.setItem('likedPosts', JSON.stringify(likedPosts));
    } catch (e) { console.error("Like xətası:", e); }
};

// 4. Şərh Funksiyası (Global)
window.handleComment = async (postId) => {
    const input = document.getElementById(`comment-input-${postId}`);
    const text = input.value.trim();
    if (!text) return;
    try {
        await updateDoc(doc(db, "posts", postId), {
            comments: arrayUnion({ text, author: "İstifadəçi", time: Date.now() })
        });
        input.value = "";
    } catch (e) { console.error("Şərh xətası:", e); }
};

// 5. Şəkil Yükləmə Funksiyası (Düzəldildi)
async function handleFileUpload(type) {
    const fileInput = document.getElementById('fileInput');
    fileInput.click();
    
    fileInput.onchange = async () => {
        const file = fileInput.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("image", file);

        try {
            const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: formData });
            const result = await res.json();
            
            if (result.success) {
                const url = result.data.url;
                const text = type === 'posts' ? prompt("Post üçün başlıq yazın:") : "";

                await addDoc(collection(db, type), {
                    url: url,
                    text: text,
                    likes: 0,
                    comments: [],
                    timestamp: serverTimestamp()
                });
                alert("Uğurla paylaşıldı!");
            }
        } catch (e) { console.error("Yükləmə xətası:", e); }
    };
}

// 6. Story-ləri Göstər (ID: stories)
onSnapshot(query(collection(db, "stories"), orderBy("timestamp", "desc")), (snap) => {
    const container = document.getElementById('stories'); // HTML-də id="stories" olmalıdır
    if (!container) return;
    container.innerHTML = `<div class="story-card add-btn" id="addStory"><div class="story-circle"><i class="fa fa-plus"></i></div><span>Paylaş</span></div>`;
    snap.forEach(d => {
        container.innerHTML += `<div class="story-card"><div class="story-circle"><img src="${d.data().url}"></div><span>İstifadəçi</span></div>`;
    });
    document.getElementById('addStory').onclick = () => handleFileUpload('stories');
});

// 7. Postları Göstər (ID: post-list)
onSnapshot(query(collection(db, "posts"), orderBy("timestamp", "desc")), (snap) => {
    const list = document.getElementById('post-list'); // HTML-də id="post-list" olmalıdır
    if (!list) return;
    list.innerHTML = '';
    const likedPosts = JSON.parse(localStorage.getItem('likedPosts')) || [];
    
    snap.forEach(postDoc => {
        const data = postDoc.data();
        const id = postDoc.id;
        const isLiked = likedPosts.includes(id);
        const commentsHTML = (data.comments || []).map(c => `<p style="font-size:13px; margin:2px;"><strong>İstifadəçi</strong> ${c.text}</p>`).join('');

        list.innerHTML += `
            <div class="post-card">
                <div class="post-header"><span>İstifadəçi</span></div>
                <img src="${data.url}" ondblclick="handleLike('${id}')">
                <div class="post-info">
                    <div class="post-actions">
                        <i class="${isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}" 
                           style="color:${isLiked ? '#ed4956' : 'black'}; cursor:pointer;" onclick="handleLike('${id}')"></i>
                    </div>
                    <strong>${data.likes || 0} bəyənmə</strong>
                    <p><strong>İstifadəçi</strong> ${data.text || ""}</p>
                    <div class="comments-area">${commentsHTML}</div>
                    <div style="display:flex; margin-top:10px;">
                        <input type="text" id="comment-input-${id}" placeholder="Şərh yaz..." style="flex:1;">
                        <button onclick="handleComment('${id}')" style="border:none; background:none; color:#0095f6; font-weight:bold;">Paylaş</button>
                    </div>
                </div>
            </div>`;
    });
});

// Düymə Hadisələri
document.getElementById('mainAddBtn').onclick = () => handleFileUpload('posts');
document.getElementById('logout-btn').onclick = () => signOut(auth).then(() => window.location.href = "login.html");
