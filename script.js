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

// 2. Auth Yoxlaması
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html"; 
    } else {
        console.log("Giriş uğurludur!");
        startApp();
    }
});

function startApp() {
    loadStories();
    loadPosts();
}

// 3. Şəkil Yükləmə (Post və Story üçün mərkəzi funksiya)
async function handleFileUpload(type) {
    const fileInput = document.getElementById('fileInput');
    fileInput.onchange = async () => {
        const file = fileInput.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("image", file);

        try {
            const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: formData });
            const result = await res.json();
            
            if (result.success) {
                const text = type === 'posts' ? prompt("Post başlığı:") : "";
                await addDoc(collection(db, type), {
                    url: result.data.url,
                    text: text,
                    likes: 0,
                    comments: [],
                    timestamp: serverTimestamp()
                });
                alert("Paylaşıldı!");
            }
        } catch (e) { alert("Yükləmə zamanı xəta oldu!"); }
    };
    fileInput.click();
}

// 4. Story-ləri Yükle
function loadStories() {
    const container = document.querySelector('.story-container');
    if (!container) return;

    onSnapshot(query(collection(db, "stories"), orderBy("timestamp", "desc")), (snap) => {
        container.innerHTML = `<div class="story-card add-btn" id="shareBtn"><div class="story-circle"><i class="fa fa-plus"></i></div><span>Paylaş</span></div>`;
        snap.forEach(d => {
            container.innerHTML += `<div class="story-card"><div class="story-circle"><img src="${d.data().url}"></div><span>İstifadəçi</span></div>`;
        });
        document.getElementById('shareBtn').onclick = () => handleFileUpload('stories');
    });
}

// 5. Postları Yükle
function loadPosts() {
    const postList = document.getElementById('post-list');
    if (!postList) return;

    onSnapshot(query(collection(db, "posts"), orderBy("timestamp", "desc")), (snap) => {
        postList.innerHTML = '';
        snap.forEach(postDoc => {
            const data = postDoc.data();
            const id = postDoc.id;
            postList.innerHTML += `
                <div class="post-card">
                    <div class="post-header"><span>İstifadəçi</span></div>
                    <img src="${data.url}" style="width:100%">
                    <div class="post-info">
                        <strong>${data.likes || 0} bəyənmə</strong>
                        <p>${data.text || ""}</p>
                    </div>
                </div>`;
        });
    });
}

// 6. Düymə Tətikləyiciləri
document.getElementById('mainAddBtn').onclick = () => handleFileUpload('posts');
