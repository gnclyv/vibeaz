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

// 2. Auth Keşikçisi (Yönləndirmə Problemini Həll Edən Hissə)
onAuthStateChanged(auth, (user) => {
    if (!user) {
        console.log("İstifadəçi daxil olmayıb. Login-ə yönləndirilir...");
        // Əgər hazırda index.html-dəyiksə login-ə at
        if (!window.location.pathname.includes("login.html")) {
            window.location.replace("login.html");
        }
    } else {
        console.log("Giriş uğurludur:", user.phoneNumber);
        initApp();
    }
});

// 3. Əsas Funksiyaların Başladılması
function initApp() {
    loadStories();
    loadPosts();
}

// 4. Like və Şərh Funksiyaları (HTML-dən çağırılması üçün window obyektinə bağlanır)
window.handleLike = async (postId) => {
    let likedPosts = JSON.parse(localStorage.getItem('likedPosts')) || [];
    if (likedPosts.includes(postId)) return;

    try {
        const postRef = doc(db, "posts", postId);
        await updateDoc(postRef, { likes: increment(1) });
        likedPosts.push(postId);
        localStorage.setItem('likedPosts', JSON.stringify(likedPosts));
    } catch (e) { console.error("Like xətası:", e); }
};

window.handleComment = async (postId) => {
    const input = document.getElementById(`comment-input-${postId}`);
    const text = input.value.trim();
    if (!text) return;

    try {
        const postRef = doc(db, "posts", postId);
        await updateDoc(postRef, {
            comments: arrayUnion({ text, author: "İstifadəçi", time: Date.now() })
        });
        input.value = "";
    } catch (e) { console.error("Şərh xətası:", e); }
};

// 5. Şəkil Yükləmə (Post və Story üçün)
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
                const text = type === 'posts' ? prompt("Post başlığı yazın:") : "";
                await addDoc(collection(db, type), {
                    url: result.data.url,
                    text: text,
                    likes: 0,
                    comments: [],
                    timestamp: serverTimestamp()
                });
                alert("Uğurla paylaşıldı!");
            }
        } catch (e) { alert("Yükləmə xətası! Konsola baxın."); console.error(e); }
    };
}

// 6. Story-ləri Real-time Yüklə (ID: stories)
function loadStories() {
    const container = document.getElementById('stories');
    if (!container) return;

    onSnapshot(query(collection(db, "stories"), orderBy("timestamp", "desc")), (snap) => {
        container.innerHTML = `
            <div class="story-card add-btn" id="addStoryBtn">
                <div class="story-circle"><i class="fa fa-plus"></i></div>
                <span>Paylaş</span>
            </div>`;
        
        snap.forEach(d => {
            const data = d.data();
            container.innerHTML += `
                <div class="story-card">
                    <div class="story-circle"><img src="${data.url}"></div>
                    <span>İstifadəçi</span>
                </div>`;
        });
        document.getElementById('addStoryBtn').onclick = () => handleFileUpload('stories');
    });
}

// 7. Postları Real-time Yüklə (ID: post-list)
function loadPosts() {
    const list = document.getElementById('post-list');
    if (!list) return;

    onSnapshot(query(collection(db, "posts"), orderBy("timestamp", "desc")), (snap) => {
        list.innerHTML = '';
        const likedPosts = JSON.parse(localStorage.getItem('likedPosts')) || [];

        snap.forEach(postDoc => {
            const data = postDoc.data();
            const id = postDoc.id;
            const isLiked = likedPosts.includes(id);
            const commentsHTML = (data.comments || []).map(c => 
                `<p style="font-size:13px; margin:2px;"><strong>İstifadəçi:</strong> ${c.text}</p>`
            ).join('');

            list.innerHTML += `
                <div class="post-card" style="background:white; border:1px solid #dbdbdb; margin-bottom:20px;">
                    <div class="post-header" style="padding:10px;"><strong>İstifadəçi</strong></div>
                    <img src="${data.url}" style="width:100%" ondblclick="handleLike('${id}')">
                    <div class="post-info" style="padding:15px;">
                        <div class="actions" style="font-size:20px; margin-bottom:10px;">
                            <i class="${isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}" 
                               style="color:${isLiked ? '#ed4956' : 'black'}; cursor:pointer;" 
                               onclick="handleLike('${id}')"></i>
                        </div>
                        <strong>${data.likes || 0} bəyənmə</strong>
                        <p><strong>İstifadəçi:</strong> ${data.text || ""}</p>
                        <div class="comments-section">${commentsHTML}</div>
                        <div style="display:flex; margin-top:10px;">
                            <input type="text" id="comment-input-${id}" placeholder="Şərh yaz..." style="flex:1; border:1px solid #eee; padding:5px;">
                            <button onclick="handleComment('${id}')" style="border:none; color:#0095f6; background:none; font-weight:bold;">Paylaş</button>
                        </div>
                    </div>
                </div>`;
        });
    });
}

// 8. Naviqasiya Düymələri
const mainAdd = document.getElementById('mainAddBtn');
if (mainAdd) mainAdd.onclick = () => handleFileUpload('posts');

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) logoutBtn.onclick = () => signOut(auth).then(() => window.location.reload());
