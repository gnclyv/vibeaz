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

// 2. Auth Keşikçisi (Giriş yoxlaması)
onAuthStateChanged(auth, (user) => {
    if (!user) {
        if (!window.location.pathname.includes("login.html")) {
            window.location.href = "login.html";
        }
    } else {
        document.getElementById('app').style.display = 'block';
        loadStories();
        loadPosts();
    }
});

// 3. Like Funksiyası
window.handleLike = async (id) => {
    let liked = JSON.parse(localStorage.getItem('vibeLikes')) || [];
    if (liked.includes(id)) return;
    try {
        await updateDoc(doc(db, "posts", id), { likes: increment(1) });
        liked.push(id);
        localStorage.setItem('vibeLikes', JSON.stringify(liked));
    } catch (e) { console.error("Like xətası:", e); }
};

// 4. Şərh Funksiyası
window.handleComment = async (id) => {
    const input = document.getElementById(`cm-${id}`);
    const text = input.value.trim();
    if (!text) return;
    try {
        await updateDoc(doc(db, "posts", id), {
            comments: arrayUnion({ text: text, author: "İstifadəçi", date: Date.now() })
        });
        input.value = "";
    } catch (e) { console.error("Şərh xətası:", e); }
};

// 5. Şəkil Yükləmə (Post və Story üçün)
async function upload(type) {
    const fileInp = document.getElementById('fileInput');
    fileInp.onchange = async () => {
        const file = fileInp.files[0];
        if (!file) return;

        const fd = new FormData();
        fd.append("image", file);

        try {
            const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: fd });
            const result = await res.json();
            
            if (result.success) {
                const text = type === 'posts' ? prompt("Açıqlama:") : "";
                await addDoc(collection(db, type), {
                    url: result.data.url,
                    text: text,
                    likes: 0,
                    comments: [],
                    timestamp: serverTimestamp()
                });
            }
        } catch (e) { alert("Yükləmə xətası!"); }
    };
    fileInp.click();
}

// 6. Story-ləri Yüklə
function loadStories() {
    const cont = document.getElementById('stories');
    onSnapshot(query(collection(db, "stories"), orderBy("timestamp", "desc")), (snap) => {
        cont.innerHTML = `<div class="story-card" id="addSt"><div class="story-circle"><i class="fa fa-plus"></i></div><span>Paylaş</span></div>`;
        snap.forEach(d => {
            cont.innerHTML += `<div class="story-card"><div class="story-circle"><img src="${d.data().url}"></div><span>User</span></div>`;
        });
        document.getElementById('addSt').onclick = () => upload('stories');
    });
}

// 7. Postları Yüklə (Səliqəli və kvadrat ölçüdə)
function loadPosts() {
    const list = document.getElementById('post-list');
    onSnapshot(query(collection(db, "posts"), orderBy("timestamp", "desc")), (snap) => {
        list.innerHTML = '';
        const likedPosts = JSON.parse(localStorage.getItem('vibeLikes')) || [];

        snap.forEach(d => {
            const data = d.data();
            const id = d.id;
            const isLiked = likedPosts.includes(id);
            const commentsHTML = (data.comments || []).map(c => 
                `<p style="margin:2px 0; font-size:13px;"><b>User</b> ${c.text}</p>`
            ).join('');

            list.innerHTML += `
                <div class="post-card">
                    <div class="post-header" style="padding:10px; font-weight:bold;">İstifadəçi</div>
                    <div class="post-img-container">
                        <img src="${data.url}" ondblclick="handleLike('${id}')">
                    </div>
                    <div class="post-info">
                        <div class="post-actions" style="font-size:22px; margin-bottom:8px;">
                            <i class="${isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}" 
                               style="color:${isLiked ? '#ed4956' : 'black'}; cursor:pointer;" 
                               onclick="handleLike('${id}')"></i>
                        </div>
                        <strong>${data.likes || 0} bəyənmə</strong>
                        <p><b>User</b> ${data.text || ""}</p>
                        <div class="comments">${commentsHTML}</div>
                        <div style="display:flex; margin-top:10px; border-top:1px solid #eee; padding-top:5px;">
                            <input type="text" id="cm-${id}" placeholder="Şərh yaz..." style="flex:1; border:none; outline:none;">
                            <button onclick="handleComment('${id}')" style="border:none; color:#0095f6; background:none; font-weight:bold; cursor:pointer;">Paylaş</button>
                        </div>
                    </div>
                </div>`;
        });
    });
}

// 8. Naviqasiya Düymələri
document.getElementById('mainAddBtn').onclick = () => upload('posts');
document.getElementById('logout-btn').onclick = () => signOut(auth).then(() => window.location.reload());
