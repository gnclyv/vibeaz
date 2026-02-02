import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

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

// Elementlər
const editModal = document.getElementById('edit-modal');
const editBtn = document.getElementById('edit-profile-btn');
const closeBtn = document.getElementById('close-modal-btn');
const saveBtn = document.getElementById('save-profile-btn');
const fileInp = document.getElementById('new-avatar-input');

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const username = user.email.split('@')[0];
        document.getElementById('profile-email').innerText = user.email;
        
        // Firestore-dan istifadəçi datasını çək
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            document.getElementById('profile-username').innerText = userDoc.data().displayName;
            document.getElementById('user-avatar').src = userDoc.data().photoURL;
            document.getElementById('preview-img').src = userDoc.data().photoURL;
        } else {
            document.getElementById('profile-username').innerText = username;
            document.getElementById('user-avatar').src = `https://ui-avatars.com/api/?name=${username}`;
        }
        
        loadMyPosts(username);
    } else {
        window.location.href = "login.html";
    }
});

// Modalı idarə et
if(editBtn) editBtn.onclick = () => editModal.style.display = 'flex';
if(closeBtn) closeBtn.onclick = () => editModal.style.display = 'none';

// Şəkil önizləmə
fileInp.onchange = (e) => {
    const file = e.target.files[0];
    if(file) document.getElementById('preview-img').src = URL.createObjectURL(file);
};

// Yadda saxla düyməsi
saveBtn.onclick = async () => {
    const user = auth.currentUser;
    const newName = document.getElementById('new-name-input').value.trim();
    const file = fileInp.files[0];
    
    saveBtn.disabled = true;
    saveBtn.innerText = "Yüklənir...";

    let photoUrl = document.getElementById('user-avatar').src;

    if (file) {
        const fd = new FormData();
        fd.append("image", file);
        try {
            const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: fd });
            const result = await res.json();
            if (result.success) photoUrl = result.data.url;
        } catch (e) { console.error("ImgBB xətası"); }
    }

    try {
        await setDoc(doc(db, "users", user.uid), {
            displayName: newName || document.getElementById('profile-username').innerText,
            photoURL: photoUrl,
            email: user.email
        });
        location.reload();
    } catch (e) { alert("Xəta!"); }
};

// Postları yüklə
function loadMyPosts(username) {
    const grid = document.getElementById('user-posts-grid');
    const q = query(collection(db, "posts"), where("userName", "==", username));

    onSnapshot(q, (snap) => {
        grid.innerHTML = "";
        let count = 0;
        snap.forEach(d => {
            count++;
            grid.innerHTML += `<div class="grid-item"><img src="${d.data().url}"></div>`;
        });
        document.getElementById('post-count').innerText = count;
    });
}
