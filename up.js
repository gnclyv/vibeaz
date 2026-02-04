import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, doc, getDoc, collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCUXJcQt0zkmQUul53VzgZOnX9UqvXKz3w",
    authDomain: "vibeaz-1e98a.firebaseapp.com",
    projectId: "vibeaz-1e98a",
    storageBucket: "vibeaz-1e98a.firebasestorage.app",
    messagingSenderId: "953434260285",
    appId: "1:953434260285:web:6263b4372487ba6d673b54"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// URL-dən UID-ni götür
const params = new URLSearchParams(window.location.search);
const profileId = params.get('uid');

async function loadProfile() {
    if (!profileId) return;

    // 1. İstifadəçi məlumatlarını gətir
    const userDoc = await getDoc(doc(db, "users", profileId));
    if (userDoc.exists()) {
        const data = userDoc.data();
        document.getElementById('header-username').innerText = data.displayName;
        document.getElementById('display-name').innerText = data.displayName;
        document.getElementById('profile-pic').src = data.photoURL || `https://ui-avatars.com/api/?name=${data.displayName}`;
        document.getElementById('follower-count').innerText = (data.followers || []).length;
        document.getElementById('following-count').innerText = (data.following || []).length;
        
        // Öz profilidirsə "İzlə" düyməsini gizlə
        onAuthStateChanged(auth, (user) => {
            if (user && user.uid === profileId) {
                document.getElementById('follow-btn').style.display = 'none';
            }
        });
    }

    // 2. İstifadəçinin postlarını gətir
    const q = query(collection(db, "posts"), where("userId", "==", profileId));
    onSnapshot(q, (snap) => {
        const grid = document.getElementById('user-posts-grid');
        grid.innerHTML = '';
        document.getElementById('post-count').innerText = snap.size;
        
        snap.forEach(d => {
            const post = d.data();
            grid.innerHTML += `<img src="${post.url}" onclick="location.href='index.html#post-${d.id}'">`;
        });
    });
}

loadProfile();
