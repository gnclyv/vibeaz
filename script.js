import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, doc, updateDoc, increment, arrayUnion, query, orderBy } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// 1. Firebase və ImgBB Konfiqurasiyası
const firebaseConfig = {
    apiKey: "AIzaSyCUXJcQt0zkmQUul53VzgZOnX9UqvXKz3w",
    authDomain: "vibeaz-1e98a.firebaseapp.com",
    projectId: "vibeaz-1e98a",
    storageBucket: "vibeaz-1e98a.firebasestorage.app",
    messagingSenderId: "953434260285",
    appId: "1:953434260285:web:6263b4372487ba6d673b54"
};

const IMGBB_API_KEY = "c405e03c9dde65d450d8be8bdcfda25f";

// App-i başlat
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 2. İstifadəçi Statusu və Dinamik Profil Şəkli
onAuthStateChanged(auth, (user) => {
    const navAvatar = document.getElementById('nav-user-avatar');
    
    if (user) {
        const userName = user.email.split('@')[0];
        
        // Aşağı menyuda profil şəkli hissəsini doldururuq
        if (navAvatar) {
            const userPhoto = user.photoURL || `https://ui-avatars.com/api/?name=${userName}&background=random&color=fff`;
            navAvatar.innerHTML = `<img src="${userPhoto}" class="nav-profile-img" alt="Profil">`;
        }

        // Postları yüklə
        loadPosts();
    } else {
        // İstifadəçi daxil olmayıbsa login-ə göndər
        if (!window.location.pathname.includes("login.html")) {
            window.location.href = "login.html";
        }
    }
});

// 3. Post Paylaşma Funksiyası
async function uploadPost() {
    const fileInp = document.getElementById('fileInput');
    
    fileInp.onchange = async () => {
        const user = auth.currentUser;
        if (!user || !fileInp.files[0]) return;

        const fd = new FormData();
        fd.append("image", fileInp.files[0]);

        try {
            const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: fd });
            const result = await res.json();

            if (result.success) {
                const text = prompt("Post üçün açıqlama yazın:");
                const userName = user.email.split('@')[0];

                await addDoc(collection(db, "posts"), {
                    url: result.data.url,
                    text: text || "",
                    userName: userName,
                    likes: 0,
                    comments: [],
                    timestamp: serverTimestamp()
                });
                alert("Paylaşıldı!");
            }
        } catch (e) {
            console.error("Yükləmə xətası:", e);
            alert("Şəkil yüklənmədi!");
        }
    };
    fileInp.click();
}

// 4. Ana Səhifə Postlarını Real Zamanlı Yükləmə
function loadPosts() {
    const list = document.getElementById('post-list');
    if (!list) return;

    // Postları ən son paylaşılan birinci olmaqla sıralayırıq
    const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));

    onSnapshot(q, (snap) => {
        list.innerHTML = ''; 
        const likedPosts = JSON.parse(localStorage.getItem('vibeLikes')) || [];

        snap.forEach(d => {
            const data = d.data();
            const id = d.id;
            const isLiked = likedPosts.includes(id);
            const author = data.userName || "İstifadəçi";
            const comments = data.comments || [];

            list.innerHTML += `
                <div class="post-card">
                    <div class="post-header" style="padding:10px 15px; display:flex; align-items:center; gap:10px;">
                        <img src="https://ui-avatars.com/api/?name=${author}&background=random&color=fff" 
                             style="width:32px; height:32px; border-radius:50%; object-fit:cover;">
                        <span style="font-weight:600; font-size:14px;">${author}</span>
                    </div>
                    
                    <div class="post-img-container">
                        <img src="${data.url}" ondblclick="handleLike('${id}')">
                    </div>
                    
                    <div style="padding:12px;">
                        <div style="display:flex; gap:15px; margin-bottom:8px; font-size:22px;">
                            <i class="${isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}" 
                               onclick="handleLike('${id}')" 
                               style="cursor:pointer; color:${isLiked ? '#ff3040' : 'white'}"></i>
                            <i class="fa-regular fa-comment"></i>
                        </div>
                        <div style="font-weight:bold; font-size:14px; margin-bottom:5px;">${data.likes || 0} bəyənmə</div>
                        <div style="font-size:14px;"><b>${author}</b> ${data.text || ""}</div>
                        
                        <div id="comments-${id}" style="font-size:13px; color:#8e8e8e; margin-top:8px;">
                            ${comments.slice(-2).map(c => `<div><b>${c.user}</b> ${c.text}</div>`).join('')}
                        </div>

                        <div style="display:flex; margin-top:10px; border-top:1px solid #262626; padding-top:8px;">
                            <input type="text" id="comment-input-${id}" placeholder="Şərh yaz..." 
                                   style="background:none; border:none; color:white; flex:1; outline:none; font-size:13px;">
                            <button onclick="window.addComment('${id}')" style="background:none; border:none; color:#0095f6; font-weight:bold; cursor:pointer;">Paylaş</button>
                        </div>
                    </div>
                </div>`;
        });
    });
}

// 5. Like və Şərh Funksiyalarını Qlobal etmək (HTML-dən çağırıla bilsin deyə)
window.handleLike = async (id) => {
    let liked = JSON.parse(localStorage.getItem('vibeLikes')) || [];
    if (liked.includes(id)) return;

    try {
        await updateDoc(doc(db, "posts", id), { likes: increment(1) });
        liked.push(id);
        localStorage.setItem('vibeLikes', JSON.stringify(liked));
    } catch (e) { console.error("Like xətası:", e); }
};

window.addComment = async (postId) => {
    const user = auth.currentUser;
    const input = document.getElementById(`comment-input-${postId}`);
    if (!input || !user || !input.value.trim()) return;

    try {
        await updateDoc(doc(db, "posts", postId), {
            comments: arrayUnion({
                user: user.email.split('@')[0],
                text: input.value.trim(),
                time: Date.now()
            })
        });
        input.value = ""; 
    } catch (e) { console.error("Şərh xətası:", e); }
};

// Düymələri dinlə
if (document.getElementById('mainAddBtn')) document.getElementById('mainAddBtn').onclick = uploadPost;
if (document.getElementById('logout-btn')) {
    document.getElementById('logout-btn').onclick = () => {
        signOut(auth).then(() => { window.location.href = "login.html"; });
    };
}
