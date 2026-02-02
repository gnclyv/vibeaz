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
    else { document.getElementById('app').style.display = 'block'; loadContent(); }
});

// Like və Şərh funksiyaları
window.handleLike = async (id) => {
    let liked = JSON.parse(localStorage.getItem('vibeLikes')) || [];
    if (liked.includes(id)) return;
    await updateDoc(doc(db, "posts", id), { likes: increment(1) });
    liked.push(id);
    localStorage.setItem('vibeLikes', JSON.stringify(liked));
};

window.handleComment = async (id) => {
    const inp = document.getElementById(`cm-${id}`);
    if (!inp.value.trim()) return;
    await updateDoc(doc(db, "posts", id), {
        comments: arrayUnion({ text: inp.value, author: "İstifadəçi", date: Date.now() })
    });
    inp.value = "";
};

function loadContent() {
    // Stories
    onSnapshot(query(collection(db, "stories"), orderBy("timestamp", "desc")), (snap) => {
        const cont = document.getElementById('stories');
        cont.innerHTML = `<div class="story-card" id="addSt"><div class="story-circle">+</div><span>Paylaş</span></div>`;
        snap.forEach(d => {
            cont.innerHTML += `<div class="story-card"><div class="story-circle"><img src="${d.data().url}"></div><span>User</span></div>`;
        });
        document.getElementById('addSt').onclick = () => upload('stories');
    });

    // Posts
    onSnapshot(query(collection(db, "posts"), orderBy("timestamp", "desc")), (snap) => {
        const list = document.getElementById('post-list');
        list.innerHTML = '';
        snap.forEach(d => {
            const data = d.data();
            const id = d.id;
            const comments = (data.comments || []).map(c => `<p style="margin:2px 0; font-size:13px;"><b>${c.author}</b> ${c.text}</p>`).join('');
            list.innerHTML += `
                <div class="post-card">
                    <div class="post-header">User</div>
                    <div class="post-img-container"><img src="${data.url}" ondblclick="handleLike('${id}')"></div>
                    <div class="post-info">
                        <div class="post-actions"><i class="fa-regular fa-heart" onclick="handleLike('${id}')"></i></div>
                        <strong>${data.likes || 0} likes</strong>
                        <p><b>User</b> ${data.text || ""}</p>
                        <div class="comments">${comments}</div>
                        <div style="display:flex; margin-top:10px;">
                            <input type="text" id="cm-${id}" placeholder="Şərh..." style="flex:1; border:none; border-bottom:1px solid #eee;">
                            <button onclick="handleComment('${id}')" style="border:none; color:#0095f6; background:none; font-weight:bold;">Paylaş</button>
                        </div>
                    </div>
                </div>`;
        });
    });
}

async function upload(type) {
    const fileInp = document.getElementById('fileInput');
    fileInp.onchange = async () => {
        const fd = new FormData(); fd.append("image", fileInp.files[0]);
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: fd });
        const result = await res.json();
        const text = type === 'posts' ? prompt("Açıqlama:") : "";
        await addDoc(collection(db, type), { url: result.data.url, text, likes: 0, comments: [], timestamp: serverTimestamp() });
    };
    fileInp.click();
}

document.getElementById('mainAddBtn').onclick = () => upload('posts');
document.getElementById('logout-btn').onclick = () => signOut(auth);
