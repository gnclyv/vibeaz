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
    if (!user) { window.location.href = "login.html"; } 
    else { document.getElementById('app').style.display = 'block'; loadPosts(); }
});

// Post paylaşma funksiyası
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
            list.innerHTML += `
                <div class="post-card">
                    <div style="padding:10px; font-weight:bold;">User</div>
                    <div class="post-img-container"><img src="${data.url}"></div>
                    <div class="post-info">
                        <div style="font-size:24px; margin-bottom:8px;"><i class="fa-regular fa-heart"></i></div>
                        <strong>${data.likes || 0} bəyənmə</strong>
                        <p><b>User</b> ${data.text || ""}</p>
                    </div>
                </div>`;
        });
    });
}

document.getElementById('mainAddBtn').onclick = uploadPost;
document.getElementById('logout-btn').onclick = () => signOut(auth);
