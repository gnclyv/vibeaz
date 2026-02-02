import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

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

// 2. İstifadəçi Statusu və Giriş Yoxlanışı
onAuthStateChanged(auth, (user) => {
    if (!user) {
        if (!window.location.pathname.includes("login.html")) {
            window.location.href = "login.html";
        }
    } else {
        document.getElementById('app').style.display = 'block';
        loadPosts();
    }
});

// 3. Post Paylaşma Funksiyası (İstifadəçi adı ilə birgə)
async function uploadPost() {
    const fileInp = document.getElementById('fileInput');
    const user = auth.currentUser;

    fileInp.onchange = async () => {
        const file = fileInp.files[0];
        if (!file || !user) return;

        const fd = new FormData();
        fd.append("image", file);

        try {
            const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: fd });
            const result = await res.json();

            if (result.success) {
                const text = prompt("Post üçün açıqlama yazın:");
                
                // İstifadəçi adını email-dən və ya profilindən götürürük
                const nameToDisplay = user.displayName || user.email.split('@')[0];

                await addDoc(collection(db, "posts"), {
                    url: result.data.url,
                    text: text || "",
                    userName: nameToDisplay, // Adı bazaya yazırıq
                    likes: 0,
                    timestamp: serverTimestamp()
                });
            }
        } catch (e) {
            console.error("Yükləmə xətası:", e);
        }
    };
    fileInp.click();
}

// 4. Like (Bəyənmə) Funksiyası
window.handleLike = async (id) => {
    let liked = JSON.parse(localStorage.getItem('vibeLikes')) || [];
    if (liked.includes(id)) return;

    try {
        await updateDoc(doc(db, "posts", id), { likes: increment(1) });
        liked.push(id);
        localStorage.setItem('vibeLikes', JSON.stringify(liked));
    } catch (e) {
        console.error("Like xətası:", e);
    }
};

// 5. Postları Ekrana Çıxarma
function loadPosts() {
    const list = document.getElementById('post-list');
    onSnapshot(query(collection(db, "posts"), orderBy("timestamp", "desc")), (snap) => {
        list.innerHTML = ''; 
        const likedPosts = JSON.parse(localStorage.getItem('vibeLikes')) || [];

        snap.forEach(d => {
            const data = d.data();
            const id = d.id;
            const isLiked = likedPosts.includes(id);
            // Əgər köhnə postlarda ad yoxdursa, "Anonim" yaz
            const author = data.userName || "VibeAz İstifadəçisi";

            list.innerHTML += `
                <div class="post-card">
                    <div class="post-header" style="display:flex; align-items:center; padding:12px;">
                        <img src="https://ui-avatars.com/api/?name=${author}&background=random" 
                             style="width:32px; height:32px; border-radius:50%; margin-right:10px;">
                        <span class="username" style="font-weight:600;">${author}</span>
                    </div>
                    <div class="post-img-container">
                        <img src="${data.url}" ondblclick="handleLike('${id}')">
                    </div>
                    <div class="post-actions" style="padding:15px; font-size:24px; display:flex; gap:15px;">
                        <i class="${isLiked ? 'fa-solid fa-heart liked' : 'fa-regular fa-heart'}" 
                           onclick="handleLike('${id}')" style="cursor:pointer; color:${isLiked ? '#ff3040' : 'inherit'}"></i>
                        <i class="fa-regular fa-comment"></i>
                        <i class="fa-regular fa-paper-plane"></i>
                    </div>
                    <div class="post-info" style="padding:0 15px 15px 15px;">
                        <span class="likes-count" style="font-weight:700;">${data.likes || 0} bəyənmə</span>
                        <p class="post-caption"><b>${author}</b> ${data.text || ""}</p>
                    </div>
                </div>`;
        });
    });
}

// 6. Düymə Tətikləyiciləri
document.getElementById('mainAddBtn').onclick = uploadPost;
document.getElementById('logout-btn').onclick = () => signOut(auth).then(() => window.location.reload());
