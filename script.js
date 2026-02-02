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

// 2. İstifadəçi Statusu Yoxlanışı
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        if (!window.location.pathname.includes("login.html")) {
            window.location.href = "login.html";
        }
    } else {
        await user.reload(); // Profil adının dərhal tanınması üçün
        document.getElementById('app').style.display = 'block';
        loadPosts();
    }
});

// 3. Post Paylaşma (Ad ilə birgə)
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
                // Ad yoxdursa nömrəni, o da yoxdursa "İstifadəçi" yazırıq
                const nameToDisplay = user.displayName || user.phoneNumber || "İstifadəçi";

                await addDoc(collection(db, "posts"), {
                    url: result.data.url,
                    text: text || "",
                    userName: nameToDisplay,
                    likes: 0,
                    comments: [], // Şərhlər üçün boş massiv
                    timestamp: serverTimestamp()
                });
                alert("Paylaşıldı!");
            }
        } catch (e) { console.error("Yükləmə xətası:", e); }
    };
    fileInp.click();
}

// 4. Like Funksiyası
window.handleLike = async (id) => {
    let liked = JSON.parse(localStorage.getItem('vibeLikes')) || [];
    if (liked.includes(id)) return;

    try {
        await updateDoc(doc(db, "posts", id), { likes: increment(1) });
        liked.push(id);
        localStorage.setItem('vibeLikes', JSON.stringify(liked));
    } catch (e) { console.error(e); }
};

// 5. Şərh Yazmaq Funksiyası
window.addComment = async (postId) => {
    const user = auth.currentUser;
    const input = document.getElementById(`comment-input-${postId}`);
    const commentText = input.value.trim();

    if (!commentText || !user) return;

    try {
        await updateDoc(doc(db, "posts", postId), {
            comments: arrayUnion({
                user: user.displayName || "İstifadəçi",
                text: commentText,
                time: Date.now()
            })
        });
        input.value = ""; 
    } catch (e) { console.error("Şərh xətası:", e); }
};

// 6. Postları Ekrana Çıxarma
function loadPosts() {
    const list = document.getElementById('post-list');
    onSnapshot(collection(db, "posts"), (snap) => {
        let postsArray = [];
        snap.forEach(d => postsArray.push({ id: d.id, ...d.data() }));
        // Tarixə görə sıralama
        postsArray.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));

        list.innerHTML = ''; 
        const likedPosts = JSON.parse(localStorage.getItem('vibeLikes')) || [];

        postsArray.forEach(data => {
            const id = data.id;
            const isLiked = likedPosts.includes(id);
            const author = data.userName || "Anonim";
            const comments = data.comments || [];

            list.innerHTML += `
                <div class="post-card" style="background:#1a1a1a; margin-bottom:25px; border-radius:15px; border:1px solid #333; overflow:hidden;">
                    <div class="post-header" style="display:flex; align-items:center; padding:12px;">
                        <img src="https://ui-avatars.com/api/?name=${author}&background=random" style="width:32px; height:32px; border-radius:50%; margin-right:10px;">
                        <span style="font-weight:600; color:white;">${author}</span>
                    </div>
                    <img src="${data.url}" style="width:100%; aspect-ratio:1/1; object-fit:cover;" ondblclick="handleLike('${id}')">
                    
                    <div style="padding:15px; color:white;">
                        <div style="display:flex; gap:15px; margin-bottom:10px; font-size:22px;">
                            <i class="${isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}" 
                               onclick="handleLike('${id}')" style="cursor:pointer; color:${isLiked ? '#ff3040' : 'white'}"></i>
                            <i class="fa-regular fa-comment" onclick="document.getElementById('comment-input-${id}').focus()" style="cursor:pointer;"></i>
                        </div>
                        <div style="font-weight:700; margin-bottom:5px;">${data.likes || 0} bəyənmə</div>
                        <div style="margin-bottom:10px;"><b>${author}</b> ${data.text || ""}</div>
                        
                        <div id="comments-${id}" style="font-size:13px; color:#aaa; max-height:80px; overflow-y:auto; margin-bottom:10px;">
                            ${comments.map(c => `<div style="margin-bottom:3px;"><b style="color:white;">${c.user}</b> ${c.text}</div>`).join('')}
                        </div>

                        <div style="display:flex; border-top:1px solid #333; padding-top:10px;">
                            <input type="text" id="comment-input-${id}" placeholder="Şərh yaz..." 
                                   style="background:none; border:none; color:white; flex:1; outline:none; font-size:14px;">
                            <button onclick="addComment('${id}')" style="background:none; border:none; color:#0095f6; font-weight:600; cursor:pointer;">Paylaş</button>
                        </div>
                    </div>
                </div>`;
        });
    });
}

document.getElementById('mainAddBtn').onclick = uploadPost;
document.getElementById('logout-btn').onclick = () => signOut(auth).then(() => window.location.reload());
