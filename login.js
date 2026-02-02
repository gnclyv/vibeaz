import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    onAuthStateChanged,
    setPersistence,
    browserLocalPersistence 
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

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

// 2. Avtomatik Yönləndirmə (Giriş edibsə login-i göstərmə)
onAuthStateChanged(auth, (user) => {
    if (user) {
        window.location.replace("index.html"); // .replace istifadə edirik ki, geri qayıda bilməsin
    }
});

// 3. Yaddaş Rejimini Təyin Et (Brauzer bağlansa belə çıxış etməsin)
setPersistence(auth, browserLocalPersistence)
    .then(() => {
        console.log("Persistence aktivdir: LocalStorage");
    })
    .catch((error) => {
        console.error("Yaddaş xətası:", error.message);
    });

// Düymələri seçirik
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');

// 4. Qeydiyyat Funksiyası
if (registerBtn) {
    registerBtn.onclick = () => {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!email || !password) {
            alert("Email və şifrə boş ola bilməz!");
            return;
        }

        createUserWithEmailAndPassword(auth, email, password)
            .then(() => {
                alert("Hesab uğurla yaradıldı!");
            })
            .catch((err) => {
                if (err.code === 'auth/email-already-in-use') alert("Bu email artıq qeydiyyatdadır!");
                else alert("Xəta: " + err.message);
            });
    };
}

// 5. Giriş Funksiyası
if (loginBtn) {
    loginBtn.onclick = () => {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        signInWithEmailAndPassword(auth, email, password)
            .then(() => {
                window.location.replace("index.html");
            })
            .catch((err) => {
                alert("Giriş xətası: Məlumatları yoxlayın.");
            });
    };
}
