import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, updateDoc, increment, arrayUnion } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCUXJcQt0zkmQUul53VzgZOnX9UqvXKz3w", // Öz Firebase API açarını qoy
    authDomain: "vibeaz-1e98a.firebaseapp.com",
    projectId: "vibeaz-1e98a",
    storageBucket: "vibeaz-1e98a.firebasestorage.app",
    messagingSenderId: "953434260285",
    appId: "1:953434260285:web:6263b4372487ba6d673b54"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const IMGBB_API_KEY = "c405e03c9dde65d450d8be8bdcfda25f"; // Öz ImgBB API açarını qoy

// İstifadəçi statusu dəyişdikdə
onAuthStateChanged(auth, (user) => {
    if (!user) {
        // İstifadəçi yoxdursa login səhifəsinə yönləndir
        if (!window.location.pathname.includes("login.html")) {
            window.location.href = "login.html";
        }
    } else {
        // İstifadəçi daxil olubsa, əsas app-i göstər və postları yüklə
        document.getElementById('app').style.display = 'block';
        loadPosts();
    }
});

// Like funksiyası
window.handleLike = async (id) => {
    let liked = JSON.parse(localStorage.getItem('vibeLikes')) || [];
    const likeIcon = document.querySelector(`.post-card[data-post-id="${id}"] .fa-heart`);

    if (liked.includes(id)) {
        // Artıq like edilibsə, çıx
        return; 
    }

    try {
        await updateDoc(doc(db, "posts", id), { likes: increment(1) });
        liked.push(id);
        localStorage.setItem('vibeLikes', JSON.stringify(liked));
        if (likeIcon) {
            likeIcon.classList.add('liked'); // Rəngini dəyiş
        }
    } catch (e) {
        console.error("Like xətası:", e);
    }
};

// Şərh əlavə et funksiyası
window.handleComment = async (id) => {
    const input = document.getElementById(`cm-${id}`);
    const text = input.value.trim();
    if (!text) return;

    try {
        await updateDoc(doc(db, "posts", id), {
            comments: arrayUnion({ text: text, author: "İstifadəçi", date: Date.now() })
        });
        input.value = ""; // Inputu təmizlə
    } catch (e) {
        console.error("Şərh xətası:", e);
    }
};

// Post yükləmə funksiyası
async function uploadPost() {
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
                const text = prompt("Post üçün açıqlama yazın (isteğe bağlı):");
                await addDoc(collection(db, "posts"), {
                    url: result.data.url,
                    text: text || "",
                    likes: 0,
                    comments: [],
                    timestamp: serverTimestamp()
                });
            } else {
                alert("Şəkil yüklənmədi. Zəhmət olmasa yenidən cəhd edin.");
            }
        } catch (e) {
            alert("Şəkil yükləmə xətası! Konsola baxın.");
            console.error("Upload error:", e);
        }
    };
    fileInp.click(); // Gizli inputu aç
}

// Postları Firestore-dan yüklə və göstər
function loadPosts() {
    const list = document.getElementById('post-list');
    onSnapshot(query(collection(db, "posts"), orderBy("timestamp", "desc")), (snap) => {
        list.innerHTML = ''; // Köhnə postları təmizlə
        const likedPosts = JSON.parse(localStorage.getItem('vibeLikes')) || [];

        snap.forEach(d => {
            const data = d.data();
            const id = d.id;
            const isLiked = likedPosts.includes(id);

            const commentsHTML = (data.comments || []).map(c => 
                `<p class="post-comment-item"><b>User</b> ${c.text}</p>`
            ).join('');

            list.innerHTML += `
                <div class="post-card" data-post-id="${id}">
                    <div class="post-header">
                        <img src="https://via.placeholder.com/32" alt="Profil Şəkli" class="profile-pic">
                        <span class="username">username</span>
                    </div>
                    <div class="post-img-container">
                        <img src="${data.url}" alt="Post Şəkli" ondblclick="handleLike('${id}')">
                    </div>
                    <div class="post-actions">
                        <i class="${isLiked ? 'fa-solid fa-heart liked' : 'fa-regular fa-heart'}" 
                           onclick="handleLike('${id}')"></i>
                        <i class="fa-regular fa-comment"></i>
                        <i class="fa-regular fa-paper-plane" style="margin-right: auto;"></i>
                        <i class="fa-regular fa-bookmark"></i>
                    </div>
                    <div class="post-info">
                        <span class="likes-count">${data.likes || 0} bəyənmə</span>
                        <p class="post-caption"><b>username</b> ${data.text || ""}</p>
                        <div class="post-comments">${commentsHTML}</div>
                        <div class="post-comment-input">
                            <input type="text" id="cm-${id}" placeholder="Şərh yaz...">
                            <button onclick="handleComment('${id}')">Paylaş</button>
                        </div>
                    </div>
                </div>`;
        });
    });
}

// Event Listener-lər
document.getElementById('mainAddBtn').onclick = uploadPost;
document.getElementById('logout-btn').onclick = () => signOut(auth).then(() => window.location.reload());
