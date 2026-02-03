import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    onAuthStateChanged,
    setPersistence,
    browserLocalPersistence,
    updateProfile 
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

// Firebase Konfiqurasiyası
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

// Yaddaş rejimini aktiv et
setPersistence(auth, browserLocalPersistence);

// Giriş edilibsə ana səhifəyə göndər
onAuthStateChanged(auth, (user) => {
    if (user) window.location.replace("index.html");
});

const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');

// --- QEYDİYYAT FUNKSİYASI ---
if (registerBtn) {
    registerBtn.onclick = async () => {
        const nickname = document.getElementById('nickname').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!nickname || !email || !password) {
            alert("Zəhmət olmasa ləqəb, email və şifrəni daxil edin!");
            return;
        }

        try {
            // 1. Hesabı yarat
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // 2. Nickname-i profilə əlavə et
            await updateProfile(userCredential.user, {
                displayName: nickname
            });

            alert("Hesab yaradıldı! Xoş gəldin, " + nickname);
            window.location.replace("index.html");
        } catch (err) {
            alert("Xəta: " + err.message);
        }
    };
}

// --- GİRİŞ FUNKSİYASI ---
if (loginBtn) {
    loginBtn.onclick = async () => {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!email || !password) {
            alert("Email və şifrəni daxil edin!");
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
            window.location.replace("index.html");
        } catch (err) {
            alert("Giriş xətası: Məlumatlar yanlışdır.");
        }
    };
}
