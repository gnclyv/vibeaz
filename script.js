import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// SƏNİN FİREBASE KONFİQURASİYAN
const firebaseConfig = {
    apiKey: "SƏNİN_API_KEY",
    authDomain: "SƏNİN_DOMAIN",
    projectId: "SƏNİN_PROJECT_ID",
    storageBucket: "SƏNİN_BUCKET",
    messagingSenderId: "SƏNİN_SENDER_ID",
    appId: "SƏNİN_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const IMGBB_API_KEY = "c405e03c9dde65d450d8be8bdcfda25f";

// --- AUTH MƏNTİQİ ---
const authScreen = document.getElementById('auth-screen');

onAuthStateChanged(auth, (user) => {
    if (user) {
        authScreen.style.display = 'none';
        renderPosts();
    } else {
        authScreen.style.display = 'flex';
    }
});

// Qeydiyyat
document.getElementById('register-btn').onclick = async () => {
    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById('auth-password').value;
    try {
        await createUserWithEmailAndPassword(auth, email, pass);
    } catch (err) { alert(err.message); }
};

// Giriş
document.getElementById('login-btn').onclick = async () => {
    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById('auth-password').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) { alert("Xəta: Email və ya şifrə yanlışdır"); }
};

// Çıxış
document.getElementById('logout-btn').onclick = () => signOut(auth);

// --- POSTLARIN RENDERİ (GRID) ---
function renderPosts() {
    const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
    onSnapshot(q, (snapshot) => {
        const postList = document.getElementById('post-list');
        postList.innerHTML = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            postList.innerHTML += `
                <div class="explore-item">
                    <img src="${data.url}">
                </div>`;
        });
    });
}

// --- FAYL YÜKLƏMƏ ---
document.getElementById('mainAddBtn').onclick = () => document.getElementById('fileInput').click();

document.getElementById('fileInput').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: "POST",
        body: formData
    });
    const result = await res.json();

    await addDoc(collection(db, "posts"), {
        url: result.data.url,
        userId: auth.currentUser.uid,
        timestamp: serverTimestamp()
    });
    alert("Paylaşıldı!");
};
