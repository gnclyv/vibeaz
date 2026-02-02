import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

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

// --- AVTOMATİK YÖNLƏNDİRMƏ ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        // İstifadəçi artıq daxil olubsa, birbaşa ana səhifəyə getsin
        window.location.href = "index.html";
    }
});

const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');

// --- QEYDİYYAT (HESAB YARAT) ---
if (registerBtn) {
    registerBtn.onclick = () => {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        if (email === "" || password === "") {
            alert("Email və şifrəni yazın!");
            return;
        }

        createUserWithEmailAndPassword(auth, email, password)
            .then(() => {
                alert("Hesab yaradıldı! İndi daxil ola bilərsiniz.");
            })
            .catch((err) => {
                if (err.code === 'auth/email-already-in-use') alert("Bu email artıq istifadə olunur!");
                else alert("Xəta: " + err.message);
            });
    };
}

// --- GİRİŞ (DAXİL OL) ---
if (loginBtn) {
    loginBtn.onclick = () => {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        signInWithEmailAndPassword(auth, email, password)
            .then(() => {
                window.location.href = "index.html";
            })
            .catch(() => alert("Email və ya şifrə yanlışdır!"));
    };
}
