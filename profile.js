import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

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

onAuthStateChanged(auth, (user) => {
    if (user) {
        const username = user.email.split('@')[0];
        document.getElementById('profile-username').innerText = username;
        document.getElementById('profile-email').innerText = user.email;
        document.getElementById('user-avatar').src = `https://ui-avatars.com/api/?name=${username}&background=random`;
        
        loadUserPosts(username);
    } else {
        window.location.href = "login.html";
    }
});

function loadUserPosts(username) {
    const grid = document.getElementById('user-posts-grid');
    // Yalnız bu istifadəçiyə aid postları çəkirik
    const q = query(collection(db, "posts"), where("userName", "==", username));

    onSnapshot(q, (snap) => {
        grid.innerHTML = "";
        let count = 0;
        snap.forEach((doc) => {
            const data = doc.data();
            count++;
            grid.innerHTML += `
                <div class="grid-item">
                    <img src="${data.url}" alt="Post">
                </div>
            `;
        });
        document.getElementById('post-count').innerText = count;
    });
}
