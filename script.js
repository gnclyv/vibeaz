import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, doc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

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

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        if (!window.location.pathname.includes("login.html")) window.location.href = "login.html";
    } else {
        await user.reload(); // Ən son profil məlumatını yüklə
        document.getElementById('app').style.display = 'block';
        loadPosts();
    }
});

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
                const text = prompt("Açıqlama yazın:");
                // Əgər displayName hələ də null-dursa, nömrəni göstər
                const finalName = user.displayName || user.phoneNumber || "İstifadəçi";

                await addDoc(collection(db, "posts"), {
                    url: result.data.url,
                    text: text || "",
                    userName: finalName,
                    likes: 0,
                    timestamp: serverTimestamp()
                });
                alert("Paylaşıldı!");
            }
        } catch (e) { console.error(e); }
    };
    fileInp.click();
}

function loadPosts() {
    const list = document.getElementById('post-list');
    onSnapshot(collection(db, "posts"), (snap) => {
        let postsArray = [];
        snap.forEach(d => postsArray.push({ id: d.id, ...d.data() }));
        postsArray.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));

        list.innerHTML = ''; 
        postsArray.forEach(data => {
            const author = data.userName || "Anonim";
            list.innerHTML += `
                <div class="post-card" style="background:#1a1a1a; margin-bottom:20px; border-radius:15px; overflow:hidden; border:1px solid #333;">
                    <div class="post-header" style="display:flex; align-items:center; padding:12px;">
                        <img src="https://ui-avatars.com/api/?name=${author}&background=random" style="width:32px; height:32px; border-radius:50%; margin-right:10px;">
                        <span style="font-weight:600;">${author}</span>
                    </div>
                    <img src="${data.url}" style="width:100%; aspect-ratio:1/1; object-fit:cover;">
                    <div style="padding:15px;">
                        <div style="font-weight:700;">${data.likes || 0} bəyənmə</div>
                        <div><b>${author}</b> ${data.text || ""}</div>
                    </div>
                </div>`;
        });
    });
}

document.getElementById('mainAddBtn').onclick = uploadPost;
document.getElementById('logout-btn').onclick = () => signOut(auth).then(() => window.location.reload());
