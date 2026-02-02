import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

// 1. Firebase Konfiqurasiyası
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

// Düymələri seçirik
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');

// 2. Qeydiyyat Funksiyası (Hesab Yarat)
if (registerBtn) {
    registerBtn.onclick = () => {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        if (email === "" || password === "") {
            alert("Zəhmət olmasa email və şifrəni doldurun!");
            return;
        }

        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                console.log("Qeydiyyat uğurlu:", userCredential.user);
                alert("Hesabınız yaradıldı! İndi 'Daxil Ol' düyməsini basa bilərsiniz.");
            })
            .catch((error) => {
                console.error("Qeydiyyat xətası:", error.code);
                // Xətaları istifadəçiyə izah edirik
                if (error.code === 'auth/email-already-in-use') {
                    alert("Bu email artıq qeydiyyatdan keçib!");
                } else if (error.code === 'auth/weak-password') {
                    alert("Şifrə çox zəifdir (ən az 6 simvol)! ");
                } else {
                    alert("Xəta: " + error.message);
                }
            });
    };
}

// 3. Giriş Funksiyası
if (loginBtn) {
    loginBtn.onclick = () => {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        signInWithEmailAndPassword(auth, email, password)
            .then(() => {
                window.location.href = "index.html"; // Uğurlu girişdə ana səhifəyə
            })
            .catch((error) => {
                alert("Giriş xətası: Email və ya şifrə yanlışdır.");
            });
    };
}
