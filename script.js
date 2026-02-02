import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, updateDoc, increment, arrayUnion } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

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

// Like funksiyası
window.handleLike = async (id) => {
    let liked = JSON.parse(localStorage.getItem('vibeLikes')) || [];
    if (liked.includes(id)) return;
    await updateDoc(doc(db, "posts", id), { likes: increment(1) });
    liked.push(id);
    localStorage.setItem('vibeLikes', JSON.stringify(liked));
};

// Şərh funksiyası
window.handleComment = async (id) => {
    const input = document.getElementById(`cm-${id}`);
    if (!input.value.trim()) return;
    await updateDoc(doc(db, "posts", id), {
        comments: arrayUnion({ text: input.value, author: "User", date: Date.now() })
    });
    input.value = "";
};

// Post paylaşma
async function uploadPost() {
    const fileInp = document.getElementById('fileInput');
    fileInp.onchange = async () => {
        const file = fileInp.files[0];
        if (!file) return;
        const fd = new FormData();
        fd.append("image", file);
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: fd });
        const result = await res.json();
        if (result.success) {
            const text = prompt("Açıqlama yazın:");
            await addDoc(collection(db, "posts"), {
                url: result.data.url,
                text: text || "",
                likes: 0,
                comments: [],
                timestamp: serverTimestamp()
            });
        }
    };
    fileInp.click();
}

// Postları göstərmə
function loadPosts() {
    const list = document.getElementById('post-list');
    onSnapshot(query(collection(db, "posts"), orderBy("timestamp", "desc")), (snap) => {
        list.innerHTML = '';
        snap.forEach(d => {
            const data = d.data();
            const id = d.id;
            const commentsHTML = (data.comments || []).map(c => `<p style="font-size:13px; margin:3px 0;"><b>User</b> ${c.text}</p>`).join('');

            list.innerHTML += `
                <div class="post-card">
                    <div style="padding:10px; font-weight:bold;">İstifadəçi</div>
                    <div class="post-img-container">
                        <img src="${data.url}" ondblclick="handleLike('${id}')">
                    </div>
                    <div class="post-info">
                        <div class="post-actions">
                            <i class="fa-regular fa-heart" onclick="handleLike('${id}')"></i>
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

document.getElementById('mainAddBtn').onclick = uploadPost;
document.getElementById('logout-btn').onclick = () => signOut(auth).then(() => window.location.reload());
