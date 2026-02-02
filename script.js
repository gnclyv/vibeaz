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

// 2. Təhlükəsizlik Yoxlaması
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html"; 
    } else {
        console.log("Xoş gəldin!");
    }
});

// 3. LIKE FUNKSİYASI
async function handleLike(postId) {
    let likedPosts = JSON.parse(localStorage.getItem('likedPosts')) || [];
    if (likedPosts.includes(postId)) return;
    try {
        await updateDoc(doc(db, "posts", postId), { likes: increment(1) });
        likedPosts.push(postId);
        localStorage.setItem('likedPosts', JSON.stringify(likedPosts));
    } catch (e) { console.error(e); }
}

// 4. ŞƏRH FUNKSİYASI
async function handleComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const text = input.value.trim();
    if (!text) return;
    try {
        await updateDoc(doc(db, "posts", postId), {
            comments: arrayUnion({ text, author: "İstifadəçi", time: Date.now() })
        });
        input.value = "";
    } catch (e) { console.error(e); }
}

// 5. YÜKLƏMƏ FUNKSİYASI (ImgBB + Firestore)
async function handleFileUpload(type) {
    const fileInput = document.getElementById('fileInput');
    fileInput.click();
    fileInput.onchange = async () => {
        const file = fileInput.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append("image", file);
        
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: formData });
        const result = await res.json();
        
        let text = type === 'posts' ? prompt("Başlıq yazın:") : "";
        await addDoc(collection(db, type), {
            url: result.data.url, text, likes: 0, comments: [], timestamp: serverTimestamp()
        });
    };
}

// 6. STORY DİNAMİKASI
onSnapshot(query(collection(db, "stories"), orderBy("timestamp", "desc")), (snap) => {
    const container = document.getElementById('stories-container');
    if (!container) return;
    container.innerHTML = `<div class="story-card add-btn" id="addStory"><div class="story-circle"><i class="fa fa-plus"></i></div><span>Paylaş</span></div>`;
    snap.forEach(doc => {
        container.innerHTML += `<div class="story-card"><div class="story-circle"><img src="${doc.data().url}"></div><span>İstifadəçi</span></div>`;
    });
    document.getElementById('addStory').onclick = () => handleFileUpload('stories');
});

// 7. POSTLARIN GÖSTƏRİLMƏSİ
onSnapshot(query(collection(db, "posts"), orderBy("timestamp", "desc")), (snap) => {
    const list = document.getElementById('post-list');
    if (!list) return;
    list.innerHTML = '';
    const likedPosts = JSON.parse(localStorage.getItem('likedPosts')) || [];
    snap.forEach(postDoc => {
        const data = postDoc.data();
        const id = postDoc.id;
        const isLiked = likedPosts.includes(id);
        const commentsHTML = (data.comments || []).map(c => `<p style="margin:2px 0; font-size:13px;"><strong>${c.author}</strong> ${c.text}</p>`).join('');

        list.innerHTML += `
            <div class="post-card">
                <div class="post-header"><span>İstifadəçi</span></div>
                <img src="${data.url}" ondblclick="handleLike('${id}')">
                <div class="post-info">
                    <i class="${isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}" style="color:${isLiked ? '#ed4956' : 'black'};" onclick="handleLike('${id}')"></i>
                    <strong>${data.likes || 0} bəyənmə</strong>
                    <p>${data.text || ""}</p>
                    <div id="comments-${id}">${commentsHTML}</div>
                    <input type="text" id="comment-input-${id}" placeholder="Şərh yaz...">
                    <button onclick="handleComment('${id}')">Paylaş</button>
                </div>
            </div>`;
    });
});

// Düymələr
document.getElementById('mainAddBtn').onclick = () => handleFileUpload('posts');
document.getElementById('logout-btn').onclick = () => signOut(auth).then(() => window.location.href = "login.html");

window.handleLike = handleLike;
window.handleComment = handleComment;
