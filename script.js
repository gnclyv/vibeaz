import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, updateDoc, increment, arrayUnion, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// 1. FİREBASE KONFİQURASİYAN (Buranı öz məlumatlarınla doldur)
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

// --- SMS GİRİŞ SİSTEMİ ---
window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', { 'size': 'invisible' }, auth);

// SMS Göndər
document.getElementById('send-sms-btn').onclick = () => {
    const number = document.getElementById('phoneNumber').value;
    const username = document.getElementById('username').value;
    if(!username) return alert("İstifadəçi adı yazın");

    signInWithPhoneNumber(auth, number, window.recaptchaVerifier)
        .then(result => {
            window.confirmationResult = result;
            document.getElementById('reg-form').classList.add('hidden');
            document.getElementById('verification-area').classList.remove('hidden');
        }).catch(err => alert("Xəta: " + err.message));
};

// Kodu Təsdiqlə
document.getElementById('verify-sms-btn').onclick = () => {
    const code = document.getElementById('smsCode').value;
    const username = document.getElementById('username').value;
    window.confirmationResult.confirm(code).then(async (result) => {
        await setDoc(doc(db, "users", result.user.uid), { username: username });
        location.reload();
    }).catch(() => alert("Kod səhvdir!"));
};

// --- ANA SƏHİFƏ FUNKSİYALARI ---

// Like Funksiyası
window.handleLike = async (postId) => {
    let likedPosts = JSON.parse(localStorage.getItem('likedPosts')) || [];
    if (likedPosts.includes(postId)) return;
    try {
        await updateDoc(doc(db, "posts", postId), { likes: increment(1) });
        likedPosts.push(postId);
        localStorage.setItem('likedPosts', JSON.stringify(likedPosts));
    } catch (e) { console.error(e); }
};

// Şərh Funksiyası
window.handleComment = async (postId) => {
    const input = document.getElementById(`comment-input-${postId}`);
    const text = input.value.trim();
    if (!text) return;
    try {
        await updateDoc(doc(db, "posts", postId), {
            comments: arrayUnion({ text, author: "İstifadəçi", time: Date.now() })
        });
        input.value = "";
    } catch (e) { console.error(e); }
};

// Şəkil Yükləmə (Post və ya Story)
async function handleFileUpload(type) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.click();
    fileInput.onchange = async () => {
        const file = fileInput.files[0];
        if (!file) return;
        
        const formData = new FormData();
        formData.append("image", file);
        
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: formData });
        const result = await res.json();
        const url = result.data.url;

        let text = type === 'posts' ? prompt("Başlıq yazın:") : "";
        
        await addDoc(collection(db, type), {
            url, text, likes: 0, comments: [], timestamp: serverTimestamp()
        });
        alert("Paylaşıldı!");
    };
}

// Məzmunu Yüklə (Girişdən sonra)
function loadContent() {
    // Story-ləri Yüklə
    onSnapshot(query(collection(db, "stories"), orderBy("timestamp", "desc")), (snap) => {
        const container = document.getElementById('stories-container');
        container.innerHTML = `<div class="story-item" id="addStoryBtn"><div class="story-circle">+</div><p>Paylaş</p></div>`;
        snap.forEach(doc => {
            const data = doc.data();
            container.innerHTML += `
                <div class="story-item">
                    <img src="${data.url}" class="story-circle">
                    <p>İstifadəçi</p>
                </div>`;
        });
        document.getElementById('addStoryBtn').onclick = () => handleFileUpload('stories');
    });

    // Postları Yüklə
    onSnapshot(query(collection(db, "posts"), orderBy("timestamp", "desc")), (snap) => {
        const list = document.getElementById('post-list');
        list.innerHTML = '';
        const likedPosts = JSON.parse(localStorage.getItem('likedPosts')) || [];

        snap.forEach(postDoc => {
            const data = postDoc.data();
            const id = postDoc.id;
            const isLiked = likedPosts.includes(id);
            const commentsHTML = (data.comments || []).map(c => `<p><strong>${c.author}</strong> ${c.text}</p>`).join('');

            list.innerHTML += `
                <div class="post-card">
                    <div class="post-header"><span>İstifadəçi</span></div>
                    <img src="${data.url}" ondblclick="handleLike('${id}')">
                    <div class="post-info">
                        <button onclick="handleLike('${id}')">${isLiked ? '❤️' : '🤍'}</button>
                        <strong>${data.likes || 0} bəyənmə</strong>
                        <p>${data.text || ""}</p>
                        <div class="comments-box">${commentsHTML}</div>
                        <input type="text" id="comment-input-${id}" placeholder="Şərh...">
                        <button onclick="handleComment('${id}')">Paylaş</button>
                    </div>
                </div>`;
        });
    });
}

// --- AUTH MÜŞAHİDƏÇİSİ ---
onAuthStateChanged(auth, (user) => {
    const authScreen = document.getElementById('auth-screen');
    const appScreen = document.getElementById('app');
    if (user) {
        authScreen.classList.add('hidden');
        appScreen.classList.remove('hidden');
        loadContent();
    } else {
        authScreen.classList.remove('hidden');
        appScreen.classList.add('hidden');
    }
});

document.getElementById('logout-btn').onclick = () => signOut(auth);
document.getElementById('mainAddBtn').onclick = () => handleFileUpload('posts');
