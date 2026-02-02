import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
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

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const cleanName = user.email.split('@')[0].toLowerCase();
        
        // Profil məlumatlarını yüklə
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            document.getElementById('profile-username').innerText = userDoc.data().displayName;
            document.getElementById('user-avatar').src = userDoc.data().photoURL;
        } else {
            document.getElementById('profile-username').innerText = cleanName;
        }
        
        document.getElementById('profile-email').innerText = user.email;
        loadUserPosts(cleanName);
    } else {
        window.location.href = "login.html";
    }
});

function loadUserPosts(cleanName) {
    const grid = document.getElementById('user-posts-grid');
    const q = query(collection(db, "posts"), where("userName", "==", cleanName));

    onSnapshot(q, (snap) => {
        grid.innerHTML = "";
        let count = 0;
        snap.forEach(d => {
            count++;
            grid.innerHTML += `
                <div class="grid-item">
                    <img src="${d.data().url}">
                </div>`;
        });
        document.getElementById('post-count').innerText = count;
    });
}

// Çıxış düyməsi
document.getElementById('logout-btn').onclick = () => {
    signOut(auth).then(() => window.location.href = "login.html");
};
